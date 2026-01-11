'use client';

import { useMemo, useState, useEffect } from 'react';
import { ComparisonChart } from './ComparisonChart';
import { AISummary } from '@/components/ui/AISummary';

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

interface ResultsViewProps {
  nodes: NodeProfile[];
  onReset: () => void;
  network?: string;
}

export function ResultsView({ nodes, onReset, network = 'devnet' }: ResultsViewProps) {
  const [pingData, setPingData] = useState<Record<string, { current: number | null; history: Array<{ timestamp: number; ping: number | null; status: string }> }>>({});
  const [loadingPings, setLoadingPings] = useState(false);
  const isMainnet = network === 'mainnet';

  // Fetch ping data - only for mainnet, devnet ping disabled
  useEffect(() => {
    if (nodes.length === 0 || !isMainnet) return;
    
    setLoadingPings(true);
    const fetchPings = async () => {
      try {
        const pingRes = await fetch('/api/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            items: nodes.map(n => ({ ip: n.ip, pubkey: n.pubkey })),
            save: true,
            network
          }),
        });
        
        const pingResults = pingRes.ok ? (await pingRes.json()).results : {};
        
        const historyPromises = nodes.map(async (node) => {
          try {
            const res = await fetch(`/api/ping-history?ip=${node.ip}&hours=168&network=${network}`);
            if (res.ok) {
              const data = await res.json();
              return { ip: node.ip, history: data.history || [] };
            }
          } catch {}
          return { ip: node.ip, history: [] };
        });
        
        const histories = await Promise.all(historyPromises);
        
        const combined: Record<string, { current: number | null; history: Array<{ timestamp: number; ping: number | null; status: string }> }> = {};
        nodes.forEach(node => {
          const historyData = histories.find(h => h.ip === node.ip);
          combined[node.ip] = {
            current: pingResults[node.ip]?.ping ?? null,
            history: historyData?.history || [],
          };
        });
        
        setPingData(combined);
      } catch (e) {
        console.error('Failed to fetch pings:', e);
      } finally {
        setLoadingPings(false);
      }
    };

    fetchPings();
  }, [nodes, isMainnet, network]);

  const formatUptime = (s: number) => {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h` : '<1h';
  };

  const formatStorage = (b: number) => {
    const gb = b / (1024 * 1024 * 1024);
    return gb >= 1000 ? `${(gb / 1000).toFixed(1)} TB` : `${gb.toFixed(1)} GB`;
  };

  const formatPing = (ping: number | null) => {
    if (ping === null) return '—';
    return `${ping}ms`;
  };

  const getBest = (key: keyof NodeProfile) => {
    return Math.max(...nodes.map(p => typeof p[key] === 'number' ? p[key] as number : 0));
  };

  const getBestPing = () => {
    const pings = nodes.map(n => pingData[n.ip]?.current).filter(p => p !== null && p !== undefined) as number[];
    return pings.length > 0 ? Math.min(...pings) : null;
  };

  const stats = [
    { key: 'credits', label: 'Credits', format: (v: number) => `+${v.toLocaleString()}`, best: getBest('credits') },
    { key: 'uptime', label: 'Uptime', format: formatUptime, best: getBest('uptime') },
    { key: 'storage_committed', label: 'Storage', format: formatStorage, best: getBest('storage_committed') },
  ];

  const aiComparisonPrompt = useMemo(() => {
    if (nodes.length < 2) return '';
    
    const formatStorageAI = (bytes: number) => {
      if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
      if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
      return `${bytes}B`;
    };
    
    const nodeDetails = nodes.map((n, i) => {
      const days = (n.uptime / 86400).toFixed(1);
      const storageCommitted = formatStorageAI(n.storage_committed);
      const storageUsed = formatStorageAI(n.storage_used);
      const ping = pingData[n.ip]?.current;
      const pingStr = ping !== null && ping !== undefined ? `${ping}ms ping` : 'ping N/A';
      return `Node ${i+1} (${n.ip}): ${n.status}, ${n.credits.toLocaleString()} credits, ${days}d uptime, ${storageCommitted} committed (${storageUsed} used), ${pingStr}`;
    }).join('. ');

    return `Compare these ${nodes.length} Xandeum network nodes. ${nodeDetails}. In 2-3 sentences: identify the best performer (consider ping for responsiveness), note key differences, give one recommendation.`;
  }, [nodes, pingData]);

  const creditsChartData = useMemo(() => 
    nodes.map(p => ({
      label: p.ip,
      color: p.color,
      data: p.history?.map(h => ({ timestamp: h.timestamp, value: h.credits })) || []
    })), [nodes]);

  const uptimeChartData = useMemo(() => 
    nodes.map(p => ({
      label: p.ip,
      color: p.color,
      data: p.history?.map(h => ({ timestamp: h.timestamp, value: h.uptime / 3600 })) || []
    })), [nodes]);

  const storageChartData = useMemo(() => 
    nodes.map(p => ({
      label: p.ip,
      color: p.color,
      data: p.history?.map(h => ({ timestamp: h.timestamp, value: h.storage_committed / (1024 * 1024 * 1024) })) || []
    })), [nodes]);

  const pingChartData = useMemo(() => 
    nodes.map(p => ({
      label: p.ip,
      color: p.color,
      data: (pingData[p.ip]?.history || [])
        .filter(h => h.ping !== null)
        .map(h => ({ timestamp: h.timestamp, value: h.ping as number }))
    })), [nodes, pingData]);

  const bestPing = getBestPing();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Comparison Results</h2>
          <p className="text-xs text-white/40">{nodes.length} nodes analyzed</p>
        </div>
        <button onClick={onReset} className="px-4 py-2 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
          New Comparison
        </button>
      </div>

      <div className={`grid gap-4 ${nodes.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : nodes.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {nodes.map((node) => {
          const isWinner = (key: string) => {
            const stat = stats.find(s => s.key === key);
            return stat && (node[key as keyof NodeProfile] as number) === stat.best && nodes.length > 1;
          };
          
          const nodePing = pingData[node.ip]?.current;
          const isPingBest = nodePing !== null && nodePing !== undefined && bestPing !== null && nodePing === bestPing && nodes.length > 1;
          
          return (
            <div key={node.pubkey} className="relative bg-black/50 border rounded-xl p-4 overflow-hidden" style={{ borderColor: `${node.color}30` }}>
              <div className="absolute top-0 left-0 right-0 h-1 opacity-60" style={{ background: `linear-gradient(90deg, transparent, ${node.color}, transparent)` }} />
              
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: node.color }} />
                <span className="font-mono text-sm text-white font-medium">{node.ip}</span>
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${node.status === 'online' ? 'bg-emerald-500/20 text-emerald-400' : node.status === 'syncing' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                  {node.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Ping</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`font-mono text-sm ${loadingPings ? 'text-white/30' : isPingBest ? 'text-emerald-400 font-medium' : nodePing !== null ? (nodePing < 100 ? 'text-emerald-400' : nodePing < 300 ? 'text-amber-400' : 'text-red-400') : 'text-white/30'}`}>
                      {loadingPings ? '...' : formatPing(nodePing ?? null)}
                    </span>
                    {isPingBest && <span className="text-[8px] px-1 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">BEST</span>}
                  </div>
                </div>
                
                {stats.map(stat => {
                  const value = node[stat.key as keyof NodeProfile] as number;
                  const winner = isWinner(stat.key);
                  return (
                    <div key={stat.key} className="flex items-center justify-between">
                      <span className="text-xs text-white/50">{stat.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono text-sm ${winner ? 'text-emerald-400 font-medium' : 'text-white'}`}>{stat.format(value)}</span>
                        {winner && <span className="text-[8px] px-1 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">BEST</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {node.location && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="text-[10px] text-white/30">{node.location.city}, {node.location.country}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-sm font-medium text-white">Detailed Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left py-3 px-4 text-white/40 text-xs font-medium">Parameter</th>
                {nodes.map(node => (
                  <th key={node.pubkey} className="text-center py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: node.color }} />
                      <span className="font-mono text-xs text-white">{node.ip}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Status', getValue: (n: NodeProfile) => n.status.toUpperCase(), getClass: (n: NodeProfile) => n.status === 'online' ? 'text-emerald-400' : n.status === 'syncing' ? 'text-amber-400' : 'text-red-400' },
                { label: 'Ping', getValue: (n: NodeProfile) => formatPing(pingData[n.ip]?.current ?? null), isBest: (n: NodeProfile) => { const p = pingData[n.ip]?.current; return p !== null && p !== undefined && bestPing !== null && p === bestPing; }, getClass: (n: NodeProfile) => { const p = pingData[n.ip]?.current; return p !== null ? (p < 100 ? 'text-emerald-400' : p < 300 ? 'text-amber-400' : 'text-red-400') : 'text-white/30'; } },
                { label: 'Credits', getValue: (n: NodeProfile) => `+${n.credits.toLocaleString()}`, isBest: (n: NodeProfile) => n.credits === getBest('credits') },
                { label: 'Uptime', getValue: (n: NodeProfile) => formatUptime(n.uptime), isBest: (n: NodeProfile) => n.uptime === getBest('uptime') },
                { label: 'Storage', getValue: (n: NodeProfile) => formatStorage(n.storage_committed), isBest: (n: NodeProfile) => n.storage_committed === getBest('storage_committed') },
                { label: 'Version', getValue: (n: NodeProfile) => n.version || 'N/A' },
                { label: 'Provider', getValue: (n: NodeProfile) => n.location?.provider || 'N/A' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 text-white/60 text-sm">{row.label}</td>
                  {nodes.map(node => {
                    const isBest = row.isBest?.(node) && nodes.length > 1;
                    return (
                      <td key={node.pubkey} className="py-3 px-4 text-center">
                        <span className={`font-mono text-sm ${row.getClass?.(node) || (isBest ? 'text-emerald-400 font-medium' : 'text-white')}`}>{row.getValue(node)}</span>
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

      <div className="bg-black/50 border border-white/10 rounded-xl p-4">
        <h3 className="text-sm font-medium text-white mb-4">Historical Trends (7 Days)</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ComparisonChart title="Ping Latency (ms)" datasets={pingChartData} valueFormatter={(v) => `${v.toFixed(0)}ms`} />
          <ComparisonChart title="Credits Over Time" datasets={creditsChartData} valueFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : v.toString()} />
          <ComparisonChart title="Uptime (Hours)" datasets={uptimeChartData} valueFormatter={(v) => `${v.toFixed(0)}h`} />
          <ComparisonChart title="Storage (GB)" datasets={storageChartData} valueFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}TB` : `${v.toFixed(0)}GB`} />
        </div>
      </div>

      {aiComparisonPrompt && <AISummary prompt={aiComparisonPrompt} title="Comparison Analysis" autoLoad={true} />}
    </div>
  );
}
