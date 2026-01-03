'use client';

import React from 'react';

export const NetworkSelector: React.FC = () => {
  return (
    <div className="flex items-center justify-center space-x-1.5 sm:space-x-2 bg-black/30 backdrop-blur-sm rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 border border-white/20 text-white/90 text-xs sm:text-sm w-full">
      <div className="w-2 h-2 rounded-full bg-green-400"></div>
      <span>Devnet</span>
    </div>
  );
};
