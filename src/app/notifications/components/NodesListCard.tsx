'use client';

import React from 'react';
import { CornerAccents } from '@/components/ui';
import { Icons, formatUptime, StatusBadge, LoadingButton } from './ui';
import type { NodeBinding } from './types';

// Single node item component
function NodeItem({
    node,
    onUnbind,
    onTest,
    isUnbinding,
    isTesting,
}: {
    node: NodeBinding;
    onUnbind: (ip: string) => void;
    onTest: (ip: string) => void;
    isUnbinding: boolean;
    isTesting: boolean;
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-black/40 border border-white/10 p-3 gap-3 hover:border-white/20 transition-colors">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-white text-sm">{node.nodeIp}</span>
                    <StatusBadge status={node.status} />
                    <span className="text-[10px] text-white/40">{node.network}</span>
                </div>
                <div className="text-xs text-white/50 mt-1 flex flex-wrap gap-3">
                    {node.uptime !== undefined && (
                        <span className="flex items-center gap-1">
                            {Icons.clock}
                            {formatUptime(node.uptime)}
                        </span>
                    )}
                    {node.version && <span>v{node.version}</span>}
                    {node.credits !== undefined && (
                        <span className="flex items-center gap-1">
                            {Icons.credits}
                            {node.credits.toLocaleString()}
                        </span>
                    )}
                </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
                {!node.testUsed && (
                    <LoadingButton
                        onClick={() => onTest(node.nodeIp)}
                        loading={isTesting}
                        variant="test"
                    >
                        {Icons.test}
                        <span>Test</span>
                    </LoadingButton>
                )}
                <LoadingButton
                    onClick={() => onUnbind(node.nodeIp)}
                    loading={isUnbinding}
                    variant="danger"
                >
                    {Icons.unlink}
                    <span>Unbind</span>
                </LoadingButton>
            </div>
        </div>
    );
}

// Nodes list card component
interface NodesListCardProps {
    nodes: NodeBinding[];
    onRefresh: () => void;
    onUnbind: (ip: string) => void;
    onTest: (ip: string) => void;
    refreshing: boolean;
    unbindingNode: string | null;
    testingNode: string | null;
}

export function NodesListCard({
    nodes,
    onRefresh,
    onUnbind,
    onTest,
    refreshing,
    unbindingNode,
    testingNode,
}: NodesListCardProps) {
    return (
        <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden h-full">
            <CornerAccents />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm sm:text-base font-bold text-white font-mono">// YOUR NODES</h2>
                    <LoadingButton onClick={onRefresh} loading={refreshing} variant="default">
                        {Icons.refresh}
                        <span>Refresh</span>
                    </LoadingButton>
                </div>

                {nodes.length === 0 ? (
                    <p className="text-white/50 text-sm">No nodes added yet. Add a node to receive notifications.</p>
                ) : (
                    <div className="space-y-2">
                        {nodes.map((node) => (
                            <NodeItem
                                key={`${node.nodeIp}-${node.network}`}
                                node={node}
                                onUnbind={onUnbind}
                                onTest={onTest}
                                isUnbinding={unbindingNode === node.nodeIp}
                                isTesting={testingNode === node.nodeIp}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
