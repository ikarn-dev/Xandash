'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface NetworkNodesCardProps {
  className?: string;
  totalNodes: number;
  locatedNodes: number;
  isLoading: boolean;
  error: string | null;
}

export const NetworkNodesCard: React.FC<NetworkNodesCardProps> = ({ 
  className = "", 
  totalNodes,
  locatedNodes,
  isLoading,
  error
}) => {
  const locatedPercentage = totalNodes > 0 ? (locatedNodes / totalNodes) * 100 : 0;

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

  if (isLoading) {
    return (
      <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
        <CornerAccents />
        <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
          <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin mb-3"></div>
          <div className="text-white/40 text-xs">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
        <CornerAccents />
        <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
          <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-red-400 text-xs">Error</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
      <CornerAccents />
      
      <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
        <div className="text-white/50 text-xs font-medium tracking-wider mb-3">// MAPPED NODES</div>
        <div className="text-green-400 text-4xl lg:text-5xl font-bold font-mono mb-1">
          {locatedNodes}
        </div>
        <div className="text-white/40 text-[10px] mb-3">
          of {totalNodes} total nodes
        </div>
        
        {/* Located Nodes Bar */}
        <div className="w-full px-2 mt-1">
          <svg className="w-full" height="24" viewBox="0 0 200 24" preserveAspectRatio="none">
            {Array.from({ length: 45 }).map((_, index) => {
              const fillCount = Math.round((locatedPercentage / 100) * 45);
              return (
                <rect
                  key={index}
                  x={index * 4.5}
                  y={0}
                  width={3}
                  height={24}
                  rx={1}
                  fill={index < fillCount ? '#22c55e' : '#374151'}
                />
              );
            })}
          </svg>
          <div className="flex justify-center items-center mt-1.5">
            <span className="text-green-400 text-[9px] font-medium">{locatedPercentage.toFixed(1)}% located</span>
          </div>
        </div>
      </div>
    </div>
  );
};
