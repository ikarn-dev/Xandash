'use client';

export function CountryCardSkeleton() {
  return (
    <div className="relative bg-black border border-white/10 p-3 sm:p-4 md:p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-4 bg-gray-700/50 rounded"></div>
          <div className="h-5 bg-gray-700/50 rounded w-24"></div>
        </div>
        <div className="text-right">
          <div className="h-8 bg-gray-700/50 rounded w-10 mb-1"></div>
          <div className="h-3 bg-gray-700/50 rounded w-8"></div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[1, 2, 3].map(j => (
          <div key={j} className="text-center">
            <div className="h-3 bg-gray-700/50 rounded w-12 mx-auto mb-1"></div>
            <div className="h-6 bg-gray-700/50 rounded w-8 mx-auto"></div>
          </div>
        ))}
      </div>
      <div className="h-5 bg-gray-700/50 rounded mb-4"></div>
      <div className="space-y-2 border-t border-white/5 pt-4">
        {[1, 2, 3].map(j => (
          <div key={j} className="flex justify-between">
            <div className="h-3 bg-gray-700/50 rounded w-20"></div>
            <div className="h-3 bg-gray-700/50 rounded w-16"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
