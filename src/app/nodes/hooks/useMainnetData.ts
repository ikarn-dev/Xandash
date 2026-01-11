'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ValidatorData } from '@/libs/server';

/**
 * Mainnet Data Hook
 * 
 * Fetches mainnet nodes using dual-source staggered approach:
 * - 0s: Source A fetch
 * - 15s: Source B fetch
 * - 30s: Cycle restarts
 * 
 * Data is merged: larger source provides base count,
 * smaller source updates matching pubkeys
 */

interface MainnetGeoData {
  country: string;
  country_code: string;
  credits: number | null;
  geo_sort: string;
  ip: string;
  name: string;
  nfts: string[];
  ping: number | null;
  provider: string;
  stake: number;
}

interface MainnetPod {
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
  ping?: number | null;
  credits?: number | null;
  country?: string;
  country_code?: string;
  provider?: string;
}

interface UseMainnetDataResult {
  mainnetNodes: ValidatorData[];
  geoData: Record<string, MainnetGeoData>;
  isLoading: boolean;
  lastFetchTime: number;
  canRefresh: boolean;
  timeUntilRefresh: number;
  manualRefresh: () => void;
  dataSource: string;
}

const CYCLE_MS = 30 * 1000; // 30 second full cycle

export function useMainnetData(
  network: string
): UseMainnetDataResult {
  const [mainnetNodes, setMainnetNodes] = useState<ValidatorData[]>([]);
  const [geoData, setGeoData] = useState<Record<string, MainnetGeoData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [canRefresh, setCanRefresh] = useState(true);
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(0);
  const [dataSource, setDataSource] = useState<string>('');
  
  const lastFetchRef = useRef(0);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  // Fetch mainnet nodes
  const fetchMainnetData = useCallback(async () => {
    console.log('[Mainnet Hook] Fetching mainnet data...');
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/mainnet-rpc', {
        method: 'GET',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(`Fetch error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`[Mainnet Hook] Received ${data.nodes?.length} nodes (source: ${data.source})`);

      if (data.nodes && Array.isArray(data.nodes)) {
        const serverTime = Math.floor(Date.now() / 1000);
        const transformedNodes: ValidatorData[] = data.nodes.map((pod: MainnetPod, index: number) => {
          const ip = pod.address?.split(':')[0] || '';
          const geo = data.geo?.[ip] as MainnetGeoData | undefined;
          const timeDiff = serverTime - (pod.last_seen_timestamp || 0);
          
          let status: 'online' | 'syncing' | 'offline' = 'offline';
          if (timeDiff < 1800) status = 'online';
          else if (timeDiff < 3600) status = 'syncing';

          return {
            address: pod.address || '',
            pubkey: pod.pubkey || `node-${index}`,
            is_public: pod.is_public || false,
            storage_committed: pod.storage_committed || 0,
            storage_used: pod.storage_used || 0,
            usage_percent: pod.storage_usage_percent || 0,
            storage_usage_percent: pod.storage_usage_percent || 0,
            rpc_port: pod.rpc_port || 0,
            version: pod.version || '',
            uptime: pod.uptime || 0,
            last_seen_timestamp: pod.last_seen_timestamp || 0,
            status,
            score: 0,
            rank: index + 1,
            duplicateCount: 0,
            isDuplicate: false,
            ping: pod.ping ?? geo?.ping ?? null,
            credits: pod.credits ?? geo?.credits ?? 0,
          } as ValidatorData;
        });

        // Update nodes in place to avoid full table re-render
        setMainnetNodes(prevNodes => {
          if (isInitialLoad.current || prevNodes.length === 0) {
            isInitialLoad.current = false;
            return transformedNodes;
          }
          
          // Update existing nodes in place by matching pubkey
          const updatedNodes = prevNodes.map(prev => {
            const updated = transformedNodes.find(v => v.pubkey === prev.pubkey);
            if (updated) {
              // Check if values actually changed
              if (
                prev.status === updated.status &&
                prev.uptime === updated.uptime &&
                prev.last_seen_timestamp === updated.last_seen_timestamp &&
                prev.storage_used === updated.storage_used &&
                prev.storage_usage_percent === updated.storage_usage_percent &&
                prev.credits === updated.credits
              ) {
                return prev; // No changes, keep same reference
              }
              return { ...prev, ...updated };
            }
            return prev;
          });
          
          // Add any new nodes
          const existingPubkeys = new Set(prevNodes.map(v => v.pubkey));
          const newNodes = transformedNodes.filter(v => !existingPubkeys.has(v.pubkey));
          
          // Remove nodes that no longer exist
          const currentPubkeys = new Set(transformedNodes.map(v => v.pubkey));
          const filteredNodes = updatedNodes.filter(v => currentPubkeys.has(v.pubkey));
          
          if (newNodes.length > 0) {
            return [...filteredNodes, ...newNodes];
          }
          
          return filteredNodes;
        });
        
        setGeoData(data.geo || {});
        setDataSource(data.source || 'unknown');
        lastFetchRef.current = Date.now();
        setLastFetchTime(Date.now());
        setCanRefresh(false);
        setTimeUntilRefresh(CYCLE_MS);
        
        console.log(`[Mainnet Hook] Transformed ${transformedNodes.length} nodes`);
      }
    } catch (error) {
      console.error('[Mainnet Hook] Fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Manual refresh
  const manualRefresh = useCallback(() => {
    const timeSinceLastFetch = Date.now() - lastFetchRef.current;
    if (timeSinceLastFetch >= CYCLE_MS && network === 'mainnet') {
      fetchMainnetData();
    }
  }, [network, fetchMainnetData]);

  // Fetch on mount and when network changes to mainnet
  useEffect(() => {
    if (network !== 'mainnet') {
      setMainnetNodes([]);
      setGeoData({});
      setDataSource('');
      isInitialLoad.current = true; // Reset for next time
      return;
    }

    const timeSinceLastFetch = Date.now() - lastFetchRef.current;
    if (timeSinceLastFetch >= CYCLE_MS || mainnetNodes.length === 0) {
      fetchMainnetData();
    }
  }, [network, fetchMainnetData]);

  // Countdown timer and auto-refresh
  useEffect(() => {
    if (network !== 'mainnet') return;

    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastFetchRef.current;
      const remaining = Math.max(0, CYCLE_MS - elapsed);
      setTimeUntilRefresh(remaining);
      setCanRefresh(remaining === 0);
      
      // Auto-refresh when cycle completes
      if (remaining === 0 && elapsed >= CYCLE_MS) {
        fetchMainnetData();
      }
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [network, fetchMainnetData]);

  return {
    mainnetNodes,
    geoData,
    isLoading,
    lastFetchTime,
    canRefresh,
    timeUntilRefresh,
    manualRefresh,
    dataSource,
  };
}
