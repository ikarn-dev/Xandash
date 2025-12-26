import React from 'react';

export const ValidatorTableSkeleton: React.FC<{ count?: number }> = ({ count = 25 }) => {
  return (
    <div className="bg-black/20 rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="bg-black/40 border-b border-gray-800/50 px-6 py-4">
        <div className="grid grid-cols-9 gap-4">
          {['LOCATION', 'PUBKEY', 'PUBLIC', 'STORAGE', 'USAGE %', 'VERSION', 'UPTIME', 'LAST SEEN', 'STATUS'].map((header) => (
            <div key={header} className="h-4 bg-gray-700/50 rounded animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-800/30">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="px-6 py-4">
            <div className="grid grid-cols-9 gap-4 items-center">
              {/* Location */}
              <div className="flex items-center space-x-2">
                <div className="w-4 h-3 bg-gray-700/50 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-700/50 rounded animate-pulse"></div>
              </div>
              
              {/* Pubkey */}
              <div className="h-4 w-20 bg-gray-700/50 rounded animate-pulse"></div>
              
              {/* Public */}
              <div className="flex justify-center">
                <div className="w-4 h-4 bg-gray-700/50 rounded animate-pulse"></div>
              </div>
              
              {/* Storage */}
              <div className="h-4 w-16 bg-gray-700/50 rounded animate-pulse"></div>
              
              {/* Usage % */}
              <div className="h-4 w-12 bg-gray-700/50 rounded animate-pulse"></div>
              
              {/* Version */}
              <div className="h-4 w-12 bg-gray-700/50 rounded animate-pulse"></div>
              
              {/* Uptime */}
              <div className="h-4 w-16 bg-gray-700/50 rounded animate-pulse"></div>
              
              {/* Last Seen */}
              <div className="h-4 w-12 bg-gray-700/50 rounded animate-pulse"></div>
              
              {/* Status */}
              <div className="flex justify-center">
                <div className="w-3 h-3 bg-gray-700/50 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};