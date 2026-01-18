'use client';

import React, { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { NetworkStatsCardSkeleton } from './NetworkStatsCardSkeleton';
import { useNetwork } from '@/libs/context/network-context';
import { useNodesData } from '@/libs/context/nodes-data-context';

const formatStorage = (bytes: number) => {
  if (bytes === 0) return { value: '0', unit: 'B' };
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return {
    value: (bytes / Math.pow(k, i)).toFixed(2),
    unit: sizes[i]
  };
};

const CornerEdges: React.FC = () => (
  <>
    <div className="absolute top-0 left-0 w-4 h-4">
      <div className="absolute top-0 left-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
      <div className="absolute top-0 left-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
    </div>
    <div className="absolute top-0 right-0 w-4 h-4">
      <div className="absolute top-0 right-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
      <div className="absolute top-0 right-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
    </div>
    <div className="absolute bottom-0 left-0 w-4 h-4">
      <div className="absolute bottom-0 left-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
      <div className="absolute bottom-0 left-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
    </div>
    <div className="absolute bottom-0 right-0 w-4 h-4">
      <div className="absolute bottom-0 right-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
      <div className="absolute bottom-0 right-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
    </div>
  </>
);

// Loading animation for pie chart
const StoragePieChartLoading: React.FC = () => {
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
          <span className="text-white/30 text-[9px]">Used</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          <span className="text-white/30 text-[9px]">Avg</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span className="text-white/30 text-[9px]">Free</span>
        </div>
      </div>
    </div>
  );
};

// Modern Storage Visualization Component with improved design
interface StoragePieChartProps {
  used: number;
  committed: number;
  avgPerPod: number;
  isLoading?: boolean;
}

const StoragePieChart: React.FC<StoragePieChartProps> = ({ used, committed, avgPerPod, isLoading }) => {
  const [hoveredSegment, setHoveredSegment] = React.useState<string | null>(null);

  // Show loading state
  if (isLoading) {
    return <StoragePieChartLoading />;
  }

  const usedPercentage = committed > 0 ? Math.min((used / committed) * 100, 100) : 0;
  const available = Math.max(committed - used, 0);

  const usedFormatted = formatStorage(used);
  const availableFormatted = formatStorage(available);
  const avgFormatted = formatStorage(avgPerPod);

  const getTooltipContent = () => {
    switch (hoveredSegment) {
      case 'used':
        return `Used: ${usedFormatted.value} ${usedFormatted.unit} (${usedPercentage.toFixed(1)}%)`;
      case 'available':
        return `Available: ${availableFormatted.value} ${availableFormatted.unit}`;
      case 'avg':
        return `Avg/Pod: ${avgFormatted.value} ${avgFormatted.unit}`;
      default:
        return null;
    }
  };

  // Modern radial gauge design
  const size = 120;
  const center = size / 2;
  const radius = 50;
  const strokeWidth = 8;
  const innerRadius = radius - strokeWidth;
  const circumference = 2 * Math.PI * innerRadius;
  const usedOffset = circumference - (usedPercentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      {/* Radial Gauge Chart */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="usedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
            <linearGradient id="availableGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="none"
            stroke="url(#availableGradient)"
            strokeWidth={strokeWidth}
            className={`transition-all duration-200 cursor-pointer ${hoveredSegment === 'available' ? 'opacity-100 drop-shadow-[0_0_6px_rgba(168,85,247,0.6)]' : 'opacity-40'}`}
            onMouseEnter={() => setHoveredSegment('available')}
            onMouseLeave={() => setHoveredSegment(null)}
          />

          {/* Used arc */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="none"
            stroke="url(#usedGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={usedOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            className={`transition-all duration-300 cursor-pointer ${hoveredSegment === 'used' ? 'filter drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]' : ''}`}
            onMouseEnter={() => setHoveredSegment('used')}
            onMouseLeave={() => setHoveredSegment(null)}
          />

          {/* Center content */}
          <g>
            {/* Center circle background */}
            <circle
              cx={center}
              cy={center}
              r={radius - strokeWidth - 6}
              fill="rgba(0,0,0,0.5)"
            />

            {/* Value display */}
            <text
              x={center}
              y={center - 4}
              textAnchor="middle"
              className="fill-cyan-400 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]"
              style={{ fontSize: '11px' }}
            >
              {usedFormatted.value} {usedFormatted.unit}
            </text>
            <text
              x={center}
              y={center + 12}
              textAnchor="middle"
              className="fill-white/50"
              style={{ fontSize: '9px' }}
            >
              USED
            </text>
          </g>

          {/* Decorative dots at ends */}
          {usedPercentage > 0 && (
            <>
              {/* Start dot */}
              <circle
                cx={center}
                cy={center - innerRadius}
                r={3}
                fill="#22d3ee"
                className="transition-all duration-200"
              />
              {/* End dot */}
              <circle
                cx={center + innerRadius * Math.sin((usedPercentage / 100) * 2 * Math.PI)}
                cy={center - innerRadius * Math.cos((usedPercentage / 100) * 2 * Math.PI)}
                r={3}
                fill="#22d3ee"
                filter={hoveredSegment === 'used' ? 'url(#glow)' : undefined}
                className="transition-all duration-200"
              />
            </>
          )}
        </svg>

        {/* Tooltip */}
        {hoveredSegment && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/95 border border-white/20 px-2.5 py-1.5 rounded-lg text-[10px] text-white whitespace-nowrap z-10 shadow-lg">
            {getTooltipContent()}
          </div>
        )}
      </div>

      {/* Legend with visual indicators */}
      <div className="flex items-center gap-4 mt-3">
        <div
          className="flex items-center gap-1.5 cursor-pointer group"
          onMouseEnter={() => setHoveredSegment('used')}
          onMouseLeave={() => setHoveredSegment(null)}
        >
          <div className="w-2 h-2 rounded-full bg-cyan-400 group-hover:shadow-[0_0_6px_rgba(34,211,238,0.6)] transition-all" />
          <span className="text-white/50 text-[9px] group-hover:text-white/70 transition-colors">Used</span>
        </div>
        <div
          className="flex items-center gap-1.5 cursor-pointer group"
          onMouseEnter={() => setHoveredSegment('available')}
          onMouseLeave={() => setHoveredSegment(null)}
        >
          <div className="w-2 h-2 rounded-full bg-purple-500 group-hover:shadow-[0_0_6px_rgba(168,85,247,0.6)] transition-all" />
          <span className="text-white/50 text-[9px] group-hover:text-white/70 transition-colors">Free</span>
        </div>
      </div>
    </div>
  );
};

export const NetworkStatsCardSSR: React.FC = () => {
  const { network, isMainnet } = useNetwork();
  const { nodes, isLoading, stats } = useNodesData();

  // Calculate storage stats from nodes data
  const storageStats = useMemo(() => {
    if (nodes.length === 0) {
      return {
        storage_committed: 0,
        storage_used: 0,
        avg_storage_per_pod: 0,
        total_pods: 0,
      };
    }

    let totalCommitted = 0;
    let totalUsed = 0;

    for (const node of nodes) {
      totalCommitted += node.storage_committed || 0;
      totalUsed += node.storage_used || 0;
    }

    const avgPerPod = nodes.length > 0 ? totalCommitted / nodes.length : 0;

    return {
      storage_committed: totalCommitted,
      storage_used: totalUsed,
      avg_storage_per_pod: avgPerPod,
      total_pods: nodes.length,
    };
  }, [nodes]);

  if (isLoading && nodes.length === 0) {
    return <NetworkStatsCardSkeleton />;
  }

  if (nodes.length === 0 && !isLoading) {
    return (
      <div className="relative bg-black border border-white/10 p-6 h-full flex items-center justify-center group hover:border-white/20 transition-all duration-300">
        <CornerEdges />
        <div className="flex items-center space-x-2 text-white/40">
          <AlertCircle className="w-5 h-5" />
          <span>No nodes data available</span>
        </div>
      </div>
    );
  }

  const storageCommitted = formatStorage(storageStats.storage_committed);
  const storageUsed = formatStorage(storageStats.storage_used);
  const avgPerPod = formatStorage(storageStats.avg_storage_per_pod);

  return (
    <div className="flex flex-col gap-4">
      {/* Main stats card */}
      <div className="relative bg-black border border-white/10 p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
        <CornerEdges />

        {/* Desktop headers */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-6 mb-4">
          <div className="text-white/80 text-sm font-medium text-center">Storage Committed</div>
          <div className="text-white/80 text-sm font-medium text-center">Storage Used</div>
          <div className="text-white/80 text-sm font-medium text-center">Avg Committed per Pod</div>
          <div className="text-white/80 text-sm font-medium text-center">Storage Distribution</div>
        </div>

        {/* Desktop beam divider */}
        <div className="relative mb-6 overflow-hidden hidden lg:block">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          </div>
        </div>

        {/* Desktop layout: 4 columns */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-6 relative">
          <div className="absolute inset-0 grid grid-cols-4 gap-6 pointer-events-none">
            <div></div>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
            </div>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
            </div>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center relative z-10 text-center">
            <div className="text-white text-3xl font-bold font-mono mb-1">{storageCommitted.value}</div>
            <div className="text-white/60 text-sm">{storageCommitted.unit}</div>
          </div>

          <div className="flex flex-col justify-center items-center relative z-10 text-center">
            <div className="text-white text-3xl font-bold font-mono mb-1">{storageUsed.value}</div>
            <div className="text-white/60 text-sm">{storageUsed.unit}</div>
          </div>

          <div className="flex flex-col justify-center items-center relative z-10 text-center">
            <div className="text-white text-3xl font-bold font-mono mb-1">{avgPerPod.value}</div>
            <div className="text-white/60 text-sm">{avgPerPod.unit}</div>
          </div>

          <div className="flex flex-col justify-center items-center relative z-10">
            <StoragePieChart
              used={storageStats.storage_used}
              committed={storageStats.storage_committed}
              avgPerPod={storageStats.avg_storage_per_pod}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Mobile layout: 3 columns for text stats */}
        <div className="grid grid-cols-3 gap-2 lg:hidden">
          <div className="flex flex-col justify-center items-center text-center">
            <div className="text-white/80 text-[10px] sm:text-xs font-medium mb-1">Storage Committed</div>
            <div className="text-white text-lg sm:text-xl font-bold font-mono">{storageCommitted.value}</div>
            <div className="text-white/60 text-xs">{storageCommitted.unit}</div>
          </div>

          <div className="flex flex-col justify-center items-center text-center">
            <div className="text-white/80 text-[10px] sm:text-xs font-medium mb-1">Storage Used</div>
            <div className="text-white text-lg sm:text-xl font-bold font-mono">{storageUsed.value}</div>
            <div className="text-white/60 text-xs">{storageUsed.unit}</div>
          </div>

          <div className="flex flex-col justify-center items-center text-center">
            <div className="text-white/80 text-[10px] sm:text-xs font-medium mb-1">Avg per Pod</div>
            <div className="text-white text-lg sm:text-xl font-bold font-mono">{avgPerPod.value}</div>
            <div className="text-white/60 text-xs">{avgPerPod.unit}</div>
          </div>
        </div>
      </div>

      {/* Mobile-only pie chart card */}
      <div className="relative bg-black border border-white/10 p-4 group hover:border-white/20 transition-all duration-300 overflow-hidden lg:hidden">
        <CornerEdges />
        <div className="flex flex-col items-center">
          <div className="text-white/80 text-xs font-medium mb-3">Storage Distribution</div>
          <StoragePieChart
            used={storageStats.storage_used}
            committed={storageStats.storage_committed}
            avgPerPod={storageStats.avg_storage_per_pod}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};
