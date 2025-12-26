import React from 'react';

export const VersionCardSkeleton: React.FC = () => {
  return (
    <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl p-4 shadow-lg animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 bg-gray-700/50 rounded-lg"></div>
        <div className="h-4 bg-gray-700/50 rounded w-12"></div>
      </div>
      <div className="h-3 bg-gray-700/50 rounded w-16 mb-1"></div>
      <div className="h-6 bg-gray-700/50 rounded w-12 mb-1"></div>
      <div className="h-3 bg-gray-700/50 rounded w-20"></div>
    </div>
  );
};