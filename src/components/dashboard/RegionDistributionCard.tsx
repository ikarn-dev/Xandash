'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useNodesData } from '@/libs/context/nodes-data-context';
import { extractIPFromAddress } from '@/libs/services/geolocation';

interface RegionDistributionCardProps {
  className?: string;
}

const COLORS = [
  '#22d3ee', // cyan
  '#60a5fa', // blue
  '#f97316', // orange
  '#fbbf24', // amber
  '#ef4444', // red
  '#a3e635', // lime
  '#c084fc', // purple
  '#fb7185', // pink
  '#34d399', // emerald
  '#818cf8', // indigo
];

// Country code to flag emoji
const getFlagEmoji = (countryCode: string) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// CornerAccents component defined outside render
const CornerAccents = () => (
  <>
    <div className="absolute top-0 left-0 w-4 h-4">
      <div className="absolute top-0 left-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300" />
      <div className="absolute top-0 left-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300" />
    </div>
    <div className="absolute top-0 right-0 w-4 h-4">
      <div className="absolute top-0 right-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300" />
      <div className="absolute top-0 right-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300" />
    </div>
    <div className="absolute bottom-0 left-0 w-4 h-4">
      <div className="absolute bottom-0 left-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300" />
      <div className="absolute bottom-0 left-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300" />
    </div>
    <div className="absolute bottom-0 right-0 w-4 h-4">
      <div className="absolute bottom-0 right-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300" />
      <div className="absolute bottom-0 right-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300" />
    </div>
  </>
);

export const RegionDistributionCard: React.FC<RegionDistributionCardProps> = ({ className = '' }) => {
  const { nodes, geoData, isLoading } = useNodesData();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Trigger animation on data change
  useEffect(() => {
    if (nodes.length > 0) {
      // Use setTimeout to avoid setState in effect
      const timer = setTimeout(() => {
        setIsAnimated(false);
        setAnimationKey(prev => prev + 1);
        const animTimer = setTimeout(() => setIsAnimated(true), 50);
        return () => clearTimeout(animTimer);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [nodes.length]);

  const regionData = useMemo(() => {
    if (nodes.length === 0) return { countries: [], total: 0, maxCount: 0 };

    const countryCounts = new Map<string, { count: number; code: string }>();
    
    nodes.forEach(node => {
      let country = node.country;
      let countryCode = node.country_code;
      
      // Try to get from geoData if not on node
      if (!country || !countryCode) {
        const ip = extractIPFromAddress(node.address);
        const geo = geoData[ip];
        if (geo) {
          country = geo.country;
          countryCode = geo.country_code;
        }
      }
      
      if (country && countryCode) {
        const existing = countryCounts.get(country);
        if (existing) {
          existing.count++;
        } else {
          countryCounts.set(country, { count: 1, code: countryCode });
        }
      } else {
        const existing = countryCounts.get('Unknown');
        if (existing) {
          existing.count++;
        } else {
          countryCounts.set('Unknown', { count: 1, code: '' });
        }
      }
    });

    const total = nodes.length;
    const countries = Array.from(countryCounts.entries())
      .map(([country, data]) => ({
        country,
        code: data.code,
        count: data.count,
        percentage: (data.count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const maxCount = countries.length > 0 ? countries[0].count : 0;

    return { countries, total, maxCount };
  }, [nodes, geoData]);

  if (isLoading && nodes.length === 0) {
    return (
      <div className={`relative bg-black/80 border border-white/10 p-4 group hover:border-white/20 transition-all duration-300 ${className}`}>
        <CornerAccents />
        <div className="h-4 w-32 bg-white/10 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-5 bg-white/5 rounded" style={{ width: `${100 - i * 12}%` }} />
          ))}
        </div>
      </div>
    );
  }

  const uniqueCountries = regionData.countries.filter(c => c.country !== 'Unknown').length;

  return (
    <div className={`relative bg-black/80 border border-white/10 p-4 group hover:border-white/20 hover:shadow-lg hover:shadow-white/5 transition-all duration-300 ${className}`}>
      <CornerAccents />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white/60 text-[10px] sm:text-xs font-medium tracking-wider">{/* REGION DISTRIBUTION */}</h3>
        <span 
          className="text-white/40 text-[9px] font-mono transition-all duration-500"
          style={{ opacity: isAnimated ? 1 : 0, transform: isAnimated ? 'translateX(0)' : 'translateX(10px)' }}
        >
          {uniqueCountries} countries
        </span>
      </div>

      {/* Horizontal Bar Chart */}
      <div className="space-y-2" key={animationKey}>
        {regionData.countries.map((item, index) => (
          <div 
            key={item.country} 
            className="group/bar cursor-pointer"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              opacity: isAnimated ? 1 : 0,
              transform: isAnimated ? 'translateX(0)' : 'translateX(-20px)',
              transition: `opacity 0.4s ease, transform 0.4s ease`,
              transitionDelay: `${index * 60}ms`,
            }}
          >
            <div className="flex items-center gap-2">
              {/* Flag + Country */}
              <div 
                className="flex items-center gap-1.5 w-24 sm:w-32 flex-shrink-0 transition-transform duration-200"
                style={{ transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)' }}
              >
                <span className="text-sm">{getFlagEmoji(item.code)}</span>
                <span 
                  className="text-[9px] sm:text-[10px] font-mono truncate transition-colors duration-200"
                  style={{ color: hoveredIndex === index ? COLORS[index % COLORS.length] : 'rgba(255,255,255,0.7)' }}
                >
                  {item.country.length > 10 ? `${item.country.slice(0, 10)}..` : item.country}
                </span>
              </div>
              
              {/* Bar */}
              <div className="flex-1 relative h-5 sm:h-6 bg-white/5 rounded overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded flex items-center"
                  style={{
                    width: isAnimated ? `${(item.count / regionData.maxCount) * 100}%` : '0%',
                    backgroundColor: COLORS[index % COLORS.length],
                    minWidth: isAnimated ? '24px' : '0px',
                    transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), min-width 0.6s ease, filter 0.2s ease, transform 0.2s ease',
                    transitionDelay: `${index * 60 + 100}ms`,
                    filter: hoveredIndex === index ? `drop-shadow(0 0 8px ${COLORS[index % COLORS.length]}80)` : 'none',
                    transform: hoveredIndex === index ? 'scaleY(1.1)' : 'scaleY(1)',
                  }}
                >
                  <span 
                    className="absolute right-2 text-black/80 text-[8px] sm:text-[9px] font-bold font-mono transition-opacity duration-300"
                    style={{ opacity: isAnimated ? 1 : 0, transitionDelay: `${index * 60 + 300}ms` }}
                  >
                    {item.count}
                  </span>
                </div>
              </div>
              
              {/* Percentage */}
              <span 
                className="text-[8px] sm:text-[9px] font-mono w-10 text-right flex-shrink-0 transition-all duration-200"
                style={{ 
                  color: hoveredIndex === index ? COLORS[index % COLORS.length] : 'rgba(255,255,255,0.4)',
                  opacity: isAnimated ? 1 : 0,
                  transitionDelay: `${index * 60 + 200}ms`,
                }}
              >
                {item.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div 
        className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center transition-all duration-500"
        style={{ opacity: isAnimated ? 1 : 0, transform: isAnimated ? 'translateY(0)' : 'translateY(10px)', transitionDelay: '400ms' }}
      >
        <span className="text-white/40 text-[8px] sm:text-[9px]">Top {regionData.countries.length} regions</span>
        <span className="text-white/50 text-[9px] sm:text-[10px] font-mono">{regionData.total} total nodes</span>
      </div>
    </div>
  );
};
