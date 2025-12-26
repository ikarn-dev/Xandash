'use client';

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { Star, RefreshCw, ChevronLeft, ChevronRight, X, Bookmark } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { 
  LeaderboardTitleCard, 
  LeaderboardTotalCreditsCard, 
  LeaderboardDistributionCard, 
  LeaderboardTopPodCard 
} from '@/components/dashboard';
import { usePodCredits } from '@/libs/hooks/usePodCredits';
import { CopyBtn } from '@/components/ui/CopyBtn';
import { toast } from 'sonner';

const BOOKMARKS_STORAGE_KEY = 'leaderboard_bookmarks';

interface NodeData {
  pubkey: string;
  uptime: number;
  status: string;
}

function LeaderboardPageContent() {
  const { data: creditsData, isLoading, error, refetch } = usePodCredits();
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [bookmarkedPods, setBookmarkedPods] = React.useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = React.useState(1);
  const [nodesData, setNodesData] = useState<NodeData[]>([]);
  const [nodesLoading, setNodesLoading] = useState(true);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const itemsPerPage = 25;

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setBookmarkedPods(new Set(parsed));
        }
      }
    } catch (err) {
      console.error('Failed to load bookmarks:', err);
    }
  }, []);

  // Save bookmarks to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(Array.from(bookmarkedPods)));
    } catch (err) {
      console.error('Failed to save bookmarks:', err);
    }
  }, [bookmarkedPods]);

  // Fetch nodes data for uptime
  useEffect(() => {
    const fetchNodesData = async () => {
      try {
        setNodesLoading(true);
        const response = await fetch('/api/nodes?includeAll=true');
        if (response.ok) {
          const data = await response.json();
          setNodesData(data.nodes || []);
        }
      } catch (err) {
        console.error('Failed to fetch nodes data:', err);
      } finally {
        setNodesLoading(false);
      }
    };
    fetchNodesData();
  }, []);

  // Create a map of pubkey to uptime for quick lookup
  const uptimeMap = useMemo(() => {
    const map = new Map<string, { uptime: number; status: string }>();
    nodesData.forEach(node => {
      if (node.pubkey) {
        map.set(node.pubkey, { uptime: node.uptime || 0, status: node.status || 'unknown' });
      }
    });
    return map;
  }, [nodesData]);

  // Format uptime display
  const formatUptime = (seconds: number) => {
    if (!seconds || seconds <= 0) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return '<1h';
  };

  // Get tier based on credits
  const getTier = (credits: number): { name: string; color: string; bgColor: string } => {
    if (credits >= 50000) return { name: 'Diamond', color: '#60a5fa', bgColor: 'rgba(96, 165, 250, 0.15)' };
    if (credits >= 25000) return { name: 'Platinum', color: '#a78bfa', bgColor: 'rgba(167, 139, 250, 0.15)' };
    if (credits >= 10000) return { name: 'Gold', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.15)' };
    if (credits >= 5000) return { name: 'Silver', color: '#9ca3af', bgColor: 'rgba(156, 163, 175, 0.15)' };
    return { name: 'Bronze', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)' };
  };

  // Create leaderboard from credits data
  const { leaderboard, totalPages, paginatedData } = useMemo(() => {
    if (!creditsData?.data) return { leaderboard: [], totalPages: 0, paginatedData: [] };
    
    const sortedData = creditsData.data
      .sort((a, b) => b.credits - a.credits)
      .map((pod, index) => {
        const nodeInfo = uptimeMap.get(pod.pod_id);
        return {
          rank: index + 1,
          pod_id: pod.pod_id,
          credits: pod.credits,
          uptime: nodeInfo?.uptime || 0,
          status: nodeInfo?.status || 'unknown',
        };
      });

    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

    return { 
      leaderboard: sortedData, 
      totalPages, 
      paginatedData 
    };
  }, [creditsData, currentPage, itemsPerPage, uptimeMap]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      // Also refresh nodes data
      const response = await fetch('/api/nodes?includeAll=true');
      if (response.ok) {
        const data = await response.json();
        setNodesData(data.nodes || []);
      }
      toast.success('Leaderboard updated successfully!');
    } catch (err) {
      console.error('Failed to refresh leaderboard:', err);
      toast.error('Failed to refresh leaderboard');
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleCopy = useCallback(() => {
    toast.success('Pod ID copied to clipboard!');
  }, []);

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

  // Get bookmarked pods data
  const bookmarkedPodsData = useMemo(() => {
    if (!creditsData?.data || bookmarkedPods.size === 0) return [];
    
    return leaderboard.filter(pod => bookmarkedPods.has(pod.pod_id));
  }, [creditsData, bookmarkedPods, leaderboard]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const goToPreviousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Title Card Skeleton */}
        <div className="relative bg-black border border-white/10 p-6 h-24 animate-pulse">
          <div className="h-8 bg-gray-700/50 rounded w-48 mb-3"></div>
          <div className="h-4 bg-gray-700/50 rounded w-64"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="relative bg-black border border-white/10 p-6 h-40 animate-pulse">
              <div className="flex flex-col items-center justify-center h-full">
                <div className="h-4 bg-gray-700/50 rounded w-24 mb-3"></div>
                <div className="h-10 bg-gray-700/50 rounded w-32 mb-2"></div>
                <div className="h-3 bg-gray-700/50 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="bg-black/90 border border-gray-800 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="h-6 bg-gray-700/50 rounded w-32 animate-pulse"></div>
            <div className="w-8 h-8 bg-gray-700/50 rounded animate-pulse"></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-gray-800 bg-black/50">
                  {['#', 'Pod ID', 'Tier', 'Credits', 'Uptime'].map((_, i) => (
                    <th key={i} className="py-3 px-3">
                      <div className="h-3 bg-gray-700/50 rounded w-16 animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-800/50">
                    {[1, 2, 3, 4, 5].map(j => (
                      <td key={j} className="py-3 px-3">
                        <div className="h-4 bg-gray-700/50 rounded animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
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
      {/* Title Card */}
      <LeaderboardTitleCard />

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <LeaderboardTotalCreditsCard />
        <LeaderboardDistributionCard />
        <LeaderboardTopPodCard />
      </div>

      {/* Bookmarks Section */}
      {bookmarkedPods.size > 0 && (
        <div className="bg-black/90 border border-yellow-500/30 rounded-lg overflow-hidden">
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 border-b border-yellow-500/20 cursor-pointer hover:bg-yellow-500/5 transition-colors"
            onClick={() => setShowBookmarks(!showBookmarks)}
          >
            <div className="flex items-center space-x-3">
              <Bookmark className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <h2 className="text-lg font-bold text-white font-mono">// BOOKMARKS</h2>
              <span className="text-yellow-400 text-sm font-mono">({bookmarkedPods.size})</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setBookmarkedPods(new Set());
                  toast.success('All bookmarks cleared');
                }}
                className="text-red-400/70 hover:text-red-400 text-xs font-medium px-2 py-1 rounded hover:bg-red-400/10 transition-colors"
              >
                Clear All
              </button>
              <span className="text-white/40 text-xs">{showBookmarks ? 'Collapse' : 'Expand'}</span>
              <ChevronRight className={`w-4 h-4 text-white/40 transition-transform duration-200 ${showBookmarks ? 'rotate-90' : ''}`} />
            </div>
          </div>

          {/* Bookmarked Pods Table */}
          {showBookmarks && (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-yellow-500/20 bg-black/50">
                    <th className="text-left py-3 px-3 text-yellow-400/70 text-xs font-medium uppercase tracking-wider w-[12%]">#</th>
                    <th className="text-left py-3 px-3 text-yellow-400/70 text-xs font-medium uppercase tracking-wider w-[32%]">Pod ID</th>
                    <th className="text-center py-3 px-3 text-yellow-400/70 text-xs font-medium uppercase tracking-wider w-[14%]">Tier</th>
                    <th className="text-right py-3 px-3 text-yellow-400/70 text-xs font-medium uppercase tracking-wider w-[18%]">Credits</th>
                    <th className="text-center py-3 px-3 text-yellow-400/70 text-xs font-medium uppercase tracking-wider w-[14%]">Uptime</th>
                  </tr>
                </thead>
                <tbody>
                  {bookmarkedPodsData.map((pod) => {
                    const tier = getTier(pod.credits);
                    return (
                      <tr 
                        key={`bookmark-${pod.pod_id}`} 
                        className="group hover:bg-yellow-500/5 transition-all duration-200 border-b border-yellow-500/10"
                      >
                        {/* Rank with Remove */}
                        <td className="py-3 px-3 w-[12%]">
                          <div className="flex items-center space-x-1">
                            <span className="text-white text-sm font-medium">#{pod.rank}</span>
                            <button
                              onClick={() => toggleBookmark(pod.pod_id)}
                              className="text-yellow-400 hover:text-red-400 transition-colors duration-200 cursor-pointer"
                              title="Remove bookmark"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        
                        {/* Pod ID */}
                        <td className="py-3 px-3 w-[32%]">
                          <div className="flex items-center space-x-2">
                            <div className="font-mono text-yellow-100 text-sm group-hover:text-yellow-300 transition-colors duration-300 truncate">
                              {pod.pod_id}
                            </div>
                            <CopyBtn 
                              text={pod.pod_id} 
                              onCopy={handleCopy}
                              type="Pod ID"
                            />
                          </div>
                        </td>
                        
                        {/* Tier Badge */}
                        <td className="py-3 px-3 text-center w-[14%]">
                          <span 
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                            style={{ 
                              color: tier.color, 
                              backgroundColor: tier.bgColor,
                              border: `1px solid ${tier.color}30`
                            }}
                          >
                            <span 
                              className="w-2 h-2 rounded-full mr-1.5" 
                              style={{ backgroundColor: tier.color }}
                            />
                            {tier.name}
                          </span>
                        </td>
                        
                        {/* Credits */}
                        <td className="py-3 px-3 text-right w-[18%]">
                          <div className="text-green-400 font-mono text-sm font-bold">
                            +{pod.credits.toLocaleString()}
                          </div>
                        </td>
                        
                        {/* Uptime */}
                        <td className="py-3 px-3 text-center w-[14%]">
                          <span className={`text-xs font-mono ${
                            pod.uptime > 0 ? 'text-blue-400' : 'text-gray-500'
                          }`}>
                            {formatUptime(pod.uptime)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-black/90 border border-gray-800 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-bold text-white font-mono">// RANKINGS</h2>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-white/10 rounded-lg text-white/60 transition-all duration-300 disabled:opacity-50"
            title="Refresh Leaderboard"
          >
            <RefreshCw 
              className={`w-4 h-4 transition-all duration-500 ${
                isRefreshing 
                  ? 'animate-spin text-white/60' 
                  : 'hover:rotate-180'
              }`} 
            />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-gray-800 bg-black/50">
                <th className="text-left py-3 px-3 text-gray-400 text-xs font-medium uppercase tracking-wider w-[12%]">#</th>
                <th className="text-left py-3 px-3 text-gray-400 text-xs font-medium uppercase tracking-wider w-[32%]">Pod ID</th>
                <th className="text-center py-3 px-3 text-gray-400 text-xs font-medium uppercase tracking-wider w-[14%]">Tier</th>
                <th className="text-right py-3 px-3 text-gray-400 text-xs font-medium uppercase tracking-wider w-[18%]">Credits</th>
                <th className="text-center py-3 px-3 text-gray-400 text-xs font-medium uppercase tracking-wider w-[14%]">Uptime</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((pod) => {
                const isBookmarked = bookmarkedPods.has(pod.pod_id);
                const tier = getTier(pod.credits);
                
                return (
                  <tr 
                    key={pod.pod_id} 
                    className="group hover:bg-gray-900/50 transition-all duration-200 border-b border-gray-800/50"
                  >
                    {/* Rank with Star */}
                    <td className="py-3 px-3 w-[12%]">
                      <div className="flex items-center space-x-1">
                        <span className="text-white text-sm font-medium">#{pod.rank}</span>
                        <button
                          onClick={() => toggleBookmark(pod.pod_id)}
                          className="text-gray-500 hover:text-yellow-400 transition-colors duration-200 cursor-pointer"
                          title={isBookmarked ? 'Remove bookmark' : 'Bookmark pod'}
                        >
                          <Star 
                            className={`w-3 h-3 ${isBookmarked ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'}`} 
                          />
                        </button>
                      </div>
                    </td>
                    
                    {/* Pod ID */}
                    <td className="py-3 px-3 w-[32%]">
                      <div className="flex items-center space-x-2">
                        <div className="font-mono text-white text-sm group-hover:text-blue-300 transition-colors duration-300 truncate">
                          {pod.pod_id}
                        </div>
                        <CopyBtn 
                          text={pod.pod_id} 
                          onCopy={handleCopy}
                          type="Pod ID"
                        />
                      </div>
                    </td>
                    
                    {/* Tier Badge */}
                    <td className="py-3 px-3 text-center w-[14%]">
                      <span 
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{ 
                          color: tier.color, 
                          backgroundColor: tier.bgColor,
                          border: `1px solid ${tier.color}30`
                        }}
                      >
                        <span 
                          className="w-2 h-2 rounded-full mr-1.5" 
                          style={{ backgroundColor: tier.color }}
                        />
                        {tier.name}
                      </span>
                    </td>
                    
                    {/* Credits */}
                    <td className="py-3 px-3 text-right w-[18%]">
                      <div className="text-green-400 font-mono text-sm font-bold">
                        +{pod.credits.toLocaleString()}
                      </div>
                    </td>
                    
                    {/* Uptime */}
                    <td className="py-3 px-3 text-center w-[14%]">
                      {nodesLoading ? (
                        <div className="h-4 bg-gray-700/50 rounded w-12 mx-auto animate-pulse"></div>
                      ) : (
                        <span className={`text-xs font-mono ${
                          pod.uptime > 0 ? 'text-blue-400' : 'text-gray-500'
                        }`}>
                          {formatUptime(pod.uptime)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-800 bg-black/30">
            <div className="text-sm text-gray-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, leaderboard.length)} of {leaderboard.length} entries
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-gray-400/20 to-gray-600/10 rounded blur-sm opacity-50 group-hover:opacity-70 transition duration-300"></div>
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="relative p-2 bg-gradient-to-br from-black/60 to-black/80 border border-white/20 rounded text-gray-400 hover:text-white hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <div key={pageNum} className="relative group">
                      <div className={`absolute -inset-1 rounded blur-sm opacity-50 group-hover:opacity-70 transition duration-300 ${
                        currentPage === pageNum 
                          ? 'bg-gradient-to-r from-blue-400/40 to-purple-600/30' 
                          : 'bg-gradient-to-r from-gray-400/20 to-gray-600/10'
                      }`}></div>
                      <button
                        onClick={() => goToPage(pageNum)}
                        className={`relative px-3 py-1 bg-gradient-to-br from-black/60 to-black/80 border rounded text-sm transition-all duration-200 cursor-pointer ${
                          currentPage === pageNum
                            ? 'border-white/40 text-white'
                            : 'border-white/20 text-gray-400 hover:text-white hover:border-white/40'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-gray-400/20 to-gray-600/10 rounded blur-sm opacity-50 group-hover:opacity-70 transition duration-300"></div>
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="relative p-2 bg-gradient-to-br from-black/60 to-black/80 border border-white/20 rounded text-gray-400 hover:text-white hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
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
