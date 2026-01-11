/**
 * Devnet Data Service
 * Handles fetching devnet node data from external API
 * 
 * Primary source: https://stats.xandeum.network/api/storage
 */

import { cache } from '@/libs/cache/LocalCache';

// Get URL from environment variable - NEVER hardcode
const DEVNET_API_URL = process.env.DEVNET_API_URL || '';

// Cache keys
const CACHE_KEY_DEVNET = 'devnet:nodes';
const CACHE_KEY_LAST_FETCH = 'devnet:lastFetch';

const CACHE_TTL = 30 * 1000; // 30 seconds

export interface DevnetNodeData {
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

export interface DevnetExternalData {
  nodes: DevnetNodeData[];
  total: number;
  source: string;
  cached: boolean;
  timestamp: number;
}

/**
 * Check if we can fetch (rate limiting)
 */
async function canFetch(): Promise<boolean> {
  const lastFetch = await cache.get(CACHE_KEY_LAST_FETCH);
  if (!lastFetch) return true;
  return Date.now() - (lastFetch as number) >= CACHE_TTL;
}

/**
 * Get cached devnet data if available
 */
export async function getCachedDevnetData(): Promise<DevnetExternalData | null> {
  const cached = await cache.get(CACHE_KEY_DEVNET);
  return cached as DevnetExternalData | null;
}

/**
 * Fetch from devnet API
 */
async function fetchFromDevnetApi(): Promise<DevnetNodeData[] | null> {
  if (!DEVNET_API_URL) {
    console.warn('[Devnet] API URL not configured');
    return null;
  }

  try {
    console.log('[Devnet] Fetching from API...');
    const response = await fetch(DEVNET_API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      throw new Error(`Devnet API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle different response formats
    let pods: DevnetNodeData[] = [];
    
    if (Array.isArray(data)) {
      pods = data;
    } else if (data.pods && Array.isArray(data.pods)) {
      pods = data.pods;
    } else if (data.data?.pods && Array.isArray(data.data.pods)) {
      pods = data.data.pods;
    } else if (data.result?.pods && Array.isArray(data.result.pods)) {
      pods = data.result.pods;
    } else if (data.data && Array.isArray(data.data)) {
      pods = data.data;
    } else if (data.result && Array.isArray(data.result)) {
      pods = data.result;
    }

    console.log(`[Devnet] API returned ${pods.length} nodes`);
    return pods;
  } catch (error) {
    console.error('[Devnet] API fetch failed:', error);
    return null;
  }
}

/**
 * Main function to get devnet data
 */
export async function getDevnetData(forceRefresh: boolean = false): Promise<DevnetExternalData> {
  const canFetchNow = await canFetch();
  
  // Get cached data
  let cachedData = await cache.get(CACHE_KEY_DEVNET) as DevnetExternalData | null;
  
  // Try to fetch fresh data if allowed
  if (canFetchNow || forceRefresh) {
    const freshNodes = await fetchFromDevnetApi();
    
    if (freshNodes && freshNodes.length > 0) {
      const result: DevnetExternalData = {
        nodes: freshNodes,
        total: freshNodes.length,
        source: 'devnet-api',
        cached: false,
        timestamp: Date.now(),
      };
      
      await cache.set(CACHE_KEY_DEVNET, result, CACHE_TTL * 2);
      await cache.set(CACHE_KEY_LAST_FETCH, Date.now(), CACHE_TTL * 2);
      
      console.log(`[Devnet] Cached ${freshNodes.length} nodes`);
      return result;
    }
  }

  // Return cached data if available
  if (cachedData && cachedData.nodes.length > 0) {
    return {
      ...cachedData,
      cached: true,
    };
  }

  // No data available
  console.warn('[Devnet] No data available');
  return {
    nodes: [],
    total: 0,
    source: 'none',
    cached: false,
    timestamp: Date.now(),
  };
}

/**
 * Get devnet node by IP
 */
export async function getDevnetNodeByIp(ip: string): Promise<DevnetNodeData | null> {
  const data = await getDevnetData();
  
  const node = data.nodes.find(n => {
    const nodeIp = n.address?.split(':')[0];
    return nodeIp === ip;
  });
  
  return node || null;
}

/**
 * Get devnet node by pubkey
 */
export async function getDevnetNodeByPubkey(pubkey: string): Promise<DevnetNodeData | null> {
  const data = await getDevnetData();
  return data.nodes.find(n => n.pubkey === pubkey) || null;
}
