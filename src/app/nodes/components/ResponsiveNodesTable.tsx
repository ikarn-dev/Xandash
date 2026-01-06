'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { CopyBtn } from '@/components/ui/CopyBtn';
import type { ValidatorData } from '@/libs/server';

interface LocationData {
  country: string;
  country_code: string;
  city: string;
  region: string;
  provider: string;
  ip: string;
}

interface ResponsiveNodesTableProps {
  validators: ValidatorData[];
  locations: Record<string, LocationData | null>;
  credits: Record<string, number | null>;
  dataFetchTime: number;
  clickedNodeId: string | null;
  shouldAnimate: (index: number) => boolean;
  onNavigate: (address: string, nodeId: string) => void;
  onPrefetch: (address: string) => void;
  onCopy: (text: string, type: string) => void;
  extractIP: (address: string) => string;
  formatLocation: (location: LocationData | null) => string;
  getCountryFlagUrl: (countryCode: string) => string;
  getSortIcon: (column: string) => React.ReactNode;
  handleSort: (column: string) => void;
  sortBy: string;
}

export const ResponsiveNodesTable: React.FC<ResponsiveNodesTableProps> = ({
  validators,
  locations,
  credits,
  dataFetchTime,
  clickedNodeId,
  shouldAnimate,
  onNavigate,
  onPrefetch,
  onCopy,
  extractIP,
  formatLocation,
  getCountryFlagUrl,
  getSortIcon,
  handleSort,
}) => {
  return (
    <div className="w-full bg-black border border-white/10 rounded-lg overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full min-w-[900px]">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              <th 
                className="w-[15%] px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                onClick={() => handleSort('address')}
              >
                Location {getSortIcon('address')}
              </th>
              <th 
                className="w-[12%] px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                onClick={() => handleSort('address')}
              >
                IP Address {getSortIcon('address')}
              </th>
              <th 
                className="w-[18%] px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                onClick={() => handleSort('pubkey')}
              >
                Pubkey {getSortIcon('pubkey')}
              </th>
              <th 
                className="w-[7%] px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                onClick={() => handleSort('public')}
              >
                Public {getSortIcon('public')}
              </th>
              <th 
                className="w-[10%] px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                onClick={() => handleSort('storage_committed')}
              >
                Storage {getSortIcon('storage_committed')}
              </th>
              <th 
                className="w-[8%] px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                onClick={() => handleSort('version')}
              >
                Version {getSortIcon('version')}
              </th>
              <th 
                className="w-[7%] px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                onClick={() => handleSort('uptime')}
              >
                Uptime {getSortIcon('uptime')}
              </th>
              <th 
                className="w-[8%] px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                onClick={() => handleSort('last_seen')}
              >
                Last Seen {getSortIcon('last_seen')}
              </th>
              <th className="w-[8%] px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">
                Credits
              </th>
              <th 
                className="w-[7%] px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                onClick={() => handleSort('status')}
              >
                Status {getSortIcon('status')}
              </th>
            </tr>
          </thead>
          <tbody>
            {validators.map((validator, index) => {
              const ip = extractIP(validator.address || '');
              const location = locations[ip];
              const nodeCredits = validator.pubkey ? credits[validator.pubkey] : null;
              const nodeId = `${validator.pubkey}-${validator.address}`;
              const animate = shouldAnimate(index);
              
              const timeDiff = dataFetchTime - validator.last_seen_timestamp;
              const isOnline = timeDiff < 1800;
              const isSyncing = timeDiff >= 1800 && timeDiff < 3600;
              
              let lastSeenDisplay = '';
              if (timeDiff < 60) lastSeenDisplay = `${timeDiff}s`;
              else if (timeDiff < 3600) lastSeenDisplay = `${Math.floor(timeDiff / 60)}m`;
              else if (timeDiff < 86400) lastSeenDisplay = `${Math.floor(timeDiff / 3600)}h`;
              else lastSeenDisplay = `${Math.floor(timeDiff / 86400)}d`;
              
              const storageGB = validator.storage_committed ? (validator.storage_committed / (1024**3)).toFixed(1) : '0';
              const usagePercent = validator.storage_usage_percent ? (validator.storage_usage_percent * 100).toFixed(2) : '0.00';
              
              const uptimeHours = Math.floor(validator.uptime / 3600);
              const uptimeDays = Math.floor(uptimeHours / 24);
              const uptimeDisplay = uptimeDays > 0 ? `${uptimeDays}d` : `${uptimeHours}h`;

              return (
                <tr
                  key={nodeId}
                  className={`border-b border-white/5 hover:bg-white/5 transition-all duration-200 cursor-pointer group ${
                    clickedNodeId === nodeId ? 'bg-cyan-500/10 animate-pulse' : ''
                  } ${animate ? 'animate-blur-reveal-item' : ''}`}
                  style={animate ? { animationDelay: `${index * 50}ms` } : {}}
                  onClick={() => onNavigate(validator.address || '', nodeId)}
                  onMouseEnter={() => onPrefetch(validator.address || '')}
                >
                  {/* Location */}
                  <td className="px-3 py-3 text-xs">
                    <div className="flex items-center space-x-2 min-w-0">
                      {location?.country_code ? (
                        <img
                          src={getCountryFlagUrl(location.country_code)}
                          alt={location.country}
                          className="w-4 h-3 object-cover rounded-sm flex-shrink-0"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <Globe className="w-4 h-3 text-white/40 flex-shrink-0" />
                      )}
                      <span className="text-white/80 truncate max-w-[120px]">
                        {formatLocation(location)}
                      </span>
                    </div>
                  </td>

                  {/* IP Address */}
                  <td className="px-3 py-3 text-xs">
                    <div className="flex items-center space-x-1 min-w-0 group/cell">
                      <span className="text-white/80 font-mono truncate max-w-[100px]">
                        {ip || 'Unknown'}
                      </span>
                      {ip && <CopyBtn text={ip} type="IP" size="sm" className="opacity-0 group-hover:opacity-100 flex-shrink-0" />}
                    </div>
                  </td>

                  {/* Pubkey */}
                  <td className="px-3 py-3 text-xs">
                    <div className="flex items-center space-x-1 min-w-0 group/cell">
                      <span className="text-white/60 font-mono truncate max-w-[140px]">
                        {validator.pubkey || 'Unknown'}
                      </span>
                      {validator.pubkey && <CopyBtn text={validator.pubkey} type="Pubkey" size="sm" className="opacity-0 group-hover:opacity-100 flex-shrink-0" />}
                    </div>
                  </td>

                  {/* Public */}
                  <td className="px-3 py-3 text-xs">
                    <span className={`px-2 py-1 rounded text-xs ${
                      validator.is_public
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {validator.is_public ? 'YES' : 'NO'}
                    </span>
                  </td>

                  {/* Storage */}
                  <td className="px-3 py-3 text-xs">
                    <div className="text-white/80 font-mono">
                      <div>{storageGB} GB</div>
                      <div className="text-[10px] text-white/40">{usagePercent}%</div>
                    </div>
                  </td>

                  {/* Version */}
                  <td className="px-3 py-3 text-xs">
                    <span className="text-white/70 font-mono truncate block max-w-[70px]">
                      {validator.version || 'Unknown'}
                    </span>
                  </td>

                  {/* Uptime */}
                  <td className="px-3 py-3 text-xs">
                    <span className="text-white/70 font-mono">{uptimeDisplay}</span>
                  </td>

                  {/* Last Seen */}
                  <td className="px-3 py-3 text-xs">
                    <span className="text-white/60 font-mono">{lastSeenDisplay}</span>
                  </td>

                  {/* Credits */}
                  <td className="px-3 py-3 text-xs">
                    <span className="text-yellow-400 font-mono font-semibold">
                      {nodeCredits !== null && nodeCredits !== undefined ? nodeCredits.toLocaleString() : '0'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isOnline ? 'bg-green-400' : isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-red-400'
                      }`}></div>
                      <span className={`text-xs whitespace-nowrap ${
                        isOnline ? 'text-green-400' : isSyncing ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {isOnline ? 'Active' : isSyncing ? 'Syncing' : 'Offline'}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
