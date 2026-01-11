'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

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
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; ping: number; timestamp: number; index: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastInteractionRef = useRef<number>(0);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 800);
    return () => clearTimeout(timer);
  }, [data]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const { chartData, stats, minValue, maxValue, timeRange, validPoints } = useMemo(() => {
    if (data.length === 0) {
      return { chartData: [], stats: null, minValue: 0, maxValue: 100, timeRange: { min: 0, max: 1 }, validPoints: [] };
    }

    // Filter for valid ping values (ping is a number, not null)
    // Don't strictly require status === 'online' since ping data is valid if we have a number
    const validPings = data.filter(d => d.ping !== null && d.ping !== undefined && typeof d.ping === 'number');
    const pingValues = validPings.map(d => d.ping as number);
    
    const min = pingValues.length > 0 ? Math.min(...pingValues) : 0;
    const max = pingValues.length > 0 ? Math.max(...pingValues) : 100;
    const avg = pingValues.length > 0 ? Math.round(pingValues.reduce((a, b) => a + b, 0) / pingValues.length) : 0;
    
    // Success rate based on having valid ping data
    const successCount = validPings.length;
    const successRate = data.length > 0 ? (successCount / data.length) * 100 : 0;
    
    const padding = (max - min) * 0.1 || 10;
    
    const tMin = Math.min(...data.map(d => d.timestamp));
    const tMax = Math.max(...data.map(d => d.timestamp));

    const timeSpan = tMax - tMin || 1;
    const range = (max + padding) - Math.max(0, min - padding) || 1;
    const minVal = Math.max(0, min - padding);
    const maxVal = max + padding;
    
    const points = validPings.map((point, i) => {
      const x = ((point.timestamp - tMin) / timeSpan) * 100;
      const y = 100 - (((point.ping as number) - minVal) / range) * 100;
      return { x, y, ping: point.ping as number, timestamp: point.timestamp, index: i };
    });

    return {
      chartData: data,
      stats: { min, max, avg, successRate, total: data.length },
      minValue: minVal,
      maxValue: maxVal,
      timeRange: { min: tMin, max: tMax },
      validPoints: points,
    };
  }, [data]);


  const generatePath = useMemo(() => {
    // Use validPoints which already has the filtered data
    if (validPoints.length < 2) return '';

    const width = 100;
    const h = 100;
    const range = maxValue - minValue || 1;
    const timeSpan = timeRange.max - timeRange.min || 1;

    const sortedPoints = [...validPoints].sort((a, b) => a.timestamp - b.timestamp);

    return sortedPoints.map((point, i) => {
      const x = ((point.timestamp - timeRange.min) / timeSpan) * width;
      const y = h - ((point.ping - minValue) / range) * h;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [validPoints, minValue, maxValue, timeRange]);

  const getPingColor = (ping: number) => {
    if (ping < 100) return '#10b981';
    if (ping < 300) return '#f59e0b';
    return '#ef4444';
  };

  const findClosestPoint = useCallback((clientX: number) => {
    if (!svgRef.current || validPoints.length === 0) return;
    
    const now = Date.now();
    const throttleMs = 'ontouchstart' in window ? 33 : 16;
    if (now - lastInteractionRef.current < throttleMs) return;
    lastInteractionRef.current = now;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((clientX - rect.left) / rect.width) * 100;
    
    let closestPoint = validPoints[0];
    let minDistance = Math.abs(mouseX - validPoints[0].x);
    
    for (const point of validPoints) {
      const distance = Math.abs(mouseX - point.x);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }
    
    setHoveredPoint(closestPoint);
  }, [validPoints]);

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => findClosestPoint(event.clientX));
  }, [findClosestPoint]);

  const handleTouchMove = useCallback((event: React.TouchEvent<SVGSVGElement>) => {
    event.preventDefault();
    if (event.touches.length > 0) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => findClosestPoint(event.touches[0].clientX));
    }
  }, [findClosestPoint]);

  const handleTouchStart = useCallback((event: React.TouchEvent<SVGSVGElement>) => {
    if (event.touches.length > 0) findClosestPoint(event.touches[0].clientX);
  }, [findClosestPoint]);

  const handleInteractionEnd = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setHoveredPoint(null);
  }, []);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-white/40 text-sm" style={{ height }}>
        No ping data available
      </div>
    );
  }


  return (
    <div className="space-y-2">
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

      <div className="relative touch-none" style={{ height }}>
        <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-[9px] text-white/40 font-mono pointer-events-none">
          <span>{Math.round(maxValue)}ms</span>
          <span>{Math.round((maxValue + minValue) / 2)}ms</span>
          <span>{Math.round(minValue)}ms</span>
        </div>

        <div className="ml-12 h-full relative">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="border-t border-white/5" />
            ))}
          </div>

          <svg 
            ref={svgRef}
            viewBox="0 0 100 100" 
            preserveAspectRatio="none" 
            className="w-full h-full cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleInteractionEnd}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleInteractionEnd}
            onTouchCancel={handleInteractionEnd}
          >
            <defs>
              <linearGradient id="pingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
              </linearGradient>
            </defs>

            {generatePath && (
              <path
                d={`${generatePath} L 100 100 L 0 100 Z`}
                fill="url(#pingGradient)"
                className={isAnimating ? 'opacity-0' : 'opacity-100'}
                style={{ transition: 'opacity 0.3s' }}
              />
            )}

            <path
              d={generatePath}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
              className={`drop-shadow-sm ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
              style={{ transition: 'opacity 0.3s' }}
            />

            {hoveredPoint && (
              <line 
                x1={hoveredPoint.x} y1={0} 
                x2={hoveredPoint.x} y2={100}
                stroke="white" strokeWidth="1" strokeOpacity="0.3"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {validPoints.map((point, i) => (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r={hoveredPoint?.index === i ? "2.5" : "1.5"}
                fill={getPingColor(point.ping)}
                className="drop-shadow-sm"
              />
            ))}

            {hoveredPoint && (
              <circle 
                cx={hoveredPoint.x} cy={hoveredPoint.y} r="4"
                fill={getPingColor(hoveredPoint.ping)} stroke="#000" strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {hoveredPoint && (
            <div 
              className="absolute bg-black/95 border border-white/20 rounded px-2 py-1.5 pointer-events-none z-50 shadow-lg"
              style={{ 
                left: `${Math.min(Math.max(hoveredPoint.x, 15), 85)}%`, 
                top: '50%',
                transform: 'translateX(-50%) translateY(-50%)',
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getPingColor(hoveredPoint.ping) }}></div>
                <span className="font-mono font-bold text-sm" style={{ color: getPingColor(hoveredPoint.ping) }}>
                  {hoveredPoint.ping}ms
                </span>
              </div>
              <div className="text-white/50 text-[10px] font-mono mt-0.5">
                {new Date(hoveredPoint.timestamp * 1000).toLocaleString()}
              </div>
            </div>
          )}
        </div>

        <div className="ml-12 flex justify-between text-[9px] text-white/40 font-mono mt-1 pointer-events-none">
          <span>{new Date(timeRange.min * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span>{new Date(timeRange.max * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}
