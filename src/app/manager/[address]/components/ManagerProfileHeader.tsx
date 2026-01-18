'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CopyBtn as CopyButton } from '@/components/ui/CopyBtn';
import { ArrowLeftIcon, WalletIcon, ExternalLinkIcon } from './ManagerProfileIcons';
import { CornerAccents } from '@/components/ui';
import type { Manager, ManagerStats } from './types';

interface ManagerProfileHeaderProps {
    manager: Manager;
    stats: ManagerStats;
    onRefresh?: () => void;
}

function truncateAddress(address: string, start = 6, end = 6): string {
    if (address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export const ManagerProfileHeader = ({ manager, stats, onRefresh }: ManagerProfileHeaderProps) => {
    const router = useRouter();

    const solscanUrl = `https://solscan.io/account/${manager.manager_address}`;

    return (
        <div className="relative bg-black border border-white/10 p-3 sm:p-4 lg:p-6 group hover:border-white/20 transition-all">
            <CornerAccents />
            <div className="space-y-3 sm:space-y-4">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <button
                            onClick={() => router.back()}
                            className="p-1.5 sm:p-2 hover:bg-white/10 text-white/60 hover:text-white flex-shrink-0 cursor-pointer rounded"
                        >
                            <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            <WalletIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
                            <h1 className="text-base sm:text-lg lg:text-xl font-bold text-white truncate">
                                Manager Profile
                            </h1>
                        </div>
                    </div>

                    {/* Actions - Mobile: Stack vertically, Desktop: Horizontal */}
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <a
                            href={solscanUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 text-[10px] sm:text-xs font-medium cursor-pointer rounded"
                        >
                            <span className="hidden xs:inline">Solscan</span>
                            <span className="inline xs:hidden">Sol</span>
                            <ExternalLinkIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </a>
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                className="px-2 py-1 sm:px-3 sm:py-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] sm:text-xs flex-shrink-0 cursor-pointer rounded"
                            >
                                <span className="hidden xs:inline">Refresh</span>
                                <span className="inline xs:hidden">↻</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Address and Info Row */}
                <div className="space-y-2 sm:space-y-3">
                    {/* Address with Rank */}
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="font-mono text-white text-xs sm:text-sm break-all sm:break-normal">
                            <span className="hidden sm:inline">{manager.manager_address}</span>
                            <span className="inline sm:hidden">{truncateAddress(manager.manager_address, 6, 6)}</span>
                        </span>
                        <CopyButton text={manager.manager_address} />
                        <span className="px-2 py-1 rounded-full text-[9px] sm:text-[10px] bg-purple-500/20 border border-purple-500/50 text-purple-400 font-medium flex-shrink-0">
                            #{manager.manager_index || 'N/A'}
                        </span>
                    </div>

                    {/* Active Nodes Badge */}
                    <div className="flex items-center">
                        <span className="px-2 py-1 rounded-full text-[9px] sm:text-[10px] bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-medium">
                            {stats.activeNodes}/{stats.totalNodes} ACTIVE
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
