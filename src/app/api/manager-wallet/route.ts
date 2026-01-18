import { NextRequest, NextResponse } from 'next/server';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY_2 || '';
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
    if (!HELIUS_API_KEY) return [];

    try {
        // Use Helius DAS API for Fungible Tokens to get metadata
        const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'fungible-assets',
                method: 'getAssetsByOwner',
                params: {
                    ownerAddress: walletAddress,
                    page: 1,
                    limit: 100, // Fetch up to 100 tokens
                    displayOptions: {
                        showFungible: true,
                        showNativeBalance: false, // We get SOL separately
                    }
                }
            }),
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) return [];

        const data = await response.json();
        const items = data.result?.items || [];

        // Filter for FungibleToken or FungibleAsset
        const fungibles = items.filter((item: any) =>
            item.interface === 'FungibleToken' ||
            item.interface === 'FungibleAsset'
        );

        return fungibles.map((item: any) => {
            const tokenInfo = item.token_info || {};
            const metadata = item.content?.metadata || {};
            const files = item.content?.files || [];

            // Try to find logo in different places
            let logoURI = item.content?.links?.image;
            if (!logoURI && files.length > 0) {
                logoURI = files[0]?.uri;
            }

            // Calculate amount based on decimals
            const decimals = tokenInfo.decimals || 0;
            const balance = tokenInfo.balance || 0;
            // Balance from DAS is usually raw amount, need to adjust by decimals? 
            // Helius DAS 'balance' for token_info is often the UI amount or raw? 
            // Validating: Helius DAS "balance" in token_info is usually integer (raw).
            // But let's be careful. The `getTokenAccountsByOwner` returned uiAmount.
            // DAS `token_info.balance` is typically the raw amount (integer).
            const amount = balance / Math.pow(10, decimals);

            // Filter out zero balances if any
            if (amount <= 0) return null;

            return {
                mint: item.id,
                amount: amount,
                decimals: decimals,
                tokenAccount: '', // Not strictly needed for display
                symbol: tokenInfo.symbol || metadata.symbol,
                name: metadata.name, // "names of those tokens as per blockchain data"
                logoURI: logoURI,
            };
        }).filter(Boolean) as TokenBalance[];

    } catch (error) {
        console.error('Error fetching token balances with DAS:', error);
        // Fallback to basic method if DAS fails? For now just return empty or log error.
        return [];
    }
}

async function getSolBalance(walletAddress: string): Promise<number> {
    if (!HELIUS_API_KEY) return 0;

    try {
        const response = await fetch(`${HELIUS_API_URL}/?api-key=${HELIUS_API_KEY}`, {
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

        if (!response.ok) return 0;

        const data = await response.json();
        return (data.result?.value || 0) / 1e9; // Convert lamports to SOL
    } catch (error) {
        console.error('Error fetching SOL balance:', error);
        return 0;
    }
}

async function getNFTs(walletAddress: string): Promise<NFTAsset[]> {
    if (!HELIUS_API_KEY) return [];

    try {
        // Use Helius DAS API for NFTs
        const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'nft-assets',
                method: 'getAssetsByOwner',
                params: {
                    ownerAddress: walletAddress,
                    page: 1,
                    limit: 50,
                    displayOptions: {
                        showFungible: false,
                        showNativeBalance: false,
                    }
                }
            }),
            signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) return [];

        const data = await response.json();
        const items = data.result?.items || [];

        // Filter to only NFTs (not fungible tokens)
        return items.filter((item: any) =>
            item.interface === 'V1_NFT' ||
            item.interface === 'ProgrammableNFT' ||
            item.interface === 'Custom'
        ).slice(0, 20); // Limit to 20 NFTs
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

        if (!HELIUS_API_KEY) {
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
