'use client';

import { useState, useMemo, useTransition } from 'react';
import { filterAndSortValidators, paginateValidators, type ValidatorData } from '@/libs/server';
import { ManagerAssetData } from './useManagerAssets';

interface FilterState {
  onlyPublic: boolean;
  hideHighStake: boolean;
  showDuplicates: boolean;
  onlyOnline: boolean;
  onlyInactive: boolean;
  onlySyncing: boolean;
}

export function useNodesFilters(
  allValidators: ValidatorData[],
  dataFetchTime: number,
  network: string = 'devnet',
  managerAssets: Map<string, ManagerAssetData> = new Map()
) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<FilterState>({
    onlyPublic: false,
    hideHighStake: false,
    showDuplicates: false,
    onlyOnline: false,
    onlyInactive: false,
    onlySyncing: false,
  });
  const [versionFilter, setVersionFilter] = useState<string>('');
  const [managerFilter, setManagerFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'address' | 'location' | 'pubkey' | 'public' | 'storage_committed' | 'storage_used' | 'usage_percent' | 'rpc_port' | 'version' | 'uptime' | 'last_seen' | 'status' | 'credits'>('last_seen');
  const [isPending, startTransition] = useTransition();

  const hasActiveFilters = searchQuery !== '' || selectedFilters.onlyPublic || selectedFilters.hideHighStake || selectedFilters.showDuplicates || selectedFilters.onlyOnline || selectedFilters.onlyInactive || selectedFilters.onlySyncing || versionFilter !== '' || managerFilter !== 'all';

  const { validators, pagination, quickStats, availableVersions } = useMemo(() => {
    // 1. Filter by Manager Status
    let managerFilteredValidators = allValidators;
    if (managerFilter !== 'all') {
      managerFilteredValidators = allValidators.filter(v => {
        const isRegistered = !!v.manager_pubkey;

        // Use data from managerAssets map if available, otherwise fall back to validator data
        const assets = v.manager_pubkey ? managerAssets.get(v.manager_pubkey) : undefined;

        // Determine if there are NFTs or SBTs based on fetched assets
        const hasNfts = (assets?.nft_count || 0) > 0 || (assets?.nft_names?.length || 0) > 0;
        const hasSbts = (assets?.sbt_count || 0) > 0 || (assets?.sbt_names?.length || 0) > 0;
        const hasAssets = hasNfts || hasSbts; // Combined check for any assets

        if (managerFilter === 'registered') return isRegistered;
        if (managerFilter === 'with_nfts') return isRegistered && hasAssets;
        if (managerFilter === 'non_nft_registered') return isRegistered && !hasAssets;
        if (managerFilter === 'non_registered') return !isRegistered;
        return true;
      });
    }

    const filtered = filterAndSortValidators(
      managerFilteredValidators,
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

    const paginated = paginateValidators(filtered, currentPage, pageSize);

    // Count nodes that are duplicates (have duplicateCount > 0)
    const duplicateCount = allValidators.filter(v => v.duplicateCount && v.duplicateCount > 0).length;
    // Total is just the number of unique validators (matching API response)
    const total = allValidators.length;
    const referenceTime = dataFetchTime;

    const calculatedStats = hasActiveFilters ? {
      total: total,
      online: filtered.filter(v => {
        const timeDiff = referenceTime - v.last_seen_timestamp;
        return timeDiff < 1800;
      }).length,
      syncing: filtered.filter(v => {
        const timeDiff = referenceTime - v.last_seen_timestamp;
        return timeDiff >= 1800 && timeDiff < 3600;
      }).length,
      public: filtered.filter(v => v.is_public).length,
      inactive: filtered.filter(v => {
        const timeDiff = referenceTime - v.last_seen_timestamp;
        return timeDiff >= 3600;
      }).length,
    } : {
      total: total,
      online: allValidators.filter(v => {
        const timeDiff = referenceTime - v.last_seen_timestamp;
        return timeDiff < 1800;
      }).length,
      syncing: allValidators.filter(v => {
        const timeDiff = referenceTime - v.last_seen_timestamp;
        return timeDiff >= 1800 && timeDiff < 3600;
      }).length,
      public: allValidators.filter(v => v.is_public).length,
      inactive: allValidators.filter(v => {
        const timeDiff = referenceTime - v.last_seen_timestamp;
        return timeDiff >= 3600;
      }).length,
    };

    const allVersions = allValidators.map(v => v.version).filter(Boolean);
    const uniqueVersions = Array.from(new Set(allVersions)).sort((a, b) => {
      const parseVersion = (version: string) => version.split('.').map(num => parseInt(num, 10));
      const versionA = parseVersion(a);
      const versionB = parseVersion(b);

      for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
        const partA = versionA[i] || 0;
        const partB = versionB[i] || 0;
        if (partA !== partB) return partB - partA;
      }
      return 0;
    });

    return {
      validators: paginated.validators,
      pagination: {
        currentPage,
        totalPages: paginated.totalPages,
        hasNext: paginated.hasNext,
        hasPrev: paginated.hasPrev,
        totalCount: filtered.length,
      },
      quickStats: { ...calculatedStats, duplicates: duplicateCount, syncing: calculatedStats.syncing || 0 },
      availableVersions: uniqueVersions
    };
  }, [allValidators, searchQuery, selectedFilters, versionFilter, managerFilter, sortBy, currentPage, pageSize, hasActiveFilters, dataFetchTime, network, managerAssets]);

  const handleFilterChange = (filterKey: keyof FilterState) => {
    startTransition(() => {
      setSelectedFilters(prev => {
        const newFilters = { ...prev };

        if (filterKey === 'onlyOnline' && !prev.onlyOnline) {
          newFilters.onlyInactive = false;
          newFilters.onlySyncing = false;
          newFilters.onlyOnline = true;
        } else if (filterKey === 'onlySyncing' && !prev.onlySyncing) {
          newFilters.onlyOnline = false;
          newFilters.onlyInactive = false;
          newFilters.onlySyncing = true;
        } else if (filterKey === 'onlyInactive' && !prev.onlyInactive) {
          newFilters.onlyOnline = false;
          newFilters.onlySyncing = false;
          newFilters.onlyInactive = true;
        } else {
          newFilters[filterKey] = !prev[filterKey];
        }

        return newFilters;
      });
      setCurrentPage(1);
    });
  };

  const handleSearchChange = (value: string) => {
    startTransition(() => {
      setSearchQuery(value);
      setCurrentPage(1);
    });
  };

  const handleVersionFilterChange = (version: string) => {
    startTransition(() => {
      setVersionFilter(version);
      setCurrentPage(1);
    });
  };

  const handleManagerFilterChange = (filter: string) => {
    startTransition(() => {
      setManagerFilter(filter);
      setCurrentPage(1);
    });
  };

  const handleSort = (column: typeof sortBy) => {
    startTransition(() => {
      setSortBy(column);
      setCurrentPage(1);
    });
  };

  const handlePageChange = (page: number) => {
    startTransition(() => {
      setCurrentPage(page);
    });
  };

  return {
    validators,
    pagination,
    quickStats,
    availableVersions,
    searchQuery,
    selectedFilters,
    versionFilter,
    managerFilter,
    sortBy,
    isPending,
    handleFilterChange,
    handleSearchChange,
    handleVersionFilterChange,
    handleManagerFilterChange,
    handleSort,
    handlePageChange,
  };
}
