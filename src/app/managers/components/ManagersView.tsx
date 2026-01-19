'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { usePrefetchProfile } from '@/libs/hooks/usePrefetchProfile';
import { useNetwork } from '@/libs/context/network-context';
import { useNodesData } from '@/libs/context/nodes-data-context';
import type { ValidatorData } from '@/libs/server';
import { ManagerCard } from './ManagerCard';

// Custom Icons
const SearchIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const UsersIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const FilterIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

// Import managers data
import managersData from '../../../../managers_data/managers_node_data.json';

/** Types for manager data structure */
export interface ManagerNode {
  pnode_pubkey: string;
  registered_time: string;
  node_label: string;
}

export interface Manager {
  manager_index: number;
  manager_address: string;
  nodes: ManagerNode[];
}

interface ManagersDataType {
  summary: {
    total_managers: number;
    total_pnode_pubkeys: number;
  };
  managers: Manager[];
}

const CornerEdges: React.FC = () => (
  <>
    <div className="absolute top-0 left-0 w-4 h-4">
      <div className="absolute top-0 left-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
      <div className="absolute top-0 left-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
    </div>
    <div className="absolute top-0 right-0 w-4 h-4">
      <div className="absolute top-0 right-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
      <div className="absolute top-0 right-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
    </div>
    <div className="absolute bottom-0 left-0 w-4 h-4">
      <div className="absolute bottom-0 left-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
      <div className="absolute bottom-0 left-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
    </div>
    <div className="absolute bottom-0 right-0 w-4 h-4">
      <div className="absolute bottom-0 right-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
      <div className="absolute bottom-0 right-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
    </div>
  </>
);

export interface ManagersViewProps {
  mainnetValidators: ValidatorData[];
  devnetValidators: ValidatorData[];
}

