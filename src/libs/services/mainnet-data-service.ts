/**
 * Mainnet Data Service
 * Handles fetching mainnet node data from Gossip RPC Direct API
 * 
 * Data Flow:
 * - Single source: Gossip RPC Direct API (POST requests)
 * - Methods: get-pods-with-stats, get-stats, get-version
 * - Geo data fetched from external APIs (ipwho.is primary, ip-api.com fallback)
 * - Credits fetched from dedicated credits API
 * - MERGE strategy: Never reduce node count, only update existing + add new
 */

import { cache } from '@/libs/cache/LocalCache';
import { monitoredFetch } from './rpc-status-monitor';
import { calculateNodeScore } from '@/libs/utils/score-utils';

// Get URLs from environment variables for RPC (sensitive)
const MAINNET_RPC_URL = process.env.MAINNET_RPC_DIRECT_URL || '';
const MAINNET_RPC_KEY = process.env.MAINNET_RPC_API_KEY || '';

// Hardcoded credits API URL for mainnet
const MAINNET_CREDITS_URL = 'https://podcredits.xandeum.network/api/mainnet-pod-credits';

// Cache keys
const CACHE_KEY_NODES = 'mainnet:nodes';
const CACHE_KEY_GEO = 'mainnet:geo';
const CACHE_KEY_CREDITS = 'mainnet:credits';
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
  active_streams?: number;
  score?: number;
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
    const response = await monitoredFetch(MAINNET_RPC_URL, {
      method: 'POST',
      network: 'mainnet',
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
  } catch (_err) {
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
 * Fetch credits data from dedicated credits API
 */
async function fetchCreditsData(): Promise<Map<string, number>> {
  const creditsMap = new Map<string, number>();

  try {
    const response = await fetch(MAINNET_CREDITS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return creditsMap;
    }

    const data = await response.json();
    const credits = data.pods_credits || [];

    for (const entry of credits) {
      if (entry.pod_id && entry.credits !== null && entry.credits !== undefined) {
        creditsMap.set(entry.pod_id, entry.credits);
      }
    }
  } catch (err) {
    console.error('Credits fetch error:', err);
  }

  return creditsMap;
}

/**
 * Fetch geo data for nodes - uses external APIs with fallback chain
 * Primary: ipwho.is (HTTPS, reliable)
 * Fallback: ip-api.com batch (HTTP, fast for multiple IPs)
 */
async function fetchGeoData(items: Array<{ ip: string; pubkey: string }>): Promise<Record<string, MainnetGeoData>> {
  if (items.length === 0) {
    return {};
  }

  const geoData: Record<string, MainnetGeoData> = {};
  const ips = items.map(item => item.ip).filter(ip => ip);
  const uniqueIps = [...new Set(ips)];

  if (uniqueIps.length === 0) return {};

  // Fetch geo data from external APIs
  const externalGeo = await fetchExternalGeoData(uniqueIps);
  Object.assign(geoData, externalGeo);

  return geoData;
}

/**
 * Fetch geo data from external APIs with fallback chain
 * Primary: ip-api.com batch (fast for multiple IPs)
 * Fallback: ipwho.is for any missing IPs (HTTPS, reliable)
 */
async function fetchExternalGeoData(ips: string[]): Promise<Record<string, MainnetGeoData>> {
  const geoData: Record<string, MainnetGeoData> = {};

  if (ips.length === 0) return geoData;

  const uniqueIps = [...new Set(ips)].slice(0, 100);

  // Step 1: Try ip-api.com batch endpoint first (most efficient for multiple IPs)
  try {
    const response = await fetch('http://ip-api.com/batch?fields=status,query,country,countryCode,regionName,city,lat,lon,isp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uniqueIps),
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      const data = await response.json();

      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.status === 'success' && item.query) {
            geoData[item.query] = {
              country: item.country || '',
              country_code: (item.countryCode || '').toLowerCase(),
              credits: null,
              geo_sort: item.country || '',
              ip: item.query,
              name: '',
              nfts: [],
              provider: item.isp || '',
              stake: 0,
            };
          }
        }
      }
    }
  } catch {
    // Silent fail - will use ipwho.is fallback
  }

  // Step 2: For IPs not returned by batch, try ipwho.is individually
  const missingIps = uniqueIps.filter(ip => !geoData[ip]);

  if (missingIps.length > 0) {
    // Limit concurrent requests to avoid rate limiting
    const fetchPromises = missingIps.slice(0, 30).map(async (ip) => {
      try {
        const response = await fetch(`https://ipwho.is/${ip}`, {
          signal: AbortSignal.timeout(5000),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            return {
              ip,
              data: {
                country: data.country || '',
                country_code: (data.country_code || '').toLowerCase(),
                credits: null,
                geo_sort: data.country || '',
                ip: ip,
                name: '',
                nfts: [],
                provider: data.connection?.isp || data.connection?.org || '',
                stake: 0,
              } as MainnetGeoData
            };
          }
        }
      } catch {
        // Silent fail
      }
      return null;
    });

    const results = await Promise.allSettled(fetchPromises);

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        geoData[result.value.ip] = result.value.data;
      }
    }
  }

  return geoData;
}

