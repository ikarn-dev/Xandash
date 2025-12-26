'use client';

import React from 'react';

export const NetworkSelector: React.FC = () => {
  return (
    <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20 text-white/90 text-sm">
      <div className="w-2 h-2 rounded-full bg-green-400"></div>
      <span>Devnet</span>
    </div>
  );
};
