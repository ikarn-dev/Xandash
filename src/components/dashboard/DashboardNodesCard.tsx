'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CopyBtn } from '@/components/ui/CopyBtn';
import { getLocationsForIPs, extractIPFromAddress, getCountryFlagUrl } from '@/libs/services/geolocation';
import { usePrefetchProfile } from '@/libs/hooks/usePrefetchProfile';
import { toast } from 'sonner';
import { useNetwork } from '@/libs/context/network-context';

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
  const { network, isMainnet } = useNetwork();
  const [nodes, setNodes] = useState<ValidatorData[]>([]);
  const [locations, setLocations] = useState<{ [ip: string]: LocationData | null }>({});
  const [credits, setCredits] = useState<{ [pubkey: string]: number | null }>({});
  const [loading, setLoading] = useState(true);
  const [dataFetchTime, setDataFetchTime] = useState<number>(Math.floor(Date.now() / 1000));
  const [clickedNodeId, setClickedNodeId] = useState<string | null>(null);
  const router = useRouter();
  const { prefetchProfile, navigateToProfile } = usePrefetchProfile();

  // Fetch nodes data
  useEffect(() => {
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
  }, [network]);

  // Load geolocation data
  useEffect(() => {
    const loadGeolocationData = async () => {
      if (nodes.length === 0) return;
      
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

  // Fetch credits
  useEffect(() => {
    const fetchCredits = async () => {
      if (nodes.length === 0) return;
      
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
  }, [nodes, network]);

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
      
      const storageGB = node.storage_committed ? (node.storage_committed / (1024**3)).toFixed(1) : '0';
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
        storageGB,
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
    if (location.city !== 'Unknown') return `${location.city}, ${location.country}`;
    return location.country || 'Unknown';
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
          <table className="w-full min-w-[900px]">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
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
              </tr>
            </thead>
            <tbody>
              {nodes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-white/60 text-sm">
                    No nodes found for {isMainnet ? 'mainnet' : 'devnet'}
                  </td>
                </tr>
              ) : nodes.map((node, index) => {
                const ip = extractIPFromAddress(node.address || '');
                const location = locations[ip];
                const nodeCredits = node.pubkey ? credits[node.pubkey] : null;
                const nodeId = `${node.pubkey}-${index}`;
                
                const timeDiff = dataFetchTime - node.last_seen_timestamp;
                const isOnline = timeDiff < 1800;
                const isSyncing = timeDiff >= 1800 && timeDiff < 3600;
                
                let lastSeenDisplay = '';
                if (timeDiff < 60) lastSeenDisplay = `${timeDiff}s`;
                else if (timeDiff < 3600) lastSeenDisplay = `${Math.floor(timeDiff / 60)}m`;
                else if (timeDiff < 86400) lastSeenDisplay = `${Math.floor(timeDiff / 3600)}h`;
                else lastSeenDisplay = `${Math.floor(timeDiff / 86400)}d`;
                
                const storageGB = node.storage_committed ? (node.storage_committed / (1024**3)).toFixed(1) : '0';
                const uptimeHours = Math.floor(node.uptime / 3600);
                const uptimeDays = Math.floor(uptimeHours / 24);
                const uptimeDisplay = uptimeDays > 0 ? `${uptimeDays}d` : `${uptimeHours}h`;

                return (
                  <tr
                    key={nodeId}
                    className={`border-b border-white/5 hover:bg-white/5 transition-all duration-200 cursor-pointer group ${
                      clickedNodeId === nodeId ? 'bg-cyan-500/10 animate-pulse' : ''
                    }`}
                    onClick={() => navigateToNodeProfile(node.address || '', nodeId)}
                    onMouseEnter={() => { if (ip) prefetchProfile(ip); }}
                  >
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
                        <span className="text-white/80 truncate max-w-[120px]">{formatLocation(location)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <div className="flex items-center space-x-1 min-w-0">
                        <span className="text-white/80 font-mono truncate max-w-[100px]">{ip || 'Unknown'}</span>
                        {ip && <CopyBtn text={ip} type="IP" size="sm" className="opacity-0 group-hover:opacity-100 flex-shrink-0" />}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <div className="flex items-center space-x-1 min-w-0">
                        <span className="text-white/60 font-mono truncate max-w-[120px]">{node.pubkey || 'Unknown'}</span>
                        {node.pubkey && <CopyBtn text={node.pubkey} type="Pubkey" size="sm" className="opacity-0 group-hover:opacity-100 flex-shrink-0" />}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <span className={`px-2 py-1 rounded text-xs ${node.is_public ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {node.is_public ? 'YES' : 'NO'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <span className="text-white/80 font-mono whitespace-nowrap">{storageGB} GB</span>
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
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
