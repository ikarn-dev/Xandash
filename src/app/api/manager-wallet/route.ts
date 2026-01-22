import { NextRequest, NextResponse } from 'next/server';
import {
    getActiveApiKey,
    reportRateLimitHit,
    reportSuccess,
    isRateLimitError
} from '@/libs/utils/api-key-manager';

const HELIUS_API_URL = 'https://mainnet.helius-rpc.com';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

async function getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    const apiKey = getActiveApiKey('helius');
    if (!apiKey) return [];

    try {
        const allTokens: TokenBalance[] = [];
        
        // Fetch first page to determine if more pages exist
        const page1Response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
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

        // If first page has 100 items, fetch remaining pages concurrently
        if (items1.length === 100) {
            const remainingPages = 9; // Max 10 pages total
            const pageRequests: Promise<any>[] = [];

            for (let page = 2; page <= remainingPages + 1; page++) {
                pageRequests.push(
                    fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
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
                    }).then(r => r.json())
                );
            }

            const results = await Promise.all(pageRequests);
            results.forEach(result => {
                const items = result.result?.items || [];
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
            });
        }

        return allTokens;

    } catch (error) {
        console.error('Error fetching token balances with DAS:', error);
        return [];
    }
}

async function getSolBalance(walletAddress: string): Promise<number> {
    const apiKey = getActiveApiKey('helius');
    if (!apiKey) return 0;

    try {
        const response = await fetch(`${HELIUS_API_URL}/?api-key=${apiKey}`, {
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

async function getNFTs(walletAddress: string): Promise<NFTAsset[]> {
    const apiKey = getActiveApiKey('helius');
    if (!apiKey) return [];

    try {
        const allNFTs: NFTAsset[] = [];

        // Fetch first page to determine if more pages exist
        const page1Response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
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

        // If first page has 100 items, fetch remaining pages concurrently
        if (items1.length === 100) {
            const remainingPages = 9; // Max 10 pages total
            const pageRequests: Promise<any>[] = [];

            for (let page = 2; page <= remainingPages + 1; page++) {
                pageRequests.push(
                    fetch(`https://mainnet.helius-rpc.com/?api-key=${apiKey}`, {
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
                    }).then(r => r.json())
                );
            }

            const results = await Promise.all(pageRequests);
            results.forEach(result => {
                const items = result.result?.items || [];
                const nfts = items.filter((item: any) =>
                    item.interface === 'V1_NFT' ||
                    item.interface === 'ProgrammableNFT' ||
                    item.interface === 'Custom'
                );
                allNFTs.push(...nfts);
            });
        }

        return allNFTs;
    } catch (error) {
        console.error('Error fetching NFTs:', error);
        return [];
    }
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

        // Fetch all data in parallel
        const [solBalance, tokens, nfts] = await Promise.all([
            getSolBalance(walletAddress),
            getTokenBalances(walletAddress),
            getNFTs(walletAddress),
        ]);

        const walletData: WalletData = {
            solBalance,
            tokens,
            nfts,
            totalUsdValue: 0, // Would need price API for accurate USD values
        };

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
