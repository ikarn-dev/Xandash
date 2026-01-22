'use client';

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import {
  LeaderboardTitleCard,
  LeaderboardTotalCreditsCard,
  LeaderboardDistributionCard,
  LeaderboardTopPodCard
} from '@/components/dashboard';
import { usePodCredits } from '@/libs/hooks/usePodCredits';
import { SearchBox } from '@/components/ui/SearchBox';
import { toast } from 'sonner';
import { useNetwork } from '@/libs/context/network-context';
import { LeaderboardTabs, type LeaderboardType } from './components/LeaderboardTabs';
import { RankingTable, type NodeData } from './components/RankingTable';
import { BookmarksTable } from './components/BookmarksTable';
import { LeaderboardTrendSection } from './components/LeaderboardTrendSection';

const BOOKMARKS_STORAGE_KEY = 'leaderboard_bookmarks';

interface RawNodeData {
  pubkey: string;
  uptime?: number;
  status?: string;
  storage_used?: number;
  storage_committed?: number;
  address?: string;
}

function LeaderboardPageContent() {
  const { network: selectedNetwork } = useNetwork();
  const { data: creditsData, isLoading, isFetching, error, refetch } = usePodCredits(selectedNetwork);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bookmarkedPods, setBookmarkedPods] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [nodesData, setNodesData] = useState<RawNodeData[]>([]);
  const [nodesLoading, setNodesLoading] = useState(true);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [hasInitialData, setHasInitialData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<LeaderboardType>('credits');
  const [cooldown, setCooldown] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(0);
  const itemsPerPage = 25;

  const REFRESH_COOLDOWN = 30; // 30 seconds cooldown
  const STORAGE_KEY = 'leaderboard-last-refresh';

  // Load last refresh time from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const storedTime = parseInt(stored);
        const now = Date.now();
        const timeSinceRefresh = (now - storedTime) / 1000;

        if (timeSinceRefresh < REFRESH_COOLDOWN) {
          setLastRefresh(storedTime);
          setCooldown(Math.ceil(REFRESH_COOLDOWN - timeSinceRefresh));
        }
      }
    }
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (creditsData?.data && !hasInitialData) {
      setHasInitialData(true);
    }
  }, [creditsData, hasInitialData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedNetwork, activeTab]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${BOOKMARKS_STORAGE_KEY}_${selectedNetwork}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setBookmarkedPods(new Set(parsed));
        }
      } else {
        setBookmarkedPods(new Set());
      }
    } catch {
      setBookmarkedPods(new Set());
    }
  }, [selectedNetwork]);

  useEffect(() => {
    try {
      localStorage.setItem(`${BOOKMARKS_STORAGE_KEY}_${selectedNetwork}`, JSON.stringify(Array.from(bookmarkedPods)));
    } catch {
      // Silently handle localStorage errors
    }
  }, [bookmarkedPods, selectedNetwork]);

  useEffect(() => {
    const fetchNodesData = async () => {
      try {
        setNodesLoading(true);
        const response = await fetch(`/api/nodes?includeAll=true&network=${selectedNetwork}`);
        if (response.ok) {
          const data = await response.json();
          setNodesData(data.nodes || []);
        }
      } catch {
        console.error('Failed to fetch nodes data');
      } finally {
        setNodesLoading(false);
      }
    };
    fetchNodesData();
  }, [selectedNetwork]);

  const nodesMap = useMemo(() => {
    const map = new Map<string, RawNodeData>();
    nodesData.forEach(node => {
      if (node.pubkey) {
        map.set(node.pubkey, node);
      }
    });
    return map;
  }, [nodesData]);

  // Merge credits data with nodes data and deduplicate by pod_id
  const mergedData: NodeData[] = useMemo(() => {
    if (!creditsData?.data) return [];

    // Use a Map to deduplicate by pod_id
    const uniquePods = new Map<string, NodeData>();

    creditsData.data.forEach((pod) => {
      // Skip if we already have this pod_id (keep first occurrence which has higher credits)
      if (uniquePods.has(pod.pod_id)) return;

      const nodeInfo = nodesMap.get(pod.pod_id);
      uniquePods.set(pod.pod_id, {
        pod_id: pod.pod_id,
        credits: pod.credits,
        uptime: nodeInfo?.uptime || 0,
        storage_used: nodeInfo?.storage_used || 0,
        storage_committed: nodeInfo?.storage_committed || 0,
        address: nodeInfo?.address,
      });
    });

    return Array.from(uniquePods.values());
  }, [creditsData, nodesMap]);

  // Sort all data first based on active tab, then filter and paginate
  const sortedData = useMemo(() => {
    const sorted = [...mergedData].sort((a, b) => {
      switch (activeTab) {
        case 'credits':
          return b.credits - a.credits;
        case 'uptime':
          return b.uptime - a.uptime;
        case 'storage':
          return b.storage_committed - a.storage_committed;
        default:
          return 0;
      }
    });
    // Assign global ranks
    return sorted.map((node, index) => ({ ...node, globalRank: index + 1 }));
  }, [mergedData, activeTab]);

  // Filter by search query (Pod ID or IP address)
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return sortedData;
    const query = searchQuery.toLowerCase().trim();
    return sortedData.filter(pod => {
      // Search by Pod ID
      if (pod.pod_id.toLowerCase().includes(query)) return true;
      // Search by IP address (extracted from address field)
      if (pod.address) {
        const ip = pod.address.split(':')[0];
        if (ip.toLowerCase().includes(query)) return true;
      }
      return false;
    });
  }, [sortedData, searchQuery]);

  // Paginate data
  const { paginatedData, totalPages } = useMemo(() => {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);
    return { paginatedData, totalPages };
  }, [filteredData, currentPage, itemsPerPage]);

  // Get bookmarked pods data
  const bookmarkedPodsData = useMemo(() => {
    if (bookmarkedPods.size === 0) return [];
    return mergedData
      .filter(pod => bookmarkedPods.has(pod.pod_id))
      .sort((a, b) => b.credits - a.credits)
      .map((pod, index) => ({ ...pod, rank: index + 1 }));
  }, [mergedData, bookmarkedPods]);

  const handleRefresh = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRefresh = (now - lastRefresh) / 1000;

    if (timeSinceLastRefresh < REFRESH_COOLDOWN) {
      const remaining = Math.ceil(REFRESH_COOLDOWN - timeSinceLastRefresh);
      toast.error(`Please wait ${remaining}s before refreshing again`);
      return;
    }

    setIsRefreshing(true);
    setLastRefresh(now);
    setCooldown(REFRESH_COOLDOWN);

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, now.toString());
    }

    try {
      await refetch();
      const response = await fetch(`/api/nodes?includeAll=true&network=${selectedNetwork}`);
      if (response.ok) {
        const data = await response.json();
        setNodesData(data.nodes || []);
      }
      toast.success(`${selectedNetwork.charAt(0).toUpperCase() + selectedNetwork.slice(1)} leaderboard updated!`);
    } catch {
      toast.error('Failed to refresh leaderboard');
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, selectedNetwork, lastRefresh]);

  const toggleBookmark = useCallback((podId: string) => {
    setBookmarkedPods(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(podId)) {
        newBookmarks.delete(podId);
        toast.success('Bookmark removed');
      } else {
        newBookmarks.add(podId);
        toast.success('Pod bookmarked');
      }
      return newBookmarks;
    });
  }, []);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const showSkeleton = isLoading && !hasInitialData;

  if (showSkeleton) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="relative bg-black border border-white/10 p-4 sm:p-6 h-20 sm:h-24">
          <div className="h-6 sm:h-8 bg-white/10 rounded w-36 sm:w-48 mb-2 sm:mb-3"></div>
          <div className="h-3 sm:h-4 bg-white/10 rounded w-48 sm:w-64"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="relative bg-black border border-white/10 p-4 sm:p-6 h-32 sm:h-40">
              <div className="flex flex-col items-center justify-center h-full">
                <div className="h-3 sm:h-4 bg-white/10 rounded w-20 sm:w-24 mb-2 sm:mb-3"></div>
                <div className="h-8 sm:h-10 bg-white/10 rounded w-24 sm:w-32 mb-1 sm:mb-2"></div>
                <div className="h-2 sm:h-3 bg-white/10 rounded w-16 sm:w-20"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-black/90 border border-white/10 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-white/10">
            <div className="h-5 sm:h-6 bg-white/10 rounded w-24 sm:w-32"></div>
          </div>
          <div className="p-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-10 bg-white/5 rounded mb-2"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-400 mb-2">Failed to load leaderboard data</div>
          <div className="text-white/60 text-sm">{error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LeaderboardTitleCard />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <LeaderboardTotalCreditsCard />
        <LeaderboardDistributionCard />
        <LeaderboardTopPodCard />
      </div>

      {/* Leaderboard Trends */}
      <LeaderboardTrendSection
        data={mergedData}
        isLoading={isLoading || nodesLoading}
      />

      <SearchBox
        onSearch={handleSearch}
        placeholder="Search by Pod ID or IP..."
        mobilePlaceholder="Search Pod ID or IP..."
      />

      {/* Bookmarks Section */}
      {bookmarkedPods.size > 0 && (
        <div className="bg-black/90 border border-yellow-500/30 rounded-lg overflow-hidden">
          <div
            className="flex items-center justify-between p-3 sm:p-4 border-b border-yellow-500/20 cursor-pointer hover:bg-yellow-500/5 transition-colors"
            onClick={() => setShowBookmarks(!showBookmarks)}
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Bookmark className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 fill-yellow-400" />
              <h2 className="text-sm sm:text-lg font-bold text-white font-mono">// BOOKMARKS ({selectedNetwork.toUpperCase()})</h2>
              <span className="text-yellow-400 text-xs sm:text-sm font-mono">({bookmarkedPods.size})</span>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setBookmarkedPods(new Set());
                  toast.success('All bookmarks cleared');
                }}
                className="text-red-400/70 hover:text-red-400 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded hover:bg-red-400/10 transition-colors"
              >
                Clear All
              </button>
              <ChevronRight className={`w-3 h-3 sm:w-4 sm:h-4 text-white/40 transition-transform duration-200 ${showBookmarks ? 'rotate-90' : ''}`} />
            </div>
          </div>
          {showBookmarks && (
            <BookmarksTable
              data={bookmarkedPodsData}
              onRemoveBookmark={toggleBookmark}
            />
          )}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className={`bg-black/90 border border-gray-800 rounded-lg overflow-hidden transition-opacity duration-300 ${isFetching && !isRefreshing ? 'opacity-70' : 'opacity-100'}`}>
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-lg font-bold text-white font-mono">// RANKINGS ({selectedNetwork.toUpperCase()})</h2>
            {isFetching && !isRefreshing && (
              <div className="w-3 h-3 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            )}
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isFetching || cooldown > 0}
            className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg text-white/60 transition-all duration-300 disabled:opacity-50 flex items-center gap-1"
            title={cooldown > 0 ? `Wait ${cooldown}s` : "Refresh Leaderboard"}
          >
            {cooldown > 0 && (
              <span className="text-[9px] font-mono text-white/40">{cooldown}s</span>
            )}
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 transition-all duration-500 ${isRefreshing || isFetching ? 'animate-spin text-white/60' : 'hover:rotate-180'}`} />
          </button>
        </div>

        {/* Tabs for different leaderboards */}
        <LeaderboardTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Ranking Table */}
        <RankingTable
          data={paginatedData}
          type={activeTab}
          bookmarkedPods={bookmarkedPods}
          onToggleBookmark={toggleBookmark}
          isLoading={nodesLoading}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 border-t border-gray-800 bg-black/30">
            <div className="text-xs sm:text-sm text-gray-400 order-2 sm:order-1">
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 order-1 sm:order-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 sm:p-2 bg-black/60 border border-white/20 rounded text-gray-400 hover:text-white hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-2 sm:px-3 py-0.5 sm:py-1 bg-black/60 border rounded text-xs sm:text-sm transition-all duration-200 ${currentPage === pageNum
                          ? 'border-white/40 text-white'
                          : 'border-white/20 text-gray-400 hover:text-white hover:border-white/40'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 sm:p-2 bg-black/60 border border-white/20 rounded text-gray-400 hover:text-white hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <DashboardLayout>
      <LeaderboardPageContent />
    </DashboardLayout>
  );
}
