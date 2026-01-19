'use client';

import React from 'react';
import Link from 'next/link';
import { ManagerData } from './types';

interface ProfileManagerSectionProps {
    manager: ManagerData | null | undefined;
}

const CornerEdges = () => (
    <>
        <div className="absolute top-0 left-0 w-3 h-3">
            <div className="absolute top-0 left-0 w-1.5 h-px bg-white/20"></div>
            <div className="absolute top-0 left-0 w-px h-1.5 bg-white/20"></div>
        </div>
        <div className="absolute top-0 right-0 w-3 h-3">
            <div className="absolute top-0 right-0 w-1.5 h-px bg-white/20"></div>
            <div className="absolute top-0 right-0 w-px h-1.5 bg-white/20"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-3 h-3">
            <div className="absolute bottom-0 left-0 w-1.5 h-px bg-white/20"></div>
            <div className="absolute bottom-0 left-0 w-px h-1.5 bg-white/20"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-3 h-3">
            <div className="absolute bottom-0 right-0 w-1.5 h-px bg-white/20"></div>
            <div className="absolute bottom-0 right-0 w-px h-1.5 bg-white/20"></div>
        </div>
    </>
);

export const ProfileManagerSection: React.FC<ProfileManagerSectionProps> = ({ manager }) => {
    if (!manager) {
        return (
            <div className="relative bg-black border border-white/10 p-6 group hover:border-white/20 transition-all duration-300">
                <CornerEdges />
                <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/50"></span>
                    Node Manager
                </h3>
                <div className="text-center py-6">
                    <div className="text-white/40 text-sm">
                        This node is not registered to any manager yet.
                    </div>
                </div>
            </div>
        );
    }

    const hasAssets = manager.nft_count > 0 || manager.sbt_count > 0;
    const showXeno = manager.xeno_balance > 0;

    return (
        <div className="relative bg-black border border-white/10 p-6 group hover:border-white/20 transition-all duration-300">
            <CornerEdges />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="space-y-1">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Node Manager
                    </h3>
                    <div className="flex items-center gap-2">
                        <code className="text-white/40 text-xs font-mono bg-white/5 px-1.5 py-0.5 rounded">
                            {manager.manager_address}
                        </code>
                        <button
                            onClick={() => navigator.clipboard.writeText(manager.manager_address)}
                            className="text-white/20 hover:text-white/60 transition-colors p-1"
                            title="Copy address"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <Link
                    href={`/manager/${manager.manager_address}`}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white text-xs font-medium transition-all group/link w-fit"
                >
                    <span>View Profile</span>
                    <svg className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {/* Total Nodes */}
                <div className="relative p-3 bg-white/5 border border-white/5">
                    <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Managed Nodes</div>
                    <div className="text-xl font-bold text-white font-mono">{manager.total_nodes}</div>
                </div>

                {/* NFT Count */}
                <div className="relative p-3 bg-white/5 border border-white/5">
                    <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">NFTs</div>
                    <div className="text-xl font-bold text-orange-400 font-mono">{manager.nft_count}</div>
                </div>

                {/* XENO or SBT */}
                <div className="relative p-3 bg-white/5 border border-white/5">
                    <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">
                        {showXeno ? 'XENO' : 'SBTs'}
                    </div>
                    <div className={`text-xl font-bold font-mono ${showXeno ? 'text-purple-400' : 'text-blue-400'}`}>
                        {showXeno
                            ? manager.xeno_balance.toLocaleString(undefined, { maximumFractionDigits: 2 })
                            : manager.sbt_count
                        }
                    </div>
                </div>

                {/* XAND Balance */}
                <div className="relative p-3 bg-white/5 border border-white/5">
                    <div className="text-white/40 text-[10px] uppercase tracking-wider mb-1">XAND</div>
                    <div className="text-xl font-bold text-emerald-400 font-mono">
                        {manager.xand_balance > 0 ? manager.xand_balance.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'}
                    </div>
                </div>
            </div>

            {/* Assets Preview (Names & Badges) */}
            {hasAssets && (
                <div className="space-y-3 border-t border-white/5 pt-4">
                    <div className="flex flex-wrap gap-2">
                        {/* XENO Badge */}
                        {showXeno && (
                            <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] sm:text-xs font-mono rounded"
                                title={`Holding ${manager.xeno_balance.toLocaleString()} XENO`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                XENO
                            </span>
                        )}

                        {/* NFT Names */}
                        {manager.nft_previews?.slice(0, 6).map((nft, index) => (
                            <span
                                key={`nft-${index}`}
                                className="inline-flex items-center px-2 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400/80 text-[10px] sm:text-xs font-mono rounded cursor-help"
                                title={nft.name}
                            >
                                {nft.name.length > 20 ? `${nft.name.slice(0, 20)}...` : nft.name}
                            </span>
                        ))}

                        {/* SBT Names */}
                        {manager.sbt_previews?.slice(0, 6).map((sbt, index) => (
                            <span
                                key={`sbt-${index}`}
                                className="inline-flex items-center px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400/80 text-[10px] sm:text-xs font-mono rounded cursor-help"
                                title={sbt.name}
                            >
                                {sbt.name.length > 20 ? `${sbt.name.slice(0, 20)}...` : sbt.name}
                            </span>
                        ))}

                        {/* More counts */}
                        {(manager.nft_count > 6 || manager.sbt_count > 6) && (
                            <span className="inline-flex items-center px-2 py-1 text-white/30 text-[10px] font-mono">
                                +More assets...
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Registration Info */}
            <div className="mt-4 flex items-center gap-3 text-[10px] text-white/30 font-mono border-t border-white/5 pt-3">
                <span>LABEL: <span className="text-white/50">{manager.node_label}</span></span>
                <span>•</span>
                <span>REGISTERED: <span className="text-white/50">{manager.registered_time}</span></span>
            </div>
        </div>
    );
};

export default ProfileManagerSection;


