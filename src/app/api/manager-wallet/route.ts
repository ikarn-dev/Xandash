import { NextRequest, NextResponse } from 'next/server';
import {
    getActiveApiKey,
    reportRateLimitHit,
    reportSuccess,
    isRateLimitError
} from '@/libs/utils/api-key-manager';
import { throttledHeliusFetch } from '@/libs/services/manager-assets-service';

const HELIUS_API_URL = 'https://mainnet.helius-rpc.com';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
// Set max duration for serverless function (Vercel) - increased for manager profile page
export const maxDuration = 35;

// ============================================================================
// CACHING: In-memory cache for manager wallet data
// ============================================================================
interface CacheEntry {
    data: WalletData;
    expires: number;
}

const walletCache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 1000; // 1 minutes cache for wallet data

// In-flight request deduplication
const inFlightRequests = new Map<string, Promise<WalletData>>();

interface TokenBalance {
    mint: string;
    amount: number;
    decimals: number;
    tokenAccount: string;
    symbol?: string;
    name?: string;
    logoURI?: string;
    usdValue?: number;
}

interface NFTAsset {
    id: string;
    content: {
        metadata: {
            name: string;
            symbol: string;
            description?: string;
        };
        links?: {
            image?: string;
        };
        files?: { uri: string; type: string }[];
    };
    grouping?: { group_key: string; group_value: string }[];
}

interface WalletData {
    solBalance: number;
    tokens: TokenBalance[];
    nfts: NFTAsset[];
    totalUsdValue: number;
}

/**
 * Fetch token balances using throttled Helius API calls
 * Uses sequential page fetching to avoid rate limits
 */
async function getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    const apiKey = getActiveApiKey('helius');
    if (!apiKey) return [];

    try {
        const allTokens: TokenBalance[] = [];

        // Fetch first page using throttled fetch
        const page1Response = await throttledHeliusFetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'fungible-assets-1',
                method: 'getAssetsByOwner',
                params: {
                    ownerAddress: walletAddress,
                    page: 1,
                    limit: 100,
                    displayOptions: {
                        showFungible: true,
                        showNativeBalance: false,
                    }
                }
            }),
            signal: AbortSignal.timeout(15000),
        });

        if (isRateLimitError(page1Response)) {
            reportRateLimitHit('helius');
            return [];
        }

        if (!page1Response.ok) return [];

        reportSuccess('helius');

        const data1 = await page1Response.json();
        const items1 = data1.result?.items || [];

        // Process first page
        items1.forEach((item: any) => {
            const tokenInfo = item.token_info || {};
            const metadata = item.content?.metadata || {};
            const files = item.content?.files || [];

            let logoURI = item.content?.links?.image;
            if (!logoURI && files.length > 0) {
                logoURI = files[0]?.uri;
            }

            const decimals = tokenInfo.decimals || 0;
            const balance = tokenInfo.balance || 0;
            const amount = balance / Math.pow(10, decimals);

            if (amount > 0) {
                allTokens.push({
                    mint: item.id,
                    amount: amount,
                    decimals: decimals,
                    tokenAccount: '',
                    symbol: tokenInfo.symbol || metadata.symbol,
                    name: metadata.name,
                    logoURI: logoURI,
                });
            }
        });

        // If first page has 100 items, fetch remaining pages SEQUENTIALLY to avoid rate limits
        if (items1.length === 100) {
            for (let page = 2; page <= 10; page++) {
                const pageResponse = await throttledHeliusFetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: `fungible-assets-${page}`,
                        method: 'getAssetsByOwner',
                        params: {
                            ownerAddress: walletAddress,
                            page: page,
                            limit: 100,
                            displayOptions: {
                                showFungible: true,
                                showNativeBalance: false,
                            }
                        }
                    }),
                    signal: AbortSignal.timeout(15000),
                });

                if (isRateLimitError(pageResponse)) {
                    reportRateLimitHit('helius');
                    break; // Stop pagination on rate limit, return what we have
                }

                if (!pageResponse.ok) break;

                const pageData = await pageResponse.json();
                const items = pageData.result?.items || [];

                items.forEach((item: any) => {
                    const tokenInfo = item.token_info || {};
                    const metadata = item.content?.metadata || {};
                    const files = item.content?.files || [];

                    let logoURI = item.content?.links?.image;
                    if (!logoURI && files.length > 0) {
                        logoURI = files[0]?.uri;
                    }

                    const decimals = tokenInfo.decimals || 0;
                    const balance = tokenInfo.balance || 0;
                    const amount = balance / Math.pow(10, decimals);

                    if (amount > 0) {
                        allTokens.push({
                            mint: item.id,
                            amount: amount,
                            decimals: decimals,
                            tokenAccount: '',
                            symbol: tokenInfo.symbol || metadata.symbol,
                            name: metadata.name,
                            logoURI: logoURI,
                        });
                    }
                });

                // Stop if this page had fewer than 100 items
                if (items.length < 100) break;
            }
        }

        return allTokens;

    } catch (error) {
        console.error('Error fetching token balances with DAS:', error);
        return [];
    }
}

/**
 * Fetch SOL balance using throttled Helius API call
 */
