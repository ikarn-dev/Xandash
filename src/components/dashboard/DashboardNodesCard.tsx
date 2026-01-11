'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Globe, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CopyBtn } from '@/components/ui/CopyBtn';
import { getLocationsForIPs, extractIPFromAddress, getCountryFlagUrl } from '@/libs/services/geolocation';
import { usePrefetchProfile } from '@/libs/hooks/usePrefetchProfile';
import { toast } from 'sonner';
import { useNetwork } from '@/libs/context/network-context';
import { getNodeName, hasNodeName } from '@/libs/utils/node-names';
import { formatStorage } from '@/libs/utils';

// Compare icon
const CompareIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3h5v5M8 3H3v5M3 16v5h5M21 16v5h-5M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/>
  </svg>
);

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

interface PingResult {
  ping: number | null;
  status: 'online' | 'offline' | 'timeout';
}

interface MainnetGeoData {
  country: string;
  country_code: string;
  credits: number | null;
  geo_sort: string;
  ip: string;
  name: string;
  nfts: string[];
  ping: number | null;
  provider: string;
  stake: number;
}

const MAINNET_COOLDOWN = 30 * 1000; // 30 seconds (matches data fetch cycle)
const NATIVE_REFRESH_INTERVAL = 30 * 1000; // 30 seconds