/**
 * Enrich nodes with geo data and credits
 */
function enrichNodesWithGeoAndCredits(
  nodes: MainnetNodeData[],
  geoData: Record<string, MainnetGeoData>,
  creditsMap: Map<string, number>
): MainnetNodeData[] {
  return nodes.map(node => {
    const ip = node.address?.split(':')[0] || '';
    const geo = geoData[ip];

    // Get credits from credits API first, then fallback to node data, then geo data
    const credits = creditsMap.get(node.pubkey) ?? node.credits ?? geo?.credits ?? null;

    if (geo) {
      return {
        ...node,
        credits,
        country: node.country || geo.country,
        country_code: node.country_code || geo.country_code,
        provider: node.provider || geo.provider,
      };
    }

    return {
      ...node,
      credits,
    };
  });
}

/**
 * Main function to get mainnet data
 */
export async function getMainnetData(forceRefresh: boolean = false): Promise<MainnetExternalData> {
  const canFetch = await canCallApi();

  let currentNodes = await cache.get(CACHE_KEY_NODES) as MainnetNodeData[] | null;
  let cachedGeo = await cache.get(CACHE_KEY_GEO) as Record<string, MainnetGeoData> | null;
  let cachedCredits = await cache.get(CACHE_KEY_CREDITS) as Map<string, number> | null;
  const cachedMerged = await cache.get(CACHE_KEY_MERGED) as MainnetExternalData | null;

  let freshFetch = false;

  // Fetch fresh data if allowed or forced
  if (canFetch || forceRefresh || !currentNodes) {
    const freshNodes = await fetchPodsWithStats();

    if (freshNodes && freshNodes.length > 0) {
      // Use fresh data directly - always reflect current API state
      const now = Math.floor(Date.now() / 1000);
      currentNodes = freshNodes.map(node => ({
        ...node,
        score: calculateNodeScore(node, now)
      }));

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

      // Fetch credits data from dedicated API
      const freshCredits = await fetchCreditsData();
      if (freshCredits.size > 0) {
        cachedCredits = freshCredits;
        // Convert Map to object for caching
        const creditsObj = Object.fromEntries(freshCredits);
        await cache.set(CACHE_KEY_CREDITS, creditsObj, CACHE_TTL_MS * 2);
      }
    }
  }

  // Convert cached credits object back to Map if needed
  let creditsMap = new Map<string, number>();
  if (cachedCredits) {
    if (cachedCredits instanceof Map) {
      creditsMap = cachedCredits;
    } else {
      // It's an object from cache
      creditsMap = new Map(Object.entries(cachedCredits as unknown as Record<string, number>));
    }
  }

  // Enrich nodes with geo data and credits
  let enrichedNodes = currentNodes || [];
  enrichedNodes = enrichNodesWithGeoAndCredits(enrichedNodes, cachedGeo || {}, creditsMap);

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
    nodes = enrichNodesWithGeoAndCredits(nodes, cachedGeo || cachedMerged.geo, creditsMap);
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
 * Get credits map (pubkey -> credits) - fetches directly from credits API
 * Returns null values for nodes not found in API (vs 0 which is a valid value)
 */
export async function getMainnetCreditsMap(): Promise<Map<string, number>> {
  // Always fetch fresh credits directly from the API for sync operations
  const creditsMap = await fetchCreditsData();

  // If direct fetch returned data, use it (even if some values are 0)
  if (creditsMap.size > 0) {
    return creditsMap;
  }

  // If API completely failed, try to get from cached node data as fallback
  const data = await getMainnetData();

  for (const node of data.nodes) {
    if (node.pubkey && node.credits !== null && node.credits !== undefined) {
      creditsMap.set(node.pubkey, node.credits);
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
