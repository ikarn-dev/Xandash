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
    <div className="absolute top-0 left-0 w-6 h-6">
      <div className="absolute top-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      <div className="absolute top-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
    </div>
    <div className="absolute top-0 right-0 w-6 h-6">
      <div className="absolute top-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      <div className="absolute top-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
    </div>
    <div className="absolute bottom-0 left-0 w-6 h-6">
      <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      <div className="absolute bottom-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
    </div>
    <div className="absolute bottom-0 right-0 w-6 h-6">
      <div className="absolute bottom-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      <div className="absolute bottom-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
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

// Modern SVG Pie Chart Component with hover tooltips
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
  const availablePercentage = committed > 0 ? (available / committed) * 100 : 100;
  
  // SVG pie chart calculations
  const size = 120;
  const center = size / 2;
  const radius = 45;
  const strokeWidth = 12;
  
  // Calculate arc paths for true pie segments
  const createArcPath = (startAngle: number, endAngle: number, r: number) => {
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    const x1 = center + r * Math.cos(startRad);
    const y1 = center + r * Math.sin(startRad);
    const x2 = center + r * Math.cos(endRad);
    const y2 = center + r * Math.sin(endRad);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${center} ${center} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };
  
  // Angles for segments
  const usedAngle = (usedPercentage / 100) * 360;
  
  const usedFormatted = formatStorage(used);
  const availableFormatted = formatStorage(available);
  const avgFormatted = formatStorage(avgPerPod);
  
  const getTooltipContent = () => {
    switch (hoveredSegment) {
      case 'used':
        return `Used: ${usedFormatted.value} ${usedFormatted.unit}`;
      case 'available':
        return `Available: ${availableFormatted.value} ${availableFormatted.unit}`;
      case 'avg':
        return `Avg/Pod: ${avgFormatted.value} ${avgFormatted.unit}`;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Pie Chart */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Available segment (gray) - full circle as background */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="rgba(255,255,255,0.25)"
            className={`transition-all duration-200 cursor-pointer ${hoveredSegment === 'available' ? 'opacity-100' : 'opacity-80'}`}
            onMouseEnter={() => setHoveredSegment('available')}
            onMouseLeave={() => setHoveredSegment(null)}
          />
          
          {/* Used segment (green) */}
          {usedPercentage > 0 && (
            <path
              d={createArcPath(0, Math.max(usedAngle, 1), radius)}
              fill="#10b981"
              className={`transition-all duration-200 cursor-pointer ${hoveredSegment === 'used' ? 'opacity-100 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'opacity-90'}`}
              onMouseEnter={() => setHoveredSegment('used')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          )}
          
          {/* Inner circle to create donut effect */}
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth}
            fill="black"
          />
          
          {/* Center indicator dot for avg (white) */}
          <circle
            cx={center}
            cy={center}
            r={8}
            fill="white"
            className={`transition-all duration-200 cursor-pointer ${hoveredSegment === 'avg' ? 'opacity-100 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'opacity-70'}`}
            onMouseEnter={() => setHoveredSegment('avg')}
            onMouseLeave={() => setHoveredSegment(null)}
          />
        </svg>
        
        {/* Tooltip */}
        {hoveredSegment && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 border border-white/20 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap z-10">
            {getTooltipContent()}
          </div>
        )}
      </div>
      
      {/* Legend - horizontal at bottom with tiny text */}
      <div className="flex items-center gap-3 mt-3">
        <div 
          className="flex items-center gap-1 cursor-pointer"
          onMouseEnter={() => setHoveredSegment('used')}
          onMouseLeave={() => setHoveredSegment(null)}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-white/50 text-[9px]">Used</span>
        </div>
        <div 
          className="flex items-center gap-1 cursor-pointer"
          onMouseEnter={() => setHoveredSegment('avg')}
          onMouseLeave={() => setHoveredSegment(null)}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white" />
          <span className="text-white/50 text-[9px]">Avg</span>
        </div>
        <div 
          className="flex items-center gap-1 cursor-pointer"
          onMouseEnter={() => setHoveredSegment('available')}
          onMouseLeave={() => setHoveredSegment(null)}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
          <span className="text-white/50 text-[9px]">Free</span>
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
          <div className="text-white/80 text-sm font-medium animate-blur-reveal-item-1 text-center">Storage Committed</div>
          <div className="text-white/80 text-sm font-medium animate-blur-reveal-item-2 text-center">Storage Used</div>
          <div className="text-white/80 text-sm font-medium animate-blur-reveal-item-3 text-center">Avg Committed per Pod</div>
          <div className="text-white/80 text-sm font-medium animate-blur-reveal-item-4 text-center">Storage Distribution</div>
        </div>

        {/* Desktop beam divider */}
        <div className="relative mb-6 overflow-hidden hidden lg:block">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-beam shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
          </div>
        </div>

        {/* Desktop layout: 4 columns */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-6 relative">
          <div className="absolute inset-0 grid grid-cols-4 gap-6 pointer-events-none">
            <div></div>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-white/60 to-transparent animate-beam-vertical shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
            </div>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-white/60 to-transparent animate-beam-vertical shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{animationDelay: '0.7s'}}></div>
            </div>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-white/60 to-transparent animate-beam-vertical shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{animationDelay: '1.4s'}}></div>
            </div>
          </div>

          <div className="flex flex-col justify-center items-center animate-blur-reveal-item-1 relative z-10 text-center">
            <div className="text-white text-3xl font-bold font-mono mb-1">{storageCommitted.value}</div>
            <div className="text-white/60 text-sm">{storageCommitted.unit}</div>
          </div>

          <div className="flex flex-col justify-center items-center animate-blur-reveal-item-2 relative z-10 text-center">
            <div className="text-white text-3xl font-bold font-mono mb-1">{storageUsed.value}</div>
            <div className="text-white/60 text-sm">{storageUsed.unit}</div>
          </div>

          <div className="flex flex-col justify-center items-center animate-blur-reveal-item-3 relative z-10 text-center">
            <div className="text-white text-3xl font-bold font-mono mb-1">{avgPerPod.value}</div>
            <div className="text-white/60 text-sm">{avgPerPod.unit}</div>
          </div>

          <div className="flex flex-col justify-center items-center animate-blur-reveal-item-4 relative z-10">
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
          <div className="flex flex-col justify-center items-center animate-blur-reveal-item-1 text-center">
            <div className="text-white/80 text-[10px] sm:text-xs font-medium mb-1">Storage Committed</div>
            <div className="text-white text-lg sm:text-xl font-bold font-mono">{storageCommitted.value}</div>
            <div className="text-white/60 text-xs">{storageCommitted.unit}</div>
          </div>

          <div className="flex flex-col justify-center items-center animate-blur-reveal-item-2 text-center">
            <div className="text-white/80 text-[10px] sm:text-xs font-medium mb-1">Storage Used</div>
            <div className="text-white text-lg sm:text-xl font-bold font-mono">{storageUsed.value}</div>
            <div className="text-white/60 text-xs">{storageUsed.unit}</div>
          </div>

          <div className="flex flex-col justify-center items-center animate-blur-reveal-item-3 text-center">
            <div className="text-white/80 text-[10px] sm:text-xs font-medium mb-1">Avg per Pod</div>
            <div className="text-white text-lg sm:text-xl font-bold font-mono">{avgPerPod.value}</div>
            <div className="text-white/60 text-xs">{avgPerPod.unit}</div>
          </div>
        </div>
      </div>

      {/* Mobile-only pie chart card */}
      <div className="relative bg-black border border-white/10 p-4 group hover:border-white/20 transition-all duration-300 overflow-hidden lg:hidden">
        <CornerEdges />
        <div className="flex flex-col items-center animate-blur-reveal-item-4">
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