async function getSolBalance(walletAddress: string): Promise<number> {
    const apiKey = getActiveApiKey('helius');
    if (!apiKey) return 0;

    try {
        const response = await throttledHeliusFetch(`${HELIUS_API_URL}/?api-key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'sol-balance',
                method: 'getBalance',
                params: [walletAddress]
            }),
            signal: AbortSignal.timeout(10000),
        });

        // Check for rate limit and handle failover
        if (isRateLimitError(response)) {
            reportRateLimitHit('helius');
            return 0;
        }

        if (!response.ok) return 0;

        reportSuccess('helius');
        const data = await response.json();
        return (data.result?.value || 0) / 1e9; // Convert lamports to SOL
    } catch (error) {
        console.error('Error fetching SOL balance:', error);
        return 0;
    }
}

/**
 * Fetch NFTs using throttled Helius API calls
 * Uses sequential page fetching to avoid rate limits
 */
async function getNFTs(walletAddress: string): Promise<NFTAsset[]> {
    const apiKey = getActiveApiKey('helius');
    if (!apiKey) return [];

    try {
        const allNFTs: NFTAsset[] = [];

        // Fetch first page using throttled fetch
        const page1Response = await throttledHeliusFetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'nft-assets-1',
                method: 'getAssetsByOwner',
                params: {
                    ownerAddress: walletAddress,
                    page: 1,
                    limit: 100,
                    displayOptions: {
                        showFungible: false,
                        showNativeBalance: false,
                    }
                }
            }),
            signal: AbortSignal.timeout(15000),
        });

        if (isRateLimitError(page1Response)) {
            reportRateLimitHit('helius');
            return [];
        }

        if (!page1Response.ok) return [];

        reportSuccess('helius');

        const data1 = await page1Response.json();
        const items1 = data1.result?.items || [];

        // Filter to only NFTs
        const nfts1 = items1.filter((item: any) =>
            item.interface === 'V1_NFT' ||
            item.interface === 'ProgrammableNFT' ||
            item.interface === 'Custom'
        );

        allNFTs.push(...nfts1);

        // If first page has 100 items, fetch remaining pages SEQUENTIALLY to avoid rate limits
        if (items1.length === 100) {
            for (let page = 2; page <= 10; page++) {
                const pageResponse = await throttledHeliusFetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        jsonrpc: '2.0',
                        id: `nft-assets-${page}`,
                        method: 'getAssetsByOwner',
                        params: {
                            ownerAddress: walletAddress,
                            page: page,
                            limit: 100,
                            displayOptions: {
                                showFungible: false,
                                showNativeBalance: false,
                            }
                        }
                    }),
                    signal: AbortSignal.timeout(15000),
                });

                if (isRateLimitError(pageResponse)) {
                    reportRateLimitHit('helius');
                    break; // Stop pagination on rate limit, return what we have
                }

                if (!pageResponse.ok) break;

                const pageData = await pageResponse.json();
                const items = pageData.result?.items || [];

                const nfts = items.filter((item: any) =>
                    item.interface === 'V1_NFT' ||
                    item.interface === 'ProgrammableNFT' ||
                    item.interface === 'Custom'
                );
                allNFTs.push(...nfts);

                // Stop if this page had fewer than 100 items
                if (items.length < 100) break;
            }
        }

        return allNFTs;
    } catch (error) {
        console.error('Error fetching NFTs:', error);
        return [];
    }
}

/**
 * Core wallet data fetching with proper sequencing
 * Fetches data in sequence: SOL balance first, then tokens, then NFTs
 * This prevents overwhelming the Helius API with concurrent requests
 */
async function fetchWalletData(walletAddress: string): Promise<WalletData> {
    // Fetch in sequence to avoid rate limits
    // SOL balance is fast, tokens and NFTs can have pagination
    const solBalance = await getSolBalance(walletAddress);
    const tokens = await getTokenBalances(walletAddress);
    const nfts = await getNFTs(walletAddress);

    return {
        solBalance,
        tokens,
        nfts,
        totalUsdValue: 0, // Would need price API for accurate USD values
    };
}

/**
 * Get wallet data with caching and in-flight request deduplication
 */
async function getWalletData(walletAddress: string): Promise<WalletData> {
    const now = Date.now();

    // Check cache first
    const cached = walletCache.get(walletAddress);
    if (cached && cached.expires > now) {
        return cached.data;
    }

    // Check for in-flight request (deduplication)
    const inFlight = inFlightRequests.get(walletAddress);
    if (inFlight) {
        return inFlight;
    }

    // Create new request
    const fetchPromise = (async (): Promise<WalletData> => {
        try {
            const data = await fetchWalletData(walletAddress);

            // Cache the result
            walletCache.set(walletAddress, {
                data,
                expires: Date.now() + CACHE_TTL
            });

            return data;
        } finally {
            // Clean up in-flight request
            inFlightRequests.delete(walletAddress);
        }
    })();

    // Store in-flight request
    inFlightRequests.set(walletAddress, fetchPromise);

    return fetchPromise;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('address');

        if (!walletAddress) {
            return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
        }

        const heliusApiKey = getActiveApiKey('helius');
        if (!heliusApiKey) {
            return NextResponse.json({
                error: 'Helius API key not configured',
                solBalance: 0,
                tokens: [],
                nfts: [],
                totalUsdValue: 0
            }, { status: 200 });
        }

        // Use the cached/deduplicated wallet data fetcher
        const walletData = await getWalletData(walletAddress);

        const response = NextResponse.json(walletData);
        response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
        return response;
    } catch (error) {
        console.error('Manager wallet API error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            solBalance: 0,
            tokens: [],
            nfts: [],
            totalUsdValue: 0
        }, { status: 500 });
    }
}
