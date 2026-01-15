'use client';

import React from 'react';
import { FilterBadge, VersionDropdown } from '@/components/ui';

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
}

export const NodesFilters: React.FC<NodesFiltersProps> = ({
  selectedFilters,
  versionFilter,
  availableVersions,
  quickStats,
  onFilterChange,
  onVersionFilterChange,
}) => {
  const isAllSelected = !selectedFilters.onlyPublic && 
    !selectedFilters.onlyOnline && 
    !selectedFilters.onlyInactive && 
    !selectedFilters.onlySyncing && 
    !versionFilter;

  const handleAllClick = () => {
    if (selectedFilters.onlyPublic) onFilterChange('onlyPublic');
    if (selectedFilters.onlyOnline) onFilterChange('onlyOnline');
    if (selectedFilters.onlyInactive) onFilterChange('onlyInactive');
    if (selectedFilters.onlySyncing) onFilterChange('onlySyncing');
    if (versionFilter) onVersionFilterChange('');
  };

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
