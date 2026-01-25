import React from 'react';

const CornerEdges: React.FC = () => (
  <>
    <div className="absolute top-0 left-0 w-4 h-4">
      <div className="absolute top-0 left-0 w-2 h-px bg-white/20"></div>
      <div className="absolute top-0 left-0 w-px h-2 bg-white/20"></div>
    </div>
    <div className="absolute top-0 right-0 w-4 h-4">
      <div className="absolute top-0 right-0 w-2 h-px bg-white/20"></div>
      <div className="absolute top-0 right-0 w-px h-2 bg-white/20"></div>
    </div>
    <div className="absolute bottom-0 left-0 w-4 h-4">
      <div className="absolute bottom-0 left-0 w-2 h-px bg-white/20"></div>
      <div className="absolute bottom-0 left-0 w-px h-2 bg-white/20"></div>
    </div>
    <div className="absolute bottom-0 right-0 w-4 h-4">
      <div className="absolute bottom-0 right-0 w-2 h-px bg-white/20"></div>
      <div className="absolute bottom-0 right-0 w-px h-2 bg-white/20"></div>
    </div>
  </>
);

// Static pie chart skeleton - no animations
const PieChartSkeleton: React.FC = () => {
  const size = 120;
  const center = size / 2;
  const radius = 45;
  const strokeWidth = 12;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="rgba(255,255,255,0.08)"
          />

          {/* Static arc segments */}
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2}
            fill="none"
            stroke="rgba(16,185,129,0.3)"
            strokeWidth={strokeWidth}
            strokeDasharray="70 200"
            strokeLinecap="round"
          />
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth / 2}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={strokeWidth}
            strokeDasharray="50 200"
            strokeDashoffset="-80"
            strokeLinecap="round"
          />

          {/* Inner circle */}
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth}
            fill="black"
          />

          {/* Center dot */}
          <circle
            cx={center}
            cy={center}
            r={8}
            fill="rgba(255,255,255,0.3)"
          />
        </svg>
      </div>

      {/* Legend skeleton */}
      <div className="flex items-center gap-3 mt-3">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
          <div className="w-6 h-2 bg-white/10 rounded" />
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          <div className="w-5 h-2 bg-white/10 rounded" />
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <div className="w-6 h-2 bg-white/10 rounded" />
        </div>
      </div>
    </div>
  );
};

export const NetworkStatsCardSkeleton: React.FC = () => {
  return (
    <div className="h-full">
      {/* Main stats card skeleton */}
      <div className="relative bg-black border border-white/10 p-4 sm:p-6 h-full flex flex-col">
        <CornerEdges />

        {/* Headers */}
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 mb-3 lg:mb-4">
          <div className="h-3 bg-white/10 rounded w-20 mx-auto"></div>
          <div className="h-3 bg-white/10 rounded w-16 mx-auto"></div>
          <div className="h-3 bg-white/10 rounded w-14 mx-auto"></div>
          <div className="h-3 bg-white/10 rounded w-24 mx-auto hidden lg:block"></div>
        </div>

        {/* Divider line */}
        <div className="relative mb-4 lg:mb-6 overflow-hidden">
          <div className="w-full h-px bg-white/10"></div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6 flex-1">
          <div className="flex flex-col justify-center items-center text-center">
            <div className="h-6 sm:h-7 lg:h-8 bg-white/10 rounded w-14 sm:w-16 mb-1"></div>
            <div className="h-3 sm:h-4 bg-white/10 rounded w-6 sm:w-8"></div>
          </div>

          <div className="flex flex-col justify-center items-center text-center">
            <div className="h-6 sm:h-7 lg:h-8 bg-white/10 rounded w-12 sm:w-14 mb-1"></div>
            <div className="h-3 sm:h-4 bg-white/10 rounded w-6 sm:w-8"></div>
          </div>

          <div className="flex flex-col justify-center items-center text-center">
            <div className="h-6 sm:h-7 lg:h-8 bg-white/10 rounded w-10 sm:w-12 mb-1"></div>
            <div className="h-3 sm:h-4 bg-white/10 rounded w-6 sm:w-8"></div>
          </div>

          <div className="hidden lg:flex flex-col justify-center items-center">
            <PieChartSkeleton />
          </div>
        </div>

        {/* Mobile pie chart */}
        <div className="lg:hidden mt-4 pt-4 border-t border-white/10">
          <div className="flex flex-col items-center">
            <div className="h-3 bg-white/10 rounded w-24 mb-2"></div>
            <PieChartSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
};