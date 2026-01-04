import React from 'react';

export const VersionCardSkeleton: React.FC = () => {
  return (
    <div className="relative bg-black border border-white/10 p-4 sm:p-6 h-full animate-pulse">
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 sm:w-6 h-4 sm:h-6">
        <div className="absolute top-0 left-0 w-2 sm:w-3 h-0.5 bg-white/20"></div>
        <div className="absolute top-0 left-0 w-0.5 h-2 sm:h-3 bg-white/20"></div>
      </div>
      <div className="absolute top-0 right-0 w-4 sm:w-6 h-4 sm:h-6">
        <div className="absolute top-0 right-0 w-2 sm:w-3 h-0.5 bg-white/20"></div>
        <div className="absolute top-0 right-0 w-0.5 h-2 sm:h-3 bg-white/20"></div>
      </div>
      <div className="absolute bottom-0 left-0 w-4 sm:w-6 h-4 sm:h-6">
        <div className="absolute bottom-0 left-0 w-2 sm:w-3 h-0.5 bg-white/20"></div>
        <div className="absolute bottom-0 left-0 w-0.5 h-2 sm:h-3 bg-white/20"></div>
      </div>
      <div className="absolute bottom-0 right-0 w-4 sm:w-6 h-4 sm:h-6">
        <div className="absolute bottom-0 right-0 w-2 sm:w-3 h-0.5 bg-white/20"></div>
        <div className="absolute bottom-0 right-0 w-0.5 h-2 sm:h-3 bg-white/20"></div>
      </div>

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
          <div className="h-3 sm:h-4 bg-white/10 rounded w-24 sm:w-32"></div>
          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white/10 rounded"></div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center sm:text-left">
            <div className="h-8 sm:h-10 md:h-12 lg:h-14 bg-white/10 rounded w-28 sm:w-36 mx-auto sm:mx-0"></div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2 sm:mt-3">
              <div className="h-4 sm:h-5 bg-white/10 rounded w-20 sm:w-24 mx-auto sm:mx-0"></div>
              <div className="h-3 sm:h-4 bg-white/5 rounded w-24 sm:w-28 mx-auto sm:mx-0"></div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/5">
            <div className="flex justify-between">
              <div className="h-3 bg-white/5 rounded w-16 sm:w-20"></div>
              <div className="h-3 bg-white/5 rounded w-12 sm:w-16"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};