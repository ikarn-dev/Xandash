/**
 * Mainnet Data Service
 * Handles fetching mainnet node data from Gossip RPC Direct API
 * 
 * Data Flow:
 * - Single source: Gossip RPC Direct API (POST requests)
 * - Methods: get-pods-with-stats, get-stats, get-version
 * - Geo data fetched separately for enrichment
 * - Credits fetched from dedicated credits API
 * - MERGE strategy: Never reduce node count, only update existing + add new
 * 
 * All URLs from environment variables - no hardcoding
 */

import { cache } from '@/libs/cache/LocalCache';

// Get URLs from environment variables - NEVER hardcode
const MAINNET_RPC_URL = process.env.MAINNET_RPC_DIRECT_URL || '';
const MAINNET_RPC_KEY = process.env.MAINNET_RPC_API_KEY || '';

// Cache keys
const CACHE_KEY_NODES = 'mainnet:nodes';
const CACHE_KEY_GEO = 'mainnet:geo';
const CACHE_KEY_MERGED = 'mainnet:merged';
const CACHE_KEY_LAST_FETCH = 'mainnet:lastFetch';

const CACHE_TTL_MS = 30 * 1000; // 30 second cache

export interface MainnetGeoData {
  country: string;
  country_code: string;
  credits: number | null;
  geo_sort: string;
  ip: string;
  name: string;
  nfts: string[];
  provider: string;
  stake: number;
}

export interface MainnetNodeData {
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
  credits?: number | null;
  country?: string;
  country_code?: string;
  provider?: string;
}

export interface MainnetExternalData {
  nodes: MainnetNodeData[];
  geo: Record<string, MainnetGeoData>;
  total: number;
  source: string;
  cached: boolean;
  timestamp: number;
}

/**
 * Check if API can be called (rate limiting)
 */
async function canCallApi(): Promise<boolean> {
  const lastFetch = await cache.get(CACHE_KEY_LAST_FETCH);
  if (!lastFetch) return true;
  return Date.now() - (lastFetch as number) >= CACHE_TTL_MS;
}

/**
 * Get time until next fetch is allowed
 */
export async function getTimeUntilNextCall(): Promise<number> {
  const lastFetch = await cache.get(CACHE_KEY_LAST_FETCH);
  if (!lastFetch) return 0;
  return Math.max(0, CACHE_TTL_MS - (Date.now() - (lastFetch as number)));
}

/**
 * For external API check compatibility
 */
export async function canCallExternalApi(): Promise<boolean> {
  return await canCallApi();
}

/**
 * Get cached merged data if available
 */
export async function getCachedExternalData(): Promise<MainnetExternalData | null> {
  const cached = await cache.get(CACHE_KEY_MERGED);
  return cached as MainnetExternalData | null;
}

/**
 * Make RPC call to Gossip Direct API
 */
