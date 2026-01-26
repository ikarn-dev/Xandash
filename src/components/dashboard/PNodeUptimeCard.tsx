'use client';

import React, { useMemo } from 'react';
import { useNodesData } from '@/libs/context/nodes-data-context';
import { AnimatedValue } from '@/components/ui/SlotNumber';

interface PNodeUptimeCardProps {
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

export const PNodeUptimeCard: React.FC<PNodeUptimeCardProps> = ({ className = "" }) => {
  // Use shared nodes data context - single source of truth
  const { nodes, stats, isLoading } = useNodesData();

  // Calculate uptime stats from shared nodes data
  const uptimeStats = useMemo(() => {
    if (nodes.length === 0) {
      return {
        averageUptime: 0,
        maxUptime: 0,
        uptimePercentage: 0,
        uptimeBars: Array(30).fill(20),
      };
    }

    const uptimes = nodes.map(node => node.uptime || 0);
    const totalUptime = uptimes.reduce((sum, uptime) => sum + uptime, 0);
    const averageUptime = totalUptime / nodes.length;
    const maxUptime = Math.max(...uptimes, 0);
    const uptimePercentage = stats.onlinePercentage;

    // Generate uptime bars based on uptime distribution
    const barCount = 30;
    const uptimeBars: number[] = [];
    const sortedUptimes = [...uptimes].sort((a, b) => a - b);
    const chunkSize = Math.ceil(sortedUptimes.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const startIdx = i * chunkSize;
      const endIdx = Math.min(startIdx + chunkSize, sortedUptimes.length);
      const chunk = sortedUptimes.slice(startIdx, endIdx);

      if (chunk.length > 0) {
        const chunkAvg = chunk.reduce((a, b) => a + b, 0) / chunk.length;
        const barHeight = maxUptime > 0 ? (chunkAvg / maxUptime) * 100 : 0;
        uptimeBars.push(Math.min(100, Math.max(20, barHeight)));
      } else {
        uptimeBars.push(20);
      }
    }

    return { averageUptime, maxUptime, uptimePercentage, uptimeBars };
  }, [nodes, stats.onlinePercentage]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d`;
    return `${hours}h`;
  };

  if (isLoading && nodes.length === 0) {
    return (
      <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
        <CornerAccents />
        <div className="flex flex-col h-full text-center relative z-10">
          <div className="text-white/60 text-[10px] sm:text-xs font-medium tracking-wider mb-3 sm:mb-4 uppercase">Average Uptime</div>
          <div className="h-10 w-16 bg-white/10 rounded mb-2 mx-auto"></div>
          <div className="h-3 w-24 bg-white/10 rounded mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
      <CornerAccents />

      {/* Content */}
      <div className="flex flex-col h-full text-center relative z-10">
        <div className="text-white/60 text-[10px] sm:text-xs font-medium tracking-wider mb-3 sm:mb-4 uppercase">Average Uptime</div>
        <div className="text-blue-400 text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-1">
          <AnimatedValue value={formatUptime(uptimeStats.averageUptime)} />
        </div>
        <div className="text-white/40 text-[9px] sm:text-[10px] mb-3 sm:mb-4 w-full flex items-center justify-center gap-1">
          <AnimatedValue value={`${uptimeStats.uptimePercentage.toFixed(1)}%`} /><span>online</span>
        </div>

        {/* Uptime Bar Graph */}
        <div className="w-full px-1 sm:px-2 mt-auto">
          <svg
            className="w-full"
            height="20"
            viewBox="0 0 200 24"
            preserveAspectRatio="none"
          >
            {Array.from({ length: 45 }).map((_, index) => {
              const uptimeValue = uptimeStats.uptimeBars[index % uptimeStats.uptimeBars.length] || 80;
              const isGood = uptimeValue > 50;

              return (
                <rect
                  key={index}
                  x={index * 4.5}
                  y={0}
                  width={3}
                  height={24}
                  rx={1}
                  fill={isGood ? '#10b981' : '#374151'}
                />
              );
            })}
          </svg>
          <div className="flex justify-center items-center mt-1 sm:mt-1.5">
            <span className="text-green-400 text-[8px] sm:text-[9px] font-medium">
              {uptimeStats.uptimePercentage.toFixed(1)}% uptime
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
