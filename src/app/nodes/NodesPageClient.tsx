'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Pagination, ValidatorTableSkeleton, SearchBox } from '@/components/ui';
import { extractIPFromAddress, formatLocation, getCountryFlagUrl } from '@/libs/services/geolocation';
import { useStaggeredScrollAnimation } from '@/libs/hooks/useScrollAnimation';
import { usePrefetchProfile } from '@/libs/hooks/usePrefetchProfile';
import { toast } from 'sonner';
import { useNetwork } from '@/libs/context/network-context';
import { useNodesData as useSharedNodesData } from '@/libs/context/nodes-data-context';
import { filterAndSortValidators } from '@/libs/server';
import type { ValidatorData } from '@/libs/server';

// Import extracted components and hooks
import { 
  NodesPageHeader, 
  NodesStats, 
  NodesFilters, 
  ResponsiveNodesTable 
} from './components';
import { 
  useNodesFilters, 
  useNodesLocation, 
  useNodesCredits,
} from './hooks';
import { CustomDropdown, CaptchaGate } from '@/components/ui';

// Compare icon
const CompareIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3h5v5M8 3H3v5M3 16v5h5M21 16v5h-5M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"/>
  </svg>
);

interface NodesPageClientProps {
  allValidators: ValidatorData[];
  initialPagination: {
    currentPage: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    totalCount: number;
  };
  initialStats: {
    total: number;
    online: number;
    public: number;
  };
}