async function makeRpcCall<T>(method: string): Promise<T | null> {
  if (!MAINNET_RPC_URL || !MAINNET_RPC_KEY) {
    return null;
  }

  try {
    const response = await fetch(MAINNET_RPC_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': MAINNET_RPC_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({ method }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`RPC error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err) {
    return null;
  }
}

/**
 * Fetch pods with stats from Gossip RPC Direct API
 */
async function fetchPodsWithStats(): Promise<MainnetNodeData[] | null> {
  const data = await makeRpcCall<any>('get-pods-with-stats');
  
  if (!data) return null;

  // Handle different response formats
  let pods: MainnetNodeData[] = [];
  
  if (Array.isArray(data)) {
    pods = data;
  } else if (data.pods && Array.isArray(data.pods)) {
    pods = data.pods;
  } else if (data.result?.pods && Array.isArray(data.result.pods)) {
    pods = data.result.pods;
  } else if (data.data?.pods && Array.isArray(data.data.pods)) {
    pods = data.data.pods;
  } else if (data.result && Array.isArray(data.result)) {
    pods = data.result;
  } else if (data.data && Array.isArray(data.data)) {
    pods = data.data;
  }
  
  if (pods.length === 0) {
    return null;
  }

  return pods;
}

/**
 * Fetch geo data for nodes using IP geolocation APIs
 */
async function fetchGeoData(items: Array<{ ip: string; pubkey: string }>): Promise<Record<string, MainnetGeoData>> {
  if (items.length === 0) {
    return {};
  }

  const geoData: Record<string, MainnetGeoData> = {};
  
  try {
    const ips = items.map(item => item.ip).filter(ip => ip);
    const uniqueIps = [...new Set(ips)].slice(0, 100);
    
    if (uniqueIps.length === 0) return {};
    
    const response = await fetch('http://ip-api.com/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uniqueIps.map(ip => ({ query: ip }))),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return {};
    }

    const results = await response.json();
    
    for (const result of results) {
      if (result.status === 'success') {
        geoData[result.query] = {
          country: result.country || '',
          country_code: result.countryCode || '',
          credits: null,
          geo_sort: result.country || '',
          ip: result.query,
          name: '',
          nfts: [],
          provider: result.isp || result.org || '',
          stake: 0,
        };
      }
    }
    
  } catch (err) {
  }
  
  return geoData;
}

/**
 * Enrich nodes with geo data
 */
function enrichNodesWithGeo(
  nodes: MainnetNodeData[],
  geoData: Record<string, MainnetGeoData>
): MainnetNodeData[] {
  return nodes.map(node => {
    const ip = node.address?.split(':')[0] || '';
    const geo = geoData[ip];
    
    if (geo) {
      return {
        ...node,
        credits: node.credits ?? geo.credits,
        country: node.country || geo.country,
        country_code: node.country_code || geo.country_code,
        provider: node.provider || geo.provider,
      };
    }
    
    return node;
  });
}

/**
 * Main function to get mainnet data
 */
export async function getMainnetData(forceRefresh: boolean = false): Promise<MainnetExternalData> {
  const canFetch = await canCallApi();
  
  let currentNodes = await cache.get(CACHE_KEY_NODES) as MainnetNodeData[] | null;
  let cachedGeo = await cache.get(CACHE_KEY_GEO) as Record<string, MainnetGeoData> | null;
  const cachedMerged = await cache.get(CACHE_KEY_MERGED) as MainnetExternalData | null;
  
  let freshFetch = false;

  // Fetch fresh data if allowed or forced
  if (canFetch || forceRefresh || !currentNodes) {
    const freshNodes = await fetchPodsWithStats();
    
    if (freshNodes && freshNodes.length > 0) {
      // Use fresh data directly - always reflect current API state
      currentNodes = freshNodes;
      
      await cache.set(CACHE_KEY_NODES, currentNodes, CACHE_TTL_MS * 10);
      await cache.set(CACHE_KEY_LAST_FETCH, Date.now(), CACHE_TTL_MS * 2);
      freshFetch = true;
      
      // Fetch geo data for new IPs only (geo data can be cached longer)
      const items = currentNodes.map(pod => ({
        ip: pod.address?.split(':')[0] || '',
        pubkey: pod.pubkey || '',
      })).filter(item => item.ip && item.pubkey);
      
      // Only fetch geo for IPs we don't have
      const newItems = cachedGeo 
        ? items.filter(item => !(cachedGeo as Record<string, MainnetGeoData>)[item.ip])
        : items;
      
      if (newItems.length > 0) {
        const newGeoData = await fetchGeoData(newItems);
        cachedGeo = { ...(cachedGeo || {}), ...newGeoData };
        await cache.set(CACHE_KEY_GEO, cachedGeo, CACHE_TTL_MS * 10);
      }
    } else {
    }
  }

  // Enrich nodes with geo data
  let enrichedNodes = currentNodes || [];
  if (cachedGeo && Object.keys(cachedGeo).length > 0) {
    enrichedNodes = enrichNodesWithGeo(enrichedNodes, cachedGeo);
  }
  
  // Update merged cache if fresh data
  if (freshFetch && enrichedNodes.length > 0) {
    const result: MainnetExternalData = {
      nodes: enrichedNodes,
      geo: cachedGeo || {},
      total: enrichedNodes.length,
      source: 'gossip-rpc',
      cached: false,
      timestamp: Date.now(),
    };
    
    await cache.set(CACHE_KEY_MERGED, result, CACHE_TTL_MS);
    return result;
  }

  // Return cached data if available
  if (cachedMerged && cachedMerged.nodes.length > 0) {
    let nodes = cachedMerged.nodes;
    if (cachedGeo && Object.keys(cachedGeo).length > 0) {
      nodes = enrichNodesWithGeo(nodes, cachedGeo);
    }
    return {
      ...cachedMerged,
      nodes,
      geo: cachedGeo || cachedMerged.geo,
      cached: true,
    };
  }

  // Fallback
  if (enrichedNodes.length > 0) {
    return {
      nodes: enrichedNodes,
      geo: cachedGeo || {},
      total: enrichedNodes.length,
      source: 'cached',
      cached: true,
      timestamp: Date.now(),
    };
  }

  return {
    nodes: [],
    geo: {},
    total: 0,
    source: 'none',
    cached: false,
    timestamp: Date.now(),
  };
}

/**
 * Get mainnet node by IP
 */
export async function getMainnetNodeByIp(ip: string): Promise<MainnetNodeData | null> {
  const data = await getMainnetData();
  const node = data.nodes.find(n => n.address?.split(':')[0] === ip);
  return node || null;
}

/**
 * Get mainnet node by pubkey
 */
export async function getMainnetNodeByPubkey(pubkey: string): Promise<MainnetNodeData | null> {
  const data = await getMainnetData();
  return data.nodes.find(n => n.pubkey === pubkey) || null;
}

/**
 * Get credits map (pubkey -> credits)
 */
export async function getMainnetCreditsMap(): Promise<Map<string, number>> {
  const data = await getMainnetData();
  const creditsMap = new Map<string, number>();
  
  for (const node of data.nodes) {
    if (node.pubkey && node.credits !== null && node.credits !== undefined) {
      creditsMap.set(node.pubkey, node.credits);
    }
  }
  
  for (const [ip, geo] of Object.entries(data.geo)) {
    if (geo.credits !== null && geo.credits !== undefined) {
      const node = data.nodes.find(n => n.address?.split(':')[0] === ip);
      if (node?.pubkey && !creditsMap.has(node.pubkey)) {
        creditsMap.set(node.pubkey, geo.credits);
      }
    }
  }
  
  return creditsMap;
}

/**
 * Get geo data for a specific IP
 */
export async function getMainnetGeoForIp(ip: string): Promise<MainnetGeoData | null> {
  const data = await getMainnetData();
  return data.geo[ip] || null;
}
