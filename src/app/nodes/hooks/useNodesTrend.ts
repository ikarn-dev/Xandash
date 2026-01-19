'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNetwork } from '@/libs/context/network-context';

interface NodeCountSnapshot {
  timestamp: number;
  total_nodes: number;
  online_nodes: number;
  offline_nodes: number;
  syncing_nodes: number;
  created_at: string;
}

interface NodesTrendData {
  network: string;
  hours: number;
  data: NodeCountSnapshot[];
  count: number;
  lastUpdate: string;
}

interface UseNodesTrendReturn {
  trendData: NodeCountSnapshot[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: string | null;
  refetch: () => Promise<void>;
}

export const useNodesTrend = (hours: number = 24): UseNodesTrendReturn => {
  const { network } = useNetwork();
  const [trendData, setTrendData] = useState<NodeCountSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const fetchTrendData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/nodes-trend?network=${network}&hours=${hours}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: NodesTrendData = await response.json();
      
      setTrendData(data.data);
      setLastUpdate(data.lastUpdate);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trend data';
      setError(errorMessage);
      console.error('Nodes trend fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [network, hours]);

  // Initial fetch
  useEffect(() => {
    fetchTrendData();
  }, [fetchTrendData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTrendData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [fetchTrendData]);

  return {
    trendData,
    isLoading,
    error,
    lastUpdate,
    refetch: fetchTrendData
  };
};