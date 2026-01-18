'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useNodesData } from '@/libs/context/nodes-data-context';

interface VersionDistributionCardProps {
  className?: string;
}

const COLORS = [
  '#eab308', // yellow-500 (dominant)
  '#06b6d4', // cyan-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#3b82f6', // blue-500
  '#ec4899', // pink-500
];

// CornerAccents component defined outside render
const CornerAccents = () => (
  <>
    <div className="absolute top-0 left-0 w-4 h-4">
      <div className="absolute top-0 left-0 w-2 h-px bg-white/20 group-hover:bg-white/40 transition-colors duration-200" />
      <div className="absolute top-0 left-0 w-px h-2 bg-white/20 group-hover:bg-white/40 transition-colors duration-200" />
    </div>
    <div className="absolute top-0 right-0 w-4 h-4">
      <div className="absolute top-0 right-0 w-2 h-px bg-white/20 group-hover:bg-white/40 transition-colors duration-200" />
      <div className="absolute top-0 right-0 w-px h-2 bg-white/20 group-hover:bg-white/40 transition-colors duration-200" />
    </div>
    <div className="absolute bottom-0 left-0 w-4 h-4">
      <div className="absolute bottom-0 left-0 w-2 h-px bg-white/20 group-hover:bg-white/40 transition-colors duration-200" />
      <div className="absolute bottom-0 left-0 w-px h-2 bg-white/20 group-hover:bg-white/40 transition-colors duration-200" />
    </div>
    <div className="absolute bottom-0 right-0 w-4 h-4">
      <div className="absolute bottom-0 right-0 w-2 h-px bg-white/20 group-hover:bg-white/40 transition-colors duration-200" />
      <div className="absolute bottom-0 right-0 w-px h-2 bg-white/20 group-hover:bg-white/40 transition-colors duration-200" />
    </div>
  </>
);

export const VersionDistributionCard: React.FC<VersionDistributionCardProps> = ({ className = '' }) => {
  const { nodes, isLoading } = useNodesData();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (nodes.length > 0) {
      // Use setTimeout to avoid setState in effect
      const timer = setTimeout(() => {
        setAnimated(false);
        const animTimer = setTimeout(() => setAnimated(true), 50);
        return () => clearTimeout(animTimer);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [nodes.length]);

  const versionData = useMemo(() => {
    if (nodes.length === 0) return { versions: [], total: 0 };

    const versionCounts = new Map<string, number>();
    nodes.forEach(node => {
      const version = node.version || 'unknown';
      versionCounts.set(version, (versionCounts.get(version) || 0) + 1);
    });

    const total = nodes.length;
    const versions = Array.from(versionCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([version, count], index) => ({
        version,
        count,
        percentage: (count / total) * 100,
        color: COLORS[index % COLORS.length],
      }));

    return { versions, total };
  }, [nodes]);

  // Calculate donut chart segments with gaps and cylindrical effect
  const segments = useMemo(() => {
    if (versionData.versions.length === 0) return [];
    
    const radius = 42;
    const gapPercent = hoveredIndex !== null ? 4 : 1; // Larger gaps on hover
    const circumference = 2 * Math.PI * radius;
    
    let cumulativePercent = 0;
    return versionData.versions.map((item) => {
      const rawPercent = item.percentage;
      const percent = Math.max(0, rawPercent - gapPercent);
      const dashArray = (percent / 100) * circumference;
      const dashOffset = -((cumulativePercent + gapPercent / 2) / 100) * circumference;
      cumulativePercent += rawPercent;
      
      return {
        ...item,
        dashArray,
        dashOffset,
        circumference,
      };
    });
  }, [versionData.versions, hoveredIndex]);

  const hoveredVersion = hoveredIndex !== null ? versionData.versions[hoveredIndex] : null;

  // Format version name - crop long names
  const formatVersion = (version: string, maxLen: number = 5) => {
    if (version.length <= maxLen) return version;
    return `${version.slice(0, maxLen)}..`;
  };

  if (isLoading && nodes.length === 0) {
    return (
      <div className={`relative bg-black/80 border border-white/10 p-3 group flex flex-col ${className}`}>
        <CornerAccents />
        <div className="h-3 w-28 bg-white/10 rounded mb-2 animate-pulse" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-white/5 animate-pulse" />
        </div>
        <div className="grid grid-cols-4 gap-1 mt-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-3 bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black/80 border border-white/10 p-3 group hover:border-white/20 transition-colors duration-200 flex flex-col ${className}`}>
      <CornerAccents />
      
      {/* Header - Top Left */}
      <h3 className="text-white/60 text-[10px] sm:text-xs font-medium tracking-wider mb-1">{/* VERSION DISTRIBUTION */}</h3>

      {/* Donut Chart - Fills available space */}
      <div className="flex-1 flex items-center justify-center min-h-0">
        <div className="relative w-44 h-44 sm:w-52 sm:h-52">
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
            {segments.map((segment, index) => {
              const isHovered = hoveredIndex === index;
              
              return (
                <circle
                  key={`shadow-${segment.version}`}
                  cx="50"
                  cy="51" // Slightly offset for 3D effect
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
                  }}
                />
              );
            })}
            
            {/* Glow layer - rendered behind main segments */}
            {segments.map((segment, index) => {
              const isHovered = hoveredIndex === index;
              if (!isHovered || !animated) return null;
              
              return (
                <circle
                  key={`glow-${segment.version}`}
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
                  }}
                />
              );
            })}
            
            {/* Version segments - main layer */}
            {segments.map((segment, index) => {
              const isHovered = hoveredIndex === index;
              const isDimmed = hoveredIndex !== null && hoveredIndex !== index;
              
              return (
                <circle
                  key={segment.version}
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
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              );
            })}
            
            {/* Highlight layer - rendered on top for better visibility */}
            {segments.map((segment, index) => {
              const isHovered = hoveredIndex === index;
              if (!isHovered || !animated) return null;
              
              return (
                <circle
                  key={`highlight-${segment.version}`}
                  cx="50"
                  cy="49" // Slightly offset upward for 3D highlight effect
                  r={42}
                  fill="none"
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth={1.5}
                  strokeDasharray={`${segment.dashArray} ${segment.circumference}`}
                  strokeDashoffset={segment.dashOffset}
                  strokeLinecap="round"
                  style={{
                    opacity: 0.8,
                  }}
                />
              );
            })}
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {hoveredVersion ? (
              <>
                <div className="text-white text-xl sm:text-2xl font-bold font-mono">
                  {hoveredVersion.percentage.toFixed(1)}%
                </div>
                <div className="text-white/60 text-[8px] sm:text-[9px] font-mono mt-0.5 max-w-[90px] sm:max-w-[110px] truncate px-1">
                  {hoveredVersion.version}
                </div>
                <div className="text-white/40 text-[7px] sm:text-[8px] mt-0.5">
                  {hoveredVersion.count} nodes
                </div>
              </>
            ) : (
              <>
                <div 
                  className="text-white text-2xl sm:text-3xl font-bold font-mono"
                  style={{ opacity: animated ? 1 : 0, transition: 'opacity 0.3s ease' }}
                >
                  {versionData.versions.length}
                </div>
                <div 
                  className="text-white/40 text-[8px] sm:text-[9px] mt-0.5"
                  style={{ opacity: animated ? 1 : 0, transition: 'opacity 0.3s ease 0.1s' }}
                >
                  versions
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Version Legend - Fixed at bottom */}
      <div className="grid grid-cols-4 gap-x-2 gap-y-1.5 pt-2 mt-auto border-t border-white/10">
        {versionData.versions.map((item, index) => {
          const isHovered = hoveredIndex === index;
          const isDimmed = hoveredIndex !== null && hoveredIndex !== index;
          
          return (
            <div
              key={item.version}
              className="flex items-center gap-1.5 cursor-pointer py-0.5 px-0.5 rounded hover:bg-white/5 min-w-0"
              style={{ 
                opacity: animated ? (isDimmed ? 0.2 : 1) : 0,
                transition: 'opacity 0.15s ease, background-color 0.15s ease',
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              title={`${item.version} - ${item.count} nodes (${item.percentage.toFixed(1)}%)`}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 border border-white/20"
                style={{ 
                  backgroundColor: item.color,
                  boxShadow: isHovered ? `0 0 6px ${item.color}` : 'none',
                  transition: 'box-shadow 0.15s ease',
                }}
              />
              <span 
                className="text-[7px] sm:text-[8px] font-mono truncate flex-1 min-w-0"
                style={{ 
                  color: isHovered ? item.color : 'rgba(255,255,255,0.8)',
                  transition: 'color 0.15s ease',
                }}
              >
                {formatVersion(item.version)}
              </span>
              <span className="text-white/70 text-[6px] sm:text-[7px] font-mono flex-shrink-0">
                {item.percentage.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
