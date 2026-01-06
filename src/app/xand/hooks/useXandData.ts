import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { XandData, REFRESH_COOLDOWN, formatCooldown } from '../components';

export function useXandData() {
  const [data, setData] = useState<XandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const hasFetched = useRef(false);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      
      const response = await fetch('/api/xand-info');
      if (!response.ok) throw new Error('Failed to fetch XAND data');
      
      const xandData = await response.json();
      setData(xandData);
      setLastFetchTime(Date.now());
      setError(null);
      toast.success(isManualRefresh ? 'XAND data refreshed' : 'XAND data loaded');
    } catch (err) {
      console.error('Error fetching XAND data:', err);
      setError('Failed to load XAND data');
      toast.error('Failed to load XAND data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchData(false);
    }
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastFetchTime > 0) {
        const remaining = Math.max(0, REFRESH_COOLDOWN - (Date.now() - lastFetchTime));
        setCooldownRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastFetchTime]);

  const handleRefresh = useCallback(() => {
    if (cooldownRemaining > 0) {
      toast.error(`Please wait ${formatCooldown(cooldownRemaining)} before refreshing`);
      return;
    }
    fetchData(true);
  }, [cooldownRemaining, fetchData]);

  const canRefresh = cooldownRemaining === 0 && !refreshing;

  return {
    data,
    loading,
    refreshing,
    error,
    cooldownRemaining,
    canRefresh,
    handleRefresh,
    retry: () => fetchData(false),
  };
}
