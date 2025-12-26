'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

export interface Validator {
  address: string;
  is_public: boolean;
  last_seen_timestamp: number;
  pubkey: string;
  rpc_port: number;
  storage_committed: number;
  storage_usage_percent: number;
  storage_used: number;
  uptime: number;
  version: string;
}

export interface ValidatorsResponse {
  pods: Validator[];
  total_count: number;
}

export interface ValidatorStats {
  totalNodes: number;
  onlineNodes: number;
  totalConnections: number;
  avgCpu: number;
  avgMemory: number;
}

export interface UseValidatorsFilters {
  search?: string;
  onlyPublic?: boolean;
  hideHighStake?: boolean;
  minUptime?: number;
  status?: 'all' | 'online' | 'offline' | 'maintenance';
}

export interface UseValidatorsSort {
  field: 'score' | 'uptime' | 'storage' | 'version' | 'address';
  direction: 'asc' | 'desc';
}

export interface UseValidatorsPagination {
  page: number;
  pageSize: number;
}

// Helper function to determine validator status
const getValidatorStatus = (lastSeenTimestamp: number): 'online' | 'maintenance' | 'offline' => {
  const now = Math.floor(Date.now() / 1000);
  const timeDiff = now - lastSeenTimestamp;
  
  if (timeDiff < 300) return 'online'; // Less than 5 minutes
  if (timeDiff < 3600) return 'maintenance'; // Less than 1 hour
  return 'offline'; // More than 1 hour
};

// Helper function to calculate validator score
const calculateValidatorScore = (validator: Validator): number => {
  const status = getValidatorStatus(validator.last_seen_timestamp);
  const baseScore = status === 'online' ? 100 : status === 'maintenance' ? 50 : 0;
  const uptimeScore = Math.min((validator.uptime / (24 * 3600)) * 10, 10); // Max 10 points for 24h+ uptime
  const storageScore = validator.storage_committed > 0 ? 5 : 0;
  const publicScore = validator.is_public ? 2 : 0;
  
  return Math.min(baseScore + uptimeScore + storageScore + publicScore, 100);
};

// Main hook to fetch all validators
export const useAllValidators = () => {
  return useQuery({
    queryKey: ['validators', 'all'],
    queryFn: async (): Promise<ValidatorsResponse> => {
      const response = await fetch('/api/nodes?page=1&limit=1000'); // Fetch all at once
      
      if (!response.ok) {
        throw new Error('Failed to fetch validators');
      }
      
      const data = await response.json();
      return {
        pods: data.nodes || [],
        total_count: data.pagination?.total || 0
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - validators don't change that frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // Auto-refetch every 5 minutes
  });
};

// Hook for validator statistics
export const useValidatorStats = () => {
  return useQuery({
    queryKey: ['validator-stats'],
    queryFn: async (): Promise<ValidatorStats> => {
      const response = await fetch('/api/nodes/stats');
      
      if (!response.ok) {
        throw new Error('Failed to fetch validator stats');
      }
      
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 2 * 60 * 1000, // Auto-refetch every 2 minutes
  });
};

// Main hook with filtering, sorting, and pagination
export const useValidators = (
  filters: UseValidatorsFilters = {},
  sort: UseValidatorsSort = { field: 'score', direction: 'desc' },
  pagination: UseValidatorsPagination = { page: 1, pageSize: 12 }
) => {
  const { data: allValidatorsData, isLoading, error, refetch } = useAllValidators();
  
  const processedData = useMemo(() => {
    if (!allValidatorsData?.pods) {
      return {
        validators: [],
        totalCount: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      };
    }

    let filtered = allValidatorsData.pods.filter((validator) => {
      // Search filter
      if (filters.search) {
        const query = filters.search.toLowerCase();
        if (!validator.address?.toLowerCase().includes(query) && 
            !validator.pubkey?.toLowerCase().includes(query) &&
            !validator.version?.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        const status = getValidatorStatus(validator.last_seen_timestamp);
        if (status !== filters.status) return false;
      }

      // Other filters
      if (filters.onlyPublic && !validator.is_public) return false;
      if (filters.hideHighStake && validator.storage_committed > 50000000000) return false; // > 50GB
      if (filters.minUptime && validator.uptime < filters.minUptime) return false;
      
      return true;
    });

    // Sort validators
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sort.field) {
        case 'score':
          comparison = calculateValidatorScore(b) - calculateValidatorScore(a);
          break;
        case 'uptime':
          comparison = b.uptime - a.uptime;
          break;
        case 'storage':
          comparison = b.storage_committed - a.storage_committed;
          break;
        case 'version':
          comparison = b.version.localeCompare(a.version);
          break;
        case 'address':
          comparison = a.address.localeCompare(b.address);
          break;
        default:
          comparison = 0;
      }
      
      return sort.direction === 'desc' ? comparison : -comparison;
    });

    // Add score and status to each validator
    const enrichedValidators = filtered.map((validator, index) => ({
      ...validator,
      score: calculateValidatorScore(validator),
      status: getValidatorStatus(validator.last_seen_timestamp),
      rank: index + 1
    }));

    // Pagination
    const totalCount = enrichedValidators.length;
    const totalPages = Math.ceil(totalCount / pagination.pageSize);
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginatedValidators = enrichedValidators.slice(startIndex, endIndex);

    return {
      validators: paginatedValidators,
      totalCount,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
      allValidators: enrichedValidators // For stats calculations
    };
  }, [allValidatorsData, filters, sort, pagination]);

  return {
    ...processedData,
    isLoading,
    error,
    refetch
  };
};

// Hook for quick stats from processed data
export const useValidatorQuickStats = (validators: any[]) => {
  return useMemo(() => {
    const onlineValidators = validators.filter(v => v.status === 'online');
    const maintenanceValidators = validators.filter(v => v.status === 'maintenance');
    const offlineValidators = validators.filter(v => v.status === 'offline');
    const publicValidators = validators.filter(v => v.is_public);
    
    const avgScore = validators.length > 0 
      ? validators.reduce((sum, v) => sum + v.score, 0) / validators.length 
      : 0;
    
    const totalStorage = validators.reduce((sum, v) => sum + v.storage_committed, 0);
    
    return {
      total: validators.length,
      online: onlineValidators.length,
      maintenance: maintenanceValidators.length,
      offline: offlineValidators.length,
      public: publicValidators.length,
      avgScore: Math.round(avgScore * 100) / 100,
      totalStorage: Math.round(totalStorage / (1024 ** 3)) // GB
    };
  }, [validators]);
};