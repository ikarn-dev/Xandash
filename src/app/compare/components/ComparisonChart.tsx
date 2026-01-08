'use client';

import { useMemo } from 'react';

interface DataPoint {
  timestamp: number;
  value: number;
}

interface ChartData {
  label: string;
  color: string;
  data: DataPoint[];
}

interface ComparisonChartProps {
  datasets: ChartData[];
  title: string;
  valueFormatter?: (value: number) => string;
  height?: number;
}

export function ComparisonChart({ 
  datasets, 
  title, 
  valueFormatter = (v) => v.toLocaleString(),
  height = 200 
}: ComparisonChartProps) {
  
  function generatePath(data: DataPoint[], minY: number, maxY: number, minX: number, maxX: number): string {
    if (data.length === 0) return '';
    
    const width = 100;
    const height = 100;
    const range = maxY - minY || 1;
    const timeSpan = maxX - minX || 1;

    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    
    return sortedData.map((point, i) => {
      const x = ((point.timestamp - minX) / timeSpan) * width;
      const y = height - ((point.value - minY) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }

  const { minValue, maxValue, timeRange, points } = useMemo(() => {
    if (datasets.length === 0 || datasets.every(d => d.data.length === 0)) {
      return { minValue: 0, maxValue: 100, timeRange: { min: 0, max: 1 }, points: [] };
    }

    const allValues = datasets.flatMap(d => d.data.map(p => p.value));
    const allTimes = datasets.flatMap(d => d.data.map(p => p.timestamp));
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1 || 10;
    
    const tMin = Math.min(...allTimes);
    const tMax = Math.max(...allTimes);

    return {
      minValue: Math.max(0, min - padding),
      maxValue: max + padding,
      timeRange: { min: tMin, max: tMax },
      points: datasets.map(dataset => ({
        ...dataset,
        path: generatePath(dataset.data, min - padding, max + padding, tMin, tMax)
      }))
    };
  }, [datasets]);

  const hasData = datasets.some(d => d.data.length > 0);

  return (
    <div className="bg-white/5 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <div className="flex flex-wrap gap-3">
          {datasets.map(dataset => (
            <div key={dataset.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dataset.color }} />
              <span className="text-[10px] text-white/60">{dataset.label}</span>
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
          <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-[9px] text-white/40 font-mono">
            <span>{valueFormatter(maxValue)}</span>
            <span>{valueFormatter((maxValue + minValue) / 2)}</span>
            <span>{valueFormatter(minValue)}</span>
          </div>

          {/* Chart area */}
          <div className="ml-14 h-full relative">
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
              {points.map((dataset, i) => (
                <path
                  key={i}
                  d={dataset.path}
                  fill="none"
                  stroke={dataset.color}
                  strokeWidth="2"
                  vectorEffect="non-scaling-stroke"
                  className="drop-shadow-sm"
                />
              ))}
            </svg>
          </div>

          {/* Time labels */}
          <div className="ml-14 flex justify-between text-[9px] text-white/40 font-mono mt-1">
            <span>{new Date(timeRange.min * 1000).toLocaleDateString()}</span>
            <span>{new Date(timeRange.max * 1000).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
