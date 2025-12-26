import React from 'react';

export const ValidatorTableSkeleton: React.FC<{ count?: number }> = ({ count = 25 }) => {
  return (
    <div 
      className="bg-black/20 rounded-lg overflow-x-auto"
      style={{
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="min-w-[900px]">
        {/* Table Header */}
        <div className="bg-black/40 border-b border-gray-800/50 px-4 sm:px-6 py-3 sm:py-4">
          <div className="grid grid-cols-10 gap-2 sm:gap-4">
            {['LOCATION', 'PUBKEY', 'PUBLIC', 'STORAGE', 'USAGE %', 'VERSION', 'UPTIME', 'LAST SEEN', 'RESPONSE', 'STATUS'].map((header) => (
              <div key={header} className="h-3 sm:h-4 bg-gray-700/50 rounded animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-800/30">
          {[...Array(count)].map((_, i) => (
            <div 
              key={i} 
              className="px-4 sm:px-6 py-3 sm:py-4"
              style={{
                animationDelay: `${i * 50}ms`
              }}
            >
              <div className="grid grid-cols-10 gap-2 sm:gap-4 items-center">
                {/* Location */}
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-2 sm:w-4 sm:h-3 bg-gray-700/50 rounded animate-pulse"></div>
                  <div className="h-3 sm:h-4 w-16 sm:w-24 bg-gray-700/50 rounded animate-pulse"></div>
                </div>
                
                {/* Pubkey */}
                <div className="h-3 sm:h-4 w-14 sm:w-20 bg-gray-700/50 rounded animate-pulse"></div>
                
                {/* Public */}
                <div className="flex justify-center">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-700/50 rounded animate-pulse"></div>
                </div>
                
                {/* Storage */}
                <div className="h-3 sm:h-4 w-12 sm:w-16 bg-gray-700/50 rounded animate-pulse"></div>
                
                {/* Usage % */}
                <div className="h-3 sm:h-4 w-10 sm:w-12 bg-gray-700/50 rounded animate-pulse"></div>
                
                {/* Version */}
                <div className="h-3 sm:h-4 w-10 sm:w-12 bg-gray-700/50 rounded animate-pulse"></div>
                
                {/* Uptime */}
                <div className="h-3 sm:h-4 w-12 sm:w-16 bg-gray-700/50 rounded animate-pulse"></div>
                
                {/* Last Seen */}
                <div className="h-3 sm:h-4 w-10 sm:w-12 bg-gray-700/50 rounded animate-pulse"></div>
                
                {/* Response */}
                <div className="h-3 sm:h-4 w-10 sm:w-12 bg-gray-700/50 rounded animate-pulse"></div>
                
                {/* Status */}
                <div className="flex justify-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-700/50 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};