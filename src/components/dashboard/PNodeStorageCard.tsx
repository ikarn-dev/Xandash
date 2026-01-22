'use client';

import React, { useMemo } from 'react';
import { useNodesData } from '@/libs/context/nodes-data-context';
import { AnimatedValue } from '@/components/ui/SlotNumber';

interface PNodeStorageCardProps {
  className?: string;
}

// CornerAccents component defined outside render
const CornerAccents = () => (
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

export const PNodeStorageCard: React.FC<PNodeStorageCardProps> = ({ className = "" }) => {
  // Use shared nodes data context - single source of truth
  const { nodes, isLoading } = useNodesData();

  // Calculate storage stats from shared nodes data
  const storageStats = useMemo(() => {
    const totalStorage = nodes.reduce((sum, node) => sum + (node.storage_committed || 0), 0);
    const usedStorage = nodes.reduce((sum, node) => sum + (node.storage_used || 0), 0);
    const usagePercentage = totalStorage > 0 ? (usedStorage / totalStorage) * 100 : 0;

    return { totalStorage, usedStorage, usagePercentage };
  }, [nodes]);

  // Format bytes with full precision (no rounding)
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return value.toFixed(2) + sizes[i];
  };

  if (isLoading && nodes.length === 0) {
    return (
      <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
        <CornerAccents />
        <div className="flex flex-col h-full text-center relative z-10">
          <div className="text-white/60 text-[10px] sm:text-xs font-medium tracking-wider mb-3 sm:mb-4 uppercase">Storage Details</div>
          <div className="h-10 w-28 bg-white/10 rounded mb-2 mx-auto"></div>
          <div className="h-3 w-20 bg-white/10 rounded mb-3 sm:mb-4 mx-auto"></div>
          <div className="h-5 w-full bg-white/10 rounded mt-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
      <CornerAccents />

      {/* Content */}
      <div className="flex flex-col h-full text-center relative z-10">
        <div className="text-white/60 text-[10px] sm:text-xs font-medium tracking-wider mb-3 sm:mb-4 uppercase">Storage Details</div>
        <div className="text-orange-400 text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-1 sm:mb-2 flex items-baseline justify-center gap-2">
          <AnimatedValue value={formatBytes(storageStats.usedStorage)} />
          <span className="text-orange-400/60 text-sm font-normal">Used</span>
        </div>
        <div className="text-white/40 text-[10px] sm:text-xs mb-3 sm:mb-4">
          of <AnimatedValue value={formatBytes(storageStats.totalStorage)} />
        </div>

        {/* Storage Bar Graph */}
        <div className="w-full px-1 sm:px-2 mt-auto">
          <svg
            className="w-full"
            height="20"
            viewBox="0 0 200 24"
            preserveAspectRatio="none"
          >
            {Array.from({ length: 45 }).map((_, index) => {
              const segmentPercentage = (index / 45) * 100;
              const isFilled = segmentPercentage <= storageStats.usagePercentage;

              return (
                <rect
                  key={index}
                  x={index * 4.5}
                  y={0}
                  width={3}
                  height={24}
                  rx={1}
                  fill={isFilled ? '#fb923c' : '#374151'}
                />
              );
            })}
          </svg>
          <div className="flex justify-between items-center mt-1 sm:mt-1.5">
            <span className="text-white/40 text-[8px] sm:text-[9px]">
              {formatBytes(storageStats.totalStorage - storageStats.usedStorage)} free
            </span>
            <span className="text-orange-400 text-[8px] sm:text-[9px] font-medium">
              {storageStats.usagePercentage < 0.01
                ? storageStats.usagePercentage.toFixed(6)
                : storageStats.usagePercentage < 0.1
                  ? storageStats.usagePercentage.toFixed(4)
                  : storageStats.usagePercentage < 1
                    ? storageStats.usagePercentage.toFixed(3)
                    : storageStats.usagePercentage.toFixed(2)}% used
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
