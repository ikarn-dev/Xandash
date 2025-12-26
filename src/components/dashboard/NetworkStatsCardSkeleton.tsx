import React from 'react';

export const NetworkStatsCardSkeleton: React.FC = () => {
  return (
    <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-lg h-full animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 h-full">
        
        {/* Slot Height Skeleton */}
        <div className="flex flex-col justify-center">
          <div className="h-4 bg-gray-700/50 rounded w-16 mb-1"></div>
          <div className="h-8 bg-gray-700/50 rounded w-20"></div>
        </div>

        {/* Current Slot Time Skeleton */}
        <div className="flex flex-col justify-center">
          <div className="h-4 bg-gray-700/50 rounded w-20 mb-1"></div>
          <div className="flex items-center space-x-1">
            <div className="h-8 bg-gray-700/50 rounded w-16"></div>
            <div className="h-5 bg-gray-700/50 rounded w-4"></div>
          </div>
        </div>

        {/* RAM Usage Skeleton */}
        <div className="flex flex-col justify-center">
          <div className="h-4 bg-gray-700/50 rounded w-16 mb-1"></div>
          <div className="flex items-center space-x-2">
            <div className="h-8 bg-gray-700/50 rounded w-12"></div>
            <div className="flex-1 bg-gray-700/50 rounded-full h-2 min-w-[60px]"></div>
          </div>
          <div className="h-3 bg-gray-700/50 rounded w-24 mt-1"></div>
        </div>

        {/* CPU & Uptime Skeleton */}
        <div className="flex flex-col justify-center">
          <div className="h-4 bg-gray-700/50 rounded w-20 mb-1"></div>
          <div className="h-5 bg-gray-700/50 rounded w-16 mb-1"></div>
          <div className="h-4 bg-gray-700/50 rounded w-18 mb-1"></div>
          <div className="h-3 bg-gray-700/50 rounded w-20"></div>
        </div>

      </div>
    </div>
  );
};