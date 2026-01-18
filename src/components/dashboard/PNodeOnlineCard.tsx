'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useNodesData } from '@/libs/context/nodes-data-context';
import { AnimatedValue } from '@/components/ui/SlotNumber';

interface PNodeOnlineCardProps {
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

export const PNodeOnlineCard: React.FC<PNodeOnlineCardProps> = ({ className = "" }) => {
  // Use shared nodes data context - single source of truth
  const { stats, isLoading } = useNodesData();

  if (isLoading && stats.total === 0) {
    return (
      <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
        <CornerAccents />
        <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
          <div className="h-3 w-20 bg-white/10 rounded mb-3"></div>
          <div className="h-10 w-24 bg-white/10 rounded mb-2"></div>
          <div className="h-3 w-32 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  // Calculate how many bars should be green based on online percentage
  const totalBars = 45;
  const greenBars = Math.round((stats.onlinePercentage || 0) / 100 * totalBars);

  return (
    <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
      <CornerAccents />

      {/* Content */}
      <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
        <div className="text-white/50 text-[10px] sm:text-xs font-medium tracking-wider mb-2 sm:mb-3">{/* ONLINE RATE */}</div>
        <div className="text-green-400 text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-1">
          <AnimatedValue value={`${stats.onlinePercentage.toFixed(1)}%`} />
        </div>
        <div className="text-white/40 text-[9px] sm:text-[10px] mb-2 sm:mb-3">
          <AnimatedValue value={stats.online} /> of <AnimatedValue value={stats.total} /> nodes
        </div>
        
        {/* Online Status Bar Graph */}
        <div className="w-full px-1 sm:px-2 mt-1">
          <svg 
            className="w-full" 
            height="20" 
            viewBox="0 0 200 24" 
            preserveAspectRatio="none"
          >
            {Array.from({ length: totalBars }).map((_, index) => (
              <rect
                key={index}
                x={index * 4.5}
                y={0}
                width={3}
                height={24}
                rx={1}
                fill={index < greenBars ? '#10b981' : '#374151'}
              />
            ))}
          </svg>
          <div className="flex justify-between items-center mt-1 sm:mt-1.5">
            <span className="text-white/40 text-[8px] sm:text-[9px]">{stats.offline} offline</span>
            <span className="text-green-400 text-[8px] sm:text-[9px] font-medium">{stats.online} online</span>
            <span className="text-white/40 text-[8px] sm:text-[9px]">{stats.public} public</span>
          </div>
        </div>
      </div>
    </div>
  );
};
