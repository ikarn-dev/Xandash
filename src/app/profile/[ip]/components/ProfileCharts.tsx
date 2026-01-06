'use client';

import { useState, useEffect, useRef, useMemo } from 'react';

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

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 800);
    return () => clearTimeout(timer);
  }, [data]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const values = data.map(d => d.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    const rawRange = rawMax - rawMin;
    
    // Handle constant or near-constant data - create artificial range for visibility
    const isConstant = rawRange < 0.001 || (rawRange / Math.max(Math.abs(rawMax), 0.001)) < 0.01;
    
    let minValue: number, maxValue: number, range: number;
    if (isConstant) {
      // Create a 10% padding around the constant value for visibility
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
      // For constant data, center the line in the middle of the chart
      const normalizedValue = isConstant 
        ? 0.5 
        : (d.value - minValue) / range;
      const y = padding.top + chartHeight - normalizedValue * chartHeight;
      return { x, y, value: d.value, time: d.time, index: i };
    });

    return { points, minValue: rawMin, maxValue: rawMax, width, height, padding, chartHeight, isConstant };
  }, [data, height]);

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

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * width;
    
    let closestPoint = points[0];
    let minDistance = Math.abs(mouseX - points[0].x);
    
    points.forEach(point => {
      const distance = Math.abs(mouseX - point.x);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });
    
    setHoveredPoint(closestPoint);
  };

  const gridLines = [0.25, 0.5, 0.75].map(ratio => padding.top + chartHeight * ratio);

  return (
    <div className="relative w-full" style={{ height }}>
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full cursor-crosshair" 
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredPoint(null)}
      >
        <defs>
          <linearGradient id={`areaGradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="50%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id={`lineGradient-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="50%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
          <filter id={`glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Grid lines */}
        {gridLines.map((y, i) => (
          <line key={i} x1={padding.left} y1={y} x2={width - padding.right} y2={y}
            stroke="white" strokeOpacity="0.06" strokeWidth="0.5" strokeDasharray="2,4"
          />
        ))}
        
        {/* Area fill */}
        <path 
          d={areaPath} 
          fill={`url(#areaGradient-${label})`}
          className={`transition-opacity duration-500 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
        />
        
        {/* Main line with glow */}
        <path 
          d={smoothPath} 
          fill="none" 
          stroke={`url(#lineGradient-${label})`}
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          filter={`url(#glow-${label})`}
          className={`transition-all duration-500 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
          style={{ 
            strokeDasharray: isAnimating ? '1000' : '0',
            strokeDashoffset: isAnimating ? '1000' : '0',
          }}
        />
        
        {/* Hover vertical line */}
        {hoveredPoint && (
          <g>
            <line 
              x1={hoveredPoint.x} y1={padding.top} 
              x2={hoveredPoint.x} y2={height - padding.bottom}
              stroke="white" strokeWidth="1" strokeOpacity="0.2"
            />
            <line 
              x1={padding.left} y1={hoveredPoint.y} 
              x2={width - padding.right} y2={hoveredPoint.y}
              stroke={color} strokeWidth="0.5" strokeOpacity="0.4" strokeDasharray="3,3"
            />
          </g>
        )}
        
        {/* Data points - only show on hover or last point */}
        {points.map((point, i) => {
          const isHovered = hoveredPoint?.index === i;
          const isLast = i === points.length - 1;
          const showPoint = isHovered || (highlightCurrent && isLast);
          
          if (!showPoint) return null;
          
          return (
            <g key={i}>
              {/* Outer glow ring */}
              <circle 
                cx={point.x} cy={point.y} r={isLast && highlightCurrent ? "5" : "4"}
                fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.3"
                className={isLast && highlightCurrent ? 'animate-ping' : ''}
              />
              {/* Inner solid circle */}
              <circle 
                cx={point.x} cy={point.y} r="3"
                fill={color} stroke="#000" strokeWidth="1.5"
              />
              {/* Center dot */}
              <circle cx={point.x} cy={point.y} r="1" fill="white" />
            </g>
          );
        })}
      </svg>
      
      {/* Labels */}
      <div className="absolute top-0.5 left-2 text-[10px] text-white/40 font-medium tracking-wide uppercase">{label}</div>
      <div className={`absolute top-0.5 right-2 flex items-center gap-1.5 text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${highlightCurrent ? 'bg-black/60 backdrop-blur-sm' : ''}`}>
        <span style={{ color }}>{valueFormatter(chartData.points[chartData.points.length - 1]?.value || 0)}</span>
        {highlightCurrent && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }}></span>
            <span className="text-white/50 text-[9px]">LIVE</span>
          </span>
        )}
      </div>
      
      {/* Min/Max labels */}
      <div className="absolute bottom-0 left-2 text-[8px] text-white/25 font-mono">
        {isConstant ? 'stable' : `min: ${valueFormatter(minValue)}`}
      </div>
      <div className="absolute bottom-0 right-2 text-[8px] text-white/25 font-mono">
        {isConstant ? valueFormatter(maxValue) : `max: ${valueFormatter(maxValue)}`}
      </div>
      
      {/* Tooltip - positioned to stay within bounds */}
      {hoveredPoint && (
        <div 
          className="absolute bg-black/95 backdrop-blur-md border border-white/20 rounded px-2.5 py-1.5 pointer-events-none z-50 shadow-xl whitespace-nowrap"
          style={{ 
            left: `${Math.min(Math.max((hoveredPoint.x / width) * 100, 5), 95)}%`, 
            top: '50%',
            transform: `translateX(-50%) translateY(-50%)`,
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

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, [data]);

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-white/40 text-sm">No data</div>;
  }

  const statusConfig: Record<string, { color: string; glow: string; label: string }> = {
    online: { color: '#10b981', glow: 'rgba(16, 185, 129, 0.5)', label: 'Online' },
    syncing: { color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.5)', label: 'Syncing' },
    offline: { color: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)', label: 'Offline' },
  };

  const barWidth = 100 / data.length;
  const gap = Math.min(0.5, 2 / data.length);

  return (
    <div className="relative w-full" style={{ height }}>
      <svg 
        viewBox="0 0 100 35" 
        className="w-full h-full" 
        preserveAspectRatio="none"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          {Object.entries(statusConfig).map(([status, config]) => (
            <linearGradient key={status} id={`statusGradient-${status}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={config.color} stopOpacity="1" />
              <stop offset="100%" stopColor={config.color} stopOpacity="0.6" />
            </linearGradient>
          ))}
        </defs>
        
        {data.map((d, i) => {
          const config = statusConfig[d.status] || statusConfig.offline;
          const isHovered = hoveredIndex === i;
          const isLast = i === data.length - 1;
          
          return (
            <g key={i} onMouseEnter={() => setHoveredIndex(i)}>
              {/* Glow effect for hovered/last */}
              {(isHovered || isLast) && (
                <rect 
                  x={i * barWidth + gap} 
                  y="0" 
                  width={barWidth - gap * 2} 
                  height="30"
                  fill={config.glow}
                  filter="blur(4px)"
                  opacity="0.5"
                />
              )}
              {/* Main bar */}
              <rect 
                x={i * barWidth + gap} 
                y="2" 
                width={barWidth - gap * 2} 
                height="26"
                rx="1"
                fill={`url(#statusGradient-${d.status})`}
                className="transition-all duration-200"
                style={{ 
                  opacity: isAnimating ? 0 : (isHovered ? 1 : 0.85),
                  transform: isHovered ? 'scaleY(1.1)' : 'scaleY(1)',
                  transformOrigin: 'center',
                  animationDelay: `${i * 20}ms`,
                }}
              />
              {/* Top highlight */}
              <rect 
                x={i * barWidth + gap + 1} 
                y="3" 
                width={barWidth - gap * 2 - 2} 
                height="2"
                rx="0.5"
                fill="white"
                opacity={isAnimating ? 0 : 0.2}
              />
            </g>
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="flex justify-center gap-4 mt-1.5">
        {Object.entries(statusConfig).map(([status, config]) => (
          <div key={status} className="flex items-center gap-1.5 text-[10px]">
            <div 
              className="w-2.5 h-2.5 rounded-sm shadow-sm" 
              style={{ backgroundColor: config.color, boxShadow: `0 0 6px ${config.glow}` }}
            />
            <span className="text-white/50">{config.label}</span>
          </div>
        ))}
      </div>
      
      {/* Tooltip */}
      {hoveredIndex !== null && data[hoveredIndex] && (
        <div 
          className="absolute bg-black/90 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 pointer-events-none z-20 shadow-xl"
          style={{ 
            left: `${Math.min(Math.max((hoveredIndex / data.length) * 100, 10), 90)}%`,
            top: '-10px',
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: statusConfig[data[hoveredIndex].status]?.color }}
            />
            <span className="font-medium text-white text-xs capitalize">
              {data[hoveredIndex].status}
            </span>
          </div>
          <div className="text-white/50 text-[10px] font-mono">
            {new Date(data[hoveredIndex].time * 1000).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};