export function ManagersView({ mainnetValidators, devnetValidators }: ManagersViewProps) {
  const { navigateToProfile } = usePrefetchProfile();
  const { isMainnet } = useNetwork();
  const { nodes: contextNodes, isLoading: isContextLoading } = useNodesData();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllManagers, setShowAllManagers] = useState(false);
  const itemsPerPage = 20;

  // Type the imported data
  const data = managersData as ManagersDataType;

  // Determine active validators for the current view (priority: context -> props)
  const activeNetworkNodes = useMemo(() => {
    // If context has data (even empty array after loading), use it. 
    // If loading, fall back to props to avoid flicker.
    if (!isContextLoading) return contextNodes;
    return isMainnet ? mainnetValidators : devnetValidators;
  }, [contextNodes, isContextLoading, isMainnet, mainnetValidators, devnetValidators]);

  // Create pubkey maps for O(1) lookup
  const pubkeyMaps = useMemo(() => {
    const active = new Map<string, ValidatorData>();
    const mainnet = new Set<string>();
    const devnet = new Set<string>();

    activeNetworkNodes.forEach(v => {
      if (v.pubkey) active.set(v.pubkey, v as ValidatorData);
    });

    mainnetValidators.forEach(v => {
      if (v.pubkey) mainnet.add(v.pubkey);
    });

    devnetValidators.forEach(v => {
      if (v.pubkey) devnet.add(v.pubkey);
    });

    return { active, mainnet, devnet };
  }, [activeNetworkNodes, mainnetValidators, devnetValidators]);

  // Helper function to count active nodes for a manager (on current view network)
  const getActiveNodeCount = useCallback((manager: Manager): number => {
    return manager.nodes.filter(n => pubkeyMaps.active.has(n.pnode_pubkey)).length;
  }, [pubkeyMaps.active]);

  // Helper to get network status for badge
  const getNetworkStatus = useCallback((manager: Manager): 'mainnet' | 'devnet' | 'both' | 'none' => {
    const hasMainnet = manager.nodes.some(n => pubkeyMaps.mainnet.has(n.pnode_pubkey));
    const hasDevnet = manager.nodes.some(n => pubkeyMaps.devnet.has(n.pnode_pubkey));

    // If showing all managers, show their actual cross-network status
    if (showAllManagers) {
      if (hasMainnet && hasDevnet) return 'both';
      if (hasMainnet) return 'mainnet';
      if (hasDevnet) return 'devnet';
      return 'none';
    }

    // If not showing all, we are filtered to the current network only.
    // User requested to show only the current network badge in this case, even if they are on both.
    return isMainnet ? 'mainnet' : 'devnet';
  }, [pubkeyMaps.mainnet, pubkeyMaps.devnet, showAllManagers, isMainnet]);

  // Create a combined map for IP lookup
  const allValidatorsMap = useMemo(() => {
    const map = new Map<string, string>();
    [...mainnetValidators, ...devnetValidators].forEach(v => {
      if (v.pubkey && v.address) {
        map.set(v.pubkey, v.address);
      }
    });
    return map;
  }, [mainnetValidators, devnetValidators]);

  // Filter and sort managers
  const filteredManagers = useMemo(() => {
    let managers = data.managers;

    // Filter by search query if present
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      managers = managers.filter(manager => {
        // Search by manager address
        if (manager.manager_address.toLowerCase().includes(query)) return true;
        // Search by any node pubkey or IP
        if (manager.nodes.some(n => {
          if (n.pnode_pubkey.toLowerCase().includes(query)) return true;
          const ip = allValidatorsMap.get(n.pnode_pubkey);
          return ip && ip.toLowerCase().includes(query);
        })) return true;
        return false;
      });
    }

    // Filter by Network (unless "Show All" is checked)
    if (!showAllManagers) {
      managers = managers.filter(manager => {
        // Must have at least one node in the CURRENT network view
        return getActiveNodeCount(manager) > 0;
      });
    }

    // Sort: managers with active nodes first, then by active count descending, then by total nodes
    return [...managers].sort((a, b) => {
      const aActive = getActiveNodeCount(a);
      const bActive = getActiveNodeCount(b);

      // Primary: sort by active node count (descending)
      if (bActive !== aActive) return bActive - aActive;

      // Secondary: sort by total nodes (descending)
      return b.nodes.length - a.nodes.length;
    });
  }, [data.managers, searchQuery, getActiveNodeCount, showAllManagers, allValidatorsMap]);

  // Paginate
  const { paginatedManagers, totalPages } = useMemo(() => {
    const total = Math.ceil(filteredManagers.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    return {
      paginatedManagers: filteredManagers.slice(start, start + itemsPerPage),
      totalPages: total
    };
  }, [filteredManagers, currentPage, itemsPerPage]);

  // Reset page on search or filter change
  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  // Navigate to profile with loading toast
  const handleNavigateToProfile = useCallback((ip: string) => {
    toast.loading('Loading node profile...', { id: 'node-profile-loading' });
    navigateToProfile(ip);
  }, [navigateToProfile]);

  return (
    <div className="space-y-6">
      {/* Data Sources Card - placed at top for visibility */}
      <div className="relative bg-black/50 border border-white/10 rounded-lg p-4 group hover:border-white/20 transition-all duration-300">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4">
          <div className="absolute top-0 left-0 w-2 h-px bg-emerald-500/40"></div>
          <div className="absolute top-0 left-0 w-px h-2 bg-emerald-500/40"></div>
        </div>
        <div className="absolute top-0 right-0 w-4 h-4">
          <div className="absolute top-0 right-0 w-2 h-px bg-emerald-500/40"></div>
          <div className="absolute top-0 right-0 w-px h-2 bg-emerald-500/40"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-4 h-4">
          <div className="absolute bottom-0 left-0 w-2 h-px bg-emerald-500/40"></div>
          <div className="absolute bottom-0 left-0 w-px h-2 bg-emerald-500/40"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-4 h-4">
          <div className="absolute bottom-0 right-0 w-2 h-px bg-emerald-500/40"></div>
          <div className="absolute bottom-0 right-0 w-px h-2 bg-emerald-500/40"></div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                <path d="M2 12h20" />
              </svg>
            </div>
            <span className="text-white/50 text-xs font-medium">Data Sources</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <a
              href="https://seenodes.xandeum.network/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full transition-all duration-200 group/link"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
              <span className="text-white/70 text-[10px] group-hover/link:text-white transition-colors">seenodes.xandeum.network</span>
              <svg className="w-2.5 h-2.5 text-white/40 group-hover/link:text-white/60 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
              </svg>
            </a>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
              <span className="text-white/70 text-[10px]">Helius RPC</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 border border-white/10 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <span className="text-white/70 text-[10px]">pNodes Network</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="relative bg-black border border-white/10 p-4 group hover:border-white/20 transition-all duration-300">
          <CornerEdges />
          <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Total Managers</div>
          <div className="text-2xl font-bold text-white font-mono">{data.summary.total_managers}</div>
        </div>
        <div className="relative bg-black border border-white/10 p-4 group hover:border-white/20 transition-all duration-300">
          <CornerEdges />
          <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Registered Nodes</div>
          <div className="text-2xl font-bold text-white font-mono">{data.summary.total_pnode_pubkeys}</div>
        </div>
        <div className="relative bg-black border border-white/10 p-4 col-span-2 sm:col-span-1 group hover:border-white/20 transition-all duration-300">
          <CornerEdges />
          <div className="text-white/50 text-xs uppercase tracking-wider mb-1">Active in {isMainnet ? 'Mainnet' : 'Devnet'}</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {data.managers.reduce((acc, m) => acc + m.nodes.filter(n => pubkeyMaps.active.has(n.pnode_pubkey)).length, 0)}
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by manager address, node pubkey, or node IP..."
            className="w-full bg-black border border-white/10 pl-11 pr-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-white/20 transition-colors text-sm"
          />
        </div>

        <label
          onClick={() => {
            setShowAllManagers(prev => !prev);
            setCurrentPage(1);
          }}
          className="flex items-center gap-3 px-4 py-3 bg-black border border-white/10 hover:border-white/20 cursor-pointer select-none transition-colors group"
        >
          <div className={`w-4 h-4 border border-white/30 flex items-center justify-center transition-colors ${showAllManagers ? 'bg-emerald-500/20 border-emerald-500' : 'group-hover:border-white/50'}`}>
            {showAllManagers && <div className="w-2 h-2 bg-emerald-500" />}
          </div>
          <span className="text-white/70 text-sm font-medium">Show All Managers</span>
        </label>
      </div>

      {/* Results count */}
      <div className="text-white/50 text-sm">
        Showing {paginatedManagers.length} of {filteredManagers.length} managers
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      {/* Managers grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {paginatedManagers.map((manager) => (
          <ManagerCard
            key={manager.manager_address}
            manager={manager}
            pubkeyToNode={pubkeyMaps.active}
            onNavigateToProfile={handleNavigateToProfile}
            networkStatus={getNetworkStatus(manager)}
          />
        ))}
      </div>

      {/* Empty state */}
      {paginatedManagers.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <div className="text-white/50 text-lg">No managers found</div>
          {searchQuery ? (
            <div className="text-white/30 text-sm mt-2">
              Try adjusting your search query
            </div>
          ) : (
            <div className="text-white/30 text-sm mt-2">
              {showAllManagers ? "No managers registered." : "No active managers found on this network. Try 'Show All Managers'."}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 bg-black border border-white/10 text-white/60 hover:text-white hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 text-sm"
          >
            Previous
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (currentPage <= 3) pageNum = i + 1;
              else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-1.5 text-sm transition-all duration-300 ${currentPage === pageNum
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 bg-black border border-white/10 text-white/60 hover:text-white hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 text-sm"
          >
            Next
          </button>
        </div>
      )}


    </div>
  );
}
