'use client';

import { useMemo } from 'react';
import { ComparisonChart } from './ComparisonChart';
import { AISummary } from '@/components/ui/AISummary';
import { ManagerAssetData } from '@/app/nodes/hooks/useManagerAssets';
import { ManagerBadge } from '@/components/ui/ManagerBadge';

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
  manager_pubkey?: string;
  score: number;
}

interface ResultsViewProps {
  nodes: NodeProfile[];
  onReset: () => void;
  network?: string;
  managerAssets?: Map<string, ManagerAssetData>;
  isHistoryLoading?: boolean;
}

export function ResultsView({ nodes, onReset, network = 'devnet', managerAssets, isHistoryLoading: isHistoryLoadingProp }: ResultsViewProps) {
  const isMainnet = network === 'mainnet';

  // Check if historical data is still loading (history array is empty for all nodes)
  const isHistoryLoading = isHistoryLoadingProp ?? (nodes.length > 0 && nodes.every(n => !n.history || n.history.length === 0));

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
    { key: 'score', label: 'Score', format: (v: number) => v.toFixed(1), best: getBest('score') },
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

      return `Node ${i + 1} (${n.ip}): ${n.status}, ${n.credits.toLocaleString()} credits, ${days}d uptime, ${storageCommitted} committed (${storageUsed} used)`;
    }).join('. ');

    return `Compare these ${nodes.length} Xandeum ${isMainnet ? 'mainnet' : 'devnet'} nodes. ${nodeDetails}. In 2-3 sentences: identify the best performer and note key differences. Do not provide any recommendations.`;
  }, [nodes, isMainnet]);

  const creditsChartData = useMemo(() =>
    nodes.map(p => ({
      label: p.ip,
      color: p.color,
      data: p.history?.map(h => ({ timestamp: h.timestamp, value: h.credits })) || [],
      currentValue: p.credits
    })), [nodes]);

  const uptimeChartData = useMemo(() =>
    nodes.map(p => ({
      label: p.ip,
      color: p.color,
      data: p.history?.map(h => ({ timestamp: h.timestamp, value: h.uptime / 3600 })) || [],
      currentValue: p.uptime / 3600
    })), [nodes]);

  const storageChartData = useMemo(() =>
    nodes.map(p => ({
      label: p.ip,
      color: p.color,
      data: p.history?.map(h => ({ timestamp: h.timestamp, value: h.storage_committed / (1024 * 1024 * 1024) })) || [],
      currentValue: p.storage_committed / (1024 * 1024 * 1024)
    })), [nodes]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Comparison Results</h2>
          <p className="text-xs text-white/40">{nodes.length} nodes analyzed</p>
        </div>
        <button onClick={onReset} className="px-4 py-2 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
          New Comparison
        </button>
      </div>

      <div className={`grid gap-4 ${nodes.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : nodes.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
        {nodes.map((node) => {
          const isWinner = (key: string) => {
            const stat = stats.find(s => s.key === key);
            return stat && (node[key as keyof NodeProfile] as number) === stat.best && nodes.length > 1;
          };

          return (
            <div key={node.pubkey} className="relative bg-black border p-4 overflow-hidden" style={{ borderColor: `${node.color}30` }}>
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: node.color, opacity: 0.6 }} />

              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: node.color }} />
                <span className="font-mono text-sm text-white font-medium">{node.ip}</span>
                <span className={`ml-auto text-[10px] px-2 py-0.5 ${node.status === 'online' ? 'bg-emerald-500/20 text-emerald-400' : node.status === 'syncing' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
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
                        <span className={`font-mono text-sm ${winner ? 'text-emerald-400 font-medium' : 'text-white'}`}>{stat.format(value)}</span>
                        {winner && <span className="text-[8px] px-1 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">BEST</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Manager Badge Section - Two Column Layout */}
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Manager</span>
                  {node.manager_pubkey ? (
                    <ManagerBadge
                      managerPubkey={node.manager_pubkey}
                      nftCount={managerAssets?.get(node.manager_pubkey)?.nft_count}
                      sbtCount={managerAssets?.get(node.manager_pubkey)?.sbt_count}
                      xenoBalance={managerAssets?.get(node.manager_pubkey)?.xeno_balance}
                      nftNames={managerAssets?.get(node.manager_pubkey)?.nft_names}
                      sbtNames={managerAssets?.get(node.manager_pubkey)?.sbt_names}
                      nftPreviews={managerAssets?.get(node.manager_pubkey)?.nft_previews}
                      sbtPreviews={managerAssets?.get(node.manager_pubkey)?.sbt_previews}
                      size="sm"
                    />
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded">
                      Not Registered
                    </span>
                  )}
                </div>
              </div>

              {/* Location Section - Two Column Layout */}
              {node.location && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Location</span>
                    <span className="text-[10px] text-white/60">{node.location.city}, {node.location.country}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-black border border-white/10 overflow-hidden">
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
              {/* Status row */}
              <tr className="border-b border-white/5 hover:bg-white/5">
                <td className="py-3 px-4 text-white/60 text-sm">Status</td>
                {nodes.map(node => (
                  <td key={node.pubkey} className="py-3 px-4 text-center">
                    <span className={`font-mono text-sm ${node.status === 'online' ? 'text-emerald-400' : node.status === 'syncing' ? 'text-amber-400' : 'text-red-400'}`}>
                      {node.status.toUpperCase()}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Other stats rows */}
              {[
                { label: 'Credits', getValue: (n: NodeProfile) => `+${n.credits.toLocaleString()}`, isBest: (n: NodeProfile) => n.credits === getBest('credits') },
                { label: 'Score', getValue: (n: NodeProfile) => n.score.toFixed(1), isBest: (n: NodeProfile) => n.score === getBest('score') },
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
                        <span className={`font-mono text-sm ${isBest ? 'text-emerald-400 font-medium' : 'text-white'}`}>{row.getValue(node)}</span>
                        {isBest && <span className="ml-1 text-emerald-400">★</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Manager Row */}
              <tr className="border-b border-white/5 hover:bg-white/5">
                <td className="py-3 px-4 text-white/60 text-sm">Manager</td>
                {nodes.map(node => (
                  <td key={node.pubkey} className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      {node.manager_pubkey ? (
                        <ManagerBadge
                          managerPubkey={node.manager_pubkey}
                          nftCount={managerAssets?.get(node.manager_pubkey)?.nft_count}
                          sbtCount={managerAssets?.get(node.manager_pubkey)?.sbt_count}
                          xenoBalance={managerAssets?.get(node.manager_pubkey)?.xeno_balance}
                          nftNames={managerAssets?.get(node.manager_pubkey)?.nft_names}
                          sbtNames={managerAssets?.get(node.manager_pubkey)?.sbt_names}
                          nftPreviews={managerAssets?.get(node.manager_pubkey)?.nft_previews}
                          sbtPreviews={managerAssets?.get(node.manager_pubkey)?.sbt_previews}
                          size="sm"
                        />
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] bg-orange-500/10 text-orange-400 border border-orange-500/30 rounded">
                          Not Registered
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-white">Historical Trends (7 Days)</h3>
        </div>
        <ComparisonChart
          title="Credits Over Time"
          datasets={creditsChartData}
          valueFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(0)}
          startFromZero={true}
          height={320}
          isLoading={isHistoryLoading}
        />
        <ComparisonChart
          title="Uptime (Hours)"
          datasets={uptimeChartData}
          valueFormatter={(v) => `${v.toFixed(0)}h`}
          startFromZero={true}
          height={320}
          isLoading={isHistoryLoading}
        />
        <ComparisonChart
          title="Storage (GB)"
          datasets={storageChartData}
          valueFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}TB` : `${v.toFixed(0)}GB`}
          startFromZero={true}
          height={320}
          isLoading={isHistoryLoading}
        />
      </div>

      {aiComparisonPrompt && <AISummary prompt={aiComparisonPrompt} title="Comparison Analysis" autoLoad={true} network={isMainnet ? 'mainnet' : 'devnet'} />}
    </div>
  );
}
