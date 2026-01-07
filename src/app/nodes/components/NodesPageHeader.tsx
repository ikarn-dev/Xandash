'use client';

import React from 'react';
import { useNetwork } from '@/libs/context/network-context';
import { CornerAccents } from '@/components/ui';

export const NodesPageHeader: React.FC = () => {
  const { isMainnet } = useNetwork();
  
  return (
    <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
      <CornerAccents />

      <div className="space-y-3 sm:space-y-4 relative z-10">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white/90 font-mono">
            // <span className="text-white">PNODES</span>
          </h1>
          <div className={`flex items-center space-x-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[9px] sm:text-xs font-medium ${isMainnet ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
            <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isMainnet ? 'bg-blue-400' : 'bg-green-400'}`}></div>
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
