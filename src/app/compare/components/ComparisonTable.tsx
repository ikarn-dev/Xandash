'use client';

import { getNodeName } from '@/libs/utils/node-names';

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
  score?: number;
  location?: {
    country: string;
    city: string;
    provider: string;
  };
}

interface ComparisonTableProps {
  nodes: NodeProfile[];
}

export function ComparisonTable({ nodes }: ComparisonTableProps) {
  const formatUptime = (seconds: number) => {
    if (!seconds || seconds <= 0) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return '<1h';
  };

  const formatStorage = (bytes: number) => {
    if (!bytes || bytes <= 0) return 'N/A';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1000) return `${(gb / 1000).toFixed(2)} TB`;
    return `${gb.toFixed(2)} GB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-emerald-400';
      case 'syncing': return 'text-amber-400';
      default: return 'text-red-400';
    }
  };

  const getBestValue = (key: keyof NodeProfile, higher = true) => {
    const values = nodes.map(n => typeof n[key] === 'number' ? n[key] as number : 0);
    return higher ? Math.max(...values) : Math.min(...values);
  };

  const rows: Array<{
    label: string;
    key: string;
    format: (v: any, node?: NodeProfile) => string;
    isBest: (v: any) => boolean;
  }> = [
      { label: 'Name', key: 'pubkey', format: (v) => getNodeName(v), isBest: () => false },
      { label: 'Status', key: 'status', format: (v) => String(v).toUpperCase(), isBest: () => false },
      { label: 'Score', key: 'score', format: (v) => (v || 0).toFixed(1), isBest: (v) => v === getBestValue('score' as keyof NodeProfile) },
      { label: 'Uptime', key: 'uptime', format: formatUptime, isBest: (v) => v === getBestValue('uptime') },
      { label: 'Credits', key: 'credits', format: (v) => `+${Number(v).toLocaleString()}`, isBest: (v) => v === getBestValue('credits') },
      { label: 'Storage Committed', key: 'storage_committed', format: formatStorage, isBest: (v) => v === getBestValue('storage_committed') },
      { label: 'Storage Used', key: 'storage_used', format: formatStorage, isBest: (v) => v === getBestValue('storage_used') },
      { label: 'Version', key: 'version', format: (v) => v || 'N/A', isBest: () => false },
      { label: 'Location', key: 'location', format: (v) => v ? `${v.city}, ${v.country}` : 'N/A', isBest: () => false },
      { label: 'Provider', key: 'location', format: (v) => v?.provider || 'N/A', isBest: () => false },
    ];

  if (nodes.length === 0) {
    return (
      <div className="bg-white/5 rounded-lg p-8 text-center text-white/40">
        Select nodes to compare
      </div>
    );
  }

  return (
    <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 px-4 text-white/40 text-xs font-medium uppercase">Parameter</th>
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
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
              <td className="py-3 px-4 text-white/60 text-sm">{row.label}</td>
              {nodes.map(node => {
                const value = (node as any)[row.key];
                const formatted = row.format(value, node);
                const isBest = row.isBest(value);
                const isStatus = row.key === 'status';
                const isName = row.key === 'pubkey';
                const hasName = isName && getNodeName(value) !== 'N/A';

                return (
                  <td key={node.pubkey} className="py-3 px-4 text-center">
                    <span className={`font-mono text-sm ${isStatus ? getStatusColor(value as string) :
                        hasName ? 'text-cyan-400 font-medium' :
                          isName ? 'text-white/30' :
                            isBest ? 'text-emerald-400 font-medium' : 'text-white'
                      }`}>
                      {formatted}
                    </span>
                    {isBest && <span className="ml-1 text-[8px] text-emerald-400">★</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
