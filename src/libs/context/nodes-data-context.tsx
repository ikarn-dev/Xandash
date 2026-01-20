'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo, ReactNode } from 'react';
import { useNetwork } from './network-context';
import { useRPCContext } from './rpc-context';

/**
 * Shared Nodes Data Context
 * 
 * Provides a single source of truth for node data across all components.
 * This prevents inconsistencies between stats cards and filter badges
 * that were caused by multiple independent data fetches.
 */

interface NodeData {
  address: string;
  pubkey: string;
  is_public: boolean;
  storage_committed: number;
  storage_used: number;
  storage_usage_percent: number;
  rpc_port: number;
  version: string;
  uptime: number;
  last_seen_timestamp: number;
  status: 'online' | 'syncing' | 'offline';
  credits?: number | null;
  country?: string;
  country_code?: string;
  provider?: string;
  score?: number;
  // Manager data
  manager_pubkey?: string;
  manager_nft_count?: number;
  manager_sbt_count?: number;
  manager_xand_balance?: number;
  manager_nft_names?: string[];
  manager_sbt_names?: string[];
}

interface GeoData {
  country: string;
  country_code: string;
  credits: number | null;
  provider: string;
  ip: string;
}

interface NodesStats {
  total: number;
  online: number;
  syncing: number;
  offline: number;
  public: number;
  onlinePercentage: number;
}

interface NodesDataContextType {
  nodes: NodeData[];
  geoData: Record<string, GeoData>;
  stats: NodesStats;
  isLoading: boolean;
  lastFetchTime: number;
  dataFetchTime: number;
  source: string;
  refreshData: (force?: boolean) => Promise<void>;
}

const NodesDataContext = createContext<NodesDataContextType | null>(null);

const REFRESH_INTERVAL = 30 * 1000; // 30 seconds
const MIN_REFRESH_INTERVAL = 5 * 1000; // Minimum 5 seconds between refreshes (reduced for manual refresh)

