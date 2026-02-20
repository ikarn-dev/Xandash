'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ManagerData } from './types';
import { CopyBtn } from '@/components/ui/CopyBtn';

// Extended Manager data interface to include fetched assets
interface ManagerAssets {
    nft_count: number;
    sbt_count: number;
    xand_balance: number;
    xeno_balance: number;
    nft_previews: Array<{ name: string; image: string | null }>;
    sbt_previews: Array<{ name: string; image: string | null }>;
    last_updated?: number;
}

const STORAGE_KEY = 'xandash_manager_assets';

/** Check localStorage for cached asset data */
function getCachedAsset(address: string): ManagerAssets | null {
    try {
        if (typeof window === 'undefined') return null;
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.data?.[address] || null;
    } catch {
        return null;
    }
}

interface ProfileManagerSectionProps {
    manager: ManagerData | null | undefined;
}

// Corner accents that match the app's theme (sharp edges with white/20 lines)
const CornerAccents = () => (
    <>
        <div className="absolute top-0 left-0 w-3 h-3">
            <div className="absolute top-0 left-0 w-2 h-px bg-white/20"></div>
            <div className="absolute top-0 left-0 w-px h-2 bg-white/20"></div>
        </div>
        <div className="absolute top-0 right-0 w-3 h-3">
            <div className="absolute top-0 right-0 w-2 h-px bg-white/20"></div>
            <div className="absolute top-0 right-0 w-px h-2 bg-white/20"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-3 h-3">
            <div className="absolute bottom-0 left-0 w-2 h-px bg-white/20"></div>
            <div className="absolute bottom-0 left-0 w-px h-2 bg-white/20"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-3 h-3">
            <div className="absolute bottom-0 right-0 w-2 h-px bg-white/20"></div>
            <div className="absolute bottom-0 right-0 w-px h-2 bg-white/20"></div>
        </div>
    </>
);

// Truncate address for mobile display
function truncateAddress(address: string, start = 6, end = 4): string {
    if (address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export const ProfileManagerSection: React.FC<ProfileManagerSectionProps> = ({ manager }) => {
    // CLIENT-SIDE ASSET FETCHING - same pattern as ManagerAssetsSummary
    const [assets, setAssets] = useState<ManagerAssets | null>(null);
    const [loading, setLoading] = useState(true);
    const fetchingRef = useRef<string | null>(null);
    const mountedRef = useRef(true);

    const fetchAssets = useCallback(async () => {
        if (!manager?.manager_address) {
            setLoading(false);
            return;
        }

        // Skip if already fetching same address
        if (fetchingRef.current === manager.manager_address) {
            return;
        }

        // Check localStorage cache first
        const cached = getCachedAsset(manager.manager_address);
        if (cached && cached.last_updated && (Date.now() - cached.last_updated) < 5 * 60 * 1000) {
            setAssets(cached);
            setLoading(false);
            return;
        }
        if (cached) {
            setAssets(cached); // Show stale data immediately
        }

        fetchingRef.current = manager.manager_address;
        setLoading(true);

        try {
            const response = await fetch(`/api/manager-assets?address=${manager.manager_address}`);

            // Check credit exhaustion — use cached data if exhausted
            const exhausted = response.headers.get('x-credits-exhausted') === 'true';
            if (exhausted && cached) {
                if (mountedRef.current && fetchingRef.current === manager.manager_address) {
                    setAssets(cached);
                }
                return;
            }

            if (response.ok && mountedRef.current && fetchingRef.current === manager.manager_address) {
                const data = await response.json();
                setAssets({
                    nft_count: data.nft_count || 0,
                    sbt_count: data.sbt_count || 0,
                    xand_balance: data.xand_balance || 0,
                    xeno_balance: data.xeno_balance || 0,
                    nft_previews: data.nft_previews || [],
                    sbt_previews: data.sbt_previews || [],
                    last_updated: data.last_updated || Date.now(),
                });
            }
        } catch (err) {
            // Silent fail — use cached or server-side data as fallback
            if (process.env.NODE_ENV === 'development') {
                console.warn('[ProfileManagerSection] Failed to fetch assets:', err);
            }
        } finally {
            if (mountedRef.current && fetchingRef.current === manager?.manager_address) {
                setLoading(false);
                fetchingRef.current = null;
            }
        }
    }, [manager?.manager_address]);

    useEffect(() => {
        mountedRef.current = true;
        fetchAssets();

        return () => {
            mountedRef.current = false;
        };
    }, [fetchAssets]);

    if (!manager) {
        return (
            <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300">
                <CornerAccents />
                <h3 className="text-xs sm:text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-white/50"></span>
                    Node Manager
                </h3>
                <div className="text-center py-6">
                    <div className="text-white/40 text-xs sm:text-sm">
                        This node is not registered to any manager yet.
                    </div>
                </div>
            </div>
        );
    }

    // Use client-side fetched assets if available, otherwise fallback to server-side data
    const displayAssets = assets || {
        nft_count: manager.nft_count || 0,
        sbt_count: manager.sbt_count || 0,
        xand_balance: manager.xand_balance || 0,
        xeno_balance: manager.xeno_balance || 0,
        nft_previews: manager.nft_previews || [],
        sbt_previews: manager.sbt_previews || [],
    };

    // Get NFT/SBT images for display - limit to 6 for compact view
    const nftImages = displayAssets.nft_previews?.filter(nft => nft.image) || [];
    const sbtImages = displayAssets.sbt_previews?.filter(sbt => sbt.image) || [];
    const allImages = [...nftImages, ...sbtImages].slice(0, 6);

    const hasAssets = displayAssets.nft_count > 0 || displayAssets.sbt_count > 0;
    const showXeno = displayAssets.xeno_balance > 0;
    const showXand = displayAssets.xand_balance > 0;

    return (
        <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300">
            <CornerAccents />

            {/* Header */}
            <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1.5 min-w-0 flex-1">
                        <h3 className="text-xs sm:text-sm font-medium text-white flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-emerald-500"></span>
                            Node Manager
                        </h3>
                        {/* Address with proper truncation on mobile - using CopyBtn with toast */}
                        <div className="flex items-center gap-1.5 min-w-0">
                            <code className="text-white/50 text-[10px] sm:text-xs font-mono bg-white/5 px-1.5 py-0.5 border border-white/10 truncate max-w-[140px] sm:max-w-none">
                                <span className="hidden sm:inline">{manager.manager_address}</span>
                                <span className="inline sm:hidden">{truncateAddress(manager.manager_address, 8, 6)}</span>
                            </code>
                            <CopyBtn text={manager.manager_address} type="address" size="sm" />
                        </div>
                    </div>

                    <Link
                        href={`/manager/${manager.manager_address}`}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white text-[10px] sm:text-xs font-medium transition-all group/link flex-shrink-0"
                    >
                        <span>View Profile</span>
                        <svg className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>

            {/* Stats Grid - Sharp edges, thin white border */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {/* Total Nodes */}
                <div className="relative p-2.5 sm:p-3 bg-black border border-white/10 hover:border-white/20 transition-colors">
                    <div className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-wider mb-1">Managed Nodes</div>
                    <div className="text-lg sm:text-xl font-bold text-white font-mono">{manager.total_nodes}</div>
                </div>

                {/* NFT Count */}
                <div className="relative p-2.5 sm:p-3 bg-black border border-white/10 hover:border-white/20 transition-colors">
                    <div className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-wider mb-1">NFTs</div>
                    <div className="text-lg sm:text-xl font-bold text-orange-400 font-mono">
                        {loading ? <span className="animate-pulse">...</span> : displayAssets.nft_count}
                    </div>
                </div>

                {/* XENO Balance */}
                <div className="relative p-2.5 sm:p-3 bg-black border border-white/10 hover:border-white/20 transition-colors">
                    <div className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-wider mb-1">XENO</div>
                    <div className="text-lg sm:text-xl font-bold font-mono text-cyan-400">
                        {loading ? <span className="animate-pulse">...</span> : (
                            displayAssets.xeno_balance > 0
                                ? displayAssets.xeno_balance.toLocaleString(undefined, { maximumFractionDigits: 2 })
                                : '0'
                        )}
                    </div>
                </div>

                {/* XAND Balance */}
                <div className="relative p-2.5 sm:p-3 bg-black border border-white/10 hover:border-white/20 transition-colors">
                    <div className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-wider mb-1">XAND</div>
                    <div className="text-lg sm:text-xl font-bold text-purple-400 font-mono">
                        {loading ? <span className="animate-pulse">...</span> : (
                            displayAssets.xand_balance > 0 ? displayAssets.xand_balance.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'
                        )}
                    </div>
                </div>
            </div>

            {/* NFT/SBT Image Previews - Grid layout matching manager profile */}
            {allImages.length > 0 && (
                <div className="mb-4 sm:mb-5 border-t border-white/10 pt-3 sm:pt-4">
                    <div className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-wider mb-2 sm:mb-3">Asset Previews</div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
                        {allImages.map((asset, index) => (
                            <div
                                key={`asset-img-${index}`}
                                className="group relative aspect-square bg-black border border-white/10 hover:border-orange-500/50 transition-colors overflow-hidden"
                            >
                                <Image
                                    src={asset.image!}
                                    alt={asset.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    sizes="(max-width: 640px) 100px, 120px"
                                    unoptimized
                                />
                                {/* Name overlay at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 p-1 sm:p-1.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                                    <p className="text-[8px] sm:text-[9px] text-white truncate font-mono">
                                        {asset.name}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {/* Show count if more than displayed */}
                        {(nftImages.length + sbtImages.length) > 6 && (
                            <div className="aspect-square bg-white/5 border border-white/10 flex items-center justify-center">
                                <span className="text-white/40 text-xs sm:text-sm font-mono">
                                    +{(nftImages.length + sbtImages.length) - 6}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Assets Preview (Names & Badges) */}
            {hasAssets && (
                <div className="space-y-2 sm:space-y-3 border-t border-white/10 pt-3 sm:pt-4">
                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                        {/* XENO Badge */}
                        {showXeno && (
                            <span
                                className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[8px] sm:text-[9px] font-mono"
                                title={`Holding ${displayAssets.xeno_balance.toLocaleString()} XENO`}
                            >
                                <span className="w-1 h-1 bg-cyan-500"></span>
                                XENO
                            </span>
                        )}

                        {/* XAND Badge */}
                        {showXand && (
                            <span
                                className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] sm:text-[9px] font-mono"
                                title={`Holding ${displayAssets.xand_balance.toLocaleString()} XAND`}
                            >
                                <span className="w-1 h-1 bg-purple-500"></span>
                                XAND
                            </span>
                        )}

                        {/* NFT Names - Limited display */}
                        {displayAssets.nft_previews?.slice(0, 3).map((nft, index) => (
                            <span
                                key={`nft-${index}`}
                                className="inline-flex items-center px-1.5 sm:px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400/80 text-[8px] sm:text-[9px] font-mono cursor-help max-w-[80px] sm:max-w-[100px] truncate"
                                title={nft.name}
                            >
                                {nft.name.length > 12 ? `${nft.name.slice(0, 12)}...` : nft.name}
                            </span>
                        ))}

                        {/* SBT Names - Limited display */}
                        {displayAssets.sbt_previews?.slice(0, 3).map((sbt, index) => (
                            <span
                                key={`sbt-${index}`}
                                className="inline-flex items-center px-1.5 sm:px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400/80 text-[8px] sm:text-[9px] font-mono cursor-help max-w-[80px] sm:max-w-[100px] truncate"
                                title={sbt.name}
                            >
                                {sbt.name.length > 12 ? `${sbt.name.slice(0, 12)}...` : sbt.name}
                            </span>
                        ))}

                        {/* More counts */}
                        {(displayAssets.nft_count > 3 || displayAssets.sbt_count > 3) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-white/30 text-[8px] sm:text-[9px] font-mono">
                                +More
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Registration Info */}
            <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-3 text-[8px] sm:text-[9px] text-white/30 font-mono border-t border-white/10 pt-2 sm:pt-3">
                <span className="truncate">LABEL: <span className="text-white/50">{manager.node_label}</span></span>
                <span className="hidden sm:inline">•</span>
                <span className="truncate">REGISTERED: <span className="text-white/50">{manager.registered_time}</span></span>
            </div>
        </div>
    );
};

export default ProfileManagerSection;
