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
}

interface TooltipData {
  x: number;
  timestamp: number;
  values: { label: string; color: string; value: number }[];
}

// Format Y-axis value
const formatYAxisValue = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  if (value >= 100) return value.toFixed(0);
  if (value >= 1) return value.toFixed(1);
  return value.toFixed(2);
};

// Format time for X-axis labels
const formatTimeLabel = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Format date for X-axis
const formatDateLabel = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
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

export function ComparisonChart({ 
  datasets, 
  title, 
  valueFormatter = (v) => v.toLocaleString(),
  height = 320,
}: ComparisonChartProps) {
  const [isAnimated, setIsAnimated] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const chartRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Responsive sizing
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

  // Trigger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Reset animation when datasets change
  useEffect(() => {
    setIsAnimated(false);
    const timer = setTimeout(() => setIsAnimated(true), 150);
    return () => clearTimeout(timer);
  }, [datasets]);

  const { bars, maxValue, yTicks, totals } = useMemo(() => {
    // Check if we have any data
    const hasAnyData = datasets.some(d => d.data && d.data.length > 0);
    
    if (datasets.length === 0) {
      return { 
        bars: [], 
        maxValue: 100,
        yTicks: [0, 25, 50, 75, 100],
        totals: []
      };
    }

    // Calculate totals for header - use currentValue or latest data point
    const totals = datasets.map(d => ({
      label: d.label,
      color: d.color,
      total: d.currentValue !== undefined ? d.currentValue : 
             (d.data && d.data.length > 0 ? d.data[d.data.length - 1]?.value || 0 : 0)
    }));

    if (!hasAnyData) {
      return { 
        bars: [], 
        maxValue: 100,
        yTicks: [0, 25, 50, 75, 100],
        totals
      };
    }

    // Collect all data points with their dataset info
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

    if (allDataPoints.length === 0) {
      return { bars: [], maxValue: 100, yTicks: [0, 25, 50, 75, 100], totals };
    }

    // Sort by timestamp
    allDataPoints.sort((a, b) => a.timestamp - b.timestamp);

    // Get time range
    const minTime = allDataPoints[0].timestamp;
    const maxTime = allDataPoints[allDataPoints.length - 1].timestamp;
    const timeSpan = maxTime - minTime || 3600; // Default to 1 hour if no span

    // Determine number of time buckets based on screen width
    const numBuckets = containerWidth < 400 ? 12 : containerWidth < 640 ? 16 : containerWidth < 900 ? 20 : 24;
    const bucketDuration = timeSpan / numBuckets;

    // Create buckets
    const buckets: { 
      timestamp: number; 
      values: { datasetIndex: number; value: number; color: string; label: string; count: number }[] 
    }[] = [];

    for (let i = 0; i < numBuckets; i++) {
      const bucketStart = minTime + i * bucketDuration;
      const bucketEnd = bucketStart + bucketDuration;
      const bucketMid = bucketStart + bucketDuration / 2;

      // Initialize values for each dataset
      const values = datasets.map((d, idx) => ({
        datasetIndex: idx,
        value: 0,
        color: d.color,
        label: d.label,
        count: 0
      }));

      // Aggregate data points into this bucket
      allDataPoints.forEach(point => {
        if (point.timestamp >= bucketStart && point.timestamp < bucketEnd) {
          const v = values[point.datasetIndex];
          v.value += point.value;
          v.count += 1;
        }
      });

      // Calculate averages
      values.forEach(v => {
        if (v.count > 0) {
          v.value = v.value / v.count;
        }
      });

      buckets.push({ timestamp: bucketMid, values });
    }

    // Calculate max value for Y-axis
    let rawMax = 0;
    buckets.forEach(bucket => {
      bucket.values.forEach(v => {
        if (v.value > rawMax) rawMax = v.value;
      });
    });

    // Add 20% padding and round to nice number
    const maxVal = rawMax > 0 ? Math.ceil(rawMax * 1.2 / 10) * 10 : 100;
    
    // Generate Y-axis ticks
    const tickCount = 5;
    const tickInterval = maxVal / (tickCount - 1);
    const yTicks = Array.from({ length: tickCount }, (_, i) => Math.round(i * tickInterval));

    return { bars: buckets, maxValue: maxVal, yTicks, totals };
  }, [datasets, containerWidth]);

  // Handle mouse move for tooltip
  const handleBarHover = (barIndex: number, e: React.MouseEvent) => {
    if (!chartRef.current || bars.length === 0) return;
    
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
  };

  const handleMouseLeave = () => {
    setTooltip(null);
    setHoveredBarIndex(null);
  };

  const hasData = bars.length > 0 && bars.some(b => b.values.some(v => v.count > 0));
  const isMobile = containerWidth < 640;
  const chartHeight = isMobile ? 220 : height;
  
  // Calculate bar width - smaller on mobile
  const chartAreaWidth = containerWidth - (isMobile ? 48 : 80);
  const barGroupWidth = chartAreaWidth / bars.length;
  const barWidth = isMobile 
    ? Math.max(4, Math.min(10, (barGroupWidth - 4) / datasets.length))
    : Math.max(8, Math.min(20, (barGroupWidth - 8) / datasets.length));

  return (
    <div ref={containerRef} className="bg-[#0a0a0a] rounded-xl border border-white/10 overflow-hidden">
      {/* Header with title and totals */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-white/10">
        <h3 className="text-xs sm:text-base font-medium text-white/90 mb-2 sm:mb-3">{title}</h3>
        
        {/* Totals row - 2 column grid on mobile, row on desktop */}
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

      {!hasData ? (
        <div className="flex items-center justify-center text-white/40 text-sm" style={{ height: chartHeight }}>
          No historical data available
        </div>
      ) : (
        <div className="p-2 sm:p-5">
          <div className="relative" style={{ height: chartHeight }}>
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 sm:bottom-10 w-8 sm:w-14 flex flex-col justify-between">
              {yTicks.slice().reverse().map((tick, i) => (
                <div key={i} className="flex items-center justify-end pr-1 sm:pr-2">
                  <span className="text-[8px] sm:text-xs text-white/50 font-mono">{formatYAxisValue(tick)}</span>
                </div>
              ))}
            </div>

            {/* Chart area */}
            <div 
              ref={chartRef}
              className="ml-8 sm:ml-16 h-[calc(100%-36px)] sm:h-[calc(100%-44px)] relative"
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
                      className={`flex-1 flex items-end justify-center gap-[2px] sm:gap-1 relative h-full ${hasBarData ? 'cursor-pointer' : ''}`}
                      onMouseEnter={hasBarData ? (e) => handleBarHover(barIdx, e) : undefined}
                      onMouseMove={hasBarData ? (e) => handleBarHover(barIdx, e) : undefined}
                    >
                      {/* Hover background */}
                      {isHovered && (
                        <div className="absolute inset-0 bg-white/[0.03] rounded-t" />
                      )}
                      
                      {/* Individual bars for each dataset */}
                      {bar.values.map((val, dataIdx) => {
                        const heightPercent = maxValue > 0 ? (val.value / maxValue) * 100 : 0;
                        const showBar = val.count > 0 && heightPercent > 0;
                        
                        return (
                          <div
                            key={dataIdx}
                            className="relative z-10"
                            style={{
                              width: `${barWidth}px`,
                              height: isAnimated && showBar ? `${Math.max(heightPercent, 2)}%` : '0%',
                              minHeight: showBar ? '4px' : '0',
                              backgroundColor: val.color,
                              opacity: isHovered ? 1 : 0.9,
                              borderRadius: '3px 3px 0 0',
                              transition: 'height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease',
                              transitionDelay: `${barIdx * 20}ms`,
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
                    minWidth: '160px'
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

              {/* Vertical hover line */}
              {hoveredBarIndex !== null && (
                <div 
                  className="absolute top-0 bottom-0 w-px bg-white/30 pointer-events-none z-20"
                  style={{ 
                    left: `${((hoveredBarIndex + 0.5) / bars.length) * 100}%`
                  }}
                />
              )}
            </div>

            {/* X-axis labels */}
            <div className="ml-8 sm:ml-16 flex justify-between mt-1.5 sm:mt-2 px-1">
              {bars.length > 0 && (
                <>
                  <span className="text-[8px] sm:text-xs text-white/50 font-mono">
                    {formatDateLabel(bars[0]?.timestamp || 0)}
                  </span>
                  {!isMobile && bars.length > 4 && (
                    <span className="text-[10px] sm:text-xs text-white/40 font-mono">
                      {formatTimeLabel(bars[Math.floor(bars.length / 2)]?.timestamp || 0)}
                    </span>
                  )}
                  <span className="text-[8px] sm:text-xs text-white/50 font-mono">
                    {formatTimeLabel(bars[bars.length - 1]?.timestamp || 0)}
                  </span>
                </>
              )}
            </div>
            
            <div className="ml-8 sm:ml-16 text-center mt-0.5 sm:mt-1">
              <span className="text-[7px] sm:text-[9px] text-white/30">Time (local)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
