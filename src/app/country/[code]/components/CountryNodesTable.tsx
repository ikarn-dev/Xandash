'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CopyBtn as CopyButton } from '@/components/ui/CopyBtn';
import { ManagerBadge } from '@/components/ui/ManagerBadge';
import { extractIPFromAddress } from '@/libs/services/geolocation';
import { getNodeStatus } from '@/libs/utils/node-status';
import { getNodeName, hasNodeName } from '@/libs/utils/node-names';
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
  rpc_port?: number;
  manager_pubkey?: string;
  manager_nft_count?: number;
  manager_sbt_count?: number;
  manager_nft_names?: string[];
  manager_sbt_names?: string[];
}

interface LocationData {
  city?: string;
}

interface ManagerAssetData {
  manager_pubkey: string;
  nft_count: number;
  sbt_count: number;
  xand_balance: number;
  last_updated: number;
  nft_names: string[];
  sbt_names: string[];
}

interface CountryNodesTableProps {
  nodes: NodeData[];
  locations: { [ip: string]: LocationData | null };
  countryName: string;
  network?: string;
}

export const CountryNodesTable = ({ nodes, locations, countryName, network = 'devnet' }: CountryNodesTableProps) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [managerAssets, setManagerAssets] = useState<Map<string, ManagerAssetData>>(new Map());

  // Fetch manager assets for nodes with managers
  useEffect(() => {
    const managersToFetch = nodes
      .filter(node => node.manager_pubkey)
      .map(node => node.manager_pubkey!)
      .filter((addr, i, arr) => arr.indexOf(addr) === i); // unique

    if (managersToFetch.length === 0) return;

    const fetchAssets = async () => {
      try {
        const response = await fetch('/api/manager-assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ addresses: managersToFetch }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.managers) {
            setManagerAssets(new Map(Object.entries(data.managers)));
          }
        }
      } catch (error) {
        console.error('Failed to fetch manager assets:', error);
      }
    };

    fetchAssets();
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes;
    const query = searchQuery.toLowerCase();
    return nodes.filter(node => {
      const ip = extractIPFromAddress(node.address || '');
      const name = getNodeName(node.pubkey);
      return (
        ip.includes(query) ||
        node.pubkey?.toLowerCase().includes(query) ||
        locations[ip]?.city?.toLowerCase().includes(query) ||
        name.toLowerCase().includes(query) ||
        (node.manager_pubkey && node.manager_pubkey.toLowerCase().includes(query))
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
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b border-white/10 text-left">
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">Name</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">IP Address</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">Manager Assets</th>
              <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">Status</th>
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
                <td colSpan={9} className="px-3 sm:px-4 py-6 sm:py-8 text-center text-white/40 text-xs sm:text-sm">
                  {searchQuery ? 'No nodes match your search' : 'No nodes found in this country'}
                </td>
              </tr>
            ) : (
              filteredNodes.map((node) => {
                const ip = extractIPFromAddress(node.address || '');
                const loc = locations[ip];
                const now = Math.floor(Date.now() / 1000);
                const status = getNodeStatus(node.last_seen_timestamp || 0, now);
                const nodeName = getNodeName(node.pubkey);
                const hasName = hasNodeName(node.pubkey);
                const assets = node.manager_pubkey ? managerAssets.get(node.manager_pubkey) : null;

                return (
                  <tr
                    key={node.pubkey}
                    onClick={() => handleNodeClick(node)}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      {hasName ? (
                        <span className="text-cyan-400 font-medium text-[10px] sm:text-xs md:text-sm">{nodeName}</span>
                      ) : (
                        <span className="text-white/30 text-[10px] sm:text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-white font-mono text-[10px] sm:text-xs md:text-sm">{ip}</span>
                        <CopyButton text={ip} />
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3" onClick={(e) => e.stopPropagation()}>
                      {node.manager_pubkey ? (
                        <ManagerBadge
                          managerPubkey={node.manager_pubkey}
                          nftCount={assets?.nft_count}
                          sbtCount={assets?.sbt_count}
                          nftNames={assets?.nft_names}
                          sbtNames={assets?.sbt_names}
                        />
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] bg-gray-500/20 text-gray-400 border border-gray-500/30 whitespace-nowrap">
                          Not Registered
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3">
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${status === 'online'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : status === 'syncing'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                        {status === 'online' ? 'ACTIVE' : status === 'syncing' ? 'SYNCING' : 'OFFLINE'}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                      {loc?.city && loc.city !== 'Unknown' ? loc.city : '—'}
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
                      <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs whitespace-nowrap ${node.is_public
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
