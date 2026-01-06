'use client';

import React from 'react';
import { useNetwork } from '@/libs/context/network-context';

export const NodesPageHeader: React.FC = () => {
  const { isMainnet } = useNetwork();
  
  return (
    <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
      {/* Corner accents */}
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

      <div className="space-y-3 sm:space-y-4 animate-blur-reveal relative z-10">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white/90 font-mono">
            // <span className="text-white">PNODES</span>
          </h1>
          <div className={`flex items-center space-x-1.5 px-2 py-1 rounded-full text-xs font-medium ${isMainnet ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isMainnet ? 'bg-blue-400' : 'bg-green-400'}`}></div>
            <span>{isMainnet ? 'Mainnet' : 'Devnet'}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-white/60">
          <span className="text-xs sm:text-sm">›</span>
          <span className="text-xs sm:text-sm">Real-time pNode network monitoring and statistics</span>
        </div>
      </div>
    </div>
  );
};
