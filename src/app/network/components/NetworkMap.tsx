'use client';

import { InteractiveMap, CornerAccents } from '@/components/ui';
import type { ValidatorLocation, CountryStats } from '../hooks/useNetworkPageData';

interface NetworkMapProps {
  mapValidators: ValidatorLocation[];
  countryStats: CountryStats[];
  totalNodes: number;
  isMainnet: boolean;
  loading: boolean;
  error: string | null;
}

export function NetworkMap({ mapValidators, countryStats, totalNodes, isMainnet, loading, error }: NetworkMapProps) {
  return (
    <div className="relative bg-black border border-white/10 rounded-lg overflow-hidden group hover:border-white/20 transition-all duration-300 min-h-[280px] sm:min-h-[350px] md:min-h-[450px] lg:min-h-[500px]">
      <CornerAccents />

      {/* Stats Overlay */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 md:top-6 md:left-6 z-30 space-y-2 sm:space-y-3 bg-black/60 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/10">
        <div className="text-left">
          <div className="text-white text-xl sm:text-2xl md:text-3xl font-bold font-mono">{totalNodes}</div>
          <div className="text-white/60 text-[10px] sm:text-xs md:text-sm">pNodes</div>
        </div>
        <div className="text-left">
          <div className="text-white text-lg sm:text-xl md:text-2xl font-bold font-mono">{countryStats.length}</div>
          <div className="text-white/60 text-[10px] sm:text-xs md:text-sm">Countries</div>
        </div>
      </div>

      {/* Network Badge */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-6 md:right-6 z-30 flex items-center space-x-1.5 sm:space-x-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 border border-white/10">
        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-pulse ${isMainnet ? 'bg-blue-400' : 'bg-green-400'}`}></div>
        <span className="text-white text-xs sm:text-sm font-medium">{isMainnet ? 'Mainnet' : 'Devnet'}</span>
      </div>

      {/* Top Countries */}
      {countryStats.length > 0 && (
        <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 md:bottom-6 md:left-6 z-30 bg-black/60 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/10 max-h-28 sm:max-h-40 md:max-h-48">
          <div className="text-white/80 text-[10px] sm:text-xs font-medium mb-1.5 sm:mb-2 font-mono">// TOP COUNTRIES</div>
          <div className="space-y-1 max-w-32 sm:max-w-40 md:max-w-48 max-h-16 sm:max-h-28 md:max-h-32 overflow-y-auto scrollbar-hide">
            {countryStats.slice(0, 5).map((country) => (
              <div key={country.country} className="flex items-center justify-between text-[10px] sm:text-xs">
                <div className="flex items-center space-x-1.5 sm:space-x-2 flex-1 min-w-0">
                  {country.country_code ? (
                    <img 
                      src={`${process.env.NEXT_PUBLIC_FLAG_CDN_URL || 'https://flagcdn.com'}/16x12/${country.country_code.toLowerCase()}.png`}
                      alt={country.country}
                      className="w-3 h-2 sm:w-4 sm:h-3 object-cover rounded-sm flex-shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-3 h-2 sm:w-4 sm:h-3 bg-gray-500 rounded-sm flex-shrink-0" />
                  )}
                  <span className="text-white truncate">{country.country}</span>
                </div>
                <div className="bg-white/20 text-white px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono ml-1.5 sm:ml-2 flex-shrink-0">
                  {country.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-white/60 text-sm">Loading network data...</div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
          <div className="text-center">
            <div className="text-red-400 text-sm mb-2">Failed to load network data</div>
            <div className="text-white/40 text-xs">{error}</div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="absolute inset-0 z-0">
        <InteractiveMap validators={mapValidators} className="w-full h-full" />
      </div>
    </div>
  );
}
