'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CopyBtn as CopyButton } from '@/components/ui/CopyBtn';
import { ServerIcon, ClockIcon, ExternalLinkIcon, CheckCircleIcon, XCircleIcon, CalendarIcon, ActivityIcon } from './ManagerProfileIcons';
import { CornerAccents } from '@/components/ui';
import type { EnrichedNodeData } from './types';

interface ManagerNodeCardProps {
    node: EnrichedNodeData;
    index: number;
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

function truncateAddress(address: string, start = 8, end = 6): string {
    if (address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export const ManagerNodeCard = ({ node, index }: ManagerNodeCardProps) => {
    const router = useRouter();
    const { validator, isOnline, ip } = node;

    const handleViewProfile = () => {
        if (ip) {
            router.push(`/profile/${ip}`);
        }
    };

    return (
        <div className="relative group bg-black border border-white/10 hover:border-white/20 transition-all duration-300 overflow-hidden">
            <CornerAccents />
            {/* Card Header */}
            <div className="p-3 sm:p-4 border-b border-white/5">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        {/* Online indicator dot */}
                        <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0 ${isOnline ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-red-500/50'
                            }`} />

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className="text-white/40 text-[10px] sm:text-xs font-mono">#{index + 1}</span>
                                <span className="text-white font-mono text-xs sm:text-sm truncate">
                                    {truncateAddress(node.pnode_pubkey, 6, 4)}
                                </span>
                                <CopyButton text={node.pnode_pubkey} />
                            </div>
                            {ip && (
                                <div className="text-white/40 text-[10px] sm:text-xs font-mono mt-0.5 sm:mt-1">
                                    {ip}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Card Body - Stats */}
            <div className="p-3 sm:p-4">
                {validator && isOnline ? (
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        {/* Uptime */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-1 text-white/40 text-[9px] sm:text-[10px]">
                                <ClockIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span>Uptime</span>
                            </div>
                            <div className="text-blue-400 text-xs sm:text-sm font-mono font-medium">
                                {formatUptime(validator.uptime || 0)}
                            </div>
                        </div>

                        {/* Storage */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-1 text-white/40 text-[9px] sm:text-[10px]">
                                <ServerIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span>Storage</span>
                            </div>
                            <div className="text-orange-400 text-xs sm:text-sm font-mono font-medium">
                                {formatBytes(validator.storage_committed || 0)}
                            </div>
                        </div>

                        {/* Used */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-1 text-white/40 text-[9px] sm:text-[10px]">
                                <ServerIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span>Used</span>
                            </div>
                            <div className="text-yellow-400 text-xs sm:text-sm font-mono font-medium">
                                {formatBytes(validator.storage_used || 0)}
                            </div>
                        </div>

                        {/* Credits */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-1 text-white/40 text-[9px] sm:text-[10px]">
                                <ActivityIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                <span>Credits</span>
                            </div>
                            <div className="text-emerald-400 text-xs sm:text-sm font-mono font-medium">
                                {formatCredits(validator.credits || 0)}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4 sm:py-6">
                        <XCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-red-500/50 mx-auto mb-2" />
                        <div className="text-white/40 text-xs sm:text-sm">
                            {isOnline ? 'No validator data' : 'Node offline'}
                        </div>
                    </div>
                )}
            </div>

            {/* Card Footer - Actions */}
            {ip && (
                <div className="p-3 sm:p-4 border-t border-white/5">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500/50'}`} />
                            <span className="text-white/40 text-[10px] sm:text-xs">
                                {isOnline ? 'Online' : 'Offline'}
                            </span>
                        </div>
                        <button
                            onClick={handleViewProfile}
                            className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] sm:text-xs transition-all cursor-pointer"
                        >
                            <span>View Profile</span>
                            <ExternalLinkIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
