'use client';

import { useEffect, useState } from 'react';
import { WalletIcon, ExternalLinkIcon } from './ManagerProfileIcons';
import { CornerAccents } from '@/components/ui';

interface TokenBalance {
    mint: string;
    amount: number;
    decimals: number;
    tokenAccount: string;
    symbol?: string;
    name?: string;
    logoURI?: string;
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
}

interface ManagerWalletAssetsProps {
    walletAddress: string;
}

function truncateAddress(address: string, start = 6, end = 4): string {
    if (address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
}

// Known token mints for logo mapping
const KNOWN_TOKENS: { [mint: string]: { name: string; symbol: string; logo: string } } = {
    'So11111111111111111111111111111111111111112': { name: 'Wrapped SOL', symbol: 'SOL', logo: '/logo/SolanaToken.png' },
    // Add Xandeum token mint here
    'XANDuUoVoUqniKkpcKhrxmvYJybpJvUxJLr21Gaj3Hx': { name: 'Xandeum', symbol: 'XAND', logo: '/logo/XandToken.png' },
    'G2bTxNndhA9zxxy4PZnHFcQo9wQQozrfcmN6AN9Heqoe': { name: 'XENO', symbol: 'XENO', logo: '/logo/XandToken.png' },
};

// Keywords to identify Xandeum-related NFTs
const XANDEUM_KEYWORDS = ['xandeum', 'xand', 'pnode', 'manager', 'xandash'];

function isXandeumRelated(nft: NFTAsset): boolean {
    const name = nft.content?.metadata?.name?.toLowerCase() || '';
    const symbol = nft.content?.metadata?.symbol?.toLowerCase() || '';
    const description = nft.content?.metadata?.description?.toLowerCase() || '';

    return XANDEUM_KEYWORDS.some(keyword =>
        name.includes(keyword) || symbol.includes(keyword) || description.includes(keyword)
    );
}

function getTokenLogo(mint: string): string | null {
    if (KNOWN_TOKENS[mint]) {
        return KNOWN_TOKENS[mint].logo;
    }
    return null;
}

export const ManagerWalletAssets = ({ walletAddress }: ManagerWalletAssetsProps) => {
    const [walletData, setWalletData] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nftPage, setNftPage] = useState(0);

    useEffect(() => {
        const fetchWalletData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/manager-wallet?address=${walletAddress}`);
                if (!response.ok) throw new Error('Failed to fetch wallet data');
                const data = await response.json();
                setWalletData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load wallet data');
            } finally {
                setLoading(false);
            }
        };

        fetchWalletData();
    }, [walletAddress]);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <WalletIcon className="w-5 h-5 text-purple-400" />
                    <h2 className="text-base sm:text-lg font-semibold text-white">Wallet Assets</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {/* SOL Balance Skeleton */}
                    <div className="bg-black border border-white/10 p-3 sm:p-4 animate-pulse">
                        <div className="w-24 h-4 bg-white/10 mb-3" />
                        <div className="w-32 h-8 bg-white/10" />
                    </div>
                    {/* Tokens Skeleton */}
                    <div className="bg-black border border-white/10 p-3 sm:p-4 animate-pulse">
                        <div className="w-24 h-4 bg-white/10 mb-3" />
                        <div className="w-full h-20 bg-white/10" />
                    </div>
                    {/* NFTs Skeleton */}
                    <div className="bg-black border border-white/10 p-3 sm:p-4 animate-pulse">
                        <div className="w-24 h-4 bg-white/10 mb-3" />
                        <div className="w-full h-20 bg-white/10" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !walletData) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <WalletIcon className="w-5 h-5 text-purple-400" />
                    <h2 className="text-base sm:text-lg font-semibold text-white">Wallet Assets</h2>
                </div>
                <div className="bg-black border border-white/10 hover:border-white/20 transition-all p-4 sm:p-6 text-center">
                    <p className="text-white/40 text-sm">Unable to load wallet data</p>
                </div>
            </div>
        );
    }

    const { solBalance, tokens, nfts } = walletData;

    // Helper to check if token is Xandeum related
    const isXandeumToken = (token: TokenBalance) => {
        const name = token.name?.toLowerCase() || '';
        const symbol = token.symbol?.toLowerCase() || '';
        if (KNOWN_TOKENS[token.mint]?.name.toLowerCase().includes('xandeum')) return true;
        return XANDEUM_KEYWORDS.some(keyword => name.includes(keyword) || symbol.includes(keyword));
    };

    // Sort Tokens: Xandeum-related first, then by amount
    const sortedTokens = [...tokens].sort((a, b) => {
        const aIsXandeum = isXandeumToken(a);
        const bIsXandeum = isXandeumToken(b);
        if (aIsXandeum && !bIsXandeum) return -1;
        if (!aIsXandeum && bIsXandeum) return 1;

        // Secondary sort by amount (descending)
        return b.amount - a.amount;
    });

    // Sort NFTs: Xandeum-related first
    const sortedNfts = [...nfts].sort((a, b) => {
        const aIsXandeum = isXandeumRelated(a);
        const bIsXandeum = isXandeumRelated(b);
        if (aIsXandeum && !bIsXandeum) return -1;
        if (!aIsXandeum && bIsXandeum) return 1;
        return 0;
    });

    return (
        <div className="space-y-4">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <WalletIcon className="w-5 h-5 text-purple-400" />
                    <h2 className="text-base sm:text-lg font-semibold text-white">Wallet Assets</h2>
                </div>
                <a
                    href={`https://solscan.io/account/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-xs sm:text-sm cursor-pointer"
                >
                    <span>View on Solscan</span>
                    <ExternalLinkIcon className="w-3 h-3" />
                </a>
            </div>

            {/* SOL Balance and Counts */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* SOL Balance Card */}
                <div className="relative group bg-black border border-white/10 hover:border-white/20 transition-all p-3 sm:p-4">
                    <CornerAccents />
                    <div className="flex items-center gap-2 text-purple-400/70 text-[10px] sm:text-xs mb-2">
                        <img
                            src="/logo/SolanaToken.png"
                            alt="SOL"
                            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                            }}
                        />
                        <span>SOL Balance</span>
                    </div>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white font-mono">
                        {solBalance.toFixed(4)}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-white/30 mt-1">
                        Solana
                    </div>
                </div>

                {/* Token Count Card */}
                <div className="relative group bg-black border border-white/10 hover:border-white/20 transition-all p-3 sm:p-4">
                    <CornerAccents />
                    <div className="flex items-center gap-2 text-emerald-400/70 text-[10px] sm:text-xs mb-2">
                        <span>Token Holdings</span>
                    </div>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-emerald-400 font-mono">
                        {tokens.length}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-white/30 mt-1">
                        SPL Tokens
                    </div>
                </div>

                {/* NFT Count Card */}
                <div className="relative group bg-black border border-white/10 hover:border-white/20 transition-all p-3 sm:p-4">
                    <CornerAccents />
                    <div className="flex items-center gap-2 text-orange-400/70 text-[10px] sm:text-xs mb-2">
                        <span>NFT Holdings</span>
                    </div>
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-400 font-mono">
                        {nfts.length}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-white/30 mt-1">
                        NFTs & Collectibles
                    </div>
                </div>
            </div>

            {/* Tokens List */}
            {tokens.length > 0 && (
                <div className="relative group bg-black border border-white/10 hover:border-white/20 transition-all p-3 sm:p-4">
                    <CornerAccents />
                    <h3 className="text-xs sm:text-sm font-medium text-white/70 mb-3 block">
                        Token Balances
                        {sortedTokens.some(isXandeumToken) && (
                            <span className="ml-2 text-[10px] text-purple-400">(Xandeum tokens first)</span>
                        )}
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {sortedTokens.map((token) => {
                            const knownToken = KNOWN_TOKENS[token.mint];
                            const name = token.name || knownToken?.name;
                            const symbol = token.symbol || knownToken?.symbol;

                            let logoUrl = token.logoURI || getTokenLogo(token.mint);
                            // Fallback based on symbol
                            if (!logoUrl) {
                                if (symbol === 'SOL') logoUrl = '/logo/SolanaToken.png';
                                else if (symbol === 'XAND') logoUrl = '/logo/XandToken.png';
                            }

                            const isXandeum = isXandeumToken(token);

                            return (
                                <div
                                    key={token.mint}
                                    className={`flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 transition-colors border-l-2 ${isXandeum ? 'border-purple-500' : 'border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {logoUrl ? (
                                            <img
                                                src={logoUrl}
                                                alt={symbol || 'Token'}
                                                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0 bg-white/5"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center flex-shrink-0">
                                                <span className="text-[10px] font-bold text-white/50">T</span>
                                            </div>
                                        )}
                                        <div className="min-w-0 flex flex-col">
                                            {name ? (
                                                <>
                                                    <span className="text-white text-xs sm:text-sm font-medium truncate">
                                                        {name}
                                                    </span>
                                                    {symbol && (
                                                        <span className="text-white/50 text-[10px] sm:text-xs">
                                                            {symbol}
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-white/60 text-xs font-mono truncate">
                                                    {truncateAddress(token.mint)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-white font-mono text-xs sm:text-sm flex-shrink-0 pl-4">
                                        {token.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                    </span>
                                </div>
                            );
                        })}
                        {sortedTokens.length > 50 && (
                            <div className="text-center text-white/40 text-[10px] sm:text-xs pt-2">
                                +{sortedTokens.length - 50} more tokens
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* NFTs Grid */}
            {sortedNfts.length > 0 && (
                <div className="relative group bg-black border border-white/10 hover:border-white/20 transition-all p-3 sm:p-4">
                    <CornerAccents />
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs sm:text-sm font-medium text-white/70 block">
                            NFT Collection
                            {sortedNfts.some(isXandeumRelated) && (
                                <span className="ml-2 text-[10px] text-purple-400">(Xandeum NFTs first)</span>
                            )}
                        </h3>
                        <span className="text-[10px] text-white/40">
                            {sortedNfts.length} total
                        </span>
                    </div>
                    
                    {/* NFT Grid - 2 rows (6 cols per row) */}
                    <div className="grid grid-cols-6 gap-2 sm:gap-3 mb-3">
                        {sortedNfts.slice(nftPage * 12, (nftPage + 1) * 12).map((nft) => {
                            const imageUrl = nft.content?.links?.image ||
                                nft.content?.files?.[0]?.uri ||
                                null;
                            const isXandeum = isXandeumRelated(nft);

                            return (
                                <div
                                    key={nft.id}
                                    className={`group relative aspect-square bg-white/5 border overflow-hidden transition-all cursor-pointer ${isXandeum
                                        ? 'border-purple-500/50 hover:border-purple-500'
                                        : 'border-white/10 hover:border-white/20'
                                        }`}
                                    title={nft.content?.metadata?.name || 'NFT'}
                                >
                                    {isXandeum && (
                                        <div className="absolute top-1 right-1 z-10">
                                            <img
                                                src="/logo/XandToken.png"
                                                alt="Xandeum"
                                                className="w-4 h-4 rounded-full"
                                            />
                                        </div>
                                    )}
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={nft.content?.metadata?.name || 'NFT'}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/20">
                                            <span className="text-xl sm:text-2xl">🖼️</span>
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 left-0 right-0 p-1 sm:p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                                        <p className="text-[8px] sm:text-[9px] text-white truncate">
                                            {nft.content?.metadata?.name || truncateAddress(nft.id)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination Controls */}
                    {sortedNfts.length > 12 && (
                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            <button
                                onClick={() => setNftPage(Math.max(0, nftPage - 1))}
                                disabled={nftPage === 0}
                                className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white/70 hover:text-white transition-colors rounded"
                            >
                                ← Prev
                            </button>
                            <span className="text-[10px] text-white/50">
                                {nftPage + 1} / {Math.ceil(sortedNfts.length / 12)}
                            </span>
                            <button
                                onClick={() => setNftPage(Math.min(Math.ceil(sortedNfts.length / 12) - 1, nftPage + 1))}
                                disabled={nftPage >= Math.ceil(sortedNfts.length / 12) - 1}
                                className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white/70 hover:text-white transition-colors rounded"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Empty state */}
            {tokens.length === 0 && nfts.length === 0 && solBalance === 0 && (
                <div className="relative group bg-black border border-white/10 hover:border-white/20 transition-all p-4 sm:p-6 text-center">
                    <CornerAccents />
                    <WalletIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/50 text-sm">No assets found in this wallet</p>
                </div>
            )}
        </div>
    );
};