export const NodesDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { network, isMainnet } = useNetwork();
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [geoData, setGeoData] = useState<Record<string, GeoData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [dataFetchTime, setDataFetchTime] = useState(Math.floor(Date.now() / 1000));
  const [source, setSource] = useState('');

  const lastNetworkRef = useRef(network);
  const fetchingRef = useRef(false);
  const mountedRef = useRef(true);

  // High watermark for mainnet node count - keeps track of the highest node count seen
  const mainnetHighWatermarkRef = useRef<Map<string, NodeData>>(new Map());

  // Get RPC context for registering refresh function
  let rpcContext: { registerRefresh: (id: string, fn: () => void) => void; unregisterRefresh: (id: string) => void } | null = null;
  try {
    rpcContext = useRPCContext();
  } catch {
    // RPC context not available, that's okay
  }


  // Calculate stats from nodes
  const stats = useMemo((): NodesStats => {
    const serverTime = dataFetchTime;

    let online = 0;
    let syncing = 0;
    let offline = 0;
    let publicCount = 0;

    for (const node of nodes) {
      const timeDiff = serverTime - (node.last_seen_timestamp || 0);

      if (timeDiff <= 3600) {
        online++;
      } else if (timeDiff < 7200) {
        syncing++;
      } else {
        offline++;
      }

      if (node.is_public) {
        publicCount++;
      }
    }

    const total = nodes.length;
    const onlinePercentage = total > 0 ? (online / total) * 100 : 0;

    return {
      total,
      online,
      syncing,
      offline,
      public: publicCount,
      onlinePercentage,
    };
  }, [nodes, dataFetchTime]);

  // Fetch data from API
  const fetchData = useCallback(async (force = false) => {
    // Prevent concurrent fetches
    if (fetchingRef.current) return;

    // Respect minimum refresh interval unless forced
    if (!force && lastFetchTime > 0 && Date.now() - lastFetchTime < MIN_REFRESH_INTERVAL) {
      return;
    }

    fetchingRef.current = true;

    try {
      // Use the appropriate API endpoint based on network
      const endpoint = isMainnet
        ? '/api/mainnet-rpc'
        : `/api/nodes?includeAll=true&network=${network}&_t=${Date.now()}`;

      const response = await fetch(endpoint, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const data = await response.json();

      if (!mountedRef.current) return;

      const serverTime = data.serverTimestamp || Math.floor(Date.now() / 1000);

      // Transform nodes with consistent status calculation
      let fetchedNodes: NodeData[] = [];

      if (isMainnet && data.nodes) {
        fetchedNodes = data.nodes.map((node: any) => {
          const timeDiff = serverTime - (node.last_seen_timestamp || 0);
          let status: 'online' | 'syncing' | 'offline' = 'offline';
          if (timeDiff <= 3600) status = 'online';
          else if (timeDiff < 7200) status = 'syncing';

          return {
            address: node.address || '',
            pubkey: node.pubkey || '',
            is_public: node.is_public || false,
            storage_committed: node.storage_committed || 0,
            storage_used: node.storage_used || 0,
            storage_usage_percent: node.storage_usage_percent || 0,
            rpc_port: node.rpc_port || 0,
            version: node.version || '',
            uptime: node.uptime || 0,
            last_seen_timestamp: node.last_seen_timestamp || 0,
            status,
            credits: node.credits,
            country: node.country,
            country_code: node.country_code,
            provider: node.provider,
            score: node.score || 0,
            // Manager data
            manager_pubkey: node.manager_pubkey,
            manager_nft_count: node.manager_nft_count,
            manager_sbt_count: node.manager_sbt_count,
            manager_xand_balance: node.manager_xand_balance,
            manager_nft_names: node.manager_nft_names,
            manager_sbt_names: node.manager_sbt_names,
          };
        });

        // High watermark logic for mainnet:
        // If new fetch has more nodes, replace everything
        // If new fetch has fewer/equal nodes, only update existing nodes' data
        // Use pubkey as the unique identifier
        const currentHighWatermark = mainnetHighWatermarkRef.current;

        if (fetchedNodes.length > currentHighWatermark.size) {
          // New high watermark - replace all nodes
          currentHighWatermark.clear();
          for (const node of fetchedNodes) {
            if (node.pubkey) {
              currentHighWatermark.set(node.pubkey, node);
            }
          }
          setNodes(fetchedNodes);
        } else if (currentHighWatermark.size > 0) {
          // Update only the nodes that came back, keep the rest with their old data
          for (const node of fetchedNodes) {
            if (node.pubkey) {
              currentHighWatermark.set(node.pubkey, node);
            }
          }
          // Convert map back to array, preserving all nodes from high watermark
          setNodes(Array.from(currentHighWatermark.values()));
        } else {
          // First fetch - initialize high watermark
          for (const node of fetchedNodes) {
            if (node.pubkey) {
              currentHighWatermark.set(node.pubkey, node);
            }
          }
          setNodes(fetchedNodes);
        }

        // Store geo data for mainnet
        if (data.geo) {
          setGeoData(prev => ({ ...prev, ...data.geo }));
        }
      } else if (data.nodes) {
        // For devnet, just replace nodes normally (no high watermark)
        fetchedNodes = data.nodes.map((node: any) => {
          const timeDiff = serverTime - (node.last_seen_timestamp || 0);
          let status: 'online' | 'syncing' | 'offline' = 'offline';
          if (timeDiff <= 3600) status = 'online';
          else if (timeDiff < 7200) status = 'syncing';

          return {
            address: node.address || '',
            pubkey: node.pubkey || '',
            is_public: node.is_public || false,
            storage_committed: node.storage_committed || 0,
            storage_used: node.storage_used || 0,
            storage_usage_percent: node.storage_usage_percent || 0,
            rpc_port: node.rpc_port || 0,
            version: node.version || '',
            uptime: node.uptime || 0,
            last_seen_timestamp: node.last_seen_timestamp || 0,
            status,
            country: node.country,
            country_code: node.country_code,
            provider: node.provider,
            score: node.score || 0,
            // Manager data
            manager_pubkey: node.manager_pubkey,
            manager_nft_count: node.manager_nft_count,
            manager_sbt_count: node.manager_sbt_count,
            manager_xand_balance: node.manager_xand_balance,
            manager_nft_names: node.manager_nft_names,
            manager_sbt_names: node.manager_sbt_names,
          };
        });
        setNodes(fetchedNodes);

        // Fetch geo data for devnet nodes that don't have it
        const nodesWithoutGeo = fetchedNodes.filter(n => !n.country || !n.country_code);
        if (nodesWithoutGeo.length > 0) {
          const ips = nodesWithoutGeo.map(n => n.address.split(':')[0]).filter(Boolean);
          const uniqueIps = [...new Set(ips)];

          // Fetch geo data in background (don't block)
          fetch('/api/geolocation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ips: uniqueIps }),
          })
            .then(res => res.ok ? res.json() : {})
            .then(geoResults => {
              if (mountedRef.current && Object.keys(geoResults).length > 0) {
                setGeoData(prev => ({ ...prev, ...geoResults }));
              }
            })
            .catch(() => { });
        }
      }

      setDataFetchTime(serverTime);
      setLastFetchTime(Date.now());
      setSource(data.source || 'api');
      setIsLoading(false);

    } catch (_error) {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [network, isMainnet, lastFetchTime]);

  // Refresh data function exposed to consumers
  const refreshData = useCallback(async (force = false) => {
    await fetchData(force);
  }, [fetchData]);

  // Register with RPC context for global refresh
  useEffect(() => {
    if (rpcContext) {
      rpcContext.registerRefresh('nodes-data', () => {
        fetchData(true);
      });
      return () => {
        rpcContext.unregisterRefresh('nodes-data');
      };
    }
  }, [fetchData, rpcContext]);

  // Initial fetch and network change handling
  useEffect(() => {
    const networkChanged = lastNetworkRef.current !== network;

    if (networkChanged) {
      lastNetworkRef.current = network;
      setIsLoading(true);
      setNodes([]);
      setGeoData({});
      // Clear high watermark when switching networks
      mainnetHighWatermarkRef.current.clear();
    }

    fetchData(networkChanged);
  }, [network, fetchData]);

  // Auto-refresh interval
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const contextValue = useMemo(() => ({
    nodes,
    geoData,
    stats,
    isLoading,
    lastFetchTime,
    dataFetchTime,
    source,
    refreshData,
  }), [nodes, geoData, stats, isLoading, lastFetchTime, dataFetchTime, source, refreshData]);

  return (
    <NodesDataContext.Provider value={contextValue}>
      {children}
    </NodesDataContext.Provider>
  );
};

export function useNodesData() {
  const context = useContext(NodesDataContext);
  if (!context) {
    // Return default values if context is not available (e.g., during SSR or outside provider)
    return {
      nodes: [],
      geoData: {},
      stats: { total: 0, online: 0, syncing: 0, offline: 0, public: 0, onlinePercentage: 0 },
      isLoading: true,
      lastFetchTime: 0,
      dataFetchTime: 0, // Will be set when data is actually fetched
      source: '',
      refreshData: async () => { },
    };
  }
  return context;
}
