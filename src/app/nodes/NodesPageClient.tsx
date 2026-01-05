'use client';

import { useState, useEffect, useMemo, useTransition, useCallback } from 'react';
import { Globe, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Pagination, ValidatorTableSkeleton, Badge, SearchBox } from '@/components/ui';
import { CopyBtn as CopyButton } from '@/components/ui/CopyBtn';
import { PNodeVersionCard, PNodeOnlineCard, PNodeStorageCard, PNodeUptimeCard } from '@/components/dashboard';
import { filterAndSortValidators, paginateValidators, type ValidatorData } from '@/libs/server';
import { getLocationsForIPs, extractIPFromAddress, formatLocation, getCountryFlagUrl } from '@/libs/services/geolocation';
import { useStaggeredScrollAnimation } from '@/libs/hooks/useScrollAnimation';
import { usePrefetchProfile } from '@/libs/hooks/usePrefetchProfile';
import { toast } from 'sonner';

interface LocationData {
  country: string;
  country_code: string;
  city: string;
  region: string;
  provider: string;
  ip: string;
}

interface PodCredit {
  pod_id: string;
  credits: number;
}

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

export function NodesPageClient({ 
  allValidators: initialValidators, 
  initialPagination,
  initialStats
}: NodesPageClientProps) {
  const router = useRouter();
  const [allValidators, setAllValidators] = useState<ValidatorData[]>(initialValidators);
  const [currentPage, setCurrentPage] = useState(initialPagination.currentPage);
  const [pageSize] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    onlyPublic: false,
    hideHighStake: false,
    showDuplicates: false,
    onlyOnline: false,
    onlyInactive: false,
    onlySyncing: false,
  });
  const [versionFilter, setVersionFilter] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [locations, setLocations] = useState<{ [ip: string]: LocationData | null }>({});
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [credits, setCredits] = useState<{ [pubkey: string]: number | null }>({});
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState(initialStats);
  const [dataFetchTime, setDataFetchTime] = useState<number>(Math.floor(Date.now() / 1000));
  const [clickedNodeId, setClickedNodeId] = useState<string | null>(null);

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
        setSearchQuery(searchParam);
      }
    }
  }, []);

  const [sortBy, setSortBy] = useState<'address' | 'location' | 'pubkey' | 'public' | 'storage_committed' | 'storage_used' | 'usage_percent' | 'rpc_port' | 'version' | 'uptime' | 'last_seen' | 'status'>('last_seen');

  const [isPending, startTransition] = useTransition();

  // Check if any filters are active
  const hasActiveFilters = searchQuery !== '' || selectedFilters.onlyPublic || selectedFilters.hideHighStake || selectedFilters.showDuplicates || selectedFilters.onlyOnline || selectedFilters.onlyInactive || selectedFilters.onlySyncing || versionFilter !== '';

  // Memoized filtered and paginated data
  const { validators, pagination, quickStats, availableVersions } = useMemo(() => {
    const filtered = filterAndSortValidators(
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

    const paginated = paginateValidators(filtered, currentPage, pageSize);
    
    // Calculate duplicate count from all validators (total number of duplicate entries)
    const duplicateCount = allValidators.reduce((total, v) => total + (v.duplicateCount || 0), 0);
    
    // Always show the total including duplicates, regardless of filters
    const totalWithDuplicates = initialStats.total + duplicateCount;
    
    // Use dataFetchTime for consistent time calculation
    const referenceTime = dataFetchTime;
    
    // Use consistent total count, but calculate filtered stats when filters are active
    const calculatedStats = hasActiveFilters ? {
      total: totalWithDuplicates, // Keep total unchanged
      online: (() => {
        return filtered.filter(v => {
          const timeDiff = referenceTime - v.last_seen_timestamp;
          return timeDiff < 1800; // Less than 30 minutes = online
        }).length;
      })(),
      syncing: (() => {
        return filtered.filter(v => {
          const timeDiff = referenceTime - v.last_seen_timestamp;
          return timeDiff >= 1800 && timeDiff < 3600; // 30-60 minutes = syncing
        }).length;
      })(),
      public: filtered.filter(v => v.is_public).length,
      inactive: (() => {
        return filtered.filter(v => {
          const timeDiff = referenceTime - v.last_seen_timestamp;
          return timeDiff >= 3600; // More than 60 minutes = offline
        }).length;
      })(),
    } : {
      total: totalWithDuplicates,
      online: (() => {
        return allValidators.filter(v => {
          const timeDiff = referenceTime - v.last_seen_timestamp;
          return timeDiff < 1800; // Less than 30 minutes = online
        }).length;
      })(),
      syncing: (() => {
        return allValidators.filter(v => {
          const timeDiff = referenceTime - v.last_seen_timestamp;
          return timeDiff >= 1800 && timeDiff < 3600; // 30-60 minutes = syncing
        }).length;
      })(),
      public: allValidators.filter(v => v.is_public).length,
      inactive: (() => {
        return allValidators.filter(v => {
          const timeDiff = referenceTime - v.last_seen_timestamp;
          return timeDiff >= 3600; // More than 60 minutes = offline
        }).length;
      })(),
    };

    // Get unique versions for dropdown (latest first)
    const allVersions = allValidators.map(v => v.version).filter(Boolean);
    
    const uniqueVersions = Array.from(new Set(allVersions))
      .sort((a, b) => {
        // Parse version strings for proper comparison (e.g., "0.8.0" vs "0.10.0")
        const parseVersion = (version: string) => {
          return version.split('.').map(num => parseInt(num, 10));
        };
        
        const versionA = parseVersion(a);
        const versionB = parseVersion(b);
        
        // Compare version parts (major.minor.patch)
        for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
          const partA = versionA[i] || 0;
          const partB = versionB[i] || 0;
          
          if (partA !== partB) {
            return partB - partA; // Descending order (latest first)
          }
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
  }, [allValidators, searchQuery, selectedFilters, sortBy, currentPage, pageSize, hasActiveFilters, stats, dataFetchTime]);

  // Reset page when filters change
  useEffect(() => {
    if (currentPage > pagination.totalPages && pagination.totalPages > 0) {
      setCurrentPage(1);
    }
  }, [pagination.totalPages, currentPage]);

  // Load geolocation data for all validators at once
  useEffect(() => {
    const loadGeolocationData = async () => {
      if (allValidators.length === 0) return;
      
      setLoadingLocations(true);
      try {
        // Extract unique IPs from ALL validators (not just current page)
        const allIPs = Array.from(new Set(
          allValidators
            .map(v => extractIPFromAddress(v.address || ''))
            .filter(ip => ip && !locations[ip]) // Only fetch IPs we don't have yet
        ));
        
        if (allIPs.length > 0) {
          const newLocations = await getLocationsForIPs(allIPs);
          setLocations(prev => ({ ...prev, ...newLocations }));
        }
      } catch (error) {
        console.error('Failed to load geolocation data:', error);
      } finally {
        setLoadingLocations(false);
      }
    };

    // Only run once when component mounts or when allValidators changes
    loadGeolocationData();
  }, [allValidators]); // Remove locations dependency to avoid infinite loops

  // Fetch credits for validators
  useEffect(() => {
    const fetchCredits = async () => {
      if (allValidators.length === 0) return;
      
      try {
        const response = await fetch('/api/pod-credits');
        if (response.ok) {
          const data = await response.json();
          if (data.pods_credits && Array.isArray(data.pods_credits)) {
            const creditsMap: { [pubkey: string]: number } = {};
            data.pods_credits.forEach((pod: PodCredit) => {
              creditsMap[pod.pod_id] = pod.credits;
            });
            setCredits(creditsMap);
          }
        }
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      }
    };
    
    fetchCredits();
  }, [allValidators]);

  const handlePageChange = (page: number) => {
    startTransition(() => {
      setCurrentPage(page);
    });
  };

  // Auto-refresh data every 30 seconds
  const fetchData = useCallback(async (showToast = false) => {
    try {
      // Fetch real-time data - no caching, add cache buster
      const response = await fetch(`/api/nodes?includeAll=true&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch nodes');
      }
      
      const data = await response.json();
      
      if (data.nodes && Array.isArray(data.nodes)) {
        // Use server timestamp if available for consistent time calculation
        const serverTime = data.serverTimestamp || Math.floor(Date.now() / 1000);
        
        // First pass: transform all nodes with status calculation
        const allNodes: ValidatorData[] = data.nodes.map((node: any, index: number) => {
          const lastSeenTimestamp = node.last_seen_timestamp || 0;
          // Calculate time diff using server timestamp for consistency
          const timeDiff = serverTime - lastSeenTimestamp;
          
          // Simplified status logic similar to endpoint tester
          // Online: last seen < 30 minutes
          // Syncing: last seen 30-60 minutes
          // Offline: last seen > 60 minutes
          let status: 'online' | 'syncing' | 'offline' = 'offline';
          if (timeDiff < 1800) status = 'online';        // Less than 30 minutes = online
          else if (timeDiff < 3600) status = 'syncing';  // 30-60 minutes = syncing
          else status = 'offline';                       // More than 60 minutes = offline
          
          const isOnline = status === 'online'; // For score calculation
          
          // Calculate score (same as server-side)
          const uptimeScore = Math.min((node.uptime || 0) / (30 * 24 * 3600), 1) * 40;
          const storageScore = Math.min((node.storage_committed || 0) / (100 * 1024**3), 1) * 30;
          const onlineScore = isOnline ? 30 : 0;
          const totalScore = uptimeScore + storageScore + onlineScore;
          
          return {
            address: node.address || node.ip || '',
            pubkey: node.pubkey || node.pod_id || `validator-${index}-${Date.now()}`,
            is_public: node.is_public || false,
            storage_committed: node.storage_committed || node.storage || 0,
            storage_used: node.storage_used || 0,
            usage_percent: node.usage_percent || 0,
            storage_usage_percent: node.storage_usage_percent || 0,
            rpc_port: node.rpc_port || 0,
            version: node.version || '',
            uptime: node.uptime || 0,
            last_seen_timestamp: lastSeenTimestamp,
            status: status,
            score: totalScore,
            rank: 0,
            duplicateCount: 0,
            isDuplicate: false,
          };
        });
        
        // Duplicate detection (same logic as server-side)
        const uniqueValidators: ValidatorData[] = [];
        const pubkeyGroups = new Map<string, ValidatorData[]>();
        const addressGroups = new Map<string, ValidatorData[]>();
        
        // Group by pubkey
        allNodes.forEach(validator => {
          const pubkey = validator.pubkey;
          if (!pubkeyGroups.has(pubkey)) {
            pubkeyGroups.set(pubkey, []);
          }
          pubkeyGroups.get(pubkey)!.push(validator);
        });
        
        // Group by address
        allNodes.forEach(validator => {
          const address = validator.address;
          if (!addressGroups.has(address)) {
            addressGroups.set(address, []);
          }
          addressGroups.get(address)!.push(validator);
        });
        
        const processedValidatorIds = new Set<string>();
        
        // Process pubkey duplicates
        pubkeyGroups.forEach((validators) => {
          if (validators.length > 1) {
            validators.sort((a, b) => b.last_seen_timestamp - a.last_seen_timestamp);
            const mostRecent = validators[0];
            const validatorId = `${mostRecent.pubkey}-${mostRecent.address}`;
            
            if (!processedValidatorIds.has(validatorId)) {
              mostRecent.isDuplicate = false;
              mostRecent.duplicateCount = validators.length - 1;
              uniqueValidators.push(mostRecent);
              processedValidatorIds.add(validatorId);
            }
          }
        });
        
        // Process address duplicates
        addressGroups.forEach((validators) => {
          if (validators.length > 1) {
            validators.sort((a, b) => b.last_seen_timestamp - a.last_seen_timestamp);
            const mostRecent = validators[0];
            const validatorId = `${mostRecent.pubkey}-${mostRecent.address}`;
            
            if (!processedValidatorIds.has(validatorId)) {
              mostRecent.isDuplicate = false;
              mostRecent.duplicateCount = validators.length - 1;
              uniqueValidators.push(mostRecent);
              processedValidatorIds.add(validatorId);
            } else {
              const existingValidator = uniqueValidators.find(v => `${v.pubkey}-${v.address}` === validatorId);
              if (existingValidator) {
                existingValidator.duplicateCount = Math.max(existingValidator.duplicateCount || 0, validators.length - 1);
              }
            }
          }
        });
        
        // Add non-duplicate validators
        allNodes.forEach(validator => {
          const validatorId = `${validator.pubkey}-${validator.address}`;
          if (!processedValidatorIds.has(validatorId)) {
            const pubkeyDuplicates = pubkeyGroups.get(validator.pubkey)?.length || 1;
            const addressDuplicates = addressGroups.get(validator.address)?.length || 1;
            
            if (pubkeyDuplicates === 1 && addressDuplicates === 1) {
              validator.isDuplicate = false;
              validator.duplicateCount = 0;
              uniqueValidators.push(validator);
              processedValidatorIds.add(validatorId);
            }
          }
        });
        
        // Sort by score and assign ranks
        uniqueValidators.sort((a, b) => b.score - a.score);
        uniqueValidators.forEach((validator, index) => {
          validator.rank = index + 1;
        });
        
        // Calculate duplicate count for stats
        const duplicateCount = uniqueValidators.reduce((total, v) => total + (v.duplicateCount || 0), 0);
        
        setAllValidators(uniqueValidators);
        // Store the server time when data was fetched for consistent time diff calculation
        setDataFetchTime(serverTime);
        
        const newStats = {
          total: uniqueValidators.length,
          online: uniqueValidators.filter(v => v.status === 'online').length,
          public: uniqueValidators.filter(v => v.is_public).length,
        };
        setStats(newStats);
        
        if (showToast) {
          toast.success(`Updated ${uniqueValidators.length} pNodes (${duplicateCount} duplicates)`);
        }
      }
    } catch (error) {
      console.error('Auto-refresh failed:', error);
    }
  }, []);

  // Set up auto-refresh interval (30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false); // Silent refresh without toast
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  const handleFilterChange = (filterKey: keyof typeof selectedFilters) => {
    startTransition(() => {
      setSelectedFilters(prev => {
        const newFilters = { ...prev };
        
        // Handle mutually exclusive filters for status
        if (filterKey === 'onlyOnline' && !prev.onlyOnline) {
          // If turning on onlyOnline, turn off other status filters
          newFilters.onlyInactive = false;
          newFilters.onlySyncing = false;
          newFilters.onlyOnline = true;
        } else if (filterKey === 'onlySyncing' && !prev.onlySyncing) {
          // If turning on onlySyncing, turn off other status filters
          newFilters.onlyOnline = false;
          newFilters.onlyInactive = false;
          newFilters.onlySyncing = true;
        } else if (filterKey === 'onlyInactive' && !prev.onlyInactive) {
          // If turning on onlyInactive, turn off other status filters
          newFilters.onlyOnline = false;
          newFilters.onlySyncing = false;
          newFilters.onlyInactive = true;
        } else {
          // Toggle the selected filter
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

  const handleSortChange = (value: string) => {
    startTransition(() => {
      setSortBy(value as any);
      setCurrentPage(1);
    });
  };

  const handleVersionFilterChange = (version: string) => {
    startTransition(() => {
      setVersionFilter(version);
      setCurrentPage(1);
    });
  };

  const handleSort = (column: typeof sortBy) => {
    startTransition(() => {
      setSortBy(column);
      setCurrentPage(1);
    });
  };

  const getSortIcon = (column: typeof sortBy) => {
    if (sortBy !== column) {
      return null; // No icon for inactive columns
    }
    
    return (
      <span className="ml-1 text-blue-400">
        <svg className="w-3 h-3 inline" fill="currentColor" viewBox="0 0 20 20">
          <path d="M15 8l-5 5-5-5h10z"/>
        </svg>
      </span>
    );
  };

  const copyToClipboard = async (text: string, type: string = 'text') => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  const { prefetchProfile, navigateToProfile } = usePrefetchProfile();

  const navigateToNodeProfile = (address: string, nodeId?: string) => {
    const ip = extractIPFromAddress(address);
    if (ip) {
      if (nodeId) setClickedNodeId(nodeId);
      // Show immediate feedback
      toast.loading('Loading node profile...', { 
        duration: 5000,
        id: 'node-profile-loading'
      });
      navigateToProfile(ip);
      // Clear clicked state after navigation
      setTimeout(() => setClickedNodeId(null), 2000);
    }
  };

  const prefetchNodeProfile = (address: string) => {
    const ip = extractIPFromAddress(address);
    if (ip) {
      prefetchProfile(ip);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  // Export filtered data to CSV
  const exportToCSV = () => {
    // Use the filtered validators (respects all active filters)
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
      
      const isOnline = validator.status === 'online';
      const storageGB = validator.storage_committed ? (validator.storage_committed / (1024**3)).toFixed(1) : '0';
      const usagePercent = validator.storage_usage_percent ? (validator.storage_usage_percent * 100).toFixed(4) : '0.0000';
      const uptimeHours = Math.floor(validator.uptime / 3600);
      const uptimeDays = Math.floor(uptimeHours / 24);
      const uptimeDisplay = uptimeDays > 0 ? `${uptimeDays}d` : `${uptimeHours}h`;
      
      const now = Math.floor(Date.now() / 1000);
      const timeDiff = now - validator.last_seen_timestamp;
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
        isOnline ? 'ACTIVE' : validator.status === 'syncing' ? 'SYNCING' : 'OFFLINE'
      ];
    });
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pnodes-${hasActiveFilters ? 'filtered-' : ''}${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    toast.success(`Exported ${filteredData.length} pNodes to CSV`);
  };

  // Prefetch visible nodes on page load
  useEffect(() => {
    if (validators.length > 0) {
      // Prefetch first 5 visible nodes after a short delay
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
    <div className="space-y-6">
      {/* Page Title Section - Similar to Analytics Design */}
      <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
        {/* All four corner edges with white glow on hover */}
        {/* Top-left corner */}
        <div className="absolute top-0 left-0 w-6 h-6">
          <div className="absolute top-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute top-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>
        
        {/* Top-right corner */}
        <div className="absolute top-0 right-0 w-6 h-6">
          <div className="absolute top-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute top-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>
        
        {/* Bottom-left corner */}
        <div className="absolute bottom-0 left-0 w-6 h-6">
          <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute bottom-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>
        
        {/* Bottom-right corner */}
        <div className="absolute bottom-0 right-0 w-6 h-6">
          <div className="absolute bottom-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute bottom-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>

        <div className="space-y-3 sm:space-y-4 animate-blur-reveal relative z-10">
          {/* Main Title */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white/90 font-mono">
              // <span className="text-white">PNODES</span>
            </h1>
          </div>
          
          {/* Subtitle and Description */}
          <div className="flex items-center space-x-2 text-white/60">
            <span className="text-xs sm:text-sm">›</span>
            <span className="text-xs sm:text-sm">Real-time pNode network monitoring and statistics</span>
          </div>
        </div>
      </div>

      {/* pNode Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 animate-blur-reveal-1">
        <PNodeVersionCard />
        <PNodeOnlineCard />
        <PNodeStorageCard />
        <PNodeUptimeCard />
      </div>

      {/* Original Header Design */}
      <div className="space-y-4 animate-blur-reveal">
        {/* Search Bar */}
        <SearchBox 
          onSearch={handleSearchChange}
          placeholder="Search pNodes..."
        />

        {/* Geolocation Loading Indicator - Removed text, keep only skeleton */}

        {/* Badges and Sort Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-blur-reveal-1">
          <div 
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 pb-2 sm:pb-1"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style jsx>{`
              div::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            {/* Total pNodes Badge - White */}
            <div className="relative group overflow-visible flex-shrink-0">
              <div 
                className="absolute -inset-1 sm:-inset-2 rounded-full opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 70%, transparent 100%)',
                  filter: 'blur(8px)',
                }}
              ></div>
              <div 
                className="relative flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-xl"
                style={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 0 15px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}
              >
                <span 
                  className="font-semibold text-[10px] sm:text-xs uppercase tracking-wide whitespace-nowrap"
                  style={{ 
                    color: '#ffffff',
                    textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {quickStats.total} pNodes
                </span>
              </div>
            </div>
            
            {/* Online Badge - Green */}
            <button
              onClick={() => handleFilterChange('onlyOnline')}
              className="relative group overflow-visible flex-shrink-0"
            >
              <div 
                className="absolute -inset-1 sm:-inset-2 rounded-full opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(16,185,129,0.1) 70%, transparent 100%)',
                  filter: 'blur(8px)',
                }}
              ></div>
              <div 
                className="relative flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-xl transition-all duration-200"
                style={{
                  background: selectedFilters.onlyOnline ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 0, 0, 0.8)',
                  border: `1px solid rgba(16, 185, 129, ${selectedFilters.onlyOnline ? '0.8' : '0.6'})`,
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(16, 185, 129, 0.1)',
                }}
              >
                <span 
                  className="font-semibold text-[10px] sm:text-xs uppercase tracking-wide whitespace-nowrap"
                  style={{ 
                    color: '#10b981',
                    textShadow: '0 0 10px rgba(16, 185, 129, 0.5)',
                  }}
                >
                  {quickStats.online} online
                </span>
              </div>
            </button>
            
                  {/* Syncing Badge - Amber */}
            <button
              onClick={() => handleFilterChange('onlySyncing')}
              className="relative group overflow-visible flex-shrink-0"
            >
              <div 
                className="absolute -inset-1 sm:-inset-2 rounded-full opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(245,158,11,0.1) 70%, transparent 100%)',
                  filter: 'blur(8px)',
                }}
              ></div>
              <div 
                className="relative flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-xl transition-all duration-200"
                style={{
                  background: selectedFilters.onlySyncing ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 0, 0, 0.8)',
                  border: `1px solid rgba(245, 158, 11, ${selectedFilters.onlySyncing ? '0.8' : '0.6'})`,
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 0 15px rgba(245, 158, 11, 0.3), inset 0 1px 0 rgba(245, 158, 11, 0.1)',
                }}
              >
                <span 
                  className="font-semibold text-[10px] sm:text-xs uppercase tracking-wide whitespace-nowrap"
                  style={{ 
                    color: '#f59e0b',
                    textShadow: '0 0 10px rgba(245, 158, 11, 0.5)',
                  }}
                >
                  {quickStats.syncing || 0} syncing
                </span>
              </div>
            </button>
            
            {/* Inactive Badge - Red */}
            <button
              onClick={() => handleFilterChange('onlyInactive')}
              className="relative group overflow-visible flex-shrink-0"
            >
              <div 
                className="absolute -inset-1 sm:-inset-2 rounded-full opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, rgba(239,68,68,0.1) 70%, transparent 100%)',
                  filter: 'blur(8px)',
                }}
              ></div>
              <div 
                className="relative flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-xl transition-all duration-200"
                style={{
                  background: selectedFilters.onlyInactive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 0, 0, 0.8)',
                  border: `1px solid rgba(239, 68, 68, ${selectedFilters.onlyInactive ? '0.8' : '0.6'})`,
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 0 15px rgba(239, 68, 68, 0.3), inset 0 1px 0 rgba(239, 68, 68, 0.1)',
                }}
              >
                <span 
                  className="font-semibold text-[10px] sm:text-xs uppercase tracking-wide whitespace-nowrap"
                  style={{ 
                    color: '#ef4444',
                    textShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                  }}
                >
                  {quickStats.inactive} inactive
                </span>
              </div>
            </button>
            
            {/* Public Badge - Blue */}
            <button
              onClick={() => handleFilterChange('onlyPublic')}
              className="relative group overflow-visible flex-shrink-0"
            >
              <div 
                className="absolute -inset-1 sm:-inset-2 rounded-full opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, rgba(59,130,246,0.1) 70%, transparent 100%)',
                  filter: 'blur(8px)',
                }}
              ></div>
              <div 
                className="relative flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-xl transition-all duration-200"
                style={{
                  background: selectedFilters.onlyPublic ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0, 0, 0, 0.8)',
                  border: `1px solid rgba(59, 130, 246, ${selectedFilters.onlyPublic ? '0.8' : '0.6'})`,
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 0 15px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(59, 130, 246, 0.1)',
                }}
              >
                <span 
                  className="font-semibold text-[10px] sm:text-xs uppercase tracking-wide whitespace-nowrap"
                  style={{ 
                    color: '#3b82f6',
                    textShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
                  }}
                >
                  {quickStats.public} public
                </span>
              </div>
            </button>

            {/* Show Duplicates Toggle - Yellow */}
            <button
              onClick={() => handleFilterChange('showDuplicates')}
              className="relative group overflow-visible flex-shrink-0"
            >
              <div 
                className="absolute -inset-1 sm:-inset-2 rounded-full opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle, rgba(234,179,8,0.4) 0%, rgba(234,179,8,0.1) 70%, transparent 100%)',
                  filter: 'blur(8px)',
                }}
              ></div>
              <div 
                className="relative flex items-center px-2 py-1 sm:px-3 sm:py-1.5 rounded-full shadow-xl transition-all duration-200"
                style={{
                  background: selectedFilters.showDuplicates ? 'rgba(234, 179, 8, 0.2)' : 'rgba(0, 0, 0, 0.8)',
                  border: `1px solid rgba(234, 179, 8, ${selectedFilters.showDuplicates ? '0.8' : '0.6'})`,
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 0 15px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(234, 179, 8, 0.1)',
                }}
              >
                <span 
                  className="font-semibold text-[10px] sm:text-xs uppercase tracking-wide whitespace-nowrap"
                  style={{ 
                    color: '#eab308',
                    textShadow: '0 0 10px rgba(234, 179, 8, 0.5)',
                  }}
                >
                  {quickStats.duplicates || 0} Duplicates
                </span>
              </div>
            </button>
          </div>

          {/* Advanced Filters */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Export CSV Button */}
            <button
              onClick={exportToCSV}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-black/80 border border-white/20 rounded-lg text-white text-sm hover:border-cyan-400/50 hover:bg-cyan-400/10 transition-all duration-200"
              title={`Export ${hasActiveFilters ? 'filtered' : 'all'} pNodes to CSV`}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Advanced Filters Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="advancedFilters"
                checked={showAdvancedFilters}
                onChange={(e) => setShowAdvancedFilters(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
              />
              <label htmlFor="advancedFilters" className="text-white/60 text-sm cursor-pointer">
                Advanced
              </label>
            </div>

            {/* Version Filter Dropdown */}
            {showAdvancedFilters && (
              <select
                value={versionFilter}
                onChange={(e) => handleVersionFilterChange(e.target.value)}
                className="px-3 py-1.5 bg-black/80 border border-white/20 rounded-lg text-white text-sm focus:border-blue-400 focus:outline-none min-w-32"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                }}
              >
                <option value="" style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', color: 'white' }}>
                  All Versions
                </option>
                {availableVersions?.map((version) => (
                  <option 
                    key={version} 
                    value={version}
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', color: 'white' }}
                  >
                    v{version}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Nodes Table */}
      {isPending ? (
        <ValidatorTableSkeleton count={pageSize} />
      ) : (
        <div 
          className="bg-black/20 rounded-lg overflow-x-auto animate-blur-reveal-2"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <table className="w-full min-w-[900px]" ref={tableRef}>
            {/* Table Header */}
            <thead>
              <tr className="bg-black/40 border-b border-gray-800/50">
                <th 
                  className="text-left px-6 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none w-48"
                  onClick={() => handleSort('location')}
                >
                  LOCATION{getSortIcon('location')}
                </th>
                <th 
                  className="text-left px-4 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none w-32"
                  onClick={() => handleSort('pubkey')}
                >
                  PUBKEY{getSortIcon('pubkey')}
                </th>
                <th 
                  className="text-center px-4 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none w-20"
                  onClick={() => handleSort('public')}
                >
                  PUBLIC{getSortIcon('public')}
                </th>
                <th 
                  className="text-center px-4 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none w-32"
                  onClick={() => handleSort('storage_committed')}
                >
                  STORAGE{getSortIcon('storage_committed')}
                </th>
                <th 
                  className="text-center px-4 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none w-24"
                  onClick={() => handleSort('usage_percent')}
                >
                  USAGE %{getSortIcon('usage_percent')}
                </th>
                <th 
                  className="text-center px-4 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none w-20"
                  onClick={() => handleSort('version')}
                >
                  VERSION{getSortIcon('version')}
                </th>
                <th 
                  className="text-center px-4 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none w-24"
                  onClick={() => handleSort('uptime')}
                >
                  UPTIME{getSortIcon('uptime')}
                </th>
                <th 
                  className="text-center px-4 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none w-24"
                  onClick={() => handleSort('last_seen')}
                >
                  LAST SEEN{getSortIcon('last_seen')}
                </th>
                <th 
                  className="text-center px-4 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider select-none w-20"
                >
                  CREDITS
                </th>
                <th 
                  className="text-center px-4 py-4 text-gray-400 text-xs font-medium uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none w-20"
                  onClick={() => handleSort('status')}
                >
                  STATUS{getSortIcon('status')}
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {validators.map((validator, index) => {
                // Use dataFetchTime for consistent status calculation
                const timeDiff = dataFetchTime - validator.last_seen_timestamp;
                // Simplified status logic - only last seen matters
                const isOnline = timeDiff < 1800; // Less than 30 minutes = online
                const isSyncing = timeDiff >= 1800 && timeDiff < 3600; // 30-60 minutes = syncing
                const isOffline = timeDiff >= 3600; // More than 60 minutes = offline
                
                // Format storage committed
                const storageCommittedGB = validator.storage_committed ? 
                  (validator.storage_committed / (1024**3)).toFixed(1) : '0';
                
                // Format storage used
                const storageUsedMB = validator.storage_used ? 
                  (validator.storage_used / (1024**2)).toFixed(1) : '0';
                
                // Format usage percentage
                const usagePercent = validator.storage_usage_percent ? 
                  (validator.storage_usage_percent * 100).toFixed(4) : '0.0000';
                
                // Calculate uptime display
                const uptimeHours = Math.floor(validator.uptime / 3600);
                const uptimeDays = Math.floor(uptimeHours / 24);
                const uptimeDisplay = uptimeDays > 0 ? `${uptimeDays}d` : `${uptimeHours}h`;
                
                // Format last seen timestamp with color classes
                // Use dataFetchTime for consistent calculation (time when data was fetched from server)
                let lastSeenDisplay = '';
                let lastSeenClass = 'text-gray-400';
                if (mounted) {
                  const timeDiff = dataFetchTime - validator.last_seen_timestamp;
                  if (timeDiff < 60) {
                    lastSeenDisplay = `${Math.max(0, timeDiff)}s`;
                    lastSeenClass = 'text-emerald-400'; // fresh
                  } else if (timeDiff < 3600) {
                    lastSeenDisplay = `${Math.floor(timeDiff / 60)}m`;
                    lastSeenClass = 'text-green-400'; // recent
                  } else if (timeDiff < 86400) {
                    lastSeenDisplay = `${Math.floor(timeDiff / 3600)}h`;
                    lastSeenClass = 'text-amber-400'; // stale
                  } else if (timeDiff < 604800) {
                    lastSeenDisplay = `${Math.floor(timeDiff / 86400)}d`;
                    lastSeenClass = 'text-orange-400'; // very stale
                  } else {
                    lastSeenDisplay = `${Math.floor(timeDiff / 604800)}w`;
                    lastSeenClass = 'text-red-400'; // very old
                  }
                } else {
                  lastSeenDisplay = '--'; // Placeholder during SSR
                }

                const nodeIP = extractIPFromAddress(validator.address || '');
                const nodeId = `${validator.pubkey}-${validator.address}-${index}`;
                
                return (
                  <tr 
                    key={nodeId} 
                    className={`hover:bg-white/10 transition-colors duration-200 border-b border-gray-800/30 last:border-b-0 cursor-pointer ${
                      shouldAnimate(index) ? 'animate-scroll-blur-reveal' : ''
                    } ${
                      clickedNodeId === nodeId ? 'bg-cyan-500/20 animate-pulse' : ''
                    }`}
                    style={{
                      animationDelay: shouldAnimate(index) ? `${index * 50}ms` : '0ms'
                    }}
                    onMouseEnter={() => prefetchNodeProfile(validator.address || '')}
                    onClick={() => navigateToNodeProfile(validator.address || '', nodeId)}
                  >
                    {/* Location */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          isOnline ? 'bg-green-400' : 
                          isSyncing ? 'bg-amber-400' : 
                          'bg-red-400'
                        }`}></div>
                        {(() => {
                          const ip = extractIPFromAddress(validator.address || '');
                          const location = locations[ip];
                          
                          if (loadingLocations && !location) {
                            return (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-3 bg-gray-600 animate-pulse rounded"></div>
                                <span className="text-gray-400 text-sm animate-pulse">Loading...</span>
                              </div>
                            );
                          }
                          
                          if (!location) {
                            return (
                              <div className="flex items-center space-x-2">
                                <Globe className="w-4 h-4 text-gray-500" />
                                <div className="flex flex-col text-left">
                                  <span className="text-gray-400 text-sm">Unknown</span>
                                  <span className="text-gray-500 text-xs font-mono">
                                    {validator.address ? 
                                      (validator.address.endsWith(':9001') ? 
                                        validator.address.replace(':9001', '') : 
                                        validator.address
                                      ) : 'Unknown'
                                    }
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="flex items-center space-x-2">
                              {location.country_code && (
                                <img 
                                  src={getCountryFlagUrl(location.country_code)}
                                  alt={location.country}
                                  className="w-6 h-4 object-cover rounded-sm shadow-sm"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="flex flex-col text-left">
                                <span className="text-white text-sm font-medium">
                                  {location.city !== 'Unknown' ? location.city : location.country}
                                </span>
                                <div className="flex flex-col text-xs">
                                  {location.city !== 'Unknown' && (
                                    <span className="text-gray-400">
                                      {location.country}
                                    </span>
                                  )}
                                  <span className="text-gray-500 font-mono">
                                    {validator.address ? 
                                      (validator.address.endsWith(':9001') ? 
                                        validator.address.replace(':9001', '') : 
                                        validator.address
                                      ) : 'Unknown'
                                    }
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                        {validator.duplicateCount && validator.duplicateCount > 0 && (
                          <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs font-bold border border-yellow-500/30">
                            +{validator.duplicateCount} DUP
                          </div>
                        )}
                        <CopyButton 
                          text={validator.address || ''} 
                          onCopy={copyToClipboard}
                          type="Address"
                        />
                      </div>
                    </td>

                    {/* Pubkey */}
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-mono text-sm">
                          {validator.pubkey ? `${validator.pubkey.substring(0, 4)}...${validator.pubkey.substring(validator.pubkey.length - 4)}` : 'Unknown'}
                        </span>
                        <CopyButton 
                          text={validator.pubkey || ''} 
                          onCopy={copyToClipboard}
                          type="Pubkey"
                        />
                      </div>
                    </td>

                    {/* Public */}
                    <td className="px-4 py-4 text-center">
                      <span className={`font-mono text-sm font-bold ${validator.is_public ? 'text-green-400' : 'text-gray-400'}`}>
                        {validator.is_public ? 'YES' : 'NO'}
                      </span>
                    </td>

                    {/* Storage Committed */}
                    <td className="px-4 py-4 text-center">
                      <span className="text-orange-400 font-mono text-sm font-bold">
                        {storageCommittedGB}GB
                      </span>
                    </td>

                    {/* Usage % */}
                    <td className="px-4 py-4 text-center">
                      <span className="text-green-400 font-mono text-sm font-bold">
                        {usagePercent}%
                      </span>
                    </td>

                    {/* Version */}
                    <td className="px-4 py-4 text-center">
                      <span 
                        className="text-gray-400 font-mono text-sm block max-w-[80px] truncate" 
                        title={validator.version || 'Unknown'}
                      >
                        {validator.version ? (validator.version.length > 10 ? validator.version.substring(0, 10) + '...' : validator.version) : 'Unknown'}
                      </span>
                    </td>

                    {/* Uptime */}
                    <td className="px-4 py-4 text-center">
                      <span className="text-gray-400 font-mono text-sm">
                        {uptimeDisplay}
                      </span>
                    </td>

                    {/* Last Seen */}
                    <td className="px-4 py-4 text-center">
                      <span className={`${lastSeenClass} font-mono text-sm`}>
                        {lastSeenDisplay}
                      </span>
                    </td>

                    {/* Credits */}
                    <td className="px-4 py-4 text-center">
                      {(() => {
                        const nodeCredits = validator.pubkey ? credits[validator.pubkey] : undefined;
                        
                        if (nodeCredits === undefined) {
                          return <span className="text-gray-600 text-xs">...</span>;
                        }
                        if (nodeCredits === null || nodeCredits === 0) {
                          return <span className="text-gray-500 font-mono text-sm">0</span>;
                        }
                        
                        return (
                          <span className="text-cyan-400 font-mono text-sm font-bold">
                            {nodeCredits.toLocaleString()}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`font-mono text-sm font-bold uppercase ${
                          isOnline ? 'text-green-400' : 
                          isSyncing ? 'text-amber-400' : 
                          'text-red-400'
                        }`}>
                          {isOnline ? 'ACTIVE' : isSyncing ? 'SYNCING' : 'OFFLINE'}
                        </span>
                        {isSyncing && (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6 animate-blur-reveal-3">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
            hasNext={pagination.hasNext}
            hasPrev={pagination.hasPrev}
          />
        </div>
      )}

      {/* Results info */}
      <div className="text-center text-white/60 text-xs sm:text-sm mt-4 animate-blur-reveal-4">
        Showing {Math.min((pagination.currentPage - 1) * pageSize + 1, pagination.totalCount)} - {Math.min(pagination.currentPage * pageSize, pagination.totalCount)} of {pagination.totalCount} pNodes
      </div>


    </div>
  );
}