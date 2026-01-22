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
  idPrefix?: string;
}

const StoragePieChart: React.FC<StoragePieChartProps> = ({ used, committed, avgPerPod, isLoading, idPrefix = 'chart' }) => {
  const [hoveredSegment, setHoveredSegment] = React.useState<string | null>(null);
  const [animated, setAnimated] = React.useState(false);

  // Show loading state
  if (isLoading) {
    return <StoragePieChartLoading />;
  }

  React.useEffect(() => {
    if (committed > 0) {
      const timer = setTimeout(() => {
        setAnimated(false);
        const animTimer = setTimeout(() => setAnimated(true), 50);
        return () => clearTimeout(animTimer);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [committed]);

  const usedPercentage = committed > 0 ? Math.min((used / committed) * 100, 100) : 0;
  const available = Math.max(committed - used, 0);
  const availablePercentage = 100 - usedPercentage;

  const usedFormatted = formatStorage(used);
  const availableFormatted = formatStorage(available);

  // Define segments with colors
  const usedColor = '#00ffff'; // Bright cyan
  const availableColor = '#39ff14'; // Bright green

  const segments = React.useMemo(() => {
    if (committed === 0) return [];

    const radius = 42;
    const gapPercent = hoveredSegment !== null ? 4 : 1;
    const circumference = 2 * Math.PI * radius;
    const minVisiblePercent = 3; // Minimum 3% to ensure visibility even for small storage like 1GB

    const segmentsList = [];

    // Used segment - always show if there's any used storage, with minimum visibility
    if (used > 0) {
      const rawPercent = Math.max(usedPercentage, minVisiblePercent);
      const percent = Math.max(minVisiblePercent, rawPercent - gapPercent);
      const dashArray = (percent / 100) * circumference;
      const dashOffset = -(gapPercent / 2 / 100) * circumference;

      segmentsList.push({
        type: 'used',
        color: usedColor,
        dashArray,
        dashOffset,
        percentage: usedPercentage,
        circumference,
      });
    }

    // Available segment - adjust to account for minimum used visibility
    if (availablePercentage > 0) {
      const usedDisplayPercent = used > 0 ? Math.max(usedPercentage, minVisiblePercent) : 0;
      const availableDisplayPercent = 100 - usedDisplayPercent;
      const percent = Math.max(0, availableDisplayPercent - gapPercent);
      const dashArray = (percent / 100) * circumference;
      const dashOffset = -((usedDisplayPercent + gapPercent / 2) / 100) * circumference;

      segmentsList.push({
        type: 'available',
        color: availableColor,
        dashArray,
        dashOffset,
        percentage: availablePercentage,
        circumference,
      });
    }

    return segmentsList;
  }, [usedPercentage, availablePercentage, hoveredSegment, used]);

  const size = 120;

  return (
    <div className="flex flex-col items-center">
      {/* Donut Chart - Similar to Version Distribution */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" style={{ overflow: 'visible' }}>
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={42}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={8}
          />

          {/* Cylindrical shadow layer - rendered behind main segments */}
          {segments.map((segment) => {
            const isHovered = hoveredSegment === segment.type;

            return (
              <circle
                key={`shadow-${segment.type}`}
                cx="50"
                cy="51"
                r={42}
                fill="none"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth={isHovered ? 10 : 8}
                strokeDasharray={`${animated ? segment.dashArray : 0} ${segment.circumference}`}
                strokeDashoffset={segment.dashOffset}
                strokeLinecap="round"
                style={{
                  opacity: animated ? 0.6 : 0,
                  transition: 'opacity 0.15s ease, stroke-width 0.2s ease, stroke-dasharray 0.4s ease-out',
                  pointerEvents: 'none',
                }}
              />
            );
          })}

          {/* Glow layer - rendered behind main segments */}
          {segments.map((segment) => {
            const isHovered = hoveredSegment === segment.type;
            if (!isHovered || !animated) return null;

            return (
              <circle
                key={`glow-${segment.type}`}
                cx="50"
                cy="50"
                r={42}
                fill="none"
                stroke={segment.color}
                strokeWidth={14}
                strokeDasharray={`${segment.dashArray} ${segment.circumference}`}
                strokeDashoffset={segment.dashOffset}
                strokeLinecap="round"
                style={{
                  opacity: 0.3,
                  filter: 'blur(6px)',
                  pointerEvents: 'none',
                }}
              />
            );
          })}

          {/* Main segments layer */}
          {segments.map((segment) => {
            const isHovered = hoveredSegment === segment.type;
            const isDimmed = hoveredSegment !== null && hoveredSegment !== segment.type;

            return (
              <circle
                key={segment.type}
                cx="50"
                cy="50"
                r={42}
                fill="none"
                stroke={segment.color}
                strokeWidth={isHovered ? 10 : 8}
                strokeDasharray={`${animated ? segment.dashArray : 0} ${segment.circumference}`}
                strokeDashoffset={segment.dashOffset}
                strokeLinecap="round"
                className="cursor-pointer"
                style={{
                  opacity: animated ? (isDimmed ? 0.2 : 1) : 0,
                  transition: 'opacity 0.15s ease, stroke-width 0.2s ease, stroke-dasharray 0.4s ease-out',
                  filter: isHovered ? `drop-shadow(0 0 8px ${segment.color})` : 'none',
                }}
                onMouseEnter={() => setHoveredSegment(segment.type)}
                onMouseLeave={() => setHoveredSegment(null)}
                onTouchStart={() => setHoveredSegment(segment.type)}
                onClick={() => setHoveredSegment(hoveredSegment === segment.type ? null : segment.type)}
              />
            );
          })}

          {/* Highlight layer - rendered on top for better visibility */}
          {segments.map((segment) => {
            const isHovered = hoveredSegment === segment.type;
            if (!isHovered || !animated) return null;

            return (
              <circle
                key={`highlight-${segment.type}`}
                cx="50"
                cy="49"
                r={42}
                fill="none"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={1.5}
                strokeDasharray={`${segment.dashArray} ${segment.circumference}`}
                strokeDashoffset={segment.dashOffset}
                strokeLinecap="round"
                style={{
                  opacity: 0.8,
                  pointerEvents: 'none',
                }}
              />
            );
          })}
        </svg>

        {/* Center content - always visible with hover overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
          {hoveredSegment ? (
            // Hovered state - show specific segment info
            <>
              <div className="text-white text-xs font-bold font-mono leading-none text-center">
                {hoveredSegment === 'used' ? `${usedFormatted.value} ${usedFormatted.unit}` : `${availableFormatted.value} ${availableFormatted.unit}`}
              </div>
              <div className="text-white/60 text-[8px] font-mono mt-1 text-center leading-none">
                {hoveredSegment === 'used' ? 'Used' : 'Free'}
              </div>
              <div className="text-white/40 text-[7px] mt-0.5 text-center leading-none">
                {hoveredSegment === 'used' ? `${usedPercentage.toFixed(1)}%` : `${availablePercentage.toFixed(1)}%`}
              </div>
            </>
          ) : (
            // Default state - show overall storage info
            <>
              <div className="text-white text-[9px] font-bold font-mono leading-none text-center whitespace-nowrap">
                {usedFormatted.value} / {formatStorage(committed).value}
              </div>
              <div className="text-white/60 text-[7px] font-mono mt-1 text-center leading-none">
                {formatStorage(committed).unit} Storage
              </div>
              <div className="text-white/40 text-[6px] mt-0.5 text-center leading-none">
                {usedFormatted.value} {usedFormatted.unit} Used
              </div>
            </>
          )}
        </div>
      </div>

      {/* Legend with visual indicators */}
      <div className="flex items-center gap-4 mt-3">
        <div
          className="flex items-center gap-1.5 cursor-pointer group"
          style={{
            opacity: animated ? (hoveredSegment !== null && hoveredSegment !== 'used' ? 0.2 : 1) : 0,
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={() => setHoveredSegment('used')}
          onMouseLeave={() => setHoveredSegment(null)}
        >
          <div
            className="w-2 h-2 rounded-full border border-white/20"
            style={{
              backgroundColor: usedColor,
              boxShadow: hoveredSegment === 'used' ? `0 0 6px ${usedColor}` : 'none',
              transition: 'box-shadow 0.15s ease',
            }}
          />
          <span
            className="text-[9px] transition-colors"
            style={{
              color: hoveredSegment === 'used' ? usedColor : 'rgba(255,255,255,0.8)',
            }}
          >
            Used
          </span>
        </div>
        <div
          className="flex items-center gap-1.5 cursor-pointer group"
          style={{
            opacity: animated ? (hoveredSegment !== null && hoveredSegment !== 'available' ? 0.2 : 1) : 0,
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={() => setHoveredSegment('available')}
          onMouseLeave={() => setHoveredSegment(null)}
        >
          <div
            className="w-2 h-2 rounded-full border border-white/20"
            style={{
              backgroundColor: availableColor,
              boxShadow: hoveredSegment === 'available' ? `0 0 6px ${availableColor}` : 'none',
              transition: 'box-shadow 0.15s ease',
            }}
          />
          <span
            className="text-[9px] transition-colors"
            style={{
              color: hoveredSegment === 'available' ? availableColor : 'rgba(255,255,255,0.8)',
            }}
          >
            Free
          </span>
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
              idPrefix="desktop"
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
            idPrefix="mobile"
          />
        </div>
      </div>
    </div>
  );
};
