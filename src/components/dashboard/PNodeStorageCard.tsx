'use client';

import React, { useMemo } from 'react';
import { useNodesData } from '@/libs/context/nodes-data-context';
import { AnimatedValue } from '@/components/ui/SlotNumber';

interface PNodeStorageCardProps {
  className?: string;
}

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

  const CornerAccents = () => (
    <>
      <div className="absolute top-0 left-0 w-6 h-6">
        <div className="absolute top-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute top-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>
      <div className="absolute top-0 right-0 w-6 h-6">
        <div className="absolute top-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute top-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>
      <div className="absolute bottom-0 left-0 w-6 h-6">
        <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute bottom-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>
      <div className="absolute bottom-0 right-0 w-6 h-6">
        <div className="absolute bottom-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute bottom-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>
    </>
  );

  if (isLoading && nodes.length === 0) {
    return (
      <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
        <CornerAccents />
        <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
          <div className="h-3 w-24 bg-white/10 rounded mb-4"></div>
          <div className="h-10 w-28 bg-white/10 rounded mb-2"></div>
          <div className="h-3 w-20 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
      <CornerAccents />

      {/* Content */}
      <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
        <div className="text-white/50 text-[10px] sm:text-xs font-medium tracking-wider mb-2 sm:mb-4">// STORAGE USED</div>
        <div className="text-orange-400 text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-1 sm:mb-2">
          <AnimatedValue value={formatBytes(storageStats.usedStorage)} />
        </div>
        <div className="text-white/40 text-[10px] sm:text-xs">
          of <AnimatedValue value={formatBytes(storageStats.totalStorage)} />
        </div>
      </div>
    </div>
  );
};
