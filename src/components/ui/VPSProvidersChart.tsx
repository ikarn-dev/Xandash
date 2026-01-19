'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';

interface VPSProviderData {
  provider: string;
  count: number;
}

interface VPSProvidersChartProps {
  data: VPSProviderData[];
  isLoading?: boolean;
  height?: number;
  title?: string;
  maxItems?: number;
  showTopValue?: boolean;
}

// Assign colors based on index - using different distinct colors
const getProviderColor = (index: number): string => {
  const colors = [
    '#a855f7', // purple
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#84cc16', // lime
    '#f97316', // orange
    '#6366f1', // indigo
    '#14b8a6', // teal
    '#eab308', // yellow
  ];
  return colors[index % colors.length];
};

// Loading skeleton
const ChartLoadingSkeleton = ({ height }: { height: number }) => (
  <div className="bg-[#0a0a0a] border border-white/10 overflow-hidden" style={{ height: height + 60 }}>
    <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-white/10">
      <div className="h-4 w-32 bg-white/10 animate-pulse" />
    </div>
    <div className="p-3 space-y-2">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-20 h-2.5 bg-white/10 animate-pulse" />
          <div className="flex-1 h-3 bg-white/5 animate-pulse" />
        </div>
      ))}
    </div>
  </div>
);

export const VPSProvidersChart: React.FC<VPSProvidersChartProps> = ({
  data,
  isLoading = false,
  height = 200,
  title = 'VPS Providers',
  maxItems = 10,
  showTopValue = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Use setTimeout to avoid setState in effect
    const timer = setTimeout(() => {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Use setTimeout to avoid setState in effect
    const timer = setTimeout(() => {
      setIsAnimated(false);
      const animTimer = setTimeout(() => setIsAnimated(true), 100);
      return () => clearTimeout(animTimer);
    }, 0);
    return () => clearTimeout(timer);
  }, [data]);

  // Filter out Unknown and sort by count
  const filteredData = useMemo(() => {
    return data
      .filter(d => d.provider && d.provider !== 'Unknown' && d.provider !== 'unknown' && d.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, maxItems);
  }, [data, maxItems]);

  const maxCount = useMemo(() => {
    return filteredData.length > 0 ? Math.max(...filteredData.map(d => d.count)) : 1;
  }, [filteredData]);

  const totalNodes = useMemo(() => {
    return filteredData.reduce((sum, d) => sum + d.count, 0);
  }, [filteredData]);

  const topProvider = filteredData.length > 0 ? filteredData[0] : null;

  if (isLoading) {
    return <ChartLoadingSkeleton height={height} />;
  }

  return (
    <div className="bg-[#0a0a0a] border border-white/10 overflow-hidden group relative touch-pan-y">
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 z-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-2 h-px bg-white/20 group-hover:bg-purple-400 group-hover:shadow-[0_0_8px_rgba(168,85,247,0.6)] transition-all duration-300" />
        <div className="absolute top-0 left-0 w-px h-2 bg-white/20 group-hover:bg-purple-400 group-hover:shadow-[0_0_8px_rgba(168,85,247,0.6)] transition-all duration-300" />
      </div>
      <div className="absolute top-0 right-0 w-4 h-4 z-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-2 h-px bg-white/20 group-hover:bg-purple-400 group-hover:shadow-[0_0_8px_rgba(168,85,247,0.6)] transition-all duration-300" />
        <div className="absolute top-0 right-0 w-px h-2 bg-white/20 group-hover:bg-purple-400 group-hover:shadow-[0_0_8px_rgba(168,85,247,0.6)] transition-all duration-300" />
      </div>
      <div className="absolute bottom-0 left-0 w-4 h-4 z-20 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-2 h-px bg-white/20 group-hover:bg-purple-400 group-hover:shadow-[0_0_8px_rgba(168,85,247,0.6)] transition-all duration-300" />
        <div className="absolute bottom-0 left-0 w-px h-2 bg-white/20 group-hover:bg-purple-400 group-hover:shadow-[0_0_8px_rgba(168,85,247,0.6)] transition-all duration-300" />
      </div>
      <div className="absolute bottom-0 right-0 w-4 h-4 z-20 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-2 h-px bg-white/20 group-hover:bg-purple-400 group-hover:shadow-[0_0_8px_rgba(168,85,247,0.6)] transition-all duration-300" />
        <div className="absolute bottom-0 right-0 w-px h-2 bg-white/20 group-hover:bg-purple-400 group-hover:shadow-[0_0_8px_rgba(168,85,247,0.6)] transition-all duration-300" />
      </div>

      {/* Header */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-white/10 flex items-center justify-between gap-2">
        <h3 className="text-xs sm:text-sm font-medium text-white/90 truncate">{title}</h3>
        {showTopValue && topProvider && (
          <div className="text-base sm:text-lg font-bold text-purple-400 font-mono flex-shrink-0 transition-all duration-300">
            {topProvider.count}
          </div>
        )}
      </div>

      {/* Chart */}
      <div
        ref={containerRef}
        className="p-2 sm:p-3 touch-pan-y"
        style={{ height }}
      >
        {filteredData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/40 text-xs sm:text-sm">
            No provider data available
          </div>
        ) : (
          <div className="flex flex-col h-full" style={{ gap: '3px' }}>
            {filteredData.map((item, index) => {
              const percentage = (item.count / maxCount) * 100;
              const isHovered = hoveredIndex === index;
              const color = getProviderColor(index);
              // Limit max height per bar to 24px regardless of available space
              const maxBarHeight = 24;
              const useFixedHeight = filteredData.length <= 5;

              return (
                <div
                  key={item.provider}
                  className={`flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-all duration-200 ${isHovered ? 'bg-white/5 -mx-2 px-2' : ''
                    }`}
                  style={{
                    height: useFixedHeight ? maxBarHeight : 'auto',
                    flex: useFixedHeight ? 'none' : 1,
                    minHeight: useFixedHeight ? maxBarHeight : 12
                  }}
                  onMouseEnter={() => !isTouchDevice && setHoveredIndex(index)}
                  onMouseLeave={() => !isTouchDevice && setHoveredIndex(null)}
                  onTouchStart={() => setHoveredIndex(index)}
                  onTouchEnd={() => setTimeout(() => setHoveredIndex(null), 1500)}
                >
                  {/* Provider name - full name, no truncation */}
                  <div
                    className={`text-[9px] sm:text-[11px] flex-shrink-0 text-right transition-colors duration-200 ${isHovered ? 'text-white' : 'text-white/70'
                      }`}
                    style={{ width: '80px', minWidth: '80px' }}
                    title={item.provider}
                  >
                    <span className="truncate block">{item.provider}</span>
                  </div>

                  {/* Bar */}
                  <div className={`flex-1 h-full bg-white/5 relative overflow-hidden transition-all duration-200 ${isHovered ? 'bg-white/10' : ''
                    }`}>
                    <div
                      className="absolute inset-y-0 left-0 transition-all duration-500 ease-out flex items-center justify-end pr-1.5"
                      style={{
                        width: isAnimated ? `${Math.max(percentage, 8)}%` : '0%',
                        backgroundColor: color,
                        opacity: isHovered ? 1 : 0.85,
                        boxShadow: isHovered ? `0 0 12px ${color}70, inset 0 0 20px rgba(255,255,255,0.1)` : 'none',
                        transform: isHovered ? 'scaleY(1.1)' : 'scaleY(1)',
                        transitionDelay: `${index * 30}ms`
                      }}
                    >
                      {percentage > 25 && (
                        <span className={`text-[9px] sm:text-[10px] font-mono font-medium text-white transition-all duration-200 ${isHovered ? 'scale-110' : ''
                          }`}>
                          {item.count}
                        </span>
                      )}
                    </div>
                    {percentage <= 25 && (
                      <div className="absolute inset-y-0 flex items-center" style={{ left: `${Math.max(percentage, 8) + 2}%` }}>
                        <span className={`text-[9px] sm:text-[10px] font-mono font-medium transition-colors duration-200 ${isHovered ? 'text-white' : 'text-white/70'
                          }`}>
                          {item.count}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Percentage */}
                  <div className={`w-8 sm:w-10 text-[8px] sm:text-[10px] text-right flex-shrink-0 transition-colors duration-200 ${isHovered ? 'text-white/70' : 'text-white/40'
                    }`}>
                    {((item.count / totalNodes) * 100).toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
