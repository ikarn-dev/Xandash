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
  y: number;
  values: { label: string; color: string; value: number; timestamp: number }[];
}

// Format Y-axis value
const formatYAxisValue = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  if (value >= 100) return value.toFixed(0);
  if (value >= 10) return value.toFixed(1);
  return value.toFixed(2);
};

// Format time for X-axis labels
const formatTimeLabel = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

// Format tooltip time
const formatTooltipTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString([], { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export function ComparisonChart({ 
  datasets, 
  title, 
  valueFormatter = (v) => v.toLocaleString(),
  height = 200,
  startFromZero = true
}: ComparisonChartProps) {
  const [isAnimated, setIsAnimated] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Trigger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Reset animation when datasets change
  useEffect(() => {
    setIsAnimated(false);
    const timer = setTimeout(() => setIsAnimated(true), 100);
    return () => clearTimeout(timer);
  }, [datasets]);

  const { timeRange, chartData, yTicks, datasetStats, allTimestamps } = useMemo(() => {
    if (datasets.length === 0 || datasets.every(d => d.data.length === 0)) {
      return { 
        timeRange: { min: 0, max: 1 }, 
        chartData: [], 
        yTicks: [0, 25, 50, 75, 100],
        datasetStats: [],
        allTimestamps: []
      };
    }

    const allValues = datasets.flatMap(d => d.data.map(p => p.value));
    const allTimes = datasets.flatMap(d => d.data.map(p => p.timestamp));
    
    const rawMax = Math.max(...allValues);
    const rawMin = Math.min(...allValues);
    
    // Always start from 0
    const min = startFromZero ? 0 : rawMin;
    // Add 10% padding to max
    const max = rawMax * 1.1 || 10;
    
    const tMin = Math.min(...allTimes);
    const tMax = Math.max(...allTimes);
    const timeSpan = tMax - tMin || 1;
    const range = max - min || 1;

    // Get unique sorted timestamps for hover detection
    const uniqueTimestamps = [...new Set(allTimes)].sort((a, b) => a - b);

    // Generate Y-axis tick values
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(ratio => min + ratio * (max - min));

    // Calculate stats for each dataset - use currentValue as fallback
    const datasetStats = datasets.map(d => {
      if (d.data.length === 0) {
        // Use currentValue if no history data
        const current = d.currentValue || 0;
        return { avg: current, latest: current, max: current, min: current };
      }
      const values = d.data.map(p => p.value);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const sorted = [...d.data].sort((a, b) => b.timestamp - a.timestamp);
      const latest = sorted[0]?.value ?? d.currentValue ?? 0;
      return { 
        avg, 
        latest: d.currentValue !== undefined ? d.currentValue : latest,
        max: Math.max(...values),
        min: Math.min(...values)
      };
    });

    // Generate paths with minimum visual offset for visibility
    const chartData = datasets.map((dataset, datasetIndex) => {
      if (dataset.data.length === 0) return { ...dataset, path: '', points: [] };
      
      const sortedData = [...dataset.data].sort((a, b) => a.timestamp - b.timestamp);
      
      // Calculate points with minimum visual offset
      const points = sortedData.map(point => {
        const x = ((point.timestamp - tMin) / timeSpan) * 100;
        // Apply minimum offset of 5% from bottom so even 0 values are visible
        const normalizedY = (point.value - min) / range;
        // Ensure minimum 5% height for visibility, max 95% to leave room at top
        const visualY = 95 - (normalizedY * 90 + 5);
        return { 
          x, 
          y: visualY, 
          value: point.value, 
          timestamp: point.timestamp 
        };
      });
      
      const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      
      return {
        ...dataset,
        path,
        points,
        pathLength: points.length * 50
      };
    });

    return {
      timeRange: { min: tMin, max: tMax },
      chartData,
      yTicks,
      datasetStats,
      allTimestamps: uniqueTimestamps
    };
  }, [datasets, startFromZero]);

  // Handle mouse move for tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current || chartData.length === 0) return;
    
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const xPercent = (x / rect.width) * 100;
    
    // Find closest timestamp
    const timeSpan = timeRange.max - timeRange.min || 1;
    const hoverTime = timeRange.min + (xPercent / 100) * timeSpan;
    
    // Find closest data points for each dataset
    const values: TooltipData['values'] = [];
    
    chartData.forEach(dataset => {
      if (dataset.points && dataset.points.length > 0) {
        // Find closest point
        let closest = dataset.points[0];
        let minDiff = Math.abs(closest.timestamp - hoverTime);
        
        for (const point of dataset.points) {
          const diff = Math.abs(point.timestamp - hoverTime);
          if (diff < minDiff) {
            minDiff = diff;
            closest = point;
          }
        }
        
        values.push({
          label: dataset.label,
          color: dataset.color,
          value: closest.value,
          timestamp: closest.timestamp
        });
      }
    });
    
    if (values.length > 0) {
      setTooltip({
        x: Math.min(Math.max(x, 80), rect.width - 80),
        y: e.clientY - rect.top - 10,
        values
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const hasData = datasets.some(d => d.data.length > 0);

  return (
    <div className="bg-white/5 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <div className="flex flex-wrap gap-3">
          {datasets.map((dataset, idx) => (
            <div key={dataset.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dataset.color }} />
              <span className="text-[10px] text-white/60">{dataset.label}</span>
              {datasetStats[idx] && datasetStats[idx].latest !== undefined && (
                <span className="text-[9px] text-white/40 ml-1">
                  ({valueFormatter(datasetStats[idx].latest)})
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center text-white/40 text-sm" style={{ height }}>
          No historical data available
        </div>
      ) : (
        <div className="relative" style={{ height }}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between text-[9px] text-white/40 font-mono">
            {yTicks.slice().reverse().map((tick, i) => (
              <span key={i}>{formatYAxisValue(tick)}</span>
            ))}
          </div>

          {/* Chart area */}
          <div 
            ref={chartRef}
            className="ml-14 h-[calc(100%-24px)] relative cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="border-t border-white/5" />
              ))}
            </div>

            {/* SVG Chart */}
            <svg 
              viewBox="0 0 100 100" 
              preserveAspectRatio="none" 
              className="w-full h-full"
            >
              {/* Render lines with animation */}
              {chartData.map((dataset, i) => (
                <path
                  key={`line-${i}`}
                  d={dataset.path}
                  fill="none"
                  stroke={dataset.color}
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isAnimated ? 1 : 0}
                  style={{
                    transition: 'opacity 0.5s ease-out',
                    transitionDelay: `${i * 150}ms`
                  }}
                />
              ))}
            </svg>

            {/* Tooltip */}
            {tooltip && (
              <div 
                className="absolute z-10 bg-black/90 border border-white/20 rounded-lg px-3 py-2 pointer-events-none transform -translate-x-1/2"
                style={{ 
                  left: tooltip.x,
                  top: Math.max(10, tooltip.y - 60)
                }}
              >
                <div className="text-[9px] text-white/50 mb-1">
                  {formatTooltipTime(tooltip.values[0]?.timestamp || 0)}
                </div>
                {tooltip.values.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px]">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: v.color }} />
                    <span className="text-white/70 truncate max-w-[80px]">{v.label}:</span>
                    <span className="text-white font-mono font-medium">{valueFormatter(v.value)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Hover line indicator */}
            {tooltip && (
              <div 
                className="absolute top-0 bottom-0 w-px bg-white/20 pointer-events-none"
                style={{ left: tooltip.x }}
              />
            )}
          </div>

          {/* Time labels */}
          <div className="ml-14 flex justify-between text-[9px] text-white/40 font-mono mt-1">
            <span>{formatTimeLabel(timeRange.min)}</span>
            <span>{formatTimeLabel((timeRange.min + timeRange.max) / 2)}</span>
            <span>{formatTimeLabel(timeRange.max)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
