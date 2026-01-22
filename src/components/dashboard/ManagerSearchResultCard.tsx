'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import managerLogo from '../../../public/logo/manager_logo.jpg';
import type { ValidatorData } from '@/libs/server';

// --- Shared Types & Interfaces ---

export interface ManagerNode {
    pnode_pubkey: string;
    registered_time: string;
    node_label: string;
}

export interface Manager {
    manager_index: number;
    manager_address: string;
    nodes: ManagerNode[];
}

interface ManagerSearchResultCardProps {
    manager: Manager;
    pubkeyToNode: Map<string, ValidatorData>;
    onNavigateToProfile: (ip: string) => void;
    networkStatus: 'mainnet' | 'devnet' | 'both' | 'none';
}

// --- Icons ---

const ChevronDownIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
    </svg>
);

const ChevronUpIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
    </svg>
);

const ExternalLinkIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

const UserIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const CopyIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

// --- Shared Components ---

const ManagerLogo = ({ size = 40, className = '' }: { size?: number; className?: string }) => (
    <div
        className={`rounded-full border-2 border-white/20 flex items-center justify-center overflow-hidden bg-black/40 ${className}`}
        style={{ width: size, height: size }}
    >
        <Image
            src={managerLogo}
            alt="Manager"
            width={size}
            height={size}
            className="object-cover"
        />
    </div>
);

const StatusBadge = ({ active, total, className = '' }: { active: number; total: number; className?: string }) => {
    const isFullyActive = active === total;
    const isPartiallyActive = active > 0 && active < total;
    // const isInactive = active === 0;

    return (
        <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${isFullyActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : isPartiallyActive
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-white/10 text-white/40 border border-white/10'
                } ${className}`}
        >
            {active}/{total}
        </div>
    );
};

const CopyButton = ({
    text,
    label = 'Copy',
    className = '',
    iconClassName = 'w-3 h-3',
    onClick
}: {
    text: string;
    label?: string;
    className?: string;
    iconClassName?: string;
    onClick?: (e: React.MouseEvent) => void;
}) => {
    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();

        if (onClick) {
            onClick(e);
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied!`);
        } catch {
            toast.error('Failed to copy');
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={`p-1 hover:bg-white/10 transition-colors flex-shrink-0 ${className}`}
            title={`Copy ${label.toLowerCase()}`}
        >
            <CopyIcon className={`text-white/40 hover:text-white/70 ${iconClassName}`} />
        </button>
    );
};

const CornerEdges: React.FC = () => (
    <>
        <div className="absolute top-0 left-0 w-4 h-4">
            <div className="absolute top-0 left-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
            <div className="absolute top-0 left-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
        </div>
        <div className="absolute top-0 right-0 w-4 h-4">
            <div className="absolute top-0 right-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
            <div className="absolute top-0 right-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-4 h-4">
            <div className="absolute bottom-0 left-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
            <div className="absolute bottom-0 left-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-4 h-4">
            <div className="absolute bottom-0 right-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
            <div className="absolute bottom-0 right-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
        </div>
    </>
);

function truncateAddress(address: string, start = 6, end = 4): string {
    if (address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
}

const NetworkBadge = ({ status }: { status: 'mainnet' | 'devnet' | 'both' | 'none' }) => {
    if (status === 'both') {
        return (
            <div className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] uppercase font-bold tracking-wider">
                Mainnet & Devnet
            </div>
        );
    }
    if (status === 'mainnet') {
        return (
            <div className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] uppercase font-bold tracking-wider">
                Mainnet
            </div>
        );
    }
    if (status === 'devnet') {
        return (
            <div className="px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] uppercase font-bold tracking-wider">
                Devnet
            </div>
        );
    }
    return (
        <div className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/30 text-[9px] uppercase font-bold tracking-wider">
            Inactive
        </div>
    );
};

// --- Main Component ---

