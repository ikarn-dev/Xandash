'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { CopyBtn } from '@/components/ui/CopyBtn';
import { ManagerBadge, NFTNamesList } from '@/components/ui';
import { getNodeName } from '@/libs/utils/node-names';
import { formatStorage } from '@/libs/utils';
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
  managerAssets: Map<string, any>;
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
  // Compare props
  selectedForCompare?: string[];
  onToggleCompare?: (pubkey: string) => void;
  // Network prop
  network?: string;
}

// Compare icon component
const CompareIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3h5v5M8 3H3v5M3 16v5h5M21 16v5h-5M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
  </svg>
);

export const ResponsiveNodesTable: React.FC<ResponsiveNodesTableProps> = ({
  validators,
  locations,
  credits,
  managerAssets,
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
  selectedForCompare = [],
  onToggleCompare,
  network = 'devnet',
}) => {
  const isMainnet = network === 'mainnet';

  return (
    <div className="w-full bg-black border border-white/10 rounded-lg overflow-hidden">
      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-white/5 border-b border-white/10">
            <tr>
              {/* Compare column */}
              {onToggleCompare && (
                <th className="w-[4%] px-2 py-3 text-center text-xs font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">
                  <CompareIcon className="w-3.5 h-3.5 mx-auto text-white/50" />
                </th>
              )}
              {/* Name column - Mainnet only */}
              {isMainnet && (
                <th className="w-[6%] px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">
                  Name
                </th>
              )}
              <th
                className="w-[12%] px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                onClick={() => handleSort('address')}
              >
                Location {getSortIcon('address')}
              </th>
              <th
                className="w-[10%] px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                onClick={() => handleSort('address')}
              >
                IP Address {getSortIcon('address')}
              </th>
              <th className="w-[12%] px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">
                Manager Assets
              </th>
              <th
                className="w-[13%] px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                onClick={() => handleSort('pubkey')}
              >
                Pubkey {getSortIcon('pubkey')}
              </th>
              <th
                className="w-[6%] px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap"
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
              <th
                className="w-[8%] px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                onClick={() => handleSort('credits')}
              >
                Credits {getSortIcon('credits')}
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
              const isSelected = selectedForCompare.includes(validator.pubkey);
              const canSelect = selectedForCompare.length < 4 || isSelected;


              const timeDiff = dataFetchTime - validator.last_seen_timestamp;
              const isOnline = timeDiff < 1800;
              const isSyncing = timeDiff >= 1800 && timeDiff < 3600;

              let lastSeenDisplay = '';
              if (timeDiff < 60) lastSeenDisplay = `${timeDiff}s`;
              else if (timeDiff < 3600) lastSeenDisplay = `${Math.floor(timeDiff / 60)}m`;
              else if (timeDiff < 86400) lastSeenDisplay = `${Math.floor(timeDiff / 3600)}h`;
              else lastSeenDisplay = `${Math.floor(timeDiff / 86400)}d`;

              const storageDisplay = formatStorage(validator.storage_committed || 0);
              const usagePercent = validator.storage_usage_percent ? (validator.storage_usage_percent * 100).toFixed(2) : '0.00';

              const uptimeHours = Math.floor(validator.uptime / 3600);
              const uptimeDays = Math.floor(uptimeHours / 24);
              const uptimeDisplay = uptimeDays > 0 ? `${uptimeDays}d` : `${uptimeHours}h`;

              return (
                <tr
                  key={nodeId}
                  className={`border-b border-white/5 hover:bg-white/5 transition-all duration-200 cursor-pointer group ${clickedNodeId === nodeId ? 'bg-cyan-500/10' : ''
                    } ${isSelected ? 'bg-emerald-500/10' : ''}`}
                  onClick={() => onNavigate(validator.address || '', nodeId)}
                  onMouseEnter={() => onPrefetch(validator.address || '')}
                >
                  {/* Compare checkbox */}
                  {onToggleCompare && (
                    <td className="px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canSelect && validator.pubkey) onToggleCompare(validator.pubkey);
                        }}
                        disabled={!canSelect && !isSelected}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : canSelect
                            ? 'border-white/30 hover:border-emerald-500/50 hover:bg-emerald-500/10'
                            : 'border-white/10 opacity-30 cursor-not-allowed'
                          }`}
                        title={isSelected ? 'Remove from compare' : canSelect ? 'Add to compare' : 'Max 4 nodes'}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 12l5 5L20 7" />
                          </svg>
                        )}
                      </button>
                    </td>
                  )}

                  {/* Name - Mainnet only */}
                  {isMainnet && (
                    <td className="px-3 py-3 text-xs">
                      <span className={`${getNodeName(validator.pubkey) !== 'N/A' ? 'text-cyan-400 font-medium' : 'text-white/30'}`}>
                        {getNodeName(validator.pubkey)}
                      </span>
                    </td>
                  )}

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
                      {ip && <CopyBtn text={ip} type="IP" size="sm" className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0" />}
                    </div>
                  </td>

                  {/* Manager Assets */}
                  <td className="px-3 py-3 text-xs" onClick={(e) => e.stopPropagation()}>
                    {validator.manager_pubkey ? (
                      (() => {
                        const assets = managerAssets.get(validator.manager_pubkey);
                        return (
                          <ManagerBadge
                            managerPubkey={validator.manager_pubkey}
                            nftCount={assets?.nft_count}
                            sbtCount={assets?.sbt_count}
                            xandBalance={assets?.xand_balance}
                            nftNames={assets?.nft_names}
                            sbtNames={assets?.sbt_names}
                            size="sm"
                          />
                        );
                      })()
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[9px] sm:text-[10px] bg-gray-500/20 text-gray-400 border border-gray-500/30 whitespace-nowrap">
                        Not Registered
                      </span>
                    )}
                  </td>

                  {/* Pubkey */}
                  <td className="px-3 py-3 text-xs">
                    <div className="flex items-center space-x-1 min-w-0 group/cell">
                      <span className="text-white/60 font-mono truncate max-w-[120px]">
                        {validator.pubkey || 'Unknown'}
                      </span>
                      {validator.pubkey && <CopyBtn text={validator.pubkey} type="Pubkey" size="sm" className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0" />}
                    </div>
                  </td>

                  {/* Public */}
                  <td className="px-3 py-3 text-xs">
                    <span className={`px-2 py-1 rounded text-xs ${validator.is_public
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-gray-500/20 text-gray-400'
                      }`}>
                      {validator.is_public ? 'YES' : 'NO'}
                    </span>
                  </td>

                  {/* Storage */}
                  <td className="px-3 py-3 text-xs">
                    <div className="text-white/80 font-mono">
                      <div>{storageDisplay}</div>
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
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-400' : isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-red-400'
                        }`}></div>
                      <span className={`text-xs whitespace-nowrap ${isOnline ? 'text-green-400' : isSyncing ? 'text-amber-400' : 'text-red-400'
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
