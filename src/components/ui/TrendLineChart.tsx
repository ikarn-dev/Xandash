'use client';

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';

interface DataPoint {
  timestamp: number;
  value: number;
  label?: string;
}

interface TrendLineChartProps {
  data: DataPoint[];
  title: string;
  subtitle?: string;
  color?: string;
  valueFormatter?: (value: number) => string;
  height?: number;
  isLoading?: boolean;
  showArea?: boolean;
  emptyMessage?: string;
}

// Loading animation component
const ChartLoadingAnimation = () => (
  <div className="flex flex-col items-center justify-center gap-3 h-full">
    <div className="relative w-8 h-8 sm:w-10 sm:h-10">
      <div className="absolute inset-0 rounded-full border-2 border-white/10" />
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin" />
      <div className="absolute inset-2 rounded-full bg-emerald-500/20 animate-pulse" />
    </div>
    <span className="text-[10px] sm:text-xs text-white/40">Loading...</span>
  </div>
);

// Format timestamp for tooltip
const formatTooltipTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data,
  title,
  subtitle,
  color = '#10b981',
  valueFormatter = (v) => v.toLocaleString(),
  height = 200,
  isLoading = false,
  showArea = true,
  emptyMessage = 'No data available'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height });
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    data: DataPoint;
    index: number;
  } | null>(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const [pathLength, setPathLength] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasAnimatedRef = useRef(false);

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [height]);

  // Get path length for animation
  useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      setPathLength(len);
    }
  }, [data, dimensions]);

  // Initial animation - only once
  useEffect(() => {
    if (pathLength > 0 && !hasAnimatedRef.current) {
      const timer = setTimeout(() => {
        setIsAnimated(true);
        hasAnimatedRef.current = true;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [pathLength]);

  // Cleanup tooltip timeout
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  const { path, areaPath, points, yTicks, currentValue } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        path: '',
        areaPath: '',
        points: [],
        yTicks: [],
        currentValue: 0
      };
    }

    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    const values = sortedData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);

    const range = max - min || 1;
    const padding = range * 0.1;
    const minVal = Math.max(0, min - padding);
    const maxVal = max + padding;

    const padding_x = 45;
    const padding_y = 25;
    const chartWidth = dimensions.width - padding_x - 15;
    const chartHeight = dimensions.height - padding_y - 15;

    const pts = sortedData.map((d, i) => {
      const x = padding_x + (i / (sortedData.length - 1 || 1)) * chartWidth;
      const y =
        padding_y +
        chartHeight -
        ((d.value - minVal) / (maxVal - minVal || 1)) * chartHeight;
      return { x, y, data: d, index: i };
    });

    let pathD = '';
    let areaD = '';

    if (pts.length > 0) {
      pathD = `M ${pts[0].x} ${pts[0].y}`;
      areaD = `M ${pts[0].x} ${padding_y + chartHeight} L ${pts[0].x} ${pts[0].y}`;

      for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const tension = 0.3;

        const cp1x = prev.x + (curr.x - prev.x) * tension;
        const cp1y = prev.y;
        const cp2x = curr.x - (curr.x - prev.x) * tension;
        const cp2y = curr.y;

        pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
        areaD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      }

      areaD += ` L ${pts[pts.length - 1].x} ${padding_y + chartHeight} Z`;
    }

    const tickCount = 4;
    const ticks = Array.from({ length: tickCount }, (_, i) => {
      const value = minVal + ((maxVal - minVal) / (tickCount - 1)) * i;
      const y =
        padding_y +
        chartHeight -
        ((value - minVal) / (maxVal - minVal || 1)) * chartHeight;
      return { value, y };
    });

    return {
      path: pathD,
      areaPath: areaD,
      points: pts,
      yTicks: ticks,
      currentValue: sortedData[sortedData.length - 1]?.value || 0
    };
  }, [data, dimensions]);

  // Desktop hover handler
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (isTouchDevice || !svgRef.current || points.length === 0) return;

      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;

      let closest = points[0];
      let minDist = Math.abs(mouseX - closest.x);

      for (const pt of points) {
        const dist = Math.abs(mouseX - pt.x);
        if (dist < minDist) {
          minDist = dist;
          closest = pt;
        }
      }

      if (minDist < 60) {
        setHoveredPoint(closest);
        setShowTooltip(true);
      } else {
        setHoveredPoint(null);
        setShowTooltip(false);
      }
    },
    [points, isTouchDevice]
  );

  const handleMouseLeave = useCallback(() => {
    if (!isTouchDevice) {
      setHoveredPoint(null);
      setShowTooltip(false);
    }
  }, [isTouchDevice]);

  // Mobile tap handler
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      if (!svgRef.current || points.length === 0) return;

      const touch = e.changedTouches[0];
      const rect = svgRef.current.getBoundingClientRect();
      const touchX = touch.clientX - rect.left;

      let closest = points[0];
      let minDist = Math.abs(touchX - closest.x);

      for (const pt of points) {
        const dist = Math.abs(touchX - pt.x);
        if (dist < minDist) {
          minDist = dist;
          closest = pt;
        }
      }

      if (minDist < 80) {
        if (tooltipTimeoutRef.current) {
          clearTimeout(tooltipTimeoutRef.current);
        }

        setHoveredPoint(closest);
        setShowTooltip(true);

        tooltipTimeoutRef.current = setTimeout(() => {
          setHoveredPoint(null);
          setShowTooltip(false);
        }, 2500);
      } else {
        setHoveredPoint(null);
        setShowTooltip(false);
      }
    },
    [points]
  );

  const isMobile = dimensions.width < 400;
  const isTablet = dimensions.width >= 400 && dimensions.width < 768;
  const tooltipWidth = isMobile ? 70 : isTablet ? 90 : 120;
  const tooltipHeight = isMobile ? 35 : isTablet ? 40 : 50;

  return (
    <div className="bg-[#0a0a0a] border border-white/10 group relative touch-pan-y overflow-visible"
      style={{ zIndex: hoveredPoint && showTooltip ? 50 : 'auto' }}
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 z-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-2 h-px bg-white/20 group-hover:bg-emerald-400 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-all duration-300" />
        <div className="absolute top-0 left-0 w-px h-2 bg-white/20 group-hover:bg-emerald-400 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-all duration-300" />
      </div>
      <div className="absolute top-0 right-0 w-4 h-4 z-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-2 h-px bg-white/20 group-hover:bg-emerald-400 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-all duration-300" />
        <div className="absolute top-0 right-0 w-px h-2 bg-white/20 group-hover:bg-emerald-400 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-all duration-300" />
      </div>
      <div className="absolute bottom-0 left-0 w-4 h-4 z-20 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-2 h-px bg-white/20 group-hover:bg-emerald-400 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-all duration-300" />
        <div className="absolute bottom-0 left-0 w-px h-2 bg-white/20 group-hover:bg-emerald-400 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-all duration-300" />
      </div>
      <div className="absolute bottom-0 right-0 w-4 h-4 z-20 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-2 h-px bg-white/20 group-hover:bg-emerald-400 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-all duration-300" />
        <div className="absolute bottom-0 right-0 w-px h-2 bg-white/20 group-hover:bg-emerald-400 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-all duration-300" />
      </div>

      {/* Header */}
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-white/10 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-medium text-white/90 truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-white/50 truncate">{subtitle}</p>
          )}
        </div>
        <div
          className="text-base sm:text-lg font-bold text-white font-mono flex-shrink-0 transition-all duration-300"
          style={{ color }}
        >
          {valueFormatter(currentValue)}
        </div>
      </div>

      {/* Chart */}
      <div
        ref={containerRef}
        className="p-2 sm:p-3 relative touch-pan-y overflow-visible"
        style={{ height: isMobile ? height - 20 : height }}
      >
        {isLoading ? (
          <ChartLoadingAnimation />
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/40 text-xs sm:text-sm">
            {emptyMessage}
          </div>
        ) : (
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            preserveAspectRatio="xMidYMid meet"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchEnd={handleTouchEnd}
            className="overflow-visible touch-pan-y"
            style={{ touchAction: 'pan-y' }}
          >
            {/* Grid lines */}
            {yTicks.map((tick, i) => (
              <line
                key={i}
                x1={45}
                y1={tick.y}
                x2={dimensions.width - 15}
                y2={tick.y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            ))}

            {/* Y-axis labels */}
            {yTicks.map((tick, i) => (
              <text
                key={i}
                x={40}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[8px] sm:text-[10px] fill-white/50 font-mono"
              >
                {valueFormatter(tick.value)}
              </text>
            ))}

            {/* Area fill */}
            {showArea && areaPath && (
              <path
                d={areaPath}
                fill={`url(#gradient-${color.replace('#', '')})`}
                className="transition-opacity duration-700 ease-out"
                style={{ opacity: isAnimated ? 0.3 : 0 }}
              />
            )}

            {/* Line */}
            {path && (
              <path
                ref={pathRef}
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={isMobile ? 2 : 2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  strokeDasharray: pathLength || 1000,
                  strokeDashoffset: isAnimated ? 0 : pathLength || 1000,
                  transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: `drop-shadow(0 0 3px ${color}40)`
                }}
              />
            )}

            {/* Data points */}
            {points.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={
                  hoveredPoint?.index === i
                    ? isMobile
                      ? 5
                      : 6
                    : isMobile
                    ? 2.5
                    : 3
                }
                fill={hoveredPoint?.index === i ? color : '#0a0a0a'}
                stroke={color}
                strokeWidth={hoveredPoint?.index === i ? 2 : 1.5}
                className="transition-all duration-150 ease-out"
                style={{
                  opacity: isAnimated ? 1 : 0,
                  transitionDelay: isAnimated ? '0ms' : `${600 + i * 40}ms`,
                  filter:
                    hoveredPoint?.index === i
                      ? `drop-shadow(0 0 6px ${color})`
                      : 'none'
                }}
              />
            ))}

            {/* Hover vertical line */}
            {hoveredPoint && showTooltip && (
              <line
                x1={hoveredPoint.x}
                y1={25}
                x2={hoveredPoint.x}
                y2={dimensions.height - 15}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            )}

            {/* Gradient definition */}
            <defs>
              <linearGradient
                id={`gradient-${color.replace('#', '')}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
          </svg>
        )}

        {/* Tooltip */}
        {hoveredPoint && showTooltip && (
          <div
            className={`absolute z-30 bg-gray-900/95 backdrop-blur-md border border-white/20 pointer-events-none shadow-xl rounded-sm transition-opacity duration-200 ${
              isMobile ? 'px-1.5 py-1 text-[8px]' : isTablet ? 'px-2 py-1.5 text-[9px]' : 'px-3 py-2 text-[10px]'
            }`}
            style={{
              left: (() => {
                const halfWidth = tooltipWidth / 2;
                const minLeft = halfWidth + 10;
                const maxLeft = dimensions.width - halfWidth - 10;
                return Math.min(Math.max(hoveredPoint.x, minLeft), maxLeft);
              })(),
              top: (() => {
                const preferredTop = hoveredPoint.y - tooltipHeight - 10;
                const minTop = 10;
                const maxTop = dimensions.height - tooltipHeight - 10;
                
                // If tooltip would go above container, show below the point
                if (preferredTop < minTop) {
                  return Math.min(hoveredPoint.y + 15, maxTop);
                }
                return Math.max(preferredTop, minTop);
              })(),
              transform: 'translateX(-50%)',
              maxWidth: `${tooltipWidth}px`,
              minWidth: `${tooltipWidth - 10}px`,
              opacity: showTooltip ? 1 : 0
            }}
          >
            <div className={`text-white/60 mb-0.5 truncate ${isMobile ? 'text-[7px]' : isTablet ? 'text-[8px]' : 'text-[9px]'}`}>
              {formatTooltipTime(hoveredPoint.data.timestamp)}
            </div>
            <div
              className={`font-bold text-white font-mono truncate ${isMobile ? 'text-[9px]' : isTablet ? 'text-[10px]' : 'text-xs'}`}
              style={{ color }}
            >
              {valueFormatter(hoveredPoint.data.value)}
            </div>
            {hoveredPoint.data.label && (
              <div className={`text-white/50 mt-0.5 truncate ${isMobile ? 'text-[7px]' : isTablet ? 'text-[8px]' : 'text-[9px]'}`}>
                {hoveredPoint.data.label}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
