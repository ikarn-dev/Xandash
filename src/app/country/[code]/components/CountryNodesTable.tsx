'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CopyBtn as CopyButton } from '@/components/ui/CopyBtn';
import { extractIPFromAddress } from '@/libs/services/geolocation';
import { getNodeStatus } from '@/libs/utils/node-status';
import { NodesIcon, SearchIcon } from './CountryIcons';
import { formatBytes, formatUptime, formatCredits } from './utils';

interface NodeData {
  pubkey: string;
  address: string;
  uptime: number;
  storage_committed: number;
  is_public: boolean;
  last_seen_timestamp: number;
  credits?: number;
}

interface LocationData {
  city?: string;
}

interface CountryNodesTableProps {
  nodes: NodeData[];
  locations: { [ip: string]: LocationData | null };
  countryName: string;
}

export const CountryNodesTable = ({ nodes, locations, countryName }: CountryNodesTableProps) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes;
    const query = searchQuery.toLowerCase();
    return nodes.filter(node => {
      const ip = extractIPFromAddress(node.address || '');
      return (
        ip.includes(query) ||
        node.pubkey?.toLowerCase().includes(query) ||
        locations[ip]?.city?.toLowerCase().includes(query)
      );
    });
  }, [nodes, searchQuery, locations]);

  const handleNodeClick = (node: NodeData) => {
    const ip = extractIPFromAddress(node.address || '');
    if (ip) {
      router.push(`/profile/${encodeURIComponent(ip)}`);
    }
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2">
            <NodesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white">
              Nodes in {countryName}
            </h2>
            <span className="text-white/40 text-xs sm:text-sm">({filteredNodes.length})</span>
          </div>
          <div className="relative">
            <SearchIcon className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder:text-white/40 focus:outline-none focus:border-white/30 w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">IP Address</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">Status</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">Public Key</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">City</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">Uptime</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">Storage</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">Credits</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">Access</th>
            </tr>
          </thead>
          <tbody>
            {filteredNodes.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 sm:px-4 py-6 sm:py-8 text-center text-white/40 text-xs sm:text-sm">
                  {searchQuery ? 'No nodes match your search' : 'No nodes found in this country'}
                </td>
              </tr>
            ) : (
              filteredNodes.map((node) => {
                const ip = extractIPFromAddress(node.address || '');
                const loc = locations[ip];
                const now = Math.floor(Date.now() / 1000);
                const status = getNodeStatus(node.last_seen_timestamp || 0, now);

                return (
                  <tr 
                    key={node.pubkey}
                    onClick={() => handleNodeClick(node)}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-white font-mono text-[10px] sm:text-xs md:text-sm">{ip}</span>
                        <CopyButton text={ip} />
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                        status === 'online' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : status === 'syncing'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {status === 'online' ? 'ACTIVE' : status === 'syncing' ? 'SYNCING' : 'OFFLINE'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-white/60 font-mono text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-[120px]">
                          {node.pubkey?.slice(0, 8)}...{node.pubkey?.slice(-6)}
                        </span>
                        <CopyButton text={node.pubkey} />
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                      {loc?.city || 'Unknown'}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-white font-mono text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                      {formatUptime(node.uptime)}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-white font-mono text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                      {formatBytes(node.storage_committed)}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <span className="text-emerald-400 font-mono text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                        {formatCredits(node.credits || 0)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs whitespace-nowrap ${
                        node.is_public 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-white/10 text-white/40'
                      }`}>
                        {node.is_public ? 'PUBLIC' : 'PRIVATE'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
