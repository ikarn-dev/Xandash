'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { useNetwork } from '@/libs/context/network-context';
import { NodeSelector } from './components/NodeSelector';
import { CompareButton } from './components/CompareButton';
import { ResultsView } from './components/ResultsView';
import { toast } from 'sonner';

interface NodeData {
  pubkey: string;
  address: string;
  credits?: number;
  uptime?: number;
  storage_committed?: number;
  storage_used?: number;
  version?: string;
  last_seen_timestamp?: number;
}

interface NodeProfile {
  ip: string;
  pubkey: string;
  color: string;
  status: string;
  uptime: number;
  credits: number;
  storage_committed: number;
  storage_used: number;
  version: string;
  location?: { country: string; city: string; provider: string };
  history?: Array<{ timestamp: number; credits: number; uptime: number; storage_committed: number; storage_used: number }>;
}

const NODE_COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b'];

function ComparePageContent() {
  const { network } = useNetwork();
  const searchParams = useSearchParams();
  const [allNodes, setAllNodes] = useState<NodeData[]>([]);
  const [serverTimestamp, setServerTimestamp] = useState<number>(0);
  const [selectedPubkeys, setSelectedPubkeys] = useState<string[]>([]);
  const [nodeProfiles, setNodeProfiles] = useState<NodeProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComparing, setIsComparing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [autoCompareTriggered, setAutoCompareTriggered] = useState(false);

  // Calculate node status from last_seen_timestamp
  const getNodeStatus = useCallback((lastSeen: number, timestamp: number) => {
    const timeDiff = timestamp - lastSeen;
    if (timeDiff < 300) return 'online';
    if (timeDiff < 3600) return 'syncing';
    return 'offline';
  }, []);

  // Fetch all nodes with full data
  useEffect(() => {
    // Reset state when network changes
    setSelectedPubkeys([]);
    setNodeProfiles([]);
    setShowResults(false);
    setAutoCompareTriggered(false);
    
    const fetchNodes = async () => {
      setIsLoading(true);
      try {
        const [nodesRes, creditsRes] = await Promise.all([
          fetch(`/api/nodes?includeAll=true&network=${network}`),
          fetch(`/api/pod-credits?network=${network}`)
        ]);
        
        if (nodesRes.ok && creditsRes.ok) {
          const nodesData = await nodesRes.json();
          const creditsData = await creditsRes.json();
          
          // Store server timestamp for status calculation
          const srvTimestamp = nodesData.serverTimestamp || Math.floor(Date.now() / 1000);
          setServerTimestamp(srvTimestamp);
          
          const creditsMap = new Map<string, number>();
          (creditsData.pods_credits || []).forEach((c: any) => {
            creditsMap.set(c.pod_id, c.credits);
          });
          
          // Store full node data including uptime, storage, version
          const nodes = (nodesData.nodes || [])
            .map((n: any) => ({
              pubkey: n.pubkey,
              address: n.address,
              credits: creditsMap.get(n.pubkey) || 0,
              uptime: n.uptime || 0,
              storage_committed: n.storage_committed || 0,
              storage_used: n.storage_used || 0,
              version: n.version || '',
              last_seen_timestamp: n.last_seen_timestamp || 0,
            }))
            .sort((a: NodeData, b: NodeData) => (b.credits || 0) - (a.credits || 0));
          
          setAllNodes(nodes);
          
          // Check for URL params - auto-compare if 'auto=true' is present
          const nodesParam = searchParams.get('nodes');
          const autoParam = searchParams.get('auto');
          
          if (nodesParam) {
            const pubkeysFromUrl = nodesParam.split(',').filter(Boolean);
            const validPubkeys = pubkeysFromUrl.filter(pk => 
              nodes.some((n: NodeData) => n.pubkey === pk)
            ).slice(0, 4);
            
            if (validPubkeys.length >= 2) {
              setSelectedPubkeys(validPubkeys);
              
              // Auto-compare if auto=true param is present
              if (autoParam === 'true') {
                // Trigger auto-compare with the fetched data
                triggerAutoCompare(validPubkeys, nodes, srvTimestamp);
              }
            } else if (validPubkeys.length > 0) {
              setSelectedPubkeys(validPubkeys);
            }
          }
        }
      } catch (err) {
        toast.error('Failed to load nodes');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNodes();
  }, [network, searchParams]);

  // Auto-compare function that runs immediately with fetched data
  const triggerAutoCompare = async (pubkeys: string[], nodes: NodeData[], timestamp: number) => {
    if (pubkeys.length < 2 || autoCompareTriggered) return;
    
    setAutoCompareTriggered(true);
    setIsComparing(true);
    
    try {
      // Build profiles from fetched data
      const profiles: NodeProfile[] = [];
      
      for (let i = 0; i < pubkeys.length; i++) {
        const pubkey = pubkeys[i];
        const node = nodes.find(n => n.pubkey === pubkey);
        if (!node) continue;
        
        const ip = node.address?.split(':')[0] || '';
        
        profiles.push({
          ip,
          pubkey,
          color: NODE_COLORS[i % NODE_COLORS.length],
          status: getNodeStatus(node.last_seen_timestamp || 0, timestamp),
          uptime: node.uptime || 0,
          credits: node.credits || 0,
          storage_committed: node.storage_committed || 0,
          storage_used: node.storage_used || 0,
          version: node.version || '',
          location: undefined,
          history: []
        });
      }
      
      // Show results immediately
      setNodeProfiles(profiles);
      setShowResults(true);
      setIsComparing(false);
      
      // Fetch historical data in background
      const ips = profiles.map(p => p.ip);
      
      // Use batch fetch for all nodes at once (single DB query)
      let historyByIp: Record<string, any[]> = {};
      try {
        const batchRes = await fetch(`/api/node-history?type=batch-stats&ips=${ips.join(',')}&hours=168&network=${network}`);
        if (batchRes.ok) {
          const batchData = await batchRes.json();
          historyByIp = batchData.results || {};
        } else {
          // Fallback to individual requests if batch fails
          const historyPromises = profiles.map(async (profile) => {
            try {
              const statsRes = await fetch(`/api/node-history?ip=${profile.ip}&type=stats&hours=168&network=${network}`);
              const statsData = statsRes.ok ? await statsRes.json() : { stats: [] };
              return { ip: profile.ip, history: statsData.stats || [] };
            } catch {
              return { ip: profile.ip, history: [] };
            }
          });
          const results = await Promise.all(historyPromises);
          results.forEach(r => { historyByIp[r.ip] = r.history; });
        }
      } catch {
        // Fall back to empty history on error
      }
      
      // Fetch locations in batch
      let locationMap: Record<string, any> = {};
      try {
        const locationRes = await fetch('/api/geolocation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ips })
        });
        if (locationRes.ok) {
          locationMap = await locationRes.json();
        }
      } catch {
        // Location is optional
      }
      
      setNodeProfiles(prev => prev.map(profile => {
        const historyData = historyByIp[profile.ip] || [];
        const location = locationMap[profile.ip];
        
        return {
          ...profile,
          location: location ? {
            country: location.country,
            city: location.city,
            provider: location.provider
          } : undefined,
          history: historyData.map((h: any) => ({
            timestamp: h.timestamp,
            credits: h.credits || 0,
            uptime: h.uptime || 0,
            storage_committed: h.storage_committed || 0,
            storage_used: h.storage_used || 0
          }))
        };
      }));
      
    } catch (err) {
      toast.error('Failed to compare nodes');
      setIsComparing(false);
    }
  };

  const handleToggleNode = useCallback((pubkey: string) => {
    setSelectedPubkeys(prev => {
      if (prev.includes(pubkey)) {
        return prev.filter(p => p !== pubkey);
      }
      if (prev.length >= 4) return prev;
      return [...prev, pubkey];
    });
  }, []);

  const handleCompare = useCallback(async () => {
    if (selectedPubkeys.length < 2) return;
    
    setIsComparing(true);
    
    try {
      // Build profiles from pre-fetched data (instant)
      const profiles: NodeProfile[] = [];
      
      for (let i = 0; i < selectedPubkeys.length; i++) {
        const pubkey = selectedPubkeys[i];
        const node = allNodes.find(n => n.pubkey === pubkey);
        if (!node) continue;
        
        const ip = node.address?.split(':')[0] || '';
        
        profiles.push({
          ip,
          pubkey,
          color: NODE_COLORS[i % NODE_COLORS.length],
          status: getNodeStatus(node.last_seen_timestamp || 0, serverTimestamp),
          uptime: node.uptime || 0,
          credits: node.credits || 0,
          storage_committed: node.storage_committed || 0,
          storage_used: node.storage_used || 0,
          version: node.version || '',
          location: undefined,
          history: []
        });
      }
      
      // Show results immediately with pre-fetched data
      setNodeProfiles(profiles);
      setShowResults(true);
      setIsComparing(false);
      
      // Fetch historical data in background using batch endpoint (single DB query)
      const ips = profiles.map(p => p.ip);
      
      let historyByIp: Record<string, any[]> = {};
      try {
        const batchRes = await fetch(`/api/node-history?type=batch-stats&ips=${ips.join(',')}&hours=168&network=${network}`);
        if (batchRes.ok) {
          const batchData = await batchRes.json();
          historyByIp = batchData.results || {};
        } else {
          // Fallback to individual requests if batch fails
          const historyPromises = profiles.map(async (profile) => {
            try {
              const statsRes = await fetch(`/api/node-history?ip=${profile.ip}&type=stats&hours=168&network=${network}`);
              const statsData = statsRes.ok ? await statsRes.json() : { stats: [] };
              return { ip: profile.ip, history: statsData.stats || [] };
            } catch {
              return { ip: profile.ip, history: [] };
            }
          });
          const results = await Promise.all(historyPromises);
          results.forEach(r => { historyByIp[r.ip] = r.history; });
        }
      } catch {
        // Fall back to empty history on error
      }
      
      // Fetch locations in batch
      let locationMap: Record<string, any> = {};
      try {
        const locationRes = await fetch('/api/geolocation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ips })
        });
        if (locationRes.ok) {
          locationMap = await locationRes.json();
        }
      } catch {
        // Location is optional, continue without it
      }
      
      // Update profiles with historical data when ready
      setNodeProfiles(prev => prev.map(profile => {
        const historyData = historyByIp[profile.ip] || [];
        const location = locationMap[profile.ip];
        
        return {
          ...profile,
          location: location ? {
            country: location.country,
            city: location.city,
            provider: location.provider
          } : undefined,
          history: historyData.map((h: any) => ({
            timestamp: h.timestamp,
            credits: h.credits || 0,
            uptime: h.uptime || 0,
            storage_committed: h.storage_committed || 0,
            storage_used: h.storage_used || 0
          }))
        };
      }));
      
    } catch (err) {
      toast.error('Failed to compare nodes');
      setIsComparing(false);
    }
  }, [selectedPubkeys, allNodes, serverTimestamp, getNodeStatus, network]);

  const handleReset = useCallback(() => {
    setSelectedPubkeys([]);
    setNodeProfiles([]);
    setShowResults(false);
  }, []);

  return (
    <div className="space-y-6">
      {!showResults ? (
        <>
          {/* Header */}
          <div className="text-center py-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Node Compare</h1>
            <p className="text-white/40 text-sm max-w-md mx-auto">
              Select up to 4 nodes to compare their performance, uptime, and storage metrics side by side
            </p>
            
            {/* Network Badge */}
            <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <div className={`w-2 h-2 rounded-full ${network === 'mainnet' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
              <span className="text-xs text-white/60 uppercase tracking-wider">{network}</span>
            </div>
          </div>

          {/* Selection Panel */}
          <div className="bg-black/50 border border-white/10 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-white">Select Nodes</h2>
              {selectedPubkeys.length > 0 && (
                <button
                  onClick={() => setSelectedPubkeys([])}
                  className="text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            
            <NodeSelector
              nodes={allNodes}
              selectedNodes={selectedPubkeys}
              onToggle={handleToggleNode}
              maxNodes={4}
              isLoading={isLoading}
            />
          </div>

          {/* Compare Button */}
          <CompareButton
            count={selectedPubkeys.length}
            minRequired={2}
            onClick={handleCompare}
            isLoading={isComparing}
          />

          {/* Tips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { title: 'Multi-Select', desc: 'Click checkboxes to select multiple nodes at once' },
              { title: 'Search', desc: 'Filter by IP address or Pod ID to find specific nodes' },
              { title: 'Compare', desc: 'View detailed stats, charts, and historical data' },
            ].map((tip, i) => (
              <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-xs font-medium text-white/60 mb-1">{tip.title}</div>
                <div className="text-[10px] text-white/30">{tip.desc}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <ResultsView nodes={nodeProfiles} onReset={handleReset} network={network} />
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <DashboardLayout>
      <ComparePageContent />
    </DashboardLayout>
  );
}