export const ManagerSearchResultCard: React.FC<ManagerSearchResultCardProps> = ({
    manager,
    pubkeyToNode,
    onNavigateToProfile,
    networkStatus
}) => {
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(false);

    // Count how many nodes are matched (found in network)
    const matchedCount = manager.nodes.filter(n => pubkeyToNode.has(n.pnode_pubkey)).length;

    const copyAddress = async (address: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(address);
            toast.success('Address copied!');
        } catch {
            toast.error('Failed to copy');
        }
    };

    const handleToggle = () => {
        setIsExpanded(prev => !prev);
    };

    const handleViewManager = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/manager/${manager.manager_address}`);
    };

    return (
        <div className={`relative bg-black border border-white/10 hover:border-white/20 transition-all duration-300 group ${isExpanded ? 'z-20' : 'z-0'}`}>
            <CornerEdges />

            {/* Header - Always visible */}
            <div
                onClick={handleToggle}
                className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <ManagerLogo size={40} className="flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white/40 text-xs font-mono">#{manager.manager_index}</span>
                            <span className="text-white font-mono text-sm truncate">
                                {truncateAddress(manager.manager_address, 8, 6)}
                            </span>
                            <CopyButton
                                text={manager.manager_address}
                                label="Address"
                                onClick={(e) => copyAddress(manager.manager_address, e)}
                            />
                            <NetworkBadge status={networkStatus} />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-white/50 text-xs">{manager.nodes.length} nodes</span>
                            {matchedCount > 0 && (
                                <span className="text-emerald-400/80 text-xs">
                                    • {matchedCount} active
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <button
                        onClick={handleViewManager}
                        className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 text-xs font-medium cursor-pointer"
                    >
                        <UserIcon className="w-3 h-3" />
                        <span>View</span>
                    </button>
                    <StatusBadge active={matchedCount} total={manager.nodes.length} />
                    {isExpanded ? (
                        <ChevronUpIcon className="w-4 h-4 text-white/40" />
                    ) : (
                        <ChevronDownIcon className="w-4 h-4 text-white/40" />
                    )}
                </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
                <div className="absolute left-0 right-0 top-full border border-white/10 border-t-0 bg-black shadow-2xl shadow-black/50 w-[calc(100%+2px)] -ml-[1px] flex flex-col max-h-[60vh] sm:max-h-80">
                    <div className="flex-1 overflow-y-auto min-h-0">
                        <div className="divide-y divide-white/5">
                            {manager.nodes.map((node) => {
                                const matchedValidator = pubkeyToNode.get(node.pnode_pubkey);
                                const nodeIP = matchedValidator?.address?.split(':')[0];

                                return (
                                    <div
                                        key={node.pnode_pubkey}
                                        className="p-3 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="text-white/50 text-xs font-mono flex-shrink-0 hidden sm:block w-32">
                                                {nodeIP || '—'}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-white/60 text-xs font-mono truncate">
                                                        {truncateAddress(node.pnode_pubkey, 8, 6)}
                                                    </span>
                                                    <CopyButton
                                                        text={node.pnode_pubkey}
                                                        label="Pubkey"
                                                        className="p-0.5"
                                                        iconClassName="w-3 h-3"
                                                        onClick={(e) => copyAddress(node.pnode_pubkey, e)}
                                                    />
                                                </div>
                                                <div className="text-white/40 text-[10px] mt-0.5">
                                                    Registered: {node.registered_time}
                                                </div>
                                            </div>
                                        </div>

                                        {matchedValidator && nodeIP ? (
                                            <button
                                                onClick={() => onNavigateToProfile(nodeIP)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-white/10 text-white border border-white/20 hover:border-white/40 transition-all duration-300 text-xs font-medium flex-shrink-0 cursor-pointer"
                                            >
                                                <span className="hidden sm:inline">View Profile</span>
                                                <span className="sm:hidden">Profile</span>
                                                <ExternalLinkIcon className="w-3 h-3" />
                                            </button>
                                        ) : (
                                            <div className="px-3 py-1.5 bg-white/5 text-white/30 border border-white/10 text-xs flex-shrink-0">
                                                Offline
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="p-3 border-t border-white/10 flex-shrink-0 bg-black">
                        <button
                            onClick={handleViewManager}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 text-sm font-medium cursor-pointer"
                        >
                            <UserIcon className="w-4 h-4" />
                            <span>View Manager Profile</span>
                            <ExternalLinkIcon className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
