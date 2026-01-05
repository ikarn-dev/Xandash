import React from 'react';

export const NodeProfileSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="relative bg-black border border-white/10 p-6 group">
        {/* Corner edges */}
        <div className="absolute top-0 left-0 w-6 h-6">
          <div className="absolute top-0 left-0 w-3 h-0.5 bg-white/30"></div>
          <div className="absolute top-0 left-0 w-0.5 h-3 bg-white/30"></div>
        </div>
        <div className="absolute top-0 right-0 w-6 h-6">
          <div className="absolute top-0 right-0 w-3 h-0.5 bg-white/30"></div>
          <div className="absolute top-0 right-0 w-0.5 h-3 bg-white/30"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-6 h-6">
          <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-white/30"></div>
          <div className="absolute bottom-0 left-0 w-0.5 h-3 bg-white/30"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-6 h-6">
          <div className="absolute bottom-0 right-0 w-3 h-0.5 bg-white/30"></div>
          <div className="absolute bottom-0 right-0 w-0.5 h-3 bg-white/30"></div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gray-700 rounded"></div>
              <div className="space-y-2">
                <div className="w-48 h-6 bg-gray-700 rounded"></div>
                <div className="w-32 h-4 bg-gray-700 rounded"></div>
              </div>
            </div>
            <div className="w-20 h-6 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="relative bg-black border border-white/10 p-6">
            <div className="space-y-3">
              <div className="w-6 h-6 bg-gray-700 rounded"></div>
              <div className="w-16 h-8 bg-gray-700 rounded"></div>
              <div className="w-24 h-4 bg-gray-700 rounded"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Skeleton */}
      <div className="relative bg-black border border-white/10 p-6">
        <div className="space-y-4">
          <div className="w-32 h-6 bg-gray-700 rounded"></div>
          <div className="w-full h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  );
};