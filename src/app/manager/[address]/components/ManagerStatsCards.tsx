import React from 'react';
import { ClockIcon, ServerIcon, ActivityIcon, UsersIcon, DatabaseIcon, ChartIcon } from './ManagerProfileIcons';
import { CornerAccents } from '@/components/ui';
import type { ManagerStats } from './types';

interface ManagerStatsCardsProps {
    stats: ManagerStats;
}

// Format helpers
const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number) => {
    if (!seconds) return '0h';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
};

const formatCredits = (credits: number) => {
    if (credits >= 1000000) return `${(credits / 1000000).toFixed(1)}M`;
    if (credits >= 1000) return `${(credits / 1000).toFixed(1)}K`;
    return credits.toLocaleString();
};

export const ManagerStatsCards = ({ stats }: ManagerStatsCardsProps) => {
    return (
        <div className="w-full overflow-hidden">
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                {/* Total Nodes */}
                <div className="relative group bg-black border border-white/10 p-2 sm:p-3 lg:p-4 hover:border-white/20 transition-all min-w-0">
                    <CornerAccents />
                    <div className="flex items-center gap-1 sm:gap-1.5 text-purple-400/70 text-[9px] sm:text-[10px] mb-1 sm:mb-1.5">
                        <UsersIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 flex-shrink-0" />
                        <span className="truncate">Total Nodes</span>
                    </div>
                    <div className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-purple-400 font-mono">
                        {stats.totalNodes}
                    </div>
                    <div className="text-[8px] sm:text-[9px] lg:text-[10px] text-emerald-400/70 mt-0.5 sm:mt-1 truncate">
                        {stats.activeNodes} active
                    </div>
                </div>

                {/* Avg Score */}
                <div className="relative group bg-black border border-white/10 p-2 sm:p-3 lg:p-4 hover:border-white/20 transition-all min-w-0">
                    <CornerAccents />
                    <div className="flex items-center gap-1 sm:gap-1.5 text-pink-400/70 text-[9px] sm:text-[10px] mb-1 sm:mb-1.5">
                        <ChartIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 flex-shrink-0" />
                        <span className="truncate">Avg Score</span>
                    </div>
                    <div className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-pink-400 font-mono">
                        {(stats.avgScore || 0).toFixed(1)}
                    </div>
                    <div className="text-[8px] sm:text-[9px] lg:text-[10px] text-white/40 mt-0.5 sm:mt-1 truncate">
                        / 100 max
                    </div>
                </div>

                {/* Total Storage */}
                <div className="relative group bg-black border border-white/10 p-2 sm:p-3 lg:p-4 hover:border-white/20 transition-all min-w-0">
                    <CornerAccents />
                    <div className="flex items-center gap-1 sm:gap-1.5 text-orange-400/70 text-[9px] sm:text-[10px] mb-1 sm:mb-1.5">
                        <ServerIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 flex-shrink-0" />
                        <span className="truncate">Storage</span>
                    </div>
                    <div className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-orange-400 font-mono truncate">
                        {formatBytes(stats.totalStorage)}
                    </div>
                    <div className="text-[8px] sm:text-[9px] lg:text-[10px] text-white/40 mt-0.5 sm:mt-1 truncate">
                        Committed
                    </div>
                </div>

                {/* Used Storage */}
                <div className="relative group bg-black border border-white/10 p-2 sm:p-3 lg:p-4 hover:border-white/20 transition-all min-w-0">
                    <CornerAccents />
                    <div className="flex items-center gap-1 sm:gap-1.5 text-yellow-400/70 text-[9px] sm:text-[10px] mb-1 sm:mb-1.5">
                        <DatabaseIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 flex-shrink-0" />
                        <span className="truncate">Used</span>
                    </div>
                    <div className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-yellow-400 font-mono truncate">
                        {formatBytes(stats.usedStorage)}
                    </div>
                    <div className="text-[8px] sm:text-[9px] lg:text-[10px] text-white/40 mt-0.5 sm:mt-1 truncate">
                        {stats.totalStorage > 0 ? `${((stats.usedStorage / stats.totalStorage) * 100).toFixed(1)}% util` : '0.0% util'}
                    </div>
                </div>

                {/* Credits */}
                <div className="relative group bg-black border border-white/10 p-2 sm:p-3 lg:p-4 hover:border-white/20 transition-all min-w-0">
                    <CornerAccents />
                    <div className="flex items-center gap-1 sm:gap-1.5 text-emerald-400/70 text-[9px] sm:text-[10px] mb-1 sm:mb-1.5">
                        <ActivityIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 flex-shrink-0" />
                        <span className="truncate">Credits</span>
                    </div>
                    <div className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-emerald-400 font-mono">
                        {formatCredits(stats.totalCredits)}
                    </div>
                    <div className="text-[8px] sm:text-[9px] lg:text-[10px] text-white/40 mt-0.5 sm:mt-1 truncate">
                        Total earned
                    </div>
                </div>

                {/* Avg Uptime */}
                <div className="relative group bg-black border border-white/10 p-2 sm:p-3 lg:p-4 hover:border-white/20 transition-all min-w-0">
                    <CornerAccents />
                    <div className="flex items-center gap-1 sm:gap-1.5 text-blue-400/70 text-[9px] sm:text-[10px] mb-1 sm:mb-1.5">
                        <ClockIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5 flex-shrink-0" />
                        <span className="truncate">Avg Uptime</span>
                    </div>
                    <div className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-blue-400 font-mono">
                        {formatUptime(stats.avgUptime)}
                    </div>
                    <div className="text-[8px] sm:text-[9px] lg:text-[10px] text-white/40 mt-0.5 sm:mt-1 truncate">
                        Per node
                    </div>
                </div>
            </div>
        </div>
    );
};
