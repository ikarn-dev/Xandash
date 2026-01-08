'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useNetwork } from '@/libs/context/network-context';
import { NodeProfileData, TimeRange, timeRangeOptions, DbNodeSnapshot } from '../components/types';

interface UseNodeProfileProps {
  ip: string;
  initialData?: NodeProfileData | null;
}

export function useNodeProfile({ ip, initialData }: UseNodeProfileProps) {
  const { network } = useNetwork();
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NodeProfileData | null>(initialData || null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(initialData ? new Date() : null);

  // Dismiss navigation toast
  useEffect(() => {
    if (typeof window !== 'undefined') {
      toast.dismiss('node-profile-loading');
    }
  }, []);

  // Set initial data
  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
    }
  }, [initialData, ip]);

  const fetchData = useCallback(async (showToast = false, rangeHours?: number) => {
    try {
      let hours: number;
      if (rangeHours !== undefined) {
        hours = rangeHours;
      } else {
        const selectedRange = timeRangeOptions.find(r => r.value === timeRange);
        hours = selectedRange?.hours || 168;
      }
      
      // Include network parameter in the API call
      const response = await fetch(`/api/node-profile?ip=${encodeURIComponent(ip)}&source=both&hours=${hours}&network=${network}`);
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
      
      const profileData = await response.json();
      
      // Check if node exists on this network
      if (!profileData.currentNode && (!profileData.dbHistory || profileData.dbHistory.length === 0)) {
        setError(`Node not found on ${network}. This node may only exist on ${network === 'mainnet' ? 'devnet' : 'mainnet'}.`);
        setData(null);
        return;
      }
      
      setError(null);
      setData(profileData);
      setLastUpdate(new Date());
      if (showToast) toast.success('Data refreshed');
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      if (!data) {
        setError(`Failed to load node profile: ${errorMessage}`);
        toast.error('Failed to load node profile');
      }
    } finally {
      setLoading(false);
    }
  }, [ip, data, timeRange, network]);

  // Initial fetch and refetch when network changes
  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);
    fetchData(true, 168);
  }, [ip, network]);

  // Refetch when time range changes
  useEffect(() => {
    const hours = timeRangeOptions.find(r => r.value === timeRange)?.hours || 168;
    fetchData(false, hours);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Filter and process history data
  const { displayHistory, filteredDbHistoryLength, isShowingFallbackData, hasAnyData } = useMemo(() => {
    const filteredDbHistory = data?.dbHistory?.filter(entry => {
      if (timeRange === 'all') return true;
      const now = Date.now();
      const entryTime = entry.timestamp * 1000;
      const rangeHours = timeRangeOptions.find(r => r.value === timeRange)?.hours || 7;
      return now - entryTime <= rangeHours * 3600 * 1000;
    }) || [];

    const minDataPoints = 5;
    let displayHistory: DbNodeSnapshot[] = filteredDbHistory;
    
    if (timeRange !== 'all' && filteredDbHistory.length < minDataPoints && (data?.dbHistory?.length || 0) > 0) {
      const recentDataCount = Math.min(50, data?.dbHistory?.length || 0);
      displayHistory = data?.dbHistory?.slice(-recentDataCount) || [];
    }
    
    if (displayHistory.length === 0 && (data?.dbHistory?.length || 0) > 0) {
      displayHistory = data?.dbHistory?.slice(-10) || [];
    }

    return {
      displayHistory,
      filteredDbHistoryLength: filteredDbHistory.length,
      isShowingFallbackData: timeRange !== 'all' && displayHistory.length > filteredDbHistory.length,
      hasAnyData: (data?.dbHistory?.length || 0) > 0
    };
  }, [data?.dbHistory, timeRange]);

  const node = data?.currentNode;
  const location = data?.location;

  return {
    loading,
    error,
    data,
    node,
    location,
    timeRange,
    setTimeRange,
    lastUpdate,
    displayHistory,
    filteredDbHistoryLength,
    isShowingFallbackData,
    hasAnyData,
    fetchData: () => fetchData(true)
  };
}
