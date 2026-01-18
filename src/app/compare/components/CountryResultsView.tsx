'use client';

import { useMemo } from 'react';
import { AISummary } from '@/components/ui/AISummary';
import { CornerAccents } from '@/components/ui';

interface CountryProfile {
  country: string;
  country_code: string;
  color: string;
  totalNodes: number;
  onlineNodes: number;
  syncingNodes: number;
  offlineNodes: number;
  totalStorage: number;
  totalStorageUsed: number;
  avgUptime: number;
  onlinePercent: number;
  storageEfficiency: number;
  totalCredits: number;
}

interface CountryResultsViewProps {
  countries: CountryProfile[];
  onReset: () => void;
  network?: string;
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

const formatCredits = (credits: number) => {
  if (credits >= 1_000_000) return (credits / 1_000_000).toFixed(2) + 'M';
  if (credits >= 1_000) return (credits / 1_000).toFixed(1) + 'K';
  return credits.toLocaleString();
};

export function CountryResultsView({ countries, onReset, network = 'devnet' }: CountryResultsViewProps) {
  const isMainnet = network === 'mainnet';

  const getBest = (key: keyof CountryProfile, higherIsBetter = true) => {
    const values = countries.map(c => typeof c[key] === 'number' ? c[key] as number : 0);
    return higherIsBetter ? Math.max(...values) : Math.min(...values);
  };

  const stats = [
    { key: 'totalNodes', label: 'Total Nodes', format: (v: number) => v.toLocaleString(), best: getBest('totalNodes') },
    { key: 'totalCredits', label: 'Total Credits', format: formatCredits, best: getBest('totalCredits') },
    { key: 'onlinePercent', label: 'Online %', format: (v: number) => `${v.toFixed(1)}%`, best: getBest('onlinePercent') },
    { key: 'totalStorage', label: 'Storage', format: formatStorage, best: getBest('totalStorage') },
    { key: 'avgUptime', label: 'Avg Uptime', format: formatUptime, best: getBest('avgUptime') },
  ];

  const aiComparisonPrompt = useMemo(() => {
    if (countries.length < 2) return '';
    
    const countryDetails = countries.map((c) => {
      return `${c.country}: ${c.totalNodes} nodes (${c.onlineNodes} online/${c.syncingNodes} syncing/${c.offlineNodes} offline), ${formatCredits(c.totalCredits)} credits, ${c.onlinePercent.toFixed(1)}% uptime, ${formatStorage(c.totalStorage)} storage`;
    }).join('. ');

    return `Compare these ${countries.length} countries on the Xandeum ${isMainnet ? 'mainnet' : 'devnet'} network. ${countryDetails}. In 2-3 sentences: identify which country has the best node infrastructure and note key differences. Do not provide recommendations.`;
  }, [countries, isMainnet]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Country Comparison</h2>
          <p className="text-xs text-white/40">{countries.length} countries analyzed</p>
        </div>
        <button onClick={onReset} className="px-4 py-2 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
          New Comparison
        </button>
      </div>

      {/* Country Cards */}
      <div className={`grid gap-4 ${countries.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : countries.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {countries.map((country) => {
          const isWinner = (key: string) => {
            const stat = stats.find(s => s.key === key);
            return stat && (country[key as keyof CountryProfile] as number) === stat.best && countries.length > 1;
          };
          
          return (
            <div key={country.country_code} className="relative bg-black border border-white/10 p-4 overflow-hidden" style={{ borderColor: `${country.color}30` }}>
              <CornerAccents />
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: country.color, opacity: 0.6 }} />
              
              {/* Header with flag */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: country.color }} />
                {country.country_code && (
                  <img 
                    src={`https://flagcdn.com/32x24/${country.country_code.toLowerCase()}.png`}
                    alt=""
                    className="w-8 h-6 object-cover rounded-sm"
                  />
                )}
                <span className="font-medium text-sm text-white">{country.country}</span>
              </div>

              {/* Status breakdown */}
              <div className="grid grid-cols-3 gap-2 mb-4 p-2 bg-white/5 border border-white/5">
                <div className="text-center">
                  <div className="text-emerald-400 font-mono text-sm font-bold">{country.onlineNodes}</div>
                  <div className="text-[9px] text-white/40">Online</div>
                </div>
                <div className="text-center">
                  <div className="text-amber-400 font-mono text-sm font-bold">{country.syncingNodes}</div>
                  <div className="text-[9px] text-white/40">Syncing</div>
                </div>
                <div className="text-center">
                  <div className="text-red-400 font-mono text-sm font-bold">{country.offlineNodes}</div>
                  <div className="text-[9px] text-white/40">Offline</div>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                {stats.map(stat => {
                  const value = country[stat.key as keyof CountryProfile] as number;
                  const winner = isWinner(stat.key);
                  return (
                    <div key={stat.key} className="flex items-center justify-between">
                      <span className="text-xs text-white/50">{stat.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono text-sm ${winner ? 'text-emerald-400 font-medium' : 'text-white'}`}>{stat.format(value)}</span>
                        {winner && <span className="text-[8px] px-1 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">BEST</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Comparison Table */}
      <div className="relative bg-black border border-white/10 overflow-hidden">
        <CornerAccents />
        <div className="p-4 border-b border-white/10">
          <h3 className="text-sm font-medium text-white">Detailed Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left py-3 px-4 text-white/40 text-xs font-medium">Parameter</th>
                {countries.map(country => (
                  <th key={country.country_code} className="text-center py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: country.color }} />
                      {country.country_code && (
                        <img 
                          src={`https://flagcdn.com/16x12/${country.country_code.toLowerCase()}.png`}
                          alt=""
                          className="w-4 h-3 object-cover rounded-sm"
                        />
                      )}
                      <span className="text-xs text-white">{country.country}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Total Nodes', getValue: (c: CountryProfile) => c.totalNodes.toLocaleString(), isBest: (c: CountryProfile) => c.totalNodes === getBest('totalNodes') },
                { label: 'Total Credits', getValue: (c: CountryProfile) => formatCredits(c.totalCredits), isBest: (c: CountryProfile) => c.totalCredits === getBest('totalCredits') },
                { label: 'Online Nodes', getValue: (c: CountryProfile) => c.onlineNodes.toLocaleString(), isBest: (c: CountryProfile) => c.onlineNodes === getBest('onlineNodes') },
                { label: 'Syncing Nodes', getValue: (c: CountryProfile) => c.syncingNodes.toLocaleString() },
                { label: 'Offline Nodes', getValue: (c: CountryProfile) => c.offlineNodes.toLocaleString(), isBest: (c: CountryProfile) => c.offlineNodes === getBest('offlineNodes', false) },
                { label: 'Online %', getValue: (c: CountryProfile) => `${c.onlinePercent.toFixed(1)}%`, isBest: (c: CountryProfile) => c.onlinePercent === getBest('onlinePercent') },
                { label: 'Total Storage', getValue: (c: CountryProfile) => formatStorage(c.totalStorage), isBest: (c: CountryProfile) => c.totalStorage === getBest('totalStorage') },
                { label: 'Storage Used', getValue: (c: CountryProfile) => formatStorage(c.totalStorageUsed), isBest: (c: CountryProfile) => c.totalStorageUsed === getBest('totalStorageUsed') },
                { label: 'Storage Efficiency', getValue: (c: CountryProfile) => `${c.storageEfficiency.toFixed(1)}%`, isBest: (c: CountryProfile) => c.storageEfficiency === getBest('storageEfficiency') },
                { label: 'Avg Uptime', getValue: (c: CountryProfile) => formatUptime(c.avgUptime), isBest: (c: CountryProfile) => c.avgUptime === getBest('avgUptime') },
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 text-white/60 text-sm">{row.label}</td>
                  {countries.map(country => {
                    const isBest = row.isBest?.(country) && countries.length > 1;
                    return (
                      <td key={country.country_code} className="py-3 px-4 text-center">
                        <span className={`font-mono text-sm ${isBest ? 'text-emerald-400 font-medium' : 'text-white'}`}>{row.getValue(country)}</span>
                        {isBest && <span className="ml-1 text-emerald-400">★</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Comparison Bars */}
      <div className="relative bg-black border border-white/10 p-4 sm:p-6">
        <CornerAccents />
        <h3 className="text-sm font-medium text-white mb-4">Visual Comparison</h3>
        <div className="space-y-6">
          {/* Credits Distribution */}
          <div>
            <div className="text-xs text-white/50 mb-2">Credits Earned</div>
            <div className="space-y-2">
              {countries.map(country => {
                const maxCredits = getBest('totalCredits');
                const widthPercent = maxCredits > 0 ? (country.totalCredits / maxCredits) * 100 : 0;
                return (
                  <div key={country.country_code} className="flex items-center gap-3">
                    <div className="w-20 sm:w-24 flex items-center gap-2">
                      {country.country_code && (
                        <img 
                          src={`https://flagcdn.com/16x12/${country.country_code.toLowerCase()}.png`}
                          alt=""
                          className="w-4 h-3 object-cover rounded-sm flex-shrink-0"
                        />
                      )}
                      <span className="text-xs text-white/70 truncate">{country.country}</span>
                    </div>
                    <div className="flex-1 h-6 bg-white/5 overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ 
                          width: `${Math.max(widthPercent, 5)}%`, 
                          backgroundColor: country.color,
                          minWidth: '50px'
                        }}
                      >
                        <span className="text-[10px] text-white font-mono font-bold">{formatCredits(country.totalCredits)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nodes Distribution */}
          <div>
            <div className="text-xs text-white/50 mb-2">Node Distribution</div>
            <div className="space-y-2">
              {countries.map(country => {
                const maxNodes = getBest('totalNodes');
                const widthPercent = maxNodes > 0 ? (country.totalNodes / maxNodes) * 100 : 0;
                return (
                  <div key={country.country_code} className="flex items-center gap-3">
                    <div className="w-20 sm:w-24 flex items-center gap-2">
                      {country.country_code && (
                        <img 
                          src={`https://flagcdn.com/16x12/${country.country_code.toLowerCase()}.png`}
                          alt=""
                          className="w-4 h-3 object-cover rounded-sm flex-shrink-0"
                        />
                      )}
                      <span className="text-xs text-white/70 truncate">{country.country}</span>
                    </div>
                    <div className="flex-1 h-6 bg-white/5 overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ 
                          width: `${Math.max(widthPercent, 5)}%`, 
                          backgroundColor: country.color,
                          minWidth: '40px'
                        }}
                      >
                        <span className="text-[10px] text-white font-mono font-bold">{country.totalNodes}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Online Percentage */}
          <div>
            <div className="text-xs text-white/50 mb-2">Online Percentage</div>
            <div className="space-y-2">
              {countries.map(country => (
                <div key={country.country_code} className="flex items-center gap-3">
                  <div className="w-20 sm:w-24 flex items-center gap-2">
                    {country.country_code && (
                      <img 
                        src={`https://flagcdn.com/16x12/${country.country_code.toLowerCase()}.png`}
                        alt=""
                        className="w-4 h-3 object-cover rounded-sm flex-shrink-0"
                      />
                    )}
                    <span className="text-xs text-white/70 truncate">{country.country}</span>
                  </div>
                  <div className="flex-1 h-6 bg-white/5 overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ 
                        width: `${Math.max(country.onlinePercent, 5)}%`, 
                        backgroundColor: country.onlinePercent >= 80 ? '#10b981' : country.onlinePercent >= 50 ? '#f59e0b' : '#ef4444',
                        minWidth: '40px'
                      }}
                    >
                      <span className="text-[10px] text-white font-mono font-bold">{country.onlinePercent.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Storage */}
          <div>
            <div className="text-xs text-white/50 mb-2">Total Storage</div>
            <div className="space-y-2">
              {countries.map(country => {
                const maxStorage = getBest('totalStorage');
                const widthPercent = maxStorage > 0 ? (country.totalStorage / maxStorage) * 100 : 0;
                return (
                  <div key={country.country_code} className="flex items-center gap-3">
                    <div className="w-20 sm:w-24 flex items-center gap-2">
                      {country.country_code && (
                        <img 
                          src={`https://flagcdn.com/16x12/${country.country_code.toLowerCase()}.png`}
                          alt=""
                          className="w-4 h-3 object-cover rounded-sm flex-shrink-0"
                        />
                      )}
                      <span className="text-xs text-white/70 truncate">{country.country}</span>
                    </div>
                    <div className="flex-1 h-6 bg-white/5 overflow-hidden">
                      <div 
                        className="h-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ 
                          width: `${Math.max(widthPercent, 5)}%`, 
                          backgroundColor: country.color,
                          minWidth: '60px'
                        }}
                      >
                        <span className="text-[10px] text-white font-mono font-bold">{formatStorage(country.totalStorage)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {aiComparisonPrompt && <AISummary prompt={aiComparisonPrompt} title="Country Comparison Analysis" autoLoad={true} network={isMainnet ? 'mainnet' : 'devnet'} />}
    </div>
  );
}
