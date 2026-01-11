'use client';

import { useMemo } from 'react';

interface PingDataPoint {
  timestamp: number;
  ping: number | null;
  status: string;
}

interface PingChartProps {
  data: PingDataPoint[];
  height?: number;
  showStats?: boolean;
}

export function PingChart({ data, height = 100, showStats = true }: PingChartProps) {
  const { chartData, stats, minValue, maxValue, timeRange } = useMemo(() => {
    if (data.length === 0) {
      return { chartData: [], stats: null, minValue: 0, maxValue: 100, timeRange: { min: 0, max: 1 } };
    }

    // Filter out null pings for chart, but keep for stats
    const validPings = data.filter(d => d.ping !== null && d.status === 'online');
    const pingValues = validPings.map(d => d.ping as number);
    
    const min = pingValues.length > 0 ? Math.min(...pingValues) : 0;
    const max = pingValues.length > 0 ? Math.max(...pingValues) : 100;
    const avg = pingValues.length > 0 ? Math.round(pingValues.reduce((a, b) => a + b, 0) / pingValues.length) : 0;
    
    const successCount = data.filter(d => d.status === 'online').length;
    const successRate = data.length > 0 ? (successCount / data.length) * 100 : 0;
    
    const padding = (max - min) * 0.1 || 10;
    
    const tMin = Math.min(...data.map(d => d.timestamp));
    const tMax = Math.max(...data.map(d => d.timestamp));

    return {
      chartData: data,
      stats: {
        min,
        max,
        avg,
        successRate,
        total: data.length,
      },
      minValue: Math.max(0, min - padding),
      maxValue: max + padding,
      timeRange: { min: tMin, max: tMax },
    };
  }, [data]);

  const generatePath = useMemo(() => {
    const validData = chartData.filter(d => d.ping !== null);
    if (validData.length < 2) return '';

    const width = 100;
    const h = 100;
    const range = maxValue - minValue || 1;
    const timeSpan = timeRange.max - timeRange.min || 1;

    const sortedData = [...validData].sort((a, b) => a.timestamp - b.timestamp);

    return sortedData.map((point, i) => {
      const x = ((point.timestamp - timeRange.min) / timeSpan) * width;
      const y = h - (((point.ping as number) - minValue) / range) * h;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [chartData, minValue, maxValue, timeRange]);

  const getPingColor = (ping: number) => {
    if (ping < 100) return '#10b981'; // emerald
    if (ping < 300) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-white/40 text-sm" style={{ height }}>
        No ping data available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Stats Row */}
      {showStats && stats && (
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-white/40">Avg:</span>
            <span className={`font-mono ${stats.avg < 100 ? 'text-emerald-400' : stats.avg < 300 ? 'text-amber-400' : 'text-red-400'}`}>
              {stats.avg}ms
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white/40">Min:</span>
            <span className="font-mono text-emerald-400">{stats.min}ms</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white/40">Max:</span>
            <span className={`font-mono ${stats.max < 100 ? 'text-emerald-400' : stats.max < 300 ? 'text-amber-400' : 'text-red-400'}`}>
              {stats.max}ms
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white/40">Success:</span>
            <span className={`font-mono ${stats.successRate > 90 ? 'text-emerald-400' : stats.successRate > 70 ? 'text-amber-400' : 'text-red-400'}`}>
              {stats.successRate.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="relative" style={{ height }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-[9px] text-white/40 font-mono">
          <span>{Math.round(maxValue)}ms</span>
          <span>{Math.round((maxValue + minValue) / 2)}ms</span>
          <span>{Math.round(minValue)}ms</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-full relative">
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
            {/* Gradient fill */}
            <defs>
              <linearGradient id="pingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Area fill */}
            {generatePath && (
              <path
                d={`${generatePath} L 100 100 L 0 100 Z`}
                fill="url(#pingGradient)"
              />
            )}

            {/* Line */}
            <path
              d={generatePath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              className="drop-shadow-sm"
            />

            {/* Data points */}
            {chartData.filter(d => d.ping !== null).map((point, i) => {
              const timeSpan = timeRange.max - timeRange.min || 1;
              const range = maxValue - minValue || 1;
              const x = ((point.timestamp - timeRange.min) / timeSpan) * 100;
              const y = 100 - (((point.ping as number) - minValue) / range) * 100;
              
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="1.5"
                  fill={getPingColor(point.ping as number)}
                  className="drop-shadow-sm"
                />
              );
            })}
          </svg>
        </div>

        {/* Time labels */}
        <div className="ml-12 flex justify-between text-[9px] text-white/40 font-mono mt-1">
          <span>{new Date(timeRange.min * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span>{new Date(timeRange.max * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}
