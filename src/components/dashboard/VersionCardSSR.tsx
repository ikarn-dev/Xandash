'use client';

import React, { useMemo } from 'react';
import { VersionCardSkeleton } from './VersionCardSkeleton';
import { useNodesData } from '@/libs/context/nodes-data-context';
import { AnimatedValue } from '@/components/ui/SlotNumber';

// Custom Code Icon
const CodeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

interface VersionStats {
  latestVersion: string;
  nodeCount: number;
  percentage: number;
  totalNodes: number;
  totalVersions: number;
}

// Corner accents component
const CornerAccents = () => (
  <>
    <div className="absolute top-0 left-0 w-3 sm:w-4 h-3 sm:h-4">
      <div className="absolute top-0 left-0 w-1.5 sm:w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
      <div className="absolute top-0 left-0 w-px h-1.5 sm:h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
    </div>
    <div className="absolute top-0 right-0 w-3 sm:w-4 h-3 sm:h-4">
      <div className="absolute top-0 right-0 w-1.5 sm:w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
      <div className="absolute top-0 right-0 w-px h-1.5 sm:h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
    </div>
    <div className="absolute bottom-0 left-0 w-3 sm:w-4 h-3 sm:h-4">
      <div className="absolute bottom-0 left-0 w-1.5 sm:w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
      <div className="absolute bottom-0 left-0 w-px h-1.5 sm:h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
    </div>
    <div className="absolute bottom-0 right-0 w-3 sm:w-4 h-3 sm:h-4">
      <div className="absolute bottom-0 right-0 w-1.5 sm:w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
      <div className="absolute bottom-0 right-0 w-px h-1.5 sm:h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
    </div>
  </>
);

export const VersionCardSSR: React.FC = () => {
  // Use shared nodes data context - includes high watermark logic for mainnet
  const { nodes, isLoading } = useNodesData();

  // Calculate version stats from shared nodes data
  const stats = useMemo((): VersionStats | null => {
    if (nodes.length === 0) {
      return null;
    }

    // Count versions
    const versionCounts = new Map<string, number>();
    nodes.forEach((node) => {
      const version = node.version || 'unknown';
      versionCounts.set(version, (versionCounts.get(version) || 0) + 1);
    });

    // Find most popular version (highest count)
    let maxCount = 0;
    let latestVersion = 'unknown';
    versionCounts.forEach((count, version) => {
      if (count > maxCount && version !== 'unknown') {
        maxCount = count;
        latestVersion = version;
      }
    });

    const totalNodes = nodes.length;
    const percentage = totalNodes > 0 ? (maxCount / totalNodes) * 100 : 0;

    return {
      latestVersion,
      nodeCount: maxCount,
      percentage,
      totalNodes,
      totalVersions: versionCounts.size,
    };
  }, [nodes]);

  if (isLoading) {
    return <VersionCardSkeleton />;
  }

  if (!stats) {
    return (
      <div className="relative bg-black border border-white/10 p-4 sm:p-6 h-full group hover:border-white/20 transition-all duration-300">
        <CornerAccents />
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-white/50 text-[10px] sm:text-xs font-medium tracking-wider">// VERSION</h3>
            <div className="text-white/40">
              <CodeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold font-mono">N/A</div>
            <div className="text-white/40 text-[10px] sm:text-xs mt-1 sm:mt-2">No nodes available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-black border border-white/10 p-4 sm:p-6 h-full group hover:border-white/20 transition-all duration-300">
      <CornerAccents />
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
          <h3 className="text-white/50 text-[10px] sm:text-xs font-medium tracking-wider">// POPULAR VERSION</h3>
          <div className="text-green-400">
            <CodeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center sm:text-left">
            <div className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-mono leading-none">
              v<AnimatedValue value={stats.latestVersion} />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2 sm:mt-3">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-green-400 text-xs sm:text-sm font-mono font-semibold">
                  <AnimatedValue value={stats.nodeCount} /> nodes
                </span>
              </div>
              <span className="text-white/30 text-[10px] sm:text-xs font-mono">
                (<AnimatedValue value={stats.percentage.toFixed(1)} />% of network)
              </span>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/5">
            <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-white/30">
              <span><AnimatedValue value={stats.totalVersions} /> versions total</span>
              <span><AnimatedValue value={stats.totalNodes} /> nodes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
