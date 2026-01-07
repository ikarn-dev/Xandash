'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface LineChartProps {
  data: { time: number; value: number }[];
  color?: string;
  height?: number;
  label?: string;
  valueFormatter?: (v: number) => string;
  highlightCurrent?: boolean;
}

// Smooth curve using Catmull-Rom spline
const createSmoothPath = (points: { x: number; y: number }[], tension = 0.3): string => {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  let path = `M ${points[0].x},${points[0].y}`;
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }

  return path;
};

export const LineChart = ({ 
  data, 
  color = '#10b981', 
  height = 100,
  label = '',
  valueFormatter = (v: number) => v.toFixed(0),
  highlightCurrent = false
}: LineChartProps) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number; time: number; index: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastInteractionRef = useRef<number>(0);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 800);
    return () => clearTimeout(timer);
  }, [data]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const values = data.map(d => d.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const rawRange = rawMax - rawMin;
    
    const isConstant = rawRange < 0.001 || (rawRange / Math.max(Math.abs(rawMax), 0.001)) < 0.01;
    
    let minValue: number, maxValue: number, range: number;
    if (isConstant) {
      const avgValue = (rawMin + rawMax) / 2;
      const padding = Math.max(Math.abs(avgValue) * 0.1, 1);
      minValue = avgValue - padding;
      maxValue = avgValue + padding;
      range = maxValue - minValue;
    } else {
      minValue = rawMin;
      maxValue = rawMax;
      range = rawRange;
    }
    
    const width = 100;
    const padding = { top: 8, right: 4, bottom: 4, left: 4 };
    const chartHeight = height - padding.top - padding.bottom;
    const chartWidth = width - padding.left - padding.right;
    
    const points = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
      const normalizedValue = isConstant ? 0.5 : (d.value - minValue) / range;
      const y = padding.top + chartHeight - normalizedValue * chartHeight;
      return { x, y, value: d.value, time: d.time, index: i };
    });

    return { points, minValue: rawMin, maxValue: rawMax, width, height, padding, chartHeight, isConstant };
  }, [data, height]);

  // Throttled interaction handler
  const findClosestPoint = useCallback((clientX: number) => {
    if (!svgRef.current || !chartData) return;
    
    const now = Date.now();
    // Throttle to 60fps (16ms) on desktop, 30fps (33ms) on mobile
    const throttleMs = 'ontouchstart' in window ? 33 : 16;
    if (now - lastInteractionRef.current < throttleMs) return;
    lastInteractionRef.current = now;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((clientX - rect.left) / rect.width) * chartData.width;
    
    let closestPoint = chartData.points[0];
    let minDistance = Math.abs(mouseX - chartData.points[0].x);
    
    for (const point of chartData.points) {
      const distance = Math.abs(mouseX - point.x);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    }
    
    setHoveredPoint(closestPoint);
  }, [chartData]);

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    // Use RAF for smooth updates
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      findClosestPoint(event.clientX);
    });
  }, [findClosestPoint]);

  const handleTouchMove = useCallback((event: React.TouchEvent<SVGSVGElement>) => {
    event.preventDefault(); // Prevent scroll while interacting with chart
    if (event.touches.length > 0) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        findClosestPoint(event.touches[0].clientX);
      });
    }
  }, [findClosestPoint]);

  const handleTouchStart = useCallback((event: React.TouchEvent<SVGSVGElement>) => {
    if (event.touches.length > 0) {
      findClosestPoint(event.touches[0].clientX);
    }
  }, [findClosestPoint]);

  const handleInteractionEnd = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    setHoveredPoint(null);
  }, []);

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-full text-white/40 text-sm">
        No data available
      </div>
    );
  }

  const { points, minValue, maxValue, width, padding, chartHeight, isConstant } = chartData;
  const smoothPath = createSmoothPath(points);
  const areaPath = `${smoothPath} L ${points[points.length - 1].x},${height - padding.bottom} L ${points[0].x},${height - padding.bottom} Z`;
  const lastPoint = points[points.length - 1];

  const gridLines = [0.25, 0.5, 0.75].map(ratio => padding.top + chartHeight * ratio);

  return (
    <div ref={containerRef} className="relative w-full touch-none" style={{ height }}>
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full cursor-crosshair" 
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleInteractionEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleInteractionEnd}
        onTouchCancel={handleInteractionEnd}
      >
        <defs>
          <linearGradient id={`areaGradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {gridLines.map((y, i) => (
          <line key={i} x1={padding.left} y1={y} x2={width - padding.right} y2={y}
            stroke="white" strokeOpacity="0.06" strokeWidth="0.5" strokeDasharray="2,4"
          />
        ))}
        
        {/* Area fill - simplified, no filter */}
        <path 
          d={areaPath} 
          fill={`url(#areaGradient-${label})`}
          className={isAnimating ? 'opacity-0' : 'opacity-100'}
          style={{ transition: 'opacity 0.3s' }}
        />
        
        {/* Main line - no filter for performance */}
        <path 
          d={smoothPath} 
          fill="none" 
          stroke={color}
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={isAnimating ? 'opacity-0' : 'opacity-100'}
          style={{ transition: 'opacity 0.3s' }}
        />
        
        {/* Hover vertical line */}
        {hoveredPoint && (
          <line 
            x1={hoveredPoint.x} y1={padding.top} 
            x2={hoveredPoint.x} y2={height - padding.bottom}
            stroke="white" strokeWidth="1" strokeOpacity="0.3"
          />
        )}
        
        {/* Hovered point */}
        {hoveredPoint && (
          <circle 
            cx={hoveredPoint.x} cy={hoveredPoint.y} r="4"
            fill={color} stroke="#000" strokeWidth="1.5"
          />
        )}
        
        {/* Last point indicator */}
        {highlightCurrent && lastPoint && !hoveredPoint && (
          <circle 
            cx={lastPoint.x} cy={lastPoint.y} r="3"
            fill={color} stroke="#000" strokeWidth="1"
          />
        )}
      </svg>
      
      {/* Labels */}
      <div className="absolute top-0.5 left-2 text-[10px] text-white/40 font-medium tracking-wide uppercase pointer-events-none">{label}</div>
      <div className={`absolute top-0.5 right-2 flex items-center gap-1.5 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded pointer-events-none ${highlightCurrent ? 'bg-black/60' : ''}`}>
        <span style={{ color }}>{valueFormatter(chartData.points[chartData.points.length - 1]?.value || 0)}</span>
        {highlightCurrent && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></span>
            <span className="text-white/50 text-[9px]">LIVE</span>
          </span>
        )}
      </div>
      
      {/* Min/Max labels */}
      <div className="absolute bottom-0 left-2 text-[8px] text-white/25 font-mono pointer-events-none">
        {isConstant ? 'stable' : `min: ${valueFormatter(minValue)}`}
      </div>
      <div className="absolute bottom-0 right-2 text-[8px] text-white/25 font-mono pointer-events-none">
        {isConstant ? valueFormatter(maxValue) : `max: ${valueFormatter(maxValue)}`}
      </div>
      
      {/* Tooltip */}
      {hoveredPoint && (
        <div 
          className="absolute bg-black/95 border border-white/20 rounded px-2 py-1.5 pointer-events-none z-50 shadow-lg"
          style={{ 
            left: `${Math.min(Math.max((hoveredPoint.x / width) * 100, 10), 90)}%`, 
            top: '50%',
            transform: 'translateX(-50%) translateY(-50%)',
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
            <span className="font-mono font-bold text-sm" style={{ color }}>{valueFormatter(hoveredPoint.value)}</span>
          </div>
          <div className="text-white/50 text-[10px] font-mono mt-0.5">
            {new Date(hoveredPoint.time * 1000).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

interface StatusChartProps {
  data: { time: number; status: string }[];
  height?: number;
}

export const StatusChart = ({ data, height = 50 }: StatusChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastInteractionRef = useRef<number>(0);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 400);
    return () => clearTimeout(timer);
  }, [data]);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const statusConfig: Record<string, { color: string; label: string }> = {
    online: { color: '#10b981', label: 'Online' },
    syncing: { color: '#f59e0b', label: 'Syncing' },
    offline: { color: '#ef4444', label: 'Offline' },
  };

  const findHoveredBar = useCallback((clientX: number) => {
    if (!svgRef.current || !data.length) return;
    
    const now = Date.now();
    const throttleMs = 'ontouchstart' in window ? 50 : 16;
    if (now - lastInteractionRef.current < throttleMs) return;
    lastInteractionRef.current = now;

    const rect = svgRef.current.getBoundingClientRect();
    const relativeX = (clientX - rect.left) / rect.width;
    const index = Math.floor(relativeX * data.length);
    setHoveredIndex(Math.max(0, Math.min(data.length - 1, index)));
  }, [data.length]);

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGSVGElement>) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => findHoveredBar(event.clientX));
  }, [findHoveredBar]);

  const handleTouchMove = useCallback((event: React.TouchEvent<SVGSVGElement>) => {
    event.preventDefault();
    if (event.touches.length > 0) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => findHoveredBar(event.touches[0].clientX));
    }
  }, [findHoveredBar]);

  const handleTouchStart = useCallback((event: React.TouchEvent<SVGSVGElement>) => {
    if (event.touches.length > 0) {
      findHoveredBar(event.touches[0].clientX);
    }
  }, [findHoveredBar]);

  const handleInteractionEnd = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setHoveredIndex(null);
  }, []);

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-white/40 text-sm">No data</div>;
  }

  const barWidth = 100 / data.length;
  const gap = Math.min(0.5, 2 / data.length);

  return (
    <div className="relative w-full touch-none" style={{ height }}>
      <svg 
        ref={svgRef}
        viewBox="0 0 100 35" 
        className="w-full h-full" 
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleInteractionEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleInteractionEnd}
        onTouchCancel={handleInteractionEnd}
      >
        {data.map((d, i) => {
          const config = statusConfig[d.status] || statusConfig.offline;
          const isHovered = hoveredIndex === i;
          
          return (
            <rect 
              key={i}
              x={i * barWidth + gap} 
              y="2" 
              width={barWidth - gap * 2} 
              height="26"
              rx="1"
              fill={config.color}
              opacity={isAnimating ? 0 : (isHovered ? 1 : 0.7)}
              style={{ transition: 'opacity 0.15s' }}
            />
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="flex justify-center gap-4 mt-1.5 pointer-events-none">
        {Object.entries(statusConfig).map(([status, config]) => (
          <div key={status} className="flex items-center gap-1.5 text-[10px]">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: config.color }} />
            <span className="text-white/50">{config.label}</span>
          </div>
        ))}
      </div>
      
      {/* Tooltip */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div 
          className="absolute bg-black/95 border border-white/10 rounded-lg px-3 py-2 pointer-events-none z-20 shadow-lg"
          style={{ 
            left: `${Math.min(Math.max((hoveredIndex / data.length) * 100, 15), 85)}%`,
            top: '-8px',
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusConfig[data[hoveredIndex].status]?.color }} />
            <span className="font-medium text-white text-xs capitalize">{data[hoveredIndex].status}</span>
          </div>
          <div className="text-white/50 text-[10px] font-mono">
            {new Date(data[hoveredIndex].time * 1000).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};
