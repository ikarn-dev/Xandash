'use client';

import { useState, useMemo } from 'react';

interface CountryData {
  country: string;
  country_code: string;
  totalNodes: number;
  onlineNodes: number;
  syncingNodes: number;
  offlineNodes: number;
  totalStorage: number;
  totalStorageUsed: number;
  avgUptime: number;
  totalCredits: number;
}

interface CountrySelectorProps {
  countries: CountryData[];
  selectedCountries: string[];
  onToggle: (countryCode: string) => void;
  maxCountries?: number;
  isLoading?: boolean;
}

const formatCredits = (credits: number) => {
  if (credits >= 1_000_000) return (credits / 1_000_000).toFixed(2) + 'M';
  if (credits >= 1_000) return (credits / 1_000).toFixed(1) + 'K';
  return credits.toLocaleString();
};

const formatStorage = (bytes: number) => {
  if (bytes >= 1024 ** 4) return (bytes / 1024 ** 4).toFixed(1) + ' TB';
  if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(1) + ' GB';
  if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(0) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
};

const formatUptime = (seconds: number) => {
  if (!seconds || seconds <= 0) return '0h';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d`;
  return `${hours}h`;
};

const COUNTRY_COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b'];

export function CountrySelector({
  countries,
  selectedCountries,
  onToggle,
  maxCountries = 4,
  isLoading = false
}: CountrySelectorProps) {
  const [search, setSearch] = useState('');

  const filteredCountries = useMemo(() => {
    // Countries are already sorted alphabetically from the parent
    if (!search.trim()) return countries.slice(0, 50);
    const query = search.toLowerCase();
    return countries
      .filter(c =>
        c.country.toLowerCase().includes(query) ||
        c.country_code?.toLowerCase().includes(query)
      )
      .slice(0, 50);
  }, [countries, search]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by country name..."
          className="w-full pl-10 pr-4 py-2.5 bg-black border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30">
          {selectedCountries.length}/{maxCountries}
        </div>
      </div>

      {/* Selected Chips */}
      {selectedCountries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCountries.map((code, index) => {
            const country = countries.find(c => c.country_code === code);
            return (
              <div
                key={code}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  backgroundColor: `${COUNTRY_COLORS[index % COUNTRY_COLORS.length]}15`,
                  borderColor: `${COUNTRY_COLORS[index % COUNTRY_COLORS.length]}50`,
                  color: COUNTRY_COLORS[index % COUNTRY_COLORS.length],
                  border: '1px solid'
                }}
              >
                {country?.country_code && (
                  <img
                    src={`https://flagcdn.com/16x12/${country.country_code.toLowerCase()}.png`}
                    alt=""
                    className="w-4 h-3 object-cover rounded-sm"
                  />
                )}
                <span>{country?.country || code}</span>
                <button
                  onClick={() => onToggle(code)}
                  className="ml-1 hover:opacity-70 transition-opacity"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Country List */}
      <div className="max-h-[280px] overflow-y-auto border border-white/10 bg-black" style={{ scrollbarWidth: 'none' }}>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
            <span className="text-white/40 text-xs">Loading countries...</span>
          </div>
        ) : filteredCountries.length === 0 ? (
          <div className="p-8 text-center text-white/40 text-sm">No countries found</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredCountries.map((country) => {
              const isSelected = selectedCountries.includes(country.country_code);
              const selectedIndex = selectedCountries.indexOf(country.country_code);
              const canSelect = selectedCountries.length < maxCountries || isSelected;

              return (
                <button
                  key={country.country_code}
                  onClick={() => canSelect && onToggle(country.country_code)}
                  disabled={!canSelect}
                  className={`w-full flex items-center justify-between p-3 transition-all ${isSelected
                      ? 'bg-white/5'
                      : canSelect
                        ? 'hover:bg-white/5'
                        : 'opacity-40 cursor-not-allowed'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 border-2 flex items-center justify-center transition-all ${isSelected
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-white/20'
                        }`}
                      style={isSelected ? {
                        backgroundColor: COUNTRY_COLORS[selectedIndex % COUNTRY_COLORS.length],
                        borderColor: COUNTRY_COLORS[selectedIndex % COUNTRY_COLORS.length]
                      } : {}}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {country.country_code && (
                        <img
                          src={`https://flagcdn.com/24x18/${country.country_code.toLowerCase()}.png`}
                          alt=""
                          className="w-6 h-4 object-cover rounded-sm"
                        />
                      )}
                      <div className="text-left">
                        <span className="text-sm text-white">{country.country}</span>
                        <div className="text-[10px] text-white/30">
                          {country.totalNodes} nodes • {country.onlineNodes} online
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-blue-400 font-mono">
                        {formatUptime(country.avgUptime)}
                      </span>
                      <div className="text-[10px] text-white/30">uptime</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-purple-400 font-mono whitespace-nowrap">
                        {formatStorage(country.totalStorage)}
                      </span>
                      <div className="text-[10px] text-white/30">storage</div>
                    </div>
                    <div className="text-right min-w-[50px]">
                      <span className="text-xs text-emerald-400 font-mono">
                        {formatCredits(country.totalCredits)}
                      </span>
                      <div className="text-[10px] text-white/30">credits</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-[10px] text-white/30 text-center">
        {filteredCountries.length} countries available • Select up to {maxCountries} to compare
      </div>
    </div>
  );
}
