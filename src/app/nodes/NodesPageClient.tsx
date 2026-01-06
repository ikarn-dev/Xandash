'use client';

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Pagination, ValidatorTableSkeleton, SearchBox } from '@/components/ui';
import { extractIPFromAddress, formatLocation, getCountryFlagUrl } from '@/libs/services/geolocation';
import { useStaggeredScrollAnimation } from '@/libs/hooks/useScrollAnimation';
import { usePrefetchProfile } from '@/libs/hooks/usePrefetchProfile';
import { toast } from 'sonner';
import { useNetwork } from '@/libs/context/network-context';
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
  useNodesData, 
  useNodesFilters, 
  useNodesLocation, 
  useNodesCredits 
} from './hooks';
import { CustomDropdown, CaptchaGate } from '@/components/ui';

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
  const { network } = useNetwork();
  const [mounted, setMounted] = useState(false);
  const [clickedNodeId, setClickedNodeId] = useState<string | null>(null);

  // Custom hooks for data management
  const { allValidators, dataFetchTime, stats, isLoadingNetwork, fetchData } = useNodesData(network);
  const { locations } = useNodesLocation(allValidators);
  const { credits } = useNodesCredits(allValidators, network);
  
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
  } = useNodesFilters(allValidators, dataFetchTime);

  const { prefetchProfile, navigateToProfile } = usePrefetchProfile();

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
      { field: sortBy, direction: 'desc' }
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
      {isLoadingNetwork ? (
        <ValidatorTableSkeleton count={10} />
      ) : (
        <>
          {/* Responsive Table */}
          <div className="animate-blur-reveal-2">
            <ResponsiveNodesTable
              validators={validators}
              locations={locations}
              credits={credits}
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
            />
          </div>

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
