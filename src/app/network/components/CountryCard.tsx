'use client';

import { useRouter } from 'next/navigation';
import { CornerAccents } from '@/components/ui';
import type { CountryDetailedStats } from '../hooks/useNetworkPageData';

interface CountryCardProps {
  country: CountryDetailedStats;
  isSelected?: boolean;
  canSelect?: boolean;
  onToggleCompare?: (countryCode: string) => void;
}

const formatStorage = (bytes: number) => {
  if (bytes >= 1024 ** 4) return (bytes / 1024 ** 4).toFixed(2) + ' TB';
  if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(2) + ' GB';
  if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
};

const formatUptime = (seconds: number) => {
  if (!seconds || seconds <= 0) return '0h';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
};

export function CountryCard({ country, isSelected = false, canSelect = true, onToggleCompare }: CountryCardProps) {
  const router = useRouter();
  const onlinePercent = country.totalNodes > 0 ? (country.onlineNodes / country.totalNodes) * 100 : 0;
  const totalBars = 45;
  const greenBars = Math.round((country.onlineNodes / country.totalNodes) * totalBars);
  const yellowBars = Math.round((country.syncingNodes / country.totalNodes) * totalBars);

  const profileUrl = `/country/${encodeURIComponent(country.country_code ? country.country_code.toLowerCase() : 'unknown')}`;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleCompare && country.country_code) {
      onToggleCompare(country.country_code);
    }
  };

  return (
    <div 
      onClick={() => router.push(profileUrl)}
      className={`relative bg-black border p-3 sm:p-4 md:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden cursor-pointer ${
        isSelected ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/10'
      }`}
    >
      <CornerAccents />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10">
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Compare Checkbox */}
          {onToggleCompare && (
            <button
              onClick={handleCheckboxClick}
              disabled={!canSelect && !isSelected}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                isSelected 
                  ? 'border-purple-500 bg-purple-500' 
                  : canSelect 
                    ? 'border-white/20 hover:border-purple-500/50' 
                    : 'border-white/10 opacity-40 cursor-not-allowed'
              }`}
            >
              {isSelected && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          )}
          {country.country_code ? (
            <img 
              src={`${process.env.NEXT_PUBLIC_FLAG_CDN_URL || 'https://flagcdn.com'}/24x18/${country.country_code.toLowerCase()}.png`}
              alt={country.country}
              className="w-5 h-3.5 sm:w-6 sm:h-4 object-cover rounded-sm"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="w-5 h-3.5 sm:w-6 sm:h-4 bg-gray-600 rounded-sm" />
          )}
          <span className="text-white font-medium text-sm sm:text-base truncate max-w-[100px] sm:max-w-none">{country.country}</span>
        </div>
        <div className="text-right">
          <div className="text-white text-xl sm:text-2xl font-bold font-mono">{country.totalNodes}</div>
          <div className="text-white/40 text-[9px] sm:text-[10px]">nodes</div>
        </div>
      </div>

      {/* Status Stats */}
      <div className="grid grid-cols-4 gap-1 sm:gap-1.5 mb-3 sm:mb-4 relative z-10">
        <div className="text-center">
          <div className="text-white/40 text-[8px] sm:text-[10px] uppercase tracking-wider mb-0.5 sm:mb-1">Online</div>
          <div className="text-green-400 text-sm sm:text-lg font-bold font-mono">{country.onlineNodes}</div>
        </div>
        <div className="text-center">
          <div className="text-white/40 text-[8px] sm:text-[10px] uppercase tracking-wider mb-0.5 sm:mb-1">Syncing</div>
          <div className="text-amber-400 text-sm sm:text-lg font-bold font-mono">{country.syncingNodes}</div>
        </div>
        <div className="text-center">
          <div className="text-white/40 text-[8px] sm:text-[10px] uppercase tracking-wider mb-0.5 sm:mb-1">Offline</div>
          <div className="text-red-400 text-sm sm:text-lg font-bold font-mono">{country.offlineNodes}</div>
        </div>
        <div className="text-center">
          <div className="text-white/40 text-[8px] sm:text-[10px] uppercase tracking-wider mb-0.5 sm:mb-1">Uptime</div>
          <div className="text-blue-400 text-sm sm:text-lg font-bold font-mono">{onlinePercent.toFixed(0)}%</div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="w-full mb-3 sm:mb-4 relative z-10">
        <svg className="w-full" height="16" viewBox="0 0 200 20" preserveAspectRatio="none">
          {Array.from({ length: totalBars }).map((_, index) => (
            <rect
              key={index}
              x={index * 4.5}
              y={0}
              width={3}
              height={20}
              rx={1}
              fill={index < greenBars ? '#10b981' : index < greenBars + yellowBars ? '#f59e0b' : '#374151'}
            />
          ))}
        </svg>
      </div>

      {/* Storage Stats */}
      <div className="space-y-1.5 sm:space-y-2 relative z-10 border-t border-white/5 pt-3 sm:pt-4">
        <div className="flex items-center justify-between">
          <span className="text-white/50 text-[10px] sm:text-xs">Total Storage</span>
          <span className="text-white font-mono text-xs sm:text-sm">{formatStorage(country.totalStorage)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/50 text-[10px] sm:text-xs">Storage Used</span>
          <span className="text-white font-mono text-xs sm:text-sm">{formatStorage(country.totalStorageUsed)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/50 text-[10px] sm:text-xs">Avg Uptime</span>
          <span className="text-white font-mono text-xs sm:text-sm">{formatUptime(country.avgUptime)}</span>
        </div>
      </div>

      {/* View Profile Badge */}
      <div className="relative z-10 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/5 flex justify-end">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium bg-white/5 border border-white/15 text-white/60 rounded group-hover:bg-white/10 group-hover:border-white/30 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all duration-300">
          View Details
          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </div>
  );
}
