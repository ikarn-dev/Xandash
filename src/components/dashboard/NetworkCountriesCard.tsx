'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';

interface CountryStats {
  country: string;
  country_code: string;
  count: number;
}

interface NetworkCountriesCardProps {
  className?: string;
  countryStats: CountryStats[];
  isLoading: boolean;
  error: string | null;
}

export const NetworkCountriesCard: React.FC<NetworkCountriesCardProps> = ({ 
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

  const totalNodes = countryStats.reduce((sum, c) => sum + c.count, 0);
  const topCountries = countryStats.slice(0, 5);

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
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-3"></div>
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

  return (
    <>
      <div 
        className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden cursor-pointer ${className}`}
        onClick={() => setShowModal(true)}
      >
        <CornerAccents />
        
        <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
          <div className="text-white/50 text-xs font-medium tracking-wider mb-3">// COUNTRIES</div>
          <div className="text-blue-400 text-4xl lg:text-5xl font-bold font-mono mb-1">
            {countryStats.length}
          </div>
          <div className="text-white/40 text-[10px] mb-3">
            unique locations
          </div>
          
          {/* Top Countries Bar */}
          <div className="w-full px-2 mt-1">
            <svg className="w-full" height="24" viewBox="0 0 200 24" preserveAspectRatio="none">
              {(() => {
                let xOffset = 0;
                const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
                return topCountries.map((country, index) => {
                  const barCount = Math.max(1, Math.round((country.count / totalNodes) * 45));
                  const bars = Array.from({ length: barCount }).map((_, i) => (
                    <rect
                      key={`${country.country}-${i}`}
                      x={xOffset + i * 4.5}
                      y={0}
                      width={3}
                      height={24}
                      rx={1}
                      fill={colors[index % colors.length]}
                    />
                  ));
                  xOffset += barCount * 4.5;
                  return bars;
                });
              })()}
            </svg>
            <div className="flex justify-center items-center mt-1.5">
              <span className="text-blue-400 text-[9px] font-medium">click for details</span>
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
            className={`relative w-[320px] max-h-[80vh] overflow-hidden rounded-lg transition-all duration-200 ease-out ${
              isClosing ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0'
            }`}
            style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255, 255, 255, 0.12)' }}
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10">
              <h2 className="text-white text-xs font-bold font-mono">COUNTRIES ({countryStats.length})</h2>
              <button onClick={handleCloseModal} className="text-white/40 hover:text-white p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-3 py-3 max-h-[60vh] overflow-y-auto">
              {countryStats.map((country, index) => {
                const percentage = totalNodes > 0 ? (country.count / totalNodes) * 100 : 0;
                return (
                  <div key={country.country} className="flex items-center py-2 hover:bg-white/5 rounded px-1">
                    <div className="flex items-center flex-1 min-w-0">
                      <span className="text-white/40 text-[10px] w-5 mr-2">#{index + 1}</span>
                      {country.country_code ? (
                        <img 
                          src={`${process.env.NEXT_PUBLIC_FLAG_CDN_URL || 'https://flagcdn.com'}/16x12/${country.country_code.toLowerCase()}.png`}
                          alt={country.country}
                          className="w-4 h-3 object-cover rounded-sm mr-2 flex-shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-4 h-3 bg-gray-600 rounded-sm mr-2 flex-shrink-0" />
                      )}
                      <span className="text-white font-mono text-[11px] truncate">{country.country}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="font-mono text-[11px] font-semibold text-blue-400 w-8 text-right">
                        {country.count}
                      </span>
                      <span className="text-white/40 font-mono text-[10px] w-12 text-right">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-3 py-2.5 border-t border-white/10 bg-black/40">
              <div className="flex justify-between">
                <div>
                  <div className="text-white/40 text-[9px] uppercase">Total Nodes</div>
                  <div className="text-blue-400 text-sm font-mono font-bold">{totalNodes}</div>
                </div>
                <div className="text-right">
                  <div className="text-white/40 text-[9px] uppercase">Top Country</div>
                  <div className="text-blue-400 text-sm font-mono font-bold">{countryStats[0]?.country || 'N/A'}</div>
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
