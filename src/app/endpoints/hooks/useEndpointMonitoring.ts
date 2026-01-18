'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface UptimeDataPoint {
  timestamp: string;
  status: 'up' | 'down';
  responseTime?: number;
}

interface RecentCall {
  endpoint: string;
  method: string;
  network: string;
  success: boolean;
  responseTime: number;
  timestamp: string;
}

interface EndpointStatus {
  name: string;
  url: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime: number;
  uptime: number;
  lastChecked: string;
  network: 'devnet' | 'mainnet';
  uptimeHistory?: UptimeDataPoint[];
  recentCalls?: RecentCall[];
}

interface EndpointSummary {
  total: number;
  operational: number;
  degraded: number;
  down: number;
  avgResponseTime: number;
  avgUptime: number;
}

interface UseEndpointMonitoringReturn {
  devnetEndpoints: EndpointStatus[];
  mainnetEndpoints: EndpointStatus[];
  devnetSummary: EndpointSummary;
  mainnetSummary: EndpointSummary;
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
  testingEndpoints: Set<string>;
  refreshEndpoints: (network?: 'devnet' | 'mainnet') => Promise<void>;
  testEndpoint: (endpointName: string) => Promise<void>;
}

export const useEndpointMonitoring = (): UseEndpointMonitoringReturn => {
  const [devnetEndpoints, setDevnetEndpoints] = useState<EndpointStatus[]>([]);
  const [mainnetEndpoints, setMainnetEndpoints] = useState<EndpointStatus[]>([]);
  const [devnetSummary, setDevnetSummary] = useState<EndpointSummary>({
    total: 0,
    operational: 0,
    degraded: 0,
    down: 0,
    avgResponseTime: 0,
    avgUptime: 0
  });
  const [mainnetSummary, setMainnetSummary] = useState<EndpointSummary>({
    total: 0,
    operational: 0,
    degraded: 0,
    down: 0,
    avgResponseTime: 0,
    avgUptime: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [testingEndpoints, setTestingEndpoints] = useState<Set<string>>(new Set());

  const fetchEndpointStatus = useCallback(async (network?: 'devnet' | 'mainnet', refresh = false) => {
    try {
      const params = new URLSearchParams();
      if (network) params.set('network', network);
      if (refresh) params.set('refresh', 'true');

      // Fetch both external endpoint status and RPC status
      const [endpointResponse, rpcResponse] = await Promise.all([
        fetch(`/api/endpoint-status?${params.toString()}`),
        fetch(`/api/rpc-status?${params.toString()}`)
      ]);
      
      if (!endpointResponse.ok) {
        throw new Error(`HTTP ${endpointResponse.status}: ${endpointResponse.statusText}`);
      }

      const endpointData = await endpointResponse.json();
      let rpcData = { endpoints: [], summary: { total: 0, operational: 0, degraded: 0, down: 0, avgResponseTime: 0, avgUptime: 0 } };
      
      // RPC status might fail, handle gracefully
      if (rpcResponse.ok) {
        rpcData = await rpcResponse.json();
      }
      
      // Merge endpoint data with RPC data
      const allEndpoints = [...endpointData.endpoints, ...rpcData.endpoints];
      
      if (network === 'devnet') {
        const devnetEndpoints = allEndpoints.filter(e => e.network === 'devnet');
        setDevnetEndpoints(devnetEndpoints);
        setDevnetSummary(calculateSummary(devnetEndpoints));
      } else if (network === 'mainnet') {
        const mainnetEndpoints = allEndpoints.filter(e => e.network === 'mainnet');
        setMainnetEndpoints(mainnetEndpoints);
        setMainnetSummary(calculateSummary(mainnetEndpoints));
      } else {
        // Split endpoints by network
        const devnet = allEndpoints.filter((e: EndpointStatus) => e.network === 'devnet');
        const mainnet = allEndpoints.filter((e: EndpointStatus) => e.network === 'mainnet');
        
        setDevnetEndpoints(devnet);
        setMainnetEndpoints(mainnet);
        setDevnetSummary(calculateSummary(devnet));
        setMainnetSummary(calculateSummary(mainnet));
      }
      
      setLastUpdate(endpointData.lastUpdate || new Date().toISOString());
      setError(null);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch endpoint status';
      setError(errorMessage);
      console.error('Endpoint monitoring error:', err);
    }
  }, []);

  // Helper function to calculate summary
  const calculateSummary = (endpoints: EndpointStatus[]): EndpointSummary => ({
    total: endpoints.length,
    operational: endpoints.filter(e => e.status === 'operational').length,
    degraded: endpoints.filter(e => e.status === 'degraded').length,
    down: endpoints.filter(e => e.status === 'down').length,
    avgResponseTime: endpoints.length > 0 
      ? Math.round(endpoints.reduce((sum, e) => sum + e.responseTime, 0) / endpoints.length)
      : 0,
    avgUptime: endpoints.length > 0
      ? Math.round((endpoints.reduce((sum, e) => sum + e.uptime, 0) / endpoints.length) * 10) / 10
      : 0
  });

  const refreshEndpoints = useCallback(async (network?: 'devnet' | 'mainnet') => {
    setLoading(true);
    await fetchEndpointStatus(network, true);
    setLoading(false);
  }, [fetchEndpointStatus]);

  const testEndpoint = useCallback(async (endpointName: string) => {
    setTestingEndpoints(prev => new Set(prev).add(endpointName));
    
    try {
      const response = await fetch('/api/endpoint-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: endpointName }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const updatedEndpoint = data.endpoint;

      // Update the appropriate endpoints array
      if (updatedEndpoint.network === 'devnet') {
        setDevnetEndpoints(prev => 
          prev.map(e => e.name === endpointName ? updatedEndpoint : e)
        );
      } else {
        setMainnetEndpoints(prev => 
          prev.map(e => e.name === endpointName ? updatedEndpoint : e)
        );
      }

      // Show success toast
      toast.success(`${endpointName} tested successfully`, {
        description: `Status: ${updatedEndpoint.status}, Response: ${updatedEndpoint.responseTime}ms`
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test endpoint';
      toast.error(`Failed to test ${endpointName}`, {
        description: errorMessage
      });
      console.error('Endpoint test error:', err);
    } finally {
      setTestingEndpoints(prev => {
        const newSet = new Set(prev);
        newSet.delete(endpointName);
        return newSet;
      });
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchEndpointStatus();
      setLoading(false);
    };

    loadInitialData();
  }, [fetchEndpointStatus]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEndpointStatus(undefined, true);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchEndpointStatus]);

  // Additional effect to force component re-renders for real-time feel
  useEffect(() => {
    const realtimeInterval = setInterval(() => {
      // Force a small update to trigger re-renders without API calls
      setLastUpdate(new Date().toISOString());
    }, 5000); // Update UI every 5 seconds for smooth real-time feel

    return () => clearInterval(realtimeInterval);
  }, []);

  return {
    devnetEndpoints,
    mainnetEndpoints,
    devnetSummary,
    mainnetSummary,
    loading,
    error,
    lastUpdate,
    testingEndpoints,
    refreshEndpoints,
    testEndpoint
  };
};