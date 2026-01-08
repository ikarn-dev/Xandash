'use client';

import { useMemo } from 'react';
import { ComparisonChart } from './ComparisonChart';

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
}

export function ResultsView({ nodes, onReset }: ResultsViewProps) {
  const formatUptime = (s: number) => {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h` : '<1h';
  };

  const formatStorage = (b: number) => {
    const gb = b / (1024 * 1024 * 1024);
    return gb >= 1000 ? `${(gb / 1000).toFixed(1)} TB` : `${gb.toFixed(1)} GB`;
  };

  const getBest = (key: keyof NodeProfile) => {
    return Math.max(...nodes.map(p => typeof p[key] === 'number' ? p[key] as number : 0));
  };

  const stats = [
    { key: 'credits', label: 'Credits', format: (v: number) => `+${v.toLocaleString()}`, best: getBest('credits') },
    { key: 'uptime', label: 'Uptime', format: formatUptime, best: getBest('uptime') },
    { key: 'storage_committed', label: 'Storage', format: formatStorage, best: getBest('storage_committed') },
  ];

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

  const storageCommittedChartData = useMemo(() => 
    nodes.map(p => ({
      label: p.ip,
      color: p.color,
      data: p.history?.map(h => ({ timestamp: h.timestamp, value: h.storage_committed / (1024 * 1024 * 1024) })) || []
    })), [nodes]);

  const storageUsedChartData = useMemo(() => 
    nodes.map(p => ({
      label: p.ip,
      color: p.color,
      data: p.history?.map(h => ({ timestamp: h.timestamp, value: h.storage_used / (1024 * 1024 * 1024) })) || []
    })), [nodes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Comparison Results</h2>
          <p className="text-xs text-white/40">{nodes.length} nodes analyzed</p>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
        >
          New Comparison
        </button>
      </div>

      {/* Node Cards */}
      <div className={`grid gap-4 ${nodes.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : nodes.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {nodes.map((node) => {
          const isWinner = (key: string) => {
            const stat = stats.find(s => s.key === key);
            return stat && (node[key as keyof NodeProfile] as number) === stat.best && nodes.length > 1;
          };
          
          return (
            <div 
              key={node.pubkey}
              className="relative bg-black/50 border rounded-xl p-4 overflow-hidden"
              style={{ borderColor: `${node.color}30` }}
            >
              <div 
                className="absolute top-0 left-0 right-0 h-1 opacity-60"
                style={{ background: `linear-gradient(90deg, transparent, ${node.color}, transparent)` }}
              />
              
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: node.color }} />
                <span className="font-mono text-sm text-white font-medium">{node.ip}</span>
                <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${
                  node.status === 'online' ? 'bg-emerald-500/20 text-emerald-400' :
                  node.status === 'syncing' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {node.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3">
                {stats.map(stat => {
                  const value = node[stat.key as keyof NodeProfile] as number;
                  const winner = isWinner(stat.key);
                  return (
                    <div key={stat.key} className="flex items-center justify-between">
                      <span className="text-xs text-white/50">{stat.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono text-sm ${winner ? 'text-emerald-400 font-medium' : 'text-white'}`}>
                          {stat.format(value)}
                        </span>
                        {winner && (
                          <span className="text-[8px] px-1 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                            BEST
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {node.location && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="text-[10px] text-white/30">
                    {node.location.city}, {node.location.country}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed Table */}
      <div className="bg-black/50 border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-sm font-medium text-white">Detailed Comparison</h3>
        </div>
        <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
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
                { label: 'Credits', getValue: (n: NodeProfile) => `+${n.credits.toLocaleString()}`, isBest: (n: NodeProfile) => n.credits === getBest('credits') },
                { label: 'Uptime', getValue: (n: NodeProfile) => formatUptime(n.uptime), isBest: (n: NodeProfile) => n.uptime === getBest('uptime') },
                { label: 'Storage', getValue: (n: NodeProfile) => formatStorage(n.storage_committed), isBest: (n: NodeProfile) => n.storage_committed === getBest('storage_committed') },
                { label: 'Used', getValue: (n: NodeProfile) => formatStorage(n.storage_used), isBest: (n: NodeProfile) => n.storage_used === getBest('storage_used') },
                { label: 'Version', getValue: (n: NodeProfile) => n.version || 'N/A' },
                { label: 'Provider', getValue: (n: NodeProfile) => n.location?.provider || 'N/A' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 text-white/60 text-sm">{row.label}</td>
                  {nodes.map(node => {
                    const isBest = row.isBest?.(node) && nodes.length > 1;
                    return (
                      <td key={node.pubkey} className="py-3 px-4 text-center">
                        <span className={`font-mono text-sm ${row.getClass?.(node) || (isBest ? 'text-emerald-400 font-medium' : 'text-white')}`}>
                          {row.getValue(node)}
                        </span>
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

      {/* Charts */}
      <div className="bg-black/50 border border-white/10 rounded-xl p-4">
        <h3 className="text-sm font-medium text-white mb-4">Historical Trends (7 Days)</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ComparisonChart
            title="Credits Over Time"
            datasets={creditsChartData}
            valueFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}K` : v.toString()}
          />
          <ComparisonChart
            title="Uptime (Hours)"
            datasets={uptimeChartData}
            valueFormatter={(v) => `${v.toFixed(0)}h`}
          />
          <ComparisonChart
            title="Storage Committed (GB)"
            datasets={storageCommittedChartData}
            valueFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}TB` : `${v.toFixed(0)}GB`}
          />
          <ComparisonChart
            title="Storage Used (GB)"
            datasets={storageUsedChartData}
            valueFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}TB` : `${v.toFixed(0)}GB`}
          />
        </div>
      </div>
    </div>
  );
}
