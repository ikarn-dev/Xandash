'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Globe, ArrowRight, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CopyBtn as CopyButton } from '@/components/ui/CopyBtn';
import { getLocationsForIPs, extractIPFromAddress, getCountryFlagUrl } from '@/libs/services/geolocation';
import { usePrefetchProfile } from '@/libs/hooks/usePrefetchProfile';
import { toast } from 'sonner';

interface LocationData {
  country: string;
  country_code: string;
  city: string;
  region: string;
  provider: string;
  ip: string;
}

interface ValidatorData {
  pubkey: string;
  address: string;
  status: string;
  uptime: number;
  storage_committed: number;
  storage_used: number;
  storage_usage_percent: number;
  version: string;
  rpc_port: number;
  is_public: boolean;
  last_seen_timestamp: number;
  duplicateCount?: number;
}

interface PodCredit {
  pod_id: string;
  credits: number;
}

export const DashboardNodesCard: React.FC = () => {
  const [nodes, setNodes] = useState<ValidatorData[]>([]);
  const [locations, setLocations] = useState<{ [ip: string]: LocationData | null }>({});
  const [credits, setCredits] = useState<{ [pubkey: string]: number | null }>({});
  const [loading, setLoading] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dataFetchTime, setDataFetchTime] = useState<number>(Math.floor(Date.now() / 1000));
  const [clickedNodeId, setClickedNodeId] = useState<string | null>(null);
  const router = useRouter();
  const { prefetchProfile, navigateToProfile } = usePrefetchProfile();

  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch nodes data
  useEffect(() => {
    const fetchNodes = async () => {
      try {
        setLoading(true);
        // Add cache buster and no-cache headers
        const response = await fetch(`/api/nodes?includeAll=true&_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch nodes: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        
        // Store server timestamp for consistent time calculation
        if (data.serverTimestamp) {
          setDataFetchTime(data.serverTimestamp);
        }
        
        const allNodes = data.nodes || [];
        // Sort by last seen (most recent first) and take first 20
        const sortedNodes = allNodes
          .sort((a: ValidatorData, b: ValidatorData) => b.last_seen_timestamp - a.last_seen_timestamp)
          .slice(0, 20);
        
        setNodes(sortedNodes);
      } catch (error) {
        console.error('Failed to fetch nodes:', error);
        toast.error('Failed to load pNodes data');
      } finally {
        setLoading(false);
      }
    };

    fetchNodes();
  }, []);

  // Load geolocation data
  useEffect(() => {
    const loadGeolocationData = async () => {
      if (nodes.length === 0) return;
      
      setLoadingLocations(true);
      try {
        const uniqueIPs = Array.from(new Set(
          nodes
            .map(node => extractIPFromAddress(node.address || ''))
            .filter(ip => ip && !locations[ip])
        ));
        
        if (uniqueIPs.length > 0) {
          const newLocations = await getLocationsForIPs(uniqueIPs);
          setLocations(prev => ({ ...prev, ...newLocations }));
        }
      } catch (error) {
        console.error('Failed to load geolocation data:', error);
      } finally {
        setLoadingLocations(false);
      }
    };

    loadGeolocationData();
  }, [nodes]);

  // Fetch credits for nodes
  useEffect(() => {
    const fetchCredits = async () => {
      if (nodes.length === 0) return;
      
      try {
        const response = await fetch('/api/pod-credits');
        if (response.ok) {
          const data = await response.json();
          if (data.pods_credits && Array.isArray(data.pods_credits)) {
            const creditsMap: { [pubkey: string]: number } = {};
            data.pods_credits.forEach((pod: PodCredit) => {
              creditsMap[pod.pod_id] = pod.credits;
            });
            setCredits(creditsMap);
          }
        }
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      }
    };
    
    fetchCredits();
  }, [nodes]);

  // Prefetch visible nodes after loading
  useEffect(() => {
    if (nodes.length > 0 && !loading) {
      // Prefetch first 5 nodes after a short delay
      setTimeout(() => {
        nodes.slice(0, 5).forEach(node => {
          const ip = extractIPFromAddress(node.address || '');
          if (ip) {
            prefetchProfile(ip);
          }
        });
      }, 1000);
    }
  }, [nodes, loading, prefetchProfile]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  const handleSeeMore = () => {
    router.push('/nodes');
  };

  const exportToCSV = () => {
    const headers = ['Location', 'IP', 'Country', 'City', 'Pubkey', 'Public', 'Storage (GB)', 'Usage %', 'Version', 'Uptime', 'Last Seen', 'Credits', 'Status'];
    
    const rows = nodes.map(node => {
      const ip = extractIPFromAddress(node.address || '');
      const location = locations[ip];
      const nodeCredits = node.pubkey ? credits[node.pubkey] : null;
      
      const now = Math.floor(Date.now() / 1000);
      const timeDiff = now - node.last_seen_timestamp;
      // Simplified status logic - only last seen matters
      const isOnline = timeDiff < 1800; // Less than 30 minutes = online
      
      const storageGB = node.storage_committed ? (node.storage_committed / (1024**3)).toFixed(1) : '0';
      const usagePercent = node.storage_usage_percent ? (node.storage_usage_percent * 100).toFixed(4) : '0.0000';
      const uptimeHours = Math.floor(node.uptime / 3600);
      const uptimeDays = Math.floor(uptimeHours / 24);
      const uptimeDisplay = uptimeDays > 0 ? `${uptimeDays}d` : `${uptimeHours}h`;
      
      let lastSeenDisplay = '';
      if (timeDiff < 60) lastSeenDisplay = `${timeDiff}s`;
      else if (timeDiff < 3600) lastSeenDisplay = `${Math.floor(timeDiff / 60)}m`;
      else if (timeDiff < 86400) lastSeenDisplay = `${Math.floor(timeDiff / 3600)}h`;
      else lastSeenDisplay = `${Math.floor(timeDiff / 86400)}d`;
      
      return [
        location ? `${location.city}, ${location.country}` : 'Unknown',
        ip || 'Unknown',
        location?.country || 'Unknown',
        location?.city || 'Unknown',
        node.pubkey || 'Unknown',
        node.is_public ? 'YES' : 'NO',
        storageGB,
        usagePercent,
        node.version || 'Unknown',
        uptimeDisplay,
        lastSeenDisplay,
        nodeCredits !== null && nodeCredits !== undefined ? nodeCredits.toString() : '0',
        isOnline ? 'ACTIVE' : 'OFFLINE'
      ];
    });
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pnodes-recent-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success(`Exported ${nodes.length} pNodes to CSV`);
  };

  if (loading) {
    return (
      <div className="relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300">
        {/* Corner edges */}
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

        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-white/60 text-sm">Loading pNodes...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden">
      {/* Corner edges */}
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

      {/* Header */}
      <div className="flex items-center justify-between mb-4 animate-blur-reveal-item-1">
        <h3 className="text-white text-lg font-semibold">Recent pNodes</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportToCSV}
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 transition-colors text-sm font-medium cursor-pointer flex items-center space-x-1"
            title="Export to CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={handleSeeMore}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 transition-colors text-sm font-medium cursor-pointer"
          >
            See More
          </button>
        </div>
      </div>

      {/* Table Container with dark background */}
      <div 
        className="bg-black/20 rounded-lg overflow-x-auto"
        style={{
          scrollbarWidth: 'none', /* Firefox */
          msOverflowStyle: 'none', /* IE and Edge */
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none; /* Chrome, Safari, Opera */
          }
        `}</style>
        <table className="w-full min-w-[900px]">
          {/* Table Header */}
          <thead>
            <tr className="bg-black/40 border-b border-gray-800/50">
              <th className="text-left px-6 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                Location
              </th>
              <th className="text-left px-4 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                Pubkey
              </th>
              <th className="text-center px-4 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                Public
              </th>
              <th className="text-center px-4 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                Storage
              </th>
              <th className="text-center px-4 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                Usage %
              </th>
              <th className="text-center px-4 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                Version
              </th>
              <th className="text-center px-4 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                Uptime
              </th>
              <th className="text-center px-4 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                Last Seen
              </th>
              <th className="text-center px-4 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                Credits
              </th>
              <th className="text-center px-4 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {nodes.map((node, index) => {
              // Use dataFetchTime for consistent status calculation
              // Online: last seen < 30 minutes
              // Syncing: last seen 30-60 minutes
              // Offline: last seen > 60 minutes
              const timeDiff = dataFetchTime - node.last_seen_timestamp;
              let calculatedStatus: 'online' | 'maintenance' | 'offline';
              
              if (timeDiff < 1800) calculatedStatus = 'online';        // Less than 30 minutes = online
              else if (timeDiff < 3600) calculatedStatus = 'maintenance'; // 30-60 minutes = syncing
              else calculatedStatus = 'offline';                       // More than 60 minutes = offline
              
              const isOnline = calculatedStatus === 'online';
              
              // Format storage committed
              const storageCommittedGB = node.storage_committed ? 
                (node.storage_committed / (1024**3)).toFixed(1) : '0';
              
              // Format storage used
              const storageUsedMB = node.storage_used ? 
                (node.storage_used / (1024**2)).toFixed(1) : '0';
              
              // Format usage percentage
              const usagePercent = node.storage_usage_percent ? 
                (node.storage_usage_percent * 100).toFixed(4) : '0.0000';
              
              // Calculate uptime display
              const uptimeHours = Math.floor(node.uptime / 3600);
              const uptimeDays = Math.floor(uptimeHours / 24);
              const uptimeDisplay = uptimeDays > 0 ? `${uptimeDays}d` : `${uptimeHours}h`;

              // Format last seen timestamp with color classes
              // Use dataFetchTime for consistent calculation
              let lastSeenDisplay = '';
              let lastSeenClass = 'text-gray-400';
              if (mounted) {
                const timeDiff = dataFetchTime - node.last_seen_timestamp;
                if (timeDiff < 60) {
                  lastSeenDisplay = `${Math.max(0, timeDiff)}s`;
                  lastSeenClass = 'text-emerald-400'; // fresh
                } else if (timeDiff < 3600) {
                  lastSeenDisplay = `${Math.floor(timeDiff / 60)}m`;
                  lastSeenClass = 'text-green-400'; // recent
                } else if (timeDiff < 86400) {
                  lastSeenDisplay = `${Math.floor(timeDiff / 3600)}h`;
                  lastSeenClass = 'text-amber-400'; // stale
                } else if (timeDiff < 604800) {
                  lastSeenDisplay = `${Math.floor(timeDiff / 86400)}d`;
                  lastSeenClass = 'text-orange-400'; // very stale
                } else {
                  lastSeenDisplay = `${Math.floor(timeDiff / 604800)}w`;
                  lastSeenClass = 'text-red-400'; // very old
                }
              } else {
                lastSeenDisplay = '--';
              }

              return (
                <tr 
                  key={`${node.pubkey}-${index}`}
                  className={`hover:bg-white/10 transition-colors duration-200 border-b border-gray-800/30 last:border-b-0 cursor-pointer animate-blur-reveal-row animate-blur-reveal-row-${Math.min(index + 1, 10)} ${
                    clickedNodeId === `${node.pubkey}-${index}` ? 'bg-cyan-500/20 animate-pulse' : ''
                  }`}
                  onMouseEnter={() => {
                    const ip = extractIPFromAddress(node.address || '');
                    if (ip) prefetchProfile(ip);
                  }}
                  onClick={() => {
                    const ip = extractIPFromAddress(node.address || '');
                    if (ip) {
                      const nodeId = `${node.pubkey}-${index}`;
                      setClickedNodeId(nodeId);
                      // Show immediate feedback
                      toast.loading('Loading node profile...', { 
                        duration: 5000,
                        id: 'node-profile-loading'
                      });
                      navigateToProfile(ip);
                      // Clear clicked state after navigation
                      setTimeout(() => setClickedNodeId(null), 2000);
                    }
                  }}
                >
                  {/* Location */}
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      {(() => {
                        const ip = extractIPFromAddress(node.address || '');
                        const location = locations[ip];
                        
                        if (loadingLocations && !location) {
                          return (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-3 bg-gray-600 animate-pulse rounded"></div>
                              <span className="text-gray-400 text-sm animate-pulse">Loading...</span>
                            </div>
                          );
                        }
                        
                        if (!location) {
                          return (
                            <div className="flex items-center space-x-2">
                              <Globe className="w-4 h-4 text-gray-500" />
                              <div className="flex flex-col text-left">
                                <span className="text-gray-400 text-sm">Unknown</span>
                                <span className="text-gray-500 text-xs font-mono">
                                  {node.address ? 
                                    (node.address.endsWith(':9001') ? 
                                      node.address.replace(':9001', '') : 
                                      node.address
                                    ) : 'Unknown'
                                  }
                                </span>
                              </div>
                            </div>
                          );
                        }
                        
                        return (
                          <div className="flex items-center space-x-2">
                            {location.country_code && (
                              <img 
                                src={getCountryFlagUrl(location.country_code)}
                                alt={location.country}
                                className="w-6 h-4 object-cover rounded-sm shadow-sm"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            )}
                            <div className="flex flex-col text-left">
                              <span className="text-white text-sm font-medium">
                                {location.city !== 'Unknown' ? location.city : location.country}
                              </span>
                              <div className="flex flex-col text-xs">
                                {location.city !== 'Unknown' && (
                                  <span className="text-gray-400">
                                    {location.country}
                                  </span>
                                )}
                                <span className="text-gray-500 font-mono">
                                  {node.address ? 
                                    (node.address.endsWith(':9001') ? 
                                      node.address.replace(':9001', '') : 
                                      node.address
                                    ) : 'Unknown'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                      {node.duplicateCount && node.duplicateCount > 0 && (
                        <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-bold border border-yellow-500/30">
                          +{node.duplicateCount} DUP
                        </div>
                      )}
                      <CopyButton
                        text={node.address || ''} 
                        onCopy={copyToClipboard}
                        type="Address"
                      />
                    </div>
                  </td>

                  {/* Pubkey */}
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-mono text-sm">
                        {node.pubkey ? `${node.pubkey.substring(0, 4)}...${node.pubkey.substring(node.pubkey.length - 4)}` : 'Unknown'}
                      </span>
                      <CopyButton 
                        text={node.pubkey || ''} 
                        onCopy={copyToClipboard}
                        type="Pubkey"
                      />
                    </div>
                  </td>

                  {/* Public */}
                  <td className="px-4 py-4 text-center">
                    <span className={`font-mono text-sm font-bold ${node.is_public ? 'text-green-400' : 'text-gray-400'}`}>
                      {node.is_public ? 'YES' : 'NO'}
                    </span>
                  </td>

                  {/* Storage Committed */}
                  <td className="px-4 py-4 text-center">
                    <span className="text-orange-400 font-mono text-sm font-bold">
                      {storageCommittedGB}GB
                    </span>
                  </td>

                  {/* Usage % */}
                  <td className="px-4 py-4 text-center">
                    <span className="text-green-400 font-mono text-sm font-bold">
                      {usagePercent}%
                    </span>
                  </td>

                  {/* Version */}
                  <td className="px-4 py-4 text-center">
                    <span 
                      className="text-gray-400 font-mono text-sm block max-w-[80px] truncate mx-auto" 
                      title={node.version || 'Unknown'}
                    >
                      {node.version ? (node.version.length > 10 ? node.version.substring(0, 10) + '...' : node.version) : 'Unknown'}
                    </span>
                  </td>

                  {/* Uptime */}
                  <td className="px-4 py-4 text-center">
                    <span className="text-gray-400 font-mono text-sm">
                      {uptimeDisplay}
                    </span>
                  </td>

                  {/* Last Seen */}
                  <td className="px-4 py-4 text-center">
                    <span className={`${lastSeenClass} font-mono text-sm`}>
                      {lastSeenDisplay}
                    </span>
                  </td>

                  {/* Credits */}
                  <td className="px-4 py-4 text-center">
                    {(() => {
                      const nodeCredits = node.pubkey ? credits[node.pubkey] : undefined;
                      
                      if (nodeCredits === undefined) {
                        return (
                          <span className="text-gray-600 text-xs animate-pulse">
                            <span className="inline-block w-8 h-4 bg-gray-700 rounded"></span>
                          </span>
                        );
                      }
                      if (nodeCredits === null || nodeCredits === 0) {
                        return <span className="text-gray-500 font-mono text-sm">0</span>;
                      }
                      
                      return (
                        <span className="text-cyan-400 font-mono text-sm font-bold">
                          {nodeCredits.toLocaleString()}
                        </span>
                      );
                    })()}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4 text-center">
                    <span className={`font-mono text-sm font-bold uppercase ${
                      isOnline ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {isOnline ? 'ACTIVE' : 'OFFLINE'}
                    </span>
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