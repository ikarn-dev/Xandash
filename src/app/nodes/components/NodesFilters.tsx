'use client';

import React from 'react';
import { FilterBadge, VersionDropdown, CustomDropdown } from '@/components/ui';

type FilterKey = 'onlyPublic' | 'hideHighStake' | 'showDuplicates' | 'onlyOnline' | 'onlyInactive' | 'onlySyncing';

interface NodesFiltersProps {
  selectedFilters: {
    onlyPublic: boolean;
    hideHighStake: boolean;
    showDuplicates: boolean;
    onlyOnline: boolean;
    onlyInactive: boolean;
    onlySyncing: boolean;
  };
  versionFilter: string;
  managerFilter: string;
  availableVersions: string[];
  quickStats: {
    total: number;
    online: number;
    syncing: number;
    inactive: number;
    public: number;
    duplicates: number;
  };
  onFilterChange: (filterKey: FilterKey) => void;
  onVersionFilterChange: (version: string) => void;
  onManagerFilterChange: (filter: string) => void;
}

export const NodesFilters: React.FC<NodesFiltersProps> = ({
  selectedFilters,
  versionFilter,
  managerFilter,
  availableVersions,
  quickStats,
  onFilterChange,
  onVersionFilterChange,
  onManagerFilterChange,
}) => {
  const isAllSelected = !selectedFilters.onlyPublic &&
    !selectedFilters.onlyOnline &&
    !selectedFilters.onlyInactive &&
    !selectedFilters.onlySyncing &&
    !versionFilter &&
    (managerFilter === 'all' || !managerFilter);

  const handleAllClick = () => {
    if (selectedFilters.onlyPublic) onFilterChange('onlyPublic');
    if (selectedFilters.onlyOnline) onFilterChange('onlyOnline');
    if (selectedFilters.onlyInactive) onFilterChange('onlyInactive');
    if (selectedFilters.onlySyncing) onFilterChange('onlySyncing');
    if (versionFilter) onVersionFilterChange('');
    if (managerFilter !== 'all') onManagerFilterChange('all');
  };

  const managerOptions = [
    { value: 'all', label: 'All Managers' },
    { value: 'registered', label: 'Registered' },
    { value: 'with_nfts', label: 'With NFTs' },
    { value: 'non_nft_registered', label: 'Registered (No NFTs)' },
    { value: 'non_registered', label: 'Non-Registered' },
  ];

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
      <FilterBadge
        label={`All (${quickStats.total})`}
        active={isAllSelected}
        onClick={handleAllClick}
      />
      <FilterBadge
        label={`Active (${quickStats.online})`}
        active={selectedFilters.onlyOnline}
        onClick={() => onFilterChange('onlyOnline')}
        color="green"
      />
      <FilterBadge
        label={`Syncing (${quickStats.syncing})`}
        active={selectedFilters.onlySyncing}
        onClick={() => onFilterChange('onlySyncing')}
        color="amber"
      />
      <FilterBadge
        label={`Offline (${quickStats.inactive})`}
        active={selectedFilters.onlyInactive}
        onClick={() => onFilterChange('onlyInactive')}
        color="red"
      />
      <FilterBadge
        label={`Public (${quickStats.public})`}
        active={selectedFilters.onlyPublic}
        onClick={() => onFilterChange('onlyPublic')}
        color="blue"
      />

      {/* Manager Filter Dropdown */}
      <CustomDropdown
        value={managerFilter || 'all'}
        options={managerOptions}
        onChange={onManagerFilterChange}
        placeholder="All Managers"
        showActiveState={true}
      />

      <FilterBadge
        label={`Duplicates (${quickStats.duplicates})`}
        active={selectedFilters.showDuplicates}
        onClick={() => onFilterChange('showDuplicates')}
        color="purple"
      />

      {/* Version Filter Dropdown */}
      {availableVersions && availableVersions.length > 0 && (
        <VersionDropdown
          value={versionFilter}
          options={availableVersions}
          onChange={onVersionFilterChange}
          placeholder="All Versions"
        />
      )}
    </div>
  );
};