export function NodesPageClientRefactored({ 
  allValidators: initialValidators, 
  initialPagination,
  initialStats
}: NodesPageClientProps) {
  const router = useRouter();
  const { network, isMainnet } = useNetwork();
  const [mounted, setMounted] = useState(false);
  const [clickedNodeId, setClickedNodeId] = useState<string | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  // Clear compare selection when network changes
  useEffect(() => {
    setSelectedForCompare([]);
  }, [network]);

  // Use shared nodes data context - single source of truth for all components
  const { nodes: sharedNodes, geoData, stats: sharedStats, isLoading: isLoadingShared, dataFetchTime: sharedDataFetchTime } = useSharedNodesData();
  
  // Transform shared nodes to ValidatorData format
  const allValidators = useMemo((): ValidatorData[] => {
    return sharedNodes.map((node, index) => ({
      address: node.address || '',
      pubkey: node.pubkey || `node-${index}`,
      is_public: node.is_public || false,
      storage_committed: node.storage_committed || 0,
      storage_used: node.storage_used || 0,
      usage_percent: node.storage_usage_percent || 0,
      storage_usage_percent: node.storage_usage_percent || 0,
      rpc_port: node.rpc_port || 0,
      version: node.version || '',
      uptime: node.uptime || 0,
      last_seen_timestamp: node.last_seen_timestamp || 0,
      status: node.status,
      score: 0,
      rank: index + 1,
      duplicateCount: 0,
      isDuplicate: false,
      credits: node.credits,
      country: node.country,
      country_code: node.country_code,
      provider: node.provider,
    }));
  }, [sharedNodes]);

  const dataFetchTime = sharedDataFetchTime;
  const stats = {
    total: sharedStats.total,
    online: sharedStats.online,
    public: sharedStats.public,
  };

  const { locations } = useNodesLocation(allValidators);
  const { credits } = useNodesCredits(allValidators, network);

  // For mainnet, merge external geo data with ip-api.com location data for city info
  const mergedLocations = useMemo(() => {
    if (isMainnet) {
      const merged: Record<string, any> = {};
      
      for (const [ip, loc] of Object.entries(locations)) {
        if (loc) {
          merged[ip] = { ...loc };
        }
      }
      
      // Then, enrich with geo data from Source B (has provider info)
      if (Object.keys(geoData).length > 0) {
        for (const [ip, data] of Object.entries(geoData)) {
          if (merged[ip]) {
            // Merge: keep city from ip-api, use provider from geo if better
            merged[ip] = {
              ...merged[ip],
              provider: data.provider || merged[ip].provider,
              // If ip-api didn't have country, use geo data
              country: merged[ip].country || data.country,
              country_code: merged[ip].country_code || data.country_code,
            };
          } else {
            // No ip-api data, use geo data only
            merged[ip] = {
              country: data.country,
              country_code: data.country_code,
              city: '', // No city from geo data
              region: '',
              provider: data.provider || 'Unknown',
              ip,
            };
          }
        }
      }
      
      return merged;
    }
    return locations;
  }, [isMainnet, geoData, locations]);

  // For both mainnet and devnet, use credits from useNodesCredits hook (fetches from pod-credits API)
  // The credits hook already handles network-specific API endpoints
  const mergedCredits = credits;
  
  // Filters and pagination
  const {
    validators,
    pagination,
    quickStats,
    availableVersions,
    searchQuery,
    selectedFilters,
    versionFilter,
    sortBy,
    isPending,
    handleFilterChange,
    handleSearchChange,
    handleVersionFilterChange,
    handleSort,
    handlePageChange,
  } = useNodesFilters(allValidators, dataFetchTime, network);

  const { prefetchProfile, navigateToProfile } = usePrefetchProfile();

  // Toggle node for comparison
  const handleToggleCompare = useCallback((pubkey: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(pubkey)) {
        return prev.filter(p => p !== pubkey);
      }
      if (prev.length >= 4) return prev;
      return [...prev, pubkey];
    });
  }, []);

  // Navigate to compare page with selected nodes
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

  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Read search query from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get('search');
      if (searchParam) {
        handleSearchChange(searchParam);
      }
    }
  }, []);

  const copyToClipboard = async (text: string, type: string = 'text') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  const navigateToNodeProfile = (address: string, nodeId?: string) => {
    const ip = extractIPFromAddress(address);
    if (ip) {
      if (nodeId) setClickedNodeId(nodeId);
      
      toast.loading('Loading node profile...', { 
        id: 'node-profile-loading'
      });
      
      navigateToProfile(ip);
      setTimeout(() => setClickedNodeId(null), 2000);
    }
  };

  const prefetchNodeProfile = (address: string) => {
    const ip = extractIPFromAddress(address);
    if (ip) {
      prefetchProfile(ip);
    }
  };

  // Export filtered data to CSV
  const exportToCSV = () => {
    const filteredData = filterAndSortValidators(
      allValidators,
      {
        search: searchQuery,
        onlyPublic: selectedFilters.onlyPublic,
        hideHighStake: selectedFilters.hideHighStake,
        showDuplicates: selectedFilters.showDuplicates,
        onlyOnline: selectedFilters.onlyOnline,
        onlyInactive: selectedFilters.onlyInactive,
        onlySyncing: selectedFilters.onlySyncing,
        versionFilter: versionFilter,
      },
      { field: sortBy, direction: 'desc' },
      network
    );

    const headers = ['Location', 'IP', 'Country', 'City', 'Pubkey', 'Public', 'Storage (GB)', 'Usage %', 'Version', 'Uptime', 'Last Seen', 'Credits', 'Status'];
    
    const rows = filteredData.map(validator => {
      const ip = extractIPFromAddress(validator.address || '');
      const location = locations[ip];
      const nodeCredits = validator.pubkey ? credits[validator.pubkey] : null;
      
      const storageGB = validator.storage_committed ? (validator.storage_committed / (1024**3)).toFixed(1) : '0';
      const usagePercent = validator.storage_usage_percent ? (validator.storage_usage_percent * 100).toFixed(4) : '0.0000';
      const uptimeHours = Math.floor(validator.uptime / 3600);
      const uptimeDays = Math.floor(uptimeHours / 24);
      const uptimeDisplay = uptimeDays > 0 ? `${uptimeDays}d` : `${uptimeHours}h`;
      
      const timeDiff = dataFetchTime - validator.last_seen_timestamp;
      let lastSeenDisplay = '';
      if (timeDiff < 60) lastSeenDisplay = `${timeDiff}s`;
      else if (timeDiff < 3600) lastSeenDisplay = `${Math.floor(timeDiff / 60)}m`;
      else if (timeDiff < 86400) lastSeenDisplay = `${Math.floor(timeDiff / 3600)}h`;
      else lastSeenDisplay = `${Math.floor(timeDiff / 86400)}d`;
      
      return [
        location ? `${location.city}, ${location.country}` : 'Unknown',
        ip || 'Unknown',
        location?.country || 'Unknown',
        location?.city || 'Unknown',
        validator.pubkey || 'Unknown',
        validator.is_public ? 'YES' : 'NO',
        storageGB,
        usagePercent,
        validator.version || 'Unknown',
        uptimeDisplay,
        lastSeenDisplay,
        nodeCredits !== null && nodeCredits !== undefined ? nodeCredits.toString() : '0',
        validator.status === 'online' ? 'ACTIVE' : validator.status === 'syncing' ? 'SYNCING' : 'OFFLINE'
      ];
    });
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pnodes-filtered-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success(`Exported ${filteredData.length} pNodes to CSV`);
  };

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) return null;
    
    return (
      <span className="ml-1 text-blue-400">
        <svg className="w-3 h-3 inline" fill="currentColor" viewBox="0 0 20 20">
          <path d="M15 8l-5 5-5-5h10z"/>
        </svg>
      </span>
    );
  };

  // Prefetch visible nodes on page load
  useEffect(() => {
    if (validators.length > 0) {
      setTimeout(() => {
        validators.slice(0, 5).forEach(validator => {
          const ip = extractIPFromAddress(validator.address || '');
          if (ip) {
            prefetchProfile(ip);
          }
        });
      }, 1000);
    }
  }, [validators, prefetchProfile]);

  // Scroll animations for table rows
  const { elementRef: tableRef, shouldAnimate } = useStaggeredScrollAnimation<HTMLTableElement>(validators.length, {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  });

  return (
    <CaptchaGate
      title="Access pNodes Dashboard"
      description="Please verify you're human to access the pNodes monitoring dashboard."
      cacheKey="nodes-dashboard"
    >
      <div className="space-y-6 max-w-full overflow-hidden">
        <NodesPageHeader />
        <NodesStats />

      <div className="space-y-4 animate-blur-reveal">
        <SearchBox 
          onSearch={handleSearchChange}
          placeholder="Search pNodes..."
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-blur-reveal-1">
          <NodesFilters
            selectedFilters={selectedFilters}
            versionFilter={versionFilter}
            availableVersions={availableVersions}
            quickStats={quickStats}
            onFilterChange={handleFilterChange}
            onVersionFilterChange={handleVersionFilterChange}
          />

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-1 sm:space-x-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm transition-colors"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading state for network switch */}
      {(isLoadingShared && allValidators.length === 0) ? (
        <ValidatorTableSkeleton count={10} />
      ) : (
        <>
          {/* Responsive Table */}
          <div className="animate-blur-reveal-2">
            <ResponsiveNodesTable
              validators={validators}
              locations={mergedLocations}
              credits={mergedCredits}
              dataFetchTime={dataFetchTime}
              clickedNodeId={clickedNodeId}
              shouldAnimate={shouldAnimate}
              onNavigate={navigateToNodeProfile}
              onPrefetch={prefetchNodeProfile}
              onCopy={copyToClipboard}
              extractIP={extractIPFromAddress}
              formatLocation={formatLocation}
              getCountryFlagUrl={getCountryFlagUrl}
              getSortIcon={(column: string) => getSortIcon(column as any)}
              handleSort={(column: string) => handleSort(column as any)}
              sortBy={sortBy}
              selectedForCompare={selectedForCompare}
              onToggleCompare={handleToggleCompare}
              network={network}
            />
          </div>

          {/* Floating Compare Button - rendered via portal to escape overflow:hidden */}
          {selectedForCompare.length > 0 && typeof document !== 'undefined' && createPortal(
            <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 sm:gap-3 bg-black/95 border border-emerald-500/30 rounded-full px-4 sm:px-5 py-2.5 sm:py-3 shadow-lg shadow-emerald-500/20 backdrop-blur-xl animate-blur-reveal safe-area-bottom">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex -space-x-1.5">
                  {selectedForCompare.slice(0, 4).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-[10px] sm:text-xs text-emerald-400 font-bold"
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <span className="text-white/60 text-sm">{selectedForCompare.length} selected</span>
              </div>
              <div className="w-px h-6 sm:h-7 bg-white/10" />
              <button
                onClick={handleClearCompare}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                Clear
              </button>
              <button
                onClick={handleCompareSelected}
                disabled={selectedForCompare.length < 2}
                className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-medium transition-all ${
                  selectedForCompare.length >= 2
                    ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                <CompareIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Compare</span>
              </button>
            </div>,
            document.body
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center animate-blur-reveal-3">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                hasNext={pagination.hasNext}
                hasPrev={pagination.hasPrev}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
      </div>
    </CaptchaGate>
  );
}


// Export alias for backward compatibility
export { NodesPageClientRefactored as NodesPageClient };