export const DashboardNodesCard: React.FC = () => {
  const { network, isMainnet } = useNetwork();
  const [nodes, setNodes] = useState<ValidatorData[]>([]);
  const [locations, setLocations] = useState<{ [ip: string]: LocationData | null }>({});
  const [credits, setCredits] = useState<{ [pubkey: string]: number | null }>({});
  const [pings, setPings] = useState<{ [ip: string]: PingResult }>({});
  const [mainnetGeoData, setMainnetGeoData] = useState<{ [ip: string]: MainnetGeoData }>({});
  const [loading, setLoading] = useState(true);
  const [dataFetchTime, setDataFetchTime] = useState<number>(Math.floor(Date.now() / 1000));
  const [clickedNodeId, setClickedNodeId] = useState<string | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const lastMainnetCallRef = useRef(0);
  const router = useRouter();
  const { prefetchProfile, navigateToProfile } = usePrefetchProfile();

  // Toggle node for comparison
  const handleToggleCompare = useCallback((pubkey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedForCompare(prev => {
      if (prev.includes(pubkey)) {
        return prev.filter(p => p !== pubkey);
      }
      if (prev.length >= 4) return prev;
      return [...prev, pubkey];
    });
  }, []);

  // Navigate to compare page
  const handleCompareSelected = useCallback(() => {
    if (selectedForCompare.length >= 2) {
      const params = new URLSearchParams();
      params.set('nodes', selectedForCompare.join(','));
      router.push(`/compare?${params.toString()}`);
    }
  }, [selectedForCompare, router]);

  // Clear compare selection
  const handleClearCompare = useCallback(() => {
    setSelectedForCompare([]);
  }, []);

  // Fetch nodes data (devnet only - mainnet uses external API)
  useEffect(() => {
    // Skip native fetch for mainnet - external API will provide data
    if (isMainnet) {
      setLoading(false);
      return;
    }
    
    const fetchNodes = async () => {
      try {
        setLoading(true);
        setNodes([]);
        const response = await fetch(`/api/nodes?includeAll=true&network=${network}&_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        if (!response.ok) throw new Error(`Failed to fetch nodes: ${response.statusText}`);
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        if (data.serverTimestamp) setDataFetchTime(data.serverTimestamp);
        
        const allNodes = data.nodes || [];
        // Sort: named nodes first, then by last_seen_timestamp
        const sortedNodes = allNodes
          .sort((a: ValidatorData, b: ValidatorData) => {
            const aHasName = hasNodeName(a.pubkey);
            const bHasName = hasNodeName(b.pubkey);
            if (aHasName && !bHasName) return -1;
            if (!aHasName && bHasName) return 1;
            return b.last_seen_timestamp - a.last_seen_timestamp;
          })
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
  }, [network, isMainnet]);

  // Load geolocation data (for both networks - ip-api.com provides city data)
  useEffect(() => {
    if (nodes.length === 0) return;
    
    const loadGeolocationData = async () => {
      try {
        const uniqueIPs = Array.from(new Set(
          nodes.map(node => extractIPFromAddress(node.address || '')).filter(ip => ip && !locations[ip])
        ));
        
        if (uniqueIPs.length > 0) {
          const newLocations = await getLocationsForIPs(uniqueIPs);
          setLocations(prev => ({ ...prev, ...newLocations }));
        }
      } catch (error) {
        console.error('Failed to load geolocation data:', error);
      }
    };

    loadGeolocationData();
  }, [nodes]);

  // Fetch credits (devnet only - mainnet uses external credits)
  useEffect(() => {
    if (isMainnet || nodes.length === 0) return;
    
    const fetchCredits = async () => {
      try {
        const response = await fetch(`/api/pod-credits?network=${network}`);
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
  }, [nodes, network, isMainnet]);

  // Ping data - devnet ping disabled, mainnet uses external ping
  // Devnet ping logic removed - will show N/A

  // Fetch from external source for mainnet (30s cycle)
  useEffect(() => {
    if (!isMainnet) return;

    const fetchMainnetData = async () => {
      const timeSinceLastCall = Date.now() - lastMainnetCallRef.current;
      if (timeSinceLastCall < MAINNET_COOLDOWN && nodes.length > 0) return;

      setLoading(true);
      
      try {
        // Use GET endpoint to fetch full mainnet data
        const response = await fetch('/api/mainnet-rpc', {
          method: 'GET',
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          const geoMap = data.geo || {};
          
          // Store geo data by IP
          if (Object.keys(geoMap).length > 0) {
            setMainnetGeoData(geoMap);
          }
          
          // Transform and set mainnet nodes
          if (data.nodes && Array.isArray(data.nodes)) {
            const serverTime = Math.floor(Date.now() / 1000);
            // Transform all nodes first
            const allTransformedNodes: ValidatorData[] = data.nodes.map((pod: any, index: number) => {
              const ip = pod.address?.split(':')[0] || '';
              const geo = geoMap[ip];
              const timeDiff = serverTime - (pod.last_seen_timestamp || 0);
              
              let status = 'offline';
              if (timeDiff < 1800) status = 'online';
              else if (timeDiff < 3600) status = 'syncing';

              return {
                address: pod.address || '',
                pubkey: pod.pubkey || `node-${index}`,
                is_public: pod.is_public || false,
                storage_committed: pod.storage_committed || 0,
                storage_used: pod.storage_used || 0,
                storage_usage_percent: pod.storage_usage_percent || 0,
                rpc_port: pod.rpc_port || 0,
                version: pod.version || '',
                uptime: pod.uptime || 0,
                last_seen_timestamp: pod.last_seen_timestamp || 0,
                status,
                duplicateCount: 0,
              };
            });
            
            // Sort: named nodes first, then by last_seen_timestamp, then slice to 20
            const transformedNodes = allTransformedNodes
              .sort((a, b) => {
                const aHasName = hasNodeName(a.pubkey);
                const bHasName = hasNodeName(b.pubkey);
                if (aHasName && !bHasName) return -1;
                if (!aHasName && bHasName) return 1;
                return b.last_seen_timestamp - a.last_seen_timestamp;
              })
              .slice(0, 20);
            
            setNodes(transformedNodes);
            setDataFetchTime(serverTime);
            
            // Set credits from enriched pod data or geo data
            const creditsMap: { [pubkey: string]: number } = {};
            transformedNodes.forEach((node) => {
              const ip = node.address?.split(':')[0] || '';
              const pod = data.nodes.find((p: any) => p.address?.split(':')[0] === ip);
              const geo = geoMap[ip];
              if (node.pubkey) {
                // Prefer pod.credits (enriched), then geo.credits
                creditsMap[node.pubkey] = pod?.credits ?? geo?.credits ?? 0;
              }
            });
            setCredits(prev => ({ ...prev, ...creditsMap }));
          }
          
          lastMainnetCallRef.current = Date.now();
        }
      } catch (error) {
        console.error('[DashboardNodes] Mainnet fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch for mainnet
    fetchMainnetData();

    // Setup interval for mainnet refresh
    const intervalId = setInterval(fetchMainnetData, MAINNET_COOLDOWN);
    return () => clearInterval(intervalId);
  }, [isMainnet]);

  // Prefetch visible nodes
  useEffect(() => {
    if (nodes.length > 0 && !loading) {
      setTimeout(() => {
        nodes.slice(0, 5).forEach(node => {
          const ip = extractIPFromAddress(node.address || '');
          if (ip) prefetchProfile(ip);
        });
      }, 1000);
    }
  }, [nodes, loading, prefetchProfile]);

  const handleSeeMore = () => router.push('/nodes');

  const exportToCSV = () => {
    const headers = ['Location', 'IP', 'Pubkey', 'Public', 'Storage (GB)', 'Version', 'Uptime', 'Last Seen', 'Credits', 'Status'];
    
    const rows = nodes.map(node => {
      const ip = extractIPFromAddress(node.address || '');
      const location = locations[ip];
      const nodeCredits = node.pubkey ? credits[node.pubkey] : null;
      const timeDiff = dataFetchTime - node.last_seen_timestamp;
      
      const storageDisplay = formatStorage(node.storage_committed || 0);
      const uptimeHours = Math.floor(node.uptime / 3600);
      const uptimeDays = Math.floor(uptimeHours / 24);
      const uptimeDisplay = uptimeDays > 0 ? `${uptimeDays}d` : `${uptimeHours}h`;
      
      let lastSeenDisplay = '';
      if (timeDiff < 60) lastSeenDisplay = `${timeDiff}s`;
      else if (timeDiff < 3600) lastSeenDisplay = `${Math.floor(timeDiff / 60)}m`;
      else if (timeDiff < 86400) lastSeenDisplay = `${Math.floor(timeDiff / 3600)}h`;
      else lastSeenDisplay = `${Math.floor(timeDiff / 86400)}d`;
      
      const status = timeDiff < 1800 ? 'ACTIVE' : timeDiff < 3600 ? 'SYNCING' : 'OFFLINE';
      
      return [
        location ? `${location.city}, ${location.country}` : 'Unknown',
        ip || 'Unknown',
        node.pubkey || 'Unknown',
        node.is_public ? 'YES' : 'NO',
        storageDisplay,
        node.version || 'Unknown',
        uptimeDisplay,
        lastSeenDisplay,
        nodeCredits !== null && nodeCredits !== undefined ? nodeCredits.toString() : '0',
        status
      ];
    });
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pnodes-recent-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success(`Exported ${nodes.length} pNodes to CSV`);
  };

  const formatLocation = (location: LocationData | null): string => {
    if (!location) return 'Unknown';
    // Handle empty city or 'Unknown' city - just show country
    if (!location.city || location.city === 'Unknown') return location.country || 'Unknown';
    return `${location.city}, ${location.country}`;
  };

  const navigateToNodeProfile = (address: string, nodeId: string) => {
    const ip = extractIPFromAddress(address);
    if (ip) {
      setClickedNodeId(nodeId);
      toast.loading('Loading node profile...', { id: 'node-profile-loading' });
      navigateToProfile(ip);
      setTimeout(() => setClickedNodeId(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300">
        <CornerEdges />
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
    <div className="relative bg-black border border-white/10 p-4 sm:p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden">
      <CornerEdges />

      {/* Header */}
      <div className="flex items-center justify-between mb-4 animate-blur-reveal-item-1">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <h3 className="text-white text-base sm:text-lg font-semibold">Recent pNodes</h3>
          <div className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${isMainnet ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isMainnet ? 'bg-blue-400' : 'bg-green-400'}`}></div>
            <span>{isMainnet ? 'Mainnet' : 'Devnet'}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-1 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-colors"
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={handleSeeMore}
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors text-xs sm:text-sm font-medium"
          >
            See More
          </button>
        </div>
      </div>

      {/* Table with horizontal scroll */}
      <div className="bg-black border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full min-w-[1020px]">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="w-[4%] px-2 py-3 text-center text-xs font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">
                  <CompareIcon className="w-3.5 h-3.5 mx-auto text-white/50" />
                </th>
                {/* Name column - Mainnet only */}
                {isMainnet && (
                  <th className="px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">Name</th>
                )}
                <th className="px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">Location</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">IP Address</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">Pubkey</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">Public</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">Storage</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">Version</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">Uptime</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">Last Seen</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">Credits</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">Status</th>
                {/* Ping column - Mainnet only */}
                {isMainnet && (
                  <th className="px-3 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider whitespace-nowrap">Ping</th>
                )}
              </tr>
            </thead>
            <tbody>
              {nodes.length === 0 ? (
                <tr>
                  <td colSpan={isMainnet ? 14 : 11} className="px-6 py-12 text-center text-white/60 text-sm">
                    No nodes found for {isMainnet ? 'mainnet' : 'devnet'}
                  </td>
                </tr>
              ) : nodes.map((node, index) => {
                const ip = extractIPFromAddress(node.address || '');
                const location = locations[ip];
                const nodeCredits = node.pubkey ? credits[node.pubkey] : null;
                // Use external data for mainnet (geo + ping)
                const mainnetGeo = mainnetGeoData[ip];
                
                // Merge location data: prefer ip-api.com (has city), enrich with mainnet geo (has provider)
                let displayLocation = location;
                if (isMainnet) {
                  if (location && mainnetGeo) {
                    // Merge: ip-api city + mainnet geo provider
                    displayLocation = {
                      ...location,
                      provider: mainnetGeo.provider || location.provider,
                    };
                  } else if (mainnetGeo && mainnetGeo.country) {
                    // Only mainnet geo available
                    displayLocation = { 
                      country: mainnetGeo.country, 
                      country_code: mainnetGeo.country_code, 
                      city: '', 
                      region: '', 
                      provider: mainnetGeo.provider || 'Unknown', 
                      ip,
                    };
                  }
                }
                
                // Use external ping for mainnet, native ping for devnet
                const nodePing = isMainnet && mainnetGeo
                  ? { ping: mainnetGeo.ping, status: (mainnetGeo.ping !== null && mainnetGeo.ping > 0 ? 'online' : 'offline') as 'online' | 'offline' | 'timeout' }
                  : pings[ip];
                const nodeId = `${node.pubkey}-${index}`;
                const isSelected = selectedForCompare.includes(node.pubkey);
                const canSelect = selectedForCompare.length < 4 || isSelected;
                
                const timeDiff = dataFetchTime - node.last_seen_timestamp;
                const isOnline = timeDiff < 1800;
                const isSyncing = timeDiff >= 1800 && timeDiff < 3600;
                
                let lastSeenDisplay = '';
                if (timeDiff < 60) lastSeenDisplay = `${timeDiff}s`;
                else if (timeDiff < 3600) lastSeenDisplay = `${Math.floor(timeDiff / 60)}m`;
                else if (timeDiff < 86400) lastSeenDisplay = `${Math.floor(timeDiff / 3600)}h`;
                else lastSeenDisplay = `${Math.floor(timeDiff / 86400)}d`;
                
                const storageDisplay = formatStorage(node.storage_committed || 0);
                const uptimeHours = Math.floor(node.uptime / 3600);
                const uptimeDays = Math.floor(uptimeHours / 24);
                const uptimeDisplay = uptimeDays > 0 ? `${uptimeDays}d` : `${uptimeHours}h`;

                return (
                  <tr
                    key={nodeId}
                    className={`border-b border-white/5 hover:bg-white/5 transition-all duration-200 cursor-pointer group ${
                      clickedNodeId === nodeId ? 'bg-cyan-500/10 animate-pulse' : ''
                    } ${isSelected ? 'bg-emerald-500/10' : ''}`}
                    onClick={() => navigateToNodeProfile(node.address || '', nodeId)}
                    onMouseEnter={() => { if (ip) prefetchProfile(ip); }}
                  >
                    {/* Compare checkbox */}
                    <td className="px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => canSelect && node.pubkey && handleToggleCompare(node.pubkey, e)}
                        disabled={!canSelect && !isSelected}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                          isSelected 
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
                    {/* Name - Mainnet only */}
                    {isMainnet && (
                      <td className="px-3 py-3 text-xs">
                        <span className={`${getNodeName(node.pubkey) !== 'N/A' ? 'text-cyan-400 font-medium' : 'text-white/30'}`}>
                          {getNodeName(node.pubkey)}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-3 text-xs">
                      <div className="flex items-center space-x-2 min-w-0">
                        {displayLocation?.country_code ? (
                          <img
                            src={getCountryFlagUrl(displayLocation.country_code)}
                            alt={displayLocation.country}
                            className="w-4 h-3 object-cover rounded-sm flex-shrink-0"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <Globe className="w-4 h-3 text-white/40 flex-shrink-0" />
                        )}
                        <span className="text-white/80 truncate max-w-[120px]">{formatLocation(displayLocation)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <div className="flex items-center space-x-1 min-w-0">
                        <span className="text-white/80 font-mono truncate max-w-[100px]">{ip || 'Unknown'}</span>
                        {ip && <CopyBtn text={ip} type="IP" size="sm" className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0" />}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <div className="flex items-center space-x-1 min-w-0">
                        <span className="text-white/60 font-mono truncate max-w-[120px]">{node.pubkey || 'Unknown'}</span>
                        {node.pubkey && <CopyBtn text={node.pubkey} type="Pubkey" size="sm" className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0" />}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <span className={`px-2 py-1 rounded text-xs ${node.is_public ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {node.is_public ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <span className="text-white/80 font-mono whitespace-nowrap">{storageDisplay}</span>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <span className="text-white/70 font-mono truncate block max-w-[70px]">{node.version || 'Unknown'}</span>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <span className="text-white/70 font-mono">{uptimeDisplay}</span>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <span className="text-white/60 font-mono">{lastSeenDisplay}</span>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <span className="text-yellow-400 font-mono font-semibold">
                        {nodeCredits !== null && nodeCredits !== undefined ? nodeCredits.toLocaleString() : '0'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-400' : isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-red-400'}`}></div>
                        <span className={`text-xs whitespace-nowrap ${isOnline ? 'text-green-400' : isSyncing ? 'text-amber-400' : 'text-red-400'}`}>
                          {isOnline ? 'Active' : isSyncing ? 'Syncing' : 'Offline'}
                        </span>
                      </div>
                    </td>
                    {/* Ping cell - Mainnet only */}
                    {isMainnet && (
                      <td className="px-3 py-3 text-xs">
                        {nodePing ? (
                          <span className={`font-mono ${
                            nodePing.status === 'online' 
                              ? nodePing.ping! < 200 
                                ? 'text-green-400' 
                                : nodePing.ping! < 500 
                                  ? 'text-yellow-400' 
                                  : 'text-orange-400'
                              : 'text-red-400'
                          }`}>
                            {nodePing.status === 'online' ? `${nodePing.ping}ms` : 'N/A'}
                          </span>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Compare Button - rendered via portal to escape overflow:hidden */}
      {selectedForCompare.length > 0 && typeof document !== 'undefined' && createPortal(
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 bg-black/95 border border-emerald-500/30 rounded-full px-3 sm:px-4 py-2 shadow-lg shadow-emerald-500/20 backdrop-blur-xl animate-blur-reveal safe-area-bottom">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              {selectedForCompare.slice(0, 4).map((_, i) => (
                <div 
                  key={i} 
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-[9px] sm:text-[10px] text-emerald-400 font-bold"
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <span className="text-white/60 text-xs sm:text-sm">{selectedForCompare.length} selected</span>
          </div>
          <div className="w-px h-5 sm:h-6 bg-white/10" />
          <button
            onClick={handleClearCompare}
            className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleCompareSelected}
            disabled={selectedForCompare.length < 2}
            className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
              selectedForCompare.length >= 2
                ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <CompareIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            Compare
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

// Corner edges component
const CornerEdges: React.FC = () => (
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
