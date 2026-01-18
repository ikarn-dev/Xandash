'use client';

import React from 'react';
import { ManagerNodeCard } from './ManagerNodeCard';
import { UsersIcon } from './ManagerProfileIcons';
import type { EnrichedNodeData } from './types';

interface ManagerNodesListProps {
    nodes: EnrichedNodeData[];
}

export const ManagerNodesList = ({ nodes }: ManagerNodesListProps) => {
    // Sort nodes: online first, then by registration time
    const sortedNodes = [...nodes].sort((a, b) => {
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        return 0;
    });

    return (
        <div className="space-y-3 sm:space-y-4">
            {/* Section Header */}
            <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                    <h2 className="text-base sm:text-lg font-semibold text-white">Registered Nodes</h2>
                </div>
                <div className="text-white/40 text-xs sm:text-sm">
                    {nodes.filter(n => n.isOnline).length} online / {nodes.length} total
                </div>
            </div>

            {/* Nodes Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                {sortedNodes.map((node, index) => (
                    <ManagerNodeCard
                        key={node.pnode_pubkey}
                        node={node}
                        index={index}
                    />
                ))}
            </div>

            {/* Empty state */}
            {nodes.length === 0 && (
                <div className="text-center py-8 sm:py-12 bg-black border border-white/10">
                    <UsersIcon className="w-8 h-8 sm:w-12 sm:h-12 text-white/20 mx-auto mb-3 sm:mb-4" />
                    <div className="text-white/50 text-base sm:text-lg">No nodes registered</div>
                    <div className="text-white/30 text-xs sm:text-sm mt-1 sm:mt-2">
                        This manager has no nodes registered yet
                    </div>
                </div>
            )}
        </div>
    );
};
