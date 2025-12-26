'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';

interface RegionStats {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

interface NetworkRegionsCardProps {
  className?: string;
  countryStats: { country: string; country_code: string; count: number }[];
  isLoading: boolean;
  error: string | null;
}

// Map countries to regions
const getRegion = (countryCode: string): string => {
  const regionMap: { [key: string]: string[] } = {
    'North America': ['us', 'ca', 'mx'],
    'Europe': ['gb', 'de', 'fr', 'nl', 'es', 'it', 'pl', 'se', 'no', 'fi', 'dk', 'be', 'at', 'ch', 'ie', 'pt', 'cz', 'ro', 'hu', 'gr', 'ua', 'bg', 'hr', 'sk', 'si', 'lt', 'lv', 'ee', 'lu', 'mt', 'cy', 'is', 'rs', 'ba', 'mk', 'al', 'me', 'md', 'by'],
    'Asia Pacific': ['cn', 'jp', 'kr', 'in', 'au', 'nz', 'sg', 'hk', 'tw', 'th', 'vn', 'my', 'id', 'ph', 'pk', 'bd', 'lk', 'np', 'mm', 'kh', 'la', 'mn', 'kz', 'uz', 'tm', 'kg', 'tj'],
    'South America': ['br', 'ar', 'cl', 'co', 'pe', 've', 'ec', 'bo', 'py', 'uy', 'gy', 'sr'],
    'Middle East': ['ae', 'sa', 'il', 'tr', 'ir', 'iq', 'jo', 'lb', 'sy', 'kw', 'qa', 'bh', 'om', 'ye'],
    'Africa': ['za', 'eg', 'ng', 'ke', 'ma', 'gh', 'tz', 'et', 'ug', 'dz', 'tn', 'ly', 'sd', 'ao', 'mz', 'zm', 'zw', 'bw', 'na', 'sn', 'ci', 'cm', 'mg', 'ml', 'bf', 'ne', 'td', 'rw', 'mw', 'mu'],
  };

  const code = countryCode.toLowerCase();
  for (const [region, countries] of Object.entries(regionMap)) {
    if (countries.includes(code)) return region;
  }
  return 'Other';
};

export const NetworkRegionsCard: React.FC<NetworkRegionsCardProps> = ({ 
  className = "", 
  countryStats,
  isLoading,
  error
}) => {
  const [showModal, setShowModal] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
    }, 200);
  };

  // Calculate region stats
  const regionStats = React.useMemo(() => {
    const regionMap = new Map<string, number>();
    let total = 0;

    countryStats.forEach(country => {
      const region = getRegion(country.country_code);
      regionMap.set(region, (regionMap.get(region) || 0) + country.count);
      total += country.count;
    });

    const colors: { [key: string]: string } = {
      'North America': '#3b82f6',
      'Europe': '#8b5cf6',
      'Asia Pacific': '#06b6d4',
      'South America': '#10b981',
      'Middle East': '#f59e0b',
      'Africa': '#ef4444',
      'Other': '#6b7280',
    };

    const stats: RegionStats[] = Array.from(regionMap.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        color: colors[name] || '#6b7280',
      }))
      .sort((a, b) => b.count - a.count);

    return { stats, total };
  }, [countryStats]);

  const CornerAccents = () => (
    <>
      <div className="absolute top-0 left-0 w-6 h-6">
        <div className="absolute top-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute top-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>
      <div className="absolute top-0 right-0 w-6 h-6">
        <div className="absolute top-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute top-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>
      <div className="absolute bottom-0 left-0 w-6 h-6">
        <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute bottom-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>
      <div className="absolute bottom-0 right-0 w-6 h-6">
        <div className="absolute bottom-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute bottom-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>
    </>
  );

  if (isLoading) {
    return (
      <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
        <CornerAccents />
        <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
          <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-3"></div>
          <div className="text-white/40 text-xs">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
        <CornerAccents />
        <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
          <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-red-400 text-xs">Error</div>
        </div>
      </div>
    );
  }

  const topRegion = regionStats.stats[0];

  return (
    <>
      <div 
        className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden cursor-pointer ${className}`}
        onClick={() => setShowModal(true)}
      >
        <CornerAccents />
        
        <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
          <div className="text-white/50 text-xs font-medium tracking-wider mb-3">// REGIONS</div>
          <div className="text-purple-400 text-4xl lg:text-5xl font-bold font-mono mb-1">
            {regionStats.stats.length}
          </div>
          <div className="text-white/40 text-[10px] mb-3">
            active regions
          </div>
          
          {/* Region Distribution Bar */}
          <div className="w-full px-2 mt-1">
            <svg className="w-full" height="24" viewBox="0 0 200 24" preserveAspectRatio="none">
              {(() => {
                let xOffset = 0;
                return regionStats.stats.map((region) => {
                  const barCount = Math.max(1, Math.round((region.percentage / 100) * 45));
                  const bars = Array.from({ length: barCount }).map((_, i) => (
                    <rect
                      key={`${region.name}-${i}`}
                      x={xOffset + i * 4.5}
                      y={0}
                      width={3}
                      height={24}
                      rx={1}
                      fill={region.color}
                    />
                  ));
                  xOffset += barCount * 4.5;
                  return bars;
                });
              })()}
            </svg>
            <div className="flex justify-center items-center mt-1.5">
              <span className="text-purple-400 text-[9px] font-medium">click for details</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div 
          className={`fixed inset-0 flex items-center justify-center transition-all duration-200 ease-out ${isClosing ? 'opacity-0' : 'opacity-100'}`}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)', zIndex: 99999 }}
          onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
        >
          <div 
            className={`relative w-[280px] overflow-hidden rounded-lg transition-all duration-200 ease-out ${
              isClosing ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0'
            }`}
            style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255, 255, 255, 0.12)' }}
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10">
              <h2 className="text-white text-xs font-bold font-mono">REGION DISTRIBUTION</h2>
              <button onClick={handleCloseModal} className="text-white/40 hover:text-white p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-3 py-3">
              {regionStats.stats.map((region) => (
                <div key={region.name} className="flex items-center py-2 hover:bg-white/5 rounded px-1">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: region.color }} />
                    <span className="text-white font-mono text-[11px]">{region.name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-[11px] font-semibold w-8 text-right" style={{ color: region.color }}>
                      {region.count}
                    </span>
                    <span className="text-white/40 font-mono text-[10px] w-12 text-right">
                      {region.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-3 py-2.5 border-t border-white/10 bg-black/40">
              <div className="flex justify-between">
                <div>
                  <div className="text-white/40 text-[9px] uppercase">Total Nodes</div>
                  <div className="text-purple-400 text-sm font-mono font-bold">{regionStats.total}</div>
                </div>
                <div className="text-right">
                  <div className="text-white/40 text-[9px] uppercase">Top Region</div>
                  <div className="text-purple-400 text-sm font-mono font-bold">{topRegion?.name || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
