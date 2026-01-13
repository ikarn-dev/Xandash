import React from 'react';

const CornerEdges: React.FC = () => (
  <>
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
  </>
);

// Pie chart skeleton with spinning animation
const PieChartSkeleton: React.FC = () => {
  const size = 120;
  const center = size / 2;
  const radius = 45;
  const strokeWidth = 12;
  const innerRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * innerRadius;

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
          
          {/* Spinning arc segment */}
          <g style={{ 
            animation: 'spin 1.5s linear infinite',
            transformOrigin: 'center',
            transformBox: 'fill-box'
          }}>
            <circle
              cx={center}
              cy={center}
              r={innerRadius}
              fill="none"
              stroke="rgba(16,185,129,0.5)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference * 0.25} ${circumference * 0.75}`}
              strokeLinecap="round"
            />
          </g>
          
          {/* Inner circle */}
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth}
            fill="black"
          />
          
          {/* Center pulsing dot */}
          <circle
            cx={center}
            cy={center}
            r={8}
            fill="rgba(255,255,255,0.6)"
            style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
          />
          
          {/* Define animations in SVG */}
          <defs>
            <style>
              {`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                  0%, 100% { opacity: 0.4; }
                  50% { opacity: 0.9; }
                }
              `}
            </style>
          </defs>
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
          <div className="h-4 bg-white/10 rounded w-28 mx-auto animate-pulse"></div>
          <div className="h-4 bg-white/10 rounded w-24 mx-auto animate-pulse"></div>
          <div className="h-4 bg-white/10 rounded w-32 mx-auto animate-pulse"></div>
          <div className="h-4 bg-white/10 rounded w-28 mx-auto animate-pulse"></div>
        </div>

        {/* Divider line - desktop only */}
        <div className="relative mb-6 overflow-hidden hidden lg:block">
          <div className="w-full h-0.5 bg-white/10"></div>
        </div>

        {/* Desktop layout: 4 columns */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-6">
          <div className="flex flex-col justify-center items-center text-center">
            <div className="h-8 bg-white/10 rounded w-16 mb-1 animate-pulse"></div>
            <div className="h-4 bg-white/10 rounded w-8 animate-pulse"></div>
          </div>

          <div className="flex flex-col justify-center items-center text-center">
            <div className="h-8 bg-white/10 rounded w-14 mb-1 animate-pulse"></div>
            <div className="h-4 bg-white/10 rounded w-8 animate-pulse"></div>
          </div>

          <div className="flex flex-col justify-center items-center text-center">
            <div className="h-8 bg-white/10 rounded w-12 mb-1 animate-pulse"></div>
            <div className="h-4 bg-white/10 rounded w-8 animate-pulse"></div>
          </div>

          <div className="flex flex-col justify-center items-center">
            <PieChartSkeleton />
          </div>
        </div>

        {/* Mobile layout: 3 columns for text stats */}
        <div className="grid grid-cols-3 gap-2 lg:hidden">
          <div className="flex flex-col justify-center items-center text-center">
            <div className="h-2 bg-white/10 rounded w-16 mb-1 animate-pulse"></div>
            <div className="h-6 bg-white/10 rounded w-12 mb-1 animate-pulse"></div>
            <div className="h-3 bg-white/10 rounded w-6 animate-pulse"></div>
          </div>

          <div className="flex flex-col justify-center items-center text-center">
            <div className="h-2 bg-white/10 rounded w-14 mb-1 animate-pulse"></div>
            <div className="h-6 bg-white/10 rounded w-10 mb-1 animate-pulse"></div>
            <div className="h-3 bg-white/10 rounded w-6 animate-pulse"></div>
          </div>

          <div className="flex flex-col justify-center items-center text-center">
            <div className="h-2 bg-white/10 rounded w-14 mb-1 animate-pulse"></div>
            <div className="h-6 bg-white/10 rounded w-10 mb-1 animate-pulse"></div>
            <div className="h-3 bg-white/10 rounded w-6 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Mobile-only pie chart card skeleton */}
      <div className="relative bg-black border border-white/10 p-4 lg:hidden">
        <CornerEdges />
        <div className="flex flex-col items-center">
          <div className="h-3 bg-white/10 rounded w-28 mb-3 animate-pulse"></div>
          <PieChartSkeleton />
        </div>
      </div>
    </div>
  );
};