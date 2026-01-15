'use client';

import { useMemo, useState, useEffect, useRef } from 'react';

interface DataPoint {
  timestamp: number;
  value: number;
}

interface ChartData {
  label: string;
  color: string;
  data: DataPoint[];
  currentValue?: number;
}

interface ComparisonChartProps {
  datasets: ChartData[];
  title: string;
  valueFormatter?: (value: number) => string;
  height?: number;
  startFromZero?: boolean;
  isLoading?: boolean;
}

interface TooltipData {
  x: number;
  timestamp: number;
  values: { label: string; color: string; value: number }[];
}

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center gap-3">
    <div className="relative w-10 h-10">
      <div className="absolute inset-0 rounded-full border-2 border-white/10" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-500 animate-spin" />
      <div className="absolute inset-2 rounded-full bg-purple-500/20 animate-pulse" />
    </div>
    <span className="text-xs text-white/40">Loading historical data...</span>
  </div>
);

// Format date for X-axis (show day and date)
const formatDateLabel = (date: Date, compact: boolean = false): string => {
  const dayNum = date.getUTCDate();
  if (compact) {
    // For mobile: show short day + number (e.g., "Fri 9")
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = days[date.getUTCDay()];
    return `${day} ${dayNum}`;
  }
  const day = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
  return `${day} ${dayNum}`;
};

// Format tooltip time
const formatTooltipTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString([], { 
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true
  });
};

// Generate array of last 7 days (today and 6 days before) in UTC
const getLast7Days = (): Date[] => {
  const days: Date[] = [];
  const now = new Date();
  // Start from 6 days ago to today (7 days total)
  for (let i = 6; i >= 0; i--) {
    const date = new Date(Date.UTC(
      now.getUTCFullYear(), 
      now.getUTCMonth(), 
      now.getUTCDate() - i,
      0, 0, 0, 0
    ));
    days.push(date);
  }
  return days;
};

export function ComparisonChart({ 
  datasets, 
  title, 
  valueFormatter = (v) => v.toLocaleString(),
  height = 320,
  isLoading = false,
}: ComparisonChartProps) {
  const [isAnimated, setIsAnimated] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const chartRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clear tooltip timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setIsAnimated(false);
    const timer = setTimeout(() => setIsAnimated(true), 150);
    return () => clearTimeout(timer);
  }, [datasets]);

  // Always show last 7 days on X-axis
  const last7Days = useMemo(() => getLast7Days(), []);

  const { bars, maxValue, yTicks, totals, hasAnyData } = useMemo(() => {
    const hasAnyData = datasets.some(d => d.data && d.data.length > 0);
    
    if (datasets.length === 0) {
      return { bars: [], maxValue: 100, yTicks: [0, 25, 50, 75, 100], totals: [], hasAnyData: false };
    }

    const totals = datasets.map(d => ({
      label: d.label,
      color: d.color,
      total: d.currentValue !== undefined ? d.currentValue : 
             (d.data && d.data.length > 0 ? d.data[d.data.length - 1]?.value || 0 : 0)
    }));

    // Collect all data points
    const allDataPoints: { timestamp: number; datasetIndex: number; value: number; color: string; label: string }[] = [];
    
    datasets.forEach((dataset, datasetIndex) => {
      if (dataset.data && dataset.data.length > 0) {
        dataset.data.forEach(point => {
          allDataPoints.push({
            timestamp: point.timestamp,
            datasetIndex,
            value: point.value,
            color: dataset.color,
            label: dataset.label
          });
        });
      }
    });

    // Use fixed 7-day range aligned with X-axis labels (UTC-based)
    // Each bucket represents one day, starting from 6 days ago at UTC midnight
    const now = new Date();
    const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999);
    const sixDaysAgoUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6, 0, 0, 0, 0);
    
    const minTime = Math.floor(sixDaysAgoUTC / 1000);
    const maxTime = Math.floor(todayUTC / 1000);

    // Create exactly 7 buckets - one per day, aligned with the X-axis labels
    const numBuckets = 7;
    // Each bucket is exactly 24 hours
    const bucketDuration = 24 * 60 * 60; // 86400 seconds

    const buckets: { 
      timestamp: number; 
      dayIndex: number;
      values: { datasetIndex: number; value: number; color: string; label: string; count: number }[] 
    }[] = [];

    for (let i = 0; i < numBuckets; i++) {
      // Each bucket starts at UTC midnight of that day
      const bucketStart = minTime + i * bucketDuration;
      const bucketEnd = bucketStart + bucketDuration;
      const bucketMid = bucketStart + bucketDuration / 2;

      const values = datasets.map((d, idx) => ({
        datasetIndex: idx,
        value: 0,
        color: d.color,
        label: d.label,
        count: 0
      }));

      allDataPoints.forEach(point => {
        if (point.timestamp >= bucketStart && point.timestamp < bucketEnd) {
          const v = values[point.datasetIndex];
          v.value += point.value;
          v.count += 1;
        }
      });

      values.forEach(v => {
        if (v.count > 0) {
          v.value = v.value / v.count;
        }
      });

      buckets.push({ timestamp: bucketMid, dayIndex: i, values });
    }

    // Find max value - use a minimum threshold to ensure small values are visible
    let rawMax = 0;
    buckets.forEach(bucket => {
      bucket.values.forEach(v => {
        if (v.value > rawMax) rawMax = v.value;
      });
    });

    const maxVal = rawMax > 0 ? rawMax * 1.15 : 100;
    
    // Generate Y-axis ticks
    const tickCount = 5;
    const yTicks = Array.from({ length: tickCount }, (_, i) => (maxVal / (tickCount - 1)) * i);

    return { bars: buckets, maxValue: maxVal, yTicks, totals, hasAnyData };
  }, [datasets]);

  const handleBarHover = (barIndex: number, e: React.MouseEvent, isTouch: boolean = false) => {
    if (!chartRef.current || bars.length === 0) return;
    
    // Clear any existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    
    const bar = bars[barIndex];
    const rect = chartRef.current.getBoundingClientRect();
    
    setHoveredBarIndex(barIndex);
    setTooltip({
      x: e.clientX - rect.left,
      timestamp: bar.timestamp,
      values: bar.values.filter(v => v.count > 0).map(v => ({
        label: v.label,
        color: v.color,
        value: v.value
      }))
    });
    
    // On mobile touch, auto-hide tooltip after 5 seconds
    if (isTouch) {
      tooltipTimeoutRef.current = setTimeout(() => {
        setTooltip(null);
        setHoveredBarIndex(null);
      }, 5000);
    }
  };

  const handleMouseLeave = () => {
    // Don't clear on mouse leave if we have an active touch timeout (mobile)
    if (tooltipTimeoutRef.current) return;
    setTooltip(null);
    setHoveredBarIndex(null);
  };
  
  const handleTouchOutside = () => {
    // Clear tooltip when tapping outside
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setTooltip(null);
    setHoveredBarIndex(null);
  };

  const isMobile = containerWidth < 640;
  const chartHeight = isMobile ? 220 : height;
  
  // With 7 buckets (one per day), calculate bar width
  const barWidth = isMobile 
    ? Math.max(8, Math.min(16, (containerWidth - 80) / (7 * datasets.length * 1.5)))
    : Math.max(12, Math.min(24, (containerWidth - 100) / (7 * datasets.length * 1.5)));

  const getBarHeight = (value: number): number => {
    if (value <= 0 || maxValue <= 0) return 0;
    // Use a minimum height of 2% for non-zero values to ensure visibility
    const height = (value / maxValue) * 100;
    return Math.max(height, value > 0 ? 2 : 0);
  };

  return (
    <div 
      ref={containerRef} 
      className="bg-[#0a0a0a] rounded-xl border border-white/10 overflow-hidden"
      onTouchStart={(e) => {
        // Check if touch is on a bar area - if not, dismiss tooltip
        const target = e.target as HTMLElement;
        const isOnBar = target.closest('[data-bar]');
        if (!isOnBar && tooltip) {
          handleTouchOutside();
        }
      }}
    >
      {/* Header */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-white/10">
        <h3 className="text-xs sm:text-base font-medium text-white/90 mb-2 sm:mb-3">{title}</h3>
        
        <div className={`${isMobile ? 'grid grid-cols-2 gap-x-2 gap-y-1.5' : 'flex flex-row flex-wrap items-center gap-x-8 gap-y-2'}`}>
          {totals.map((item) => (
            <div key={item.label} className={`flex items-center ${isMobile ? 'gap-1.5' : 'gap-2'}`}>
              <div 
                className={`${isMobile ? 'w-2 h-2' : 'w-3 h-3'} rounded-full flex-shrink-0`}
                style={{ backgroundColor: item.color }} 
              />
              <span className={`${isMobile ? 'text-[10px]' : 'text-xs sm:text-sm'} text-white/50 truncate max-w-[80px] sm:max-w-none`}>
                {item.label}
              </span>
              <span className={`${isMobile ? 'text-sm' : 'text-lg sm:text-xl'} font-bold text-white font-mono`}>
                {valueFormatter(item.total)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center" style={{ height: chartHeight }}>
          <LoadingSpinner />
        </div>
      ) : bars.length === 0 ? (
        <div className="flex items-center justify-center text-white/40 text-sm" style={{ height: chartHeight }}>
          No historical data available
        </div>
      ) : (
        <div className="p-2 sm:p-5">
          <div className="relative" style={{ height: chartHeight }}>
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-14 sm:bottom-12 w-12 sm:w-16 flex flex-col justify-between">
              {yTicks.slice().reverse().map((tick, i) => (
                <div key={i} className="flex items-center justify-end pr-1 sm:pr-2">
                  <span className="text-[8px] sm:text-[10px] text-white/50 font-mono whitespace-nowrap">
                    {valueFormatter(tick)}
                  </span>
                </div>
              ))}
            </div>

            {/* Chart area */}
            <div 
              ref={chartRef}
              className="absolute top-0 right-2 sm:right-4 bottom-14 sm:bottom-12"
              style={{ left: isMobile ? '52px' : '68px' }}
              onMouseLeave={handleMouseLeave}
            >
              {/* Horizontal grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {yTicks.map((_, i) => (
                  <div key={i} className="border-t border-white/[0.06] w-full" />
                ))}
              </div>

              {/* Bars */}
              <div className="absolute inset-0 flex items-end">
                {bars.map((bar, barIdx) => {
                  const isHovered = hoveredBarIndex === barIdx;
                  const hasBarData = bar.values.some(v => v.count > 0);
                  
                  return (
                    <div 
                      key={barIdx}
                      data-bar={hasBarData ? 'true' : undefined}
                      className={`flex-1 flex items-end justify-center gap-[1px] sm:gap-[2px] relative h-full ${hasBarData ? 'cursor-pointer' : ''}`}
                      onMouseEnter={hasBarData ? (e) => handleBarHover(barIdx, e, false) : undefined}
                      onMouseMove={hasBarData ? (e) => handleBarHover(barIdx, e, false) : undefined}
                      onTouchStart={hasBarData ? (e) => {
                        const touch = e.touches[0];
                        handleBarHover(barIdx, { clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent, true);
                      } : undefined}
                    >
                      {isHovered && (
                        <div className="absolute inset-0 bg-white/[0.03] rounded-t" />
                      )}
                      
                      {bar.values.map((val, dataIdx) => {
                        const heightPercent = getBarHeight(val.value);
                        const showBar = val.count > 0 && val.value > 0;
                        
                        return (
                          <div
                            key={dataIdx}
                            className="relative z-10"
                            style={{
                              width: `${barWidth}px`,
                              height: isAnimated && showBar ? `${heightPercent}%` : '0%',
                              minHeight: showBar ? '2px' : '0',
                              backgroundColor: val.color,
                              opacity: isHovered ? 1 : 0.9,
                              borderRadius: '2px 2px 0 0',
                              transition: 'height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease',
                              transitionDelay: `${barIdx * 15}ms`,
                              boxShadow: isHovered 
                                ? `0 0 10px ${val.color}60, 0 -2px 8px ${val.color}40` 
                                : `0 0 4px ${val.color}30`,
                              transform: isHovered ? 'scaleY(1.02)' : 'scaleY(1)',
                              transformOrigin: 'bottom',
                            }}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Tooltip */}
              {tooltip && tooltip.values.length > 0 && (
                <div 
                  className="absolute z-30 bg-gray-900/95 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 pointer-events-none shadow-2xl"
                  style={{ 
                    left: Math.min(Math.max(tooltip.x, 100), (chartRef.current?.clientWidth || 300) - 100),
                    top: 12,
                    transform: 'translateX(-50%)',
                    minWidth: '180px'
                  }}
                >
                  <div className="text-xs text-white/80 font-medium mb-2 pb-2 border-b border-white/10">
                    {formatTooltipTime(tooltip.timestamp)}
                  </div>
                  
                  <div className="space-y-2">
                    {tooltip.values.map((v, i) => (
                      <div key={i} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <div 
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: v.color }} 
                          />
                          <span className="text-[11px] text-white/60 truncate">{v.label}</span>
                        </div>
                        <span className="text-sm text-white font-mono font-bold">
                          {valueFormatter(v.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hoveredBarIndex !== null && (
                <div 
                  className="absolute top-0 bottom-0 w-px bg-white/30 pointer-events-none z-20"
                  style={{ left: `${((hoveredBarIndex + 0.5) / bars.length) * 100}%` }}
                />
              )}
            </div>

            {/* X-axis labels - Always show 7 days, aligned with bars, tilted on mobile */}
            <div 
              className="absolute bottom-0 h-14 sm:h-12"
              style={{ left: isMobile ? '48px' : '68px', right: isMobile ? '4px' : '16px' }}
            >
              <div className="relative w-full h-full flex items-start pt-3 sm:pt-2">
                {last7Days.map((date, i) => (
                  <div 
                    key={i}
                    className="flex-1 flex justify-center"
                  >
                    {isMobile ? (
                      <span 
                        className="text-[8px] text-white/50 font-mono whitespace-nowrap"
                        style={{ 
                          transform: 'rotate(-45deg) translateX(-6px)',
                          transformOrigin: 'top center'
                        }}
                      >
                        {formatDateLabel(date, false)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-white/50 font-mono whitespace-nowrap">
                        {formatDateLabel(date, false)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
