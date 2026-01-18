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
    <div className="flex flex-col gap-4">
      {/* Main stats card skeleton */}
      <div className="relative bg-black border border-white/10 p-6">
        <CornerEdges />
        
        {/* Headers - desktop only */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-6 mb-4">
          <div className="h-4 bg-white/10 rounded w-28 mx-auto"></div>
          <div className="h-4 bg-white/10 rounded w-24 mx-auto"></div>
          <div className="h-4 bg-white/10 rounded w-32 mx-auto"></div>
          <div className="h-4 bg-white/10 rounded w-28 mx-auto"></div>
        </div>

        {/* Divider line - desktop only */}
        <div className="relative mb-6 overflow-hidden hidden lg:block">
          <div className="w-full h-0.5 bg-white/10"></div>
        </div>

        {/* Desktop layout: 4 columns */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-6">
          <div className="flex flex-col justify-center items-center text-center">
            <div className="h-8 bg-white/10 rounded w-16 mb-1"></div>
            <div className="h-4 bg-white/10 rounded w-8"></div>
          </div>

          <div className="flex flex-col justify-center items-center text-center">
            <div className="h-8 bg-white/10 rounded w-14 mb-1"></div>
            <div className="h-4 bg-white/10 rounded w-8"></div>
          </div>

          <div className="flex flex-col justify-center items-center text-center">
            <div className="h-8 bg-white/10 rounded w-12 mb-1"></div>
            <div className="h-4 bg-white/10 rounded w-8"></div>
          </div>

          <div className="flex flex-col justify-center items-center">
            <PieChartSkeleton />
          </div>
        </div>

        {/* Mobile layout: 3 columns for text stats */}
        <div className="grid grid-cols-3 gap-2 lg:hidden">
          <div className="flex flex-col justify-center items-center text-center">
            <div className="h-2 bg-white/10 rounded w-16 mb-1"></div>
            <div className="h-6 bg-white/10 rounded w-12 mb-1"></div>
            <div className="h-3 bg-white/10 rounded w-6"></div>
          </div>

          <div className="flex flex-col justify-center items-center text-center">
            <div className="h-2 bg-white/10 rounded w-14 mb-1"></div>
            <div className="h-6 bg-white/10 rounded w-10 mb-1"></div>
            <div className="h-3 bg-white/10 rounded w-6"></div>
          </div>

          <div className="flex flex-col justify-center items-center text-center">
            <div className="h-2 bg-white/10 rounded w-14 mb-1"></div>
            <div className="h-6 bg-white/10 rounded w-10 mb-1"></div>
            <div className="h-3 bg-white/10 rounded w-6"></div>
          </div>
        </div>
      </div>

      {/* Mobile-only pie chart card skeleton */}
      <div className="relative bg-black border border-white/10 p-4 lg:hidden">
        <CornerEdges />
        <div className="flex flex-col items-center">
          <div className="h-3 bg-white/10 rounded w-28 mb-3"></div>
          <PieChartSkeleton />
        </div>
      </div>
    </div>
  );
};