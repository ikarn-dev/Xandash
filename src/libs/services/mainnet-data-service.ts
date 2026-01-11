/**
 * Mainnet Data Service
 * Handles fetching mainnet node data from external sources
 * 
 * Data Flow:
 * - Source A: Called at 0s and 30s (start of cycle) - provides node data
 * - Source B: Called at 15s (mid-cycle) - provides node data + geo/ping data
 * - Geo/Ping data is cached for 30 seconds until next Source B request
 * - Credits are fetched from dedicated credits API
 * 
 * All URLs from environment variables - no hardcoding
 */

import { cache } from '@/libs/cache/LocalCache';

// Get URLs from environment variables - NEVER hardcode
const SOURCE_A_URL = process.env.NEW_MAINNET_API_URL || '';
const SOURCE_A_KEY = process.env.NEW_API_KEY || '';
const SOURCE_B_RPC = process.env.MAINNET_EXTERNAL_RPC_URL || '';
const SOURCE_B_GEO = process.env.MAINNET_EXTERNAL_GEO_URL || '';

// Cache keys
const CACHE_KEY_SOURCE_A = 'mainnet:sourceA:nodes';
const CACHE_KEY_SOURCE_B = 'mainnet:sourceB:nodes';
const CACHE_KEY_GEO = 'mainnet:geo';
const CACHE_KEY_PING = 'mainnet:ping'; // Separate ping cache
const CACHE_KEY_MERGED = 'mainnet:merged';
const CACHE_KEY_LAST_A = 'mainnet:lastFetchA';
const CACHE_KEY_LAST_B = 'mainnet:lastFetchB';

const CYCLE_MS = 30 * 1000; // 30 second full cycle
const MID_CYCLE_MS = 15 * 1000; // 15 seconds for mid-cycle
const PING_CACHE_MS = 30 * 1000; // Ping cached for 30 seconds

export interface MainnetGeoData {
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
  ping?: number | null;
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
 * Check if source A can be called (at 0s or 30s of cycle)
 */
async function canCallSourceA(): Promise<boolean> {
  const lastFetch = await cache.get(CACHE_KEY_LAST_A);
  if (!lastFetch) return true;
  return Date.now() - (lastFetch as number) >= CYCLE_MS;
}

/**
 * Check if source B can be called (at 15s of cycle)
 */
async function canCallSourceB(): Promise<boolean> {
  const lastFetchA = await cache.get(CACHE_KEY_LAST_A);
  const lastFetchB = await cache.get(CACHE_KEY_LAST_B);
  
  if (!lastFetchA) return false; // Source A must be called first
  if (!lastFetchB) {
    // Source B never called, check if 15s passed since A
    return Date.now() - (lastFetchA as number) >= MID_CYCLE_MS;
  }
  
  // Check if we're in mid-cycle window
  const timeSinceA = Date.now() - (lastFetchA as number);
  const timeSinceB = Date.now() - (lastFetchB as number);
  
  return timeSinceA >= MID_CYCLE_MS && timeSinceB >= CYCLE_MS;
}

/**
 * Get time until next fetch is allowed
 */
export async function getTimeUntilNextCall(): Promise<number> {
  const lastFetchA = await cache.get(CACHE_KEY_LAST_A);
  const lastFetchB = await cache.get(CACHE_KEY_LAST_B);
  
  if (!lastFetchA) return 0;
  
  const timeSinceA = Date.now() - (lastFetchA as number);
  
  // If less than 15s since A, next call is B at 15s mark
  if (timeSinceA < MID_CYCLE_MS) {
    return MID_CYCLE_MS - timeSinceA;
  }
  
  // If between 15s and 30s, check if B was called
  if (!lastFetchB || Date.now() - (lastFetchB as number) >= CYCLE_MS) {
    return 0; // B can be called now
  }
  
  // Otherwise, wait for next A call at 30s
  return Math.max(0, CYCLE_MS - timeSinceA);
}

/**
 * For external API check compatibility
 */
export async function canCallExternalApi(): Promise<boolean> {
  return await canCallSourceA() || await canCallSourceB();
}

/**
 * Get cached merged data if available
 */
export async function getCachedExternalData(): Promise<MainnetExternalData | null> {
  const cached = await cache.get(CACHE_KEY_MERGED);
  return cached as MainnetExternalData | null;
}


/**
 * Fetch from source A
 */
async function fetchFromSourceA(): Promise<MainnetNodeData[] | null> {
  if (!SOURCE_A_URL || !SOURCE_A_KEY) {
    console.warn('[Mainnet] Source A not configured');
    return null;
  }

  try {
    console.log('[Mainnet] Fetching from source A...');
    const response = await fetch(SOURCE_A_URL, {
      method: 'GET',
      headers: {
        'X-API-Key': SOURCE_A_KEY,
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      throw new Error(`Source A error: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle different response formats
    let pods: MainnetNodeData[] = [];
    
    if (Array.isArray(data)) {
      // Direct array response
      pods = data;
    } else if (data.success && data.data?.pods) {
      // { success: true, data: { pods: [...] } }
      pods = data.data.pods;
    } else if (data.data?.pods) {
      // { data: { pods: [...] } }
      pods = data.data.pods;
    } else if (data.pods) {
      // { pods: [...] }
      pods = data.pods;
    } else if (data.data && Array.isArray(data.data)) {
      // { data: [...] }
      pods = data.data;
    } else if (data.result?.pods) {
      // { result: { pods: [...] } }
      pods = data.result.pods;
    } else if (data.result && Array.isArray(data.result)) {
      // { result: [...] }
      pods = data.result;
    }
    
    if (pods.length === 0) {
      console.warn('[Mainnet] Source A returned empty or unrecognized format:', Object.keys(data));
      return null;
    }

    console.log(`[Mainnet] Source A returned ${pods.length} nodes`);
    return pods;
  } catch (error) {
    console.error('[Mainnet] Source A fetch failed:', error);
    return null;
  }
}

/**
 * Fetch from source B (RPC)
 */
async function fetchFromSourceB(): Promise<MainnetNodeData[] | null> {
  if (!SOURCE_B_RPC) {
    console.warn('[Mainnet] Source B not configured');
    return null;
  }

  try {
    console.log('[Mainnet] Fetching from source B...');
    const response = await fetch(SOURCE_B_RPC, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'get-pods-with-stats',
        params: {},
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      throw new Error(`Source B error: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || 'RPC Error');
    }

    console.log(`[Mainnet] Source B returned ${data.result?.pods?.length || 0} nodes`);
    return data.result?.pods || null;
  } catch (error) {
    console.error('[Mainnet] Source B fetch failed:', error);
    return null;
  }
}

/**
 * Fetch geo data from source B geo endpoint
 * Geo data includes location, ping, and provider info
 * Ping is cached for 30 seconds until next Source B request
 */
async function fetchGeoData(items: Array<{ ip: string; pubkey: string }>): Promise<Record<string, MainnetGeoData>> {
  if (!SOURCE_B_GEO || items.length === 0) {
    return {};
  }

  try {
    const response = await fetch(SOURCE_B_GEO, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify({ items }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Geo fetch error: ${response.status}`);
    }

    const geoData = await response.json();
    
    // Cache ping data separately for 30 seconds
    const pingData: Record<string, number | null> = {};
    for (const [ip, data] of Object.entries(geoData as Record<string, MainnetGeoData>)) {
      if (data.ping !== undefined) {
        pingData[ip] = data.ping;
      }
    }
    if (Object.keys(pingData).length > 0) {
      await cache.set(CACHE_KEY_PING, pingData, PING_CACHE_MS);
      console.log(`[Mainnet] Cached ping data for ${Object.keys(pingData).length} nodes (30s TTL)`);
    }
    
    return geoData;
  } catch (error) {
    console.error('[Mainnet] Geo fetch failed:', error);
    return {};
  }
}

/**
 * Get cached ping data
 */
async function getCachedPingData(): Promise<Record<string, number | null>> {
  const cached = await cache.get(CACHE_KEY_PING);
  return (cached as Record<string, number | null>) || {};
}

/**
 * Enrich nodes with geo data and cached ping
 * Ping data is cached for 30 seconds from Source B
 */
async function enrichNodesWithGeoAndPing(
  nodes: MainnetNodeData[],
  geoData: Record<string, MainnetGeoData>
): Promise<MainnetNodeData[]> {
  // Get cached ping data (valid for 30 seconds)
  const cachedPing = await getCachedPingData();
  
  return nodes.map(node => {
    const ip = node.address?.split(':')[0] || '';
    const geo = geoData[ip];
    const ping = cachedPing[ip];
    
    if (geo) {
      return {
        ...node,
        // Use cached ping if available, otherwise use geo ping
        ping: node.ping ?? ping ?? geo.ping,
        // Credits will be fetched from dedicated API, but keep geo credits as fallback
        credits: node.credits ?? geo.credits,
        country: node.country || geo.country,
        country_code: node.country_code || geo.country_code,
        provider: node.provider || geo.provider,
      };
    }
    
    // Even without geo data, try to use cached ping
    if (ping !== undefined) {
      return {
        ...node,
        ping: node.ping ?? ping,
      };
    }
    
    return node;
  });
}

// Keep sync version for backward compatibility
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
        ping: node.ping ?? geo.ping,
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
 * Merge data from both sources
 * Source B provides base count, Source A updates matching pubkeys
 */
function mergeNodeData(
  sourceANodes: MainnetNodeData[] | null,
  sourceBNodes: MainnetNodeData[] | null
): MainnetNodeData[] {
  // If only one source has data, use it
  if (!sourceANodes || sourceANodes.length === 0) {
    return sourceBNodes || [];
  }
  if (!sourceBNodes || sourceBNodes.length === 0) {
    return sourceANodes;
  }

  // Source B is the base (has more nodes typically)
  // Source A updates matching pubkeys
  const baseNodes = sourceBNodes.length >= sourceANodes.length ? sourceBNodes : sourceANodes;
  const updateNodes = sourceBNodes.length >= sourceANodes.length ? sourceANodes : sourceBNodes;

  // Create a map of update nodes by pubkey
  const updateMap = new Map<string, MainnetNodeData>();
  for (const node of updateNodes) {
    if (node.pubkey) {
      updateMap.set(node.pubkey, node);
    }
  }

  // Merge: base nodes with updates from matching pubkeys
  const merged = baseNodes.map(baseNode => {
    const updateNode = updateMap.get(baseNode.pubkey);
    if (updateNode) {
      // Merge data, preferring fresher data (higher last_seen_timestamp)
      const useUpdate = (updateNode.last_seen_timestamp || 0) >= (baseNode.last_seen_timestamp || 0);
      return {
        ...baseNode,
        ...(useUpdate ? {
          last_seen_timestamp: updateNode.last_seen_timestamp,
          uptime: updateNode.uptime,
          storage_used: updateNode.storage_used,
          storage_usage_percent: updateNode.storage_usage_percent,
          version: updateNode.version || baseNode.version,
        } : {}),
        // Always prefer non-null values for enriched fields
        ping: updateNode.ping ?? baseNode.ping,
        credits: updateNode.credits ?? baseNode.credits,
        country: updateNode.country || baseNode.country,
        country_code: updateNode.country_code || baseNode.country_code,
        provider: updateNode.provider || baseNode.provider,
      };
    }
    return baseNode;
  });

  console.log(`[Mainnet] Merged ${merged.length} nodes (base: ${baseNodes.length}, updates: ${updateMap.size} matching)`);
  return merged;
}


/**
 * Main function to get mainnet data
 * 
 * Logic:
 * 1. On initial load (no cache), call BOTH Source A and Source B in parallel
 * 2. After initial load, follow the staggered cycle (A at 0s/30s, B at 15s)
 * 3. Always fetch geo data for enrichment (location, credits, ping)
 * 4. Merge data from both sources when both have data
 * 5. Return cached data if both sources fail
 */
export async function getMainnetData(forceRefresh: boolean = false): Promise<MainnetExternalData> {
  const canFetchA = await canCallSourceA();
  
  // Get cached data from both sources
  let cachedA = await cache.get(CACHE_KEY_SOURCE_A) as MainnetNodeData[] | null;
  let cachedB = await cache.get(CACHE_KEY_SOURCE_B) as MainnetNodeData[] | null;
  let cachedGeo = await cache.get(CACHE_KEY_GEO) as Record<string, MainnetGeoData> | null;
  let cachedMerged = await cache.get(CACHE_KEY_MERGED) as MainnetExternalData | null;
  
  let sourceUsed = 'cached';
  let freshFetch = false;
  let sourceAFailed = false;
  let nodesForGeo: MainnetNodeData[] = [];

  // Check if this is initial load (no cached data at all)
  const isInitialLoad = !cachedA && !cachedB && !cachedMerged;

  // On initial load, call BOTH sources in parallel for fastest data
  if (isInitialLoad || forceRefresh) {
    console.log('[Mainnet] Initial load - fetching from both sources in parallel...');
    
    const [freshA, freshB] = await Promise.all([
      fetchFromSourceA(),
      fetchFromSourceB()
    ]);
    
    if (freshA && freshA.length > 0) {
      cachedA = freshA;
      nodesForGeo = freshA;
      await cache.set(CACHE_KEY_SOURCE_A, freshA, CYCLE_MS * 2);
      await cache.set(CACHE_KEY_LAST_A, Date.now(), CYCLE_MS * 2);
      sourceUsed = 'A';
      freshFetch = true;
      console.log(`[Mainnet] Cached ${freshA.length} nodes from source A`);
    }
    
    if (freshB && freshB.length > 0) {
      // Fetch geo data for source B nodes
      const items = freshB.map(pod => ({
        ip: pod.address?.split(':')[0] || '',
        pubkey: pod.pubkey || '',
      })).filter(item => item.ip && item.pubkey);
      
      const geoData = await fetchGeoData(items);
      const enrichedB = enrichNodesWithGeo(freshB, geoData);
      
      cachedB = enrichedB;
      cachedGeo = geoData;
      if (!nodesForGeo.length) nodesForGeo = freshB;
      await cache.set(CACHE_KEY_SOURCE_B, enrichedB, CYCLE_MS * 2);
      await cache.set(CACHE_KEY_GEO, geoData, CYCLE_MS * 2);
      await cache.set(CACHE_KEY_LAST_B, Date.now(), CYCLE_MS * 2);
      sourceUsed = freshFetch ? 'A+B' : 'B';
      freshFetch = true;
      console.log(`[Mainnet] Cached ${enrichedB.length} nodes from source B with geo data`);
    }
  } else {
    // Normal staggered cycle after initial load
    
    // Try Source A first if allowed
    if (canFetchA) {
      const freshA = await fetchFromSourceA();
      if (freshA && freshA.length > 0) {
        cachedA = freshA;
        nodesForGeo = freshA;
        await cache.set(CACHE_KEY_SOURCE_A, freshA, CYCLE_MS * 2);
        await cache.set(CACHE_KEY_LAST_A, Date.now(), CYCLE_MS * 2);
        sourceUsed = 'A';
        freshFetch = true;
        console.log(`[Mainnet] Cached ${freshA.length} nodes from source A`);
      } else {
        sourceAFailed = true;
        console.log('[Mainnet] Source A failed or returned no data, trying Source B...');
      }
    }

    // Try Source B if:
    // 1. Source A failed (immediate fallback)
    // 2. Mid-cycle timing allows it
    const canFetchB = await canCallSourceB();
    if (sourceAFailed || canFetchB) {
      const freshB = await fetchFromSourceB();
      if (freshB && freshB.length > 0) {
        // Fetch geo data for source B nodes
        const items = freshB.map(pod => ({
          ip: pod.address?.split(':')[0] || '',
          pubkey: pod.pubkey || '',
        })).filter(item => item.ip && item.pubkey);
        
        const geoData = await fetchGeoData(items);
        const enrichedB = enrichNodesWithGeo(freshB, geoData);
        
        cachedB = enrichedB;
        cachedGeo = geoData;
        nodesForGeo = freshB;
        await cache.set(CACHE_KEY_SOURCE_B, enrichedB, CYCLE_MS * 2);
        await cache.set(CACHE_KEY_GEO, geoData, CYCLE_MS * 2);
        await cache.set(CACHE_KEY_LAST_B, Date.now(), CYCLE_MS * 2);
        sourceUsed = freshFetch ? 'A+B' : 'B';
        freshFetch = true;
        console.log(`[Mainnet] Cached ${enrichedB.length} nodes from source B with geo data`);
      }
    }
  }

  // If we got nodes from Source A but no geo data yet, fetch geo data now
  if (nodesForGeo.length > 0 && (!cachedGeo || Object.keys(cachedGeo).length === 0)) {
    console.log('[Mainnet] Fetching geo data for Source A nodes...');
    const items = nodesForGeo.map(pod => ({
      ip: pod.address?.split(':')[0] || '',
      pubkey: pod.pubkey || '',
    })).filter(item => item.ip && item.pubkey);
    
    const geoData = await fetchGeoData(items);
    if (Object.keys(geoData).length > 0) {
      cachedGeo = geoData;
      await cache.set(CACHE_KEY_GEO, geoData, CYCLE_MS * 2);
      console.log(`[Mainnet] Fetched geo data for ${Object.keys(geoData).length} nodes`);
    }
  }

  // Merge data from both sources
  let mergedNodes = mergeNodeData(cachedA, cachedB);
  
  // Enrich merged nodes with geo data and cached ping
  if (cachedGeo && Object.keys(cachedGeo).length > 0) {
    mergedNodes = await enrichNodesWithGeoAndPing(mergedNodes, cachedGeo);
  } else {
    // Even without geo, try to apply cached ping
    const cachedPing = await getCachedPingData();
    if (Object.keys(cachedPing).length > 0) {
      mergedNodes = mergedNodes.map(node => {
        const ip = node.address?.split(':')[0] || '';
        const ping = cachedPing[ip];
        if (ping !== undefined) {
          return { ...node, ping: node.ping ?? ping };
        }
        return node;
      });
    }
  }
  
  // If we have fresh data, update merged cache
  if (freshFetch && mergedNodes.length > 0) {
    const result: MainnetExternalData = {
      nodes: mergedNodes,
      geo: cachedGeo || {},
      total: mergedNodes.length,
      source: sourceUsed,
      cached: false,
      timestamp: Date.now(),
    };
    
    await cache.set(CACHE_KEY_MERGED, result, CYCLE_MS);
    return result;
  }

  // Return cached merged data if available
  if (cachedMerged && cachedMerged.nodes.length > 0) {
    // Re-enrich with latest geo data and cached ping
    let nodes = cachedMerged.nodes;
    if (cachedGeo && Object.keys(cachedGeo).length > 0) {
      nodes = await enrichNodesWithGeoAndPing(nodes, cachedGeo);
    } else {
      // Apply cached ping even without geo
      const cachedPing = await getCachedPingData();
      if (Object.keys(cachedPing).length > 0) {
        nodes = nodes.map(node => {
          const ip = node.address?.split(':')[0] || '';
          const ping = cachedPing[ip];
          if (ping !== undefined) {
            return { ...node, ping: node.ping ?? ping };
          }
          return node;
        });
      }
    }
    return {
      ...cachedMerged,
      nodes,
      geo: cachedGeo || cachedMerged.geo,
      cached: true,
    };
  }

  // Fallback: return whatever we have
  if (mergedNodes.length > 0) {
    return {
      nodes: mergedNodes,
      geo: cachedGeo || {},
      total: mergedNodes.length,
      source: 'cached',
      cached: true,
      timestamp: Date.now(),
    };
  }

  // No data available
  console.warn('[Mainnet] No data available from any source');
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
  
  const node = data.nodes.find(n => {
    const nodeIp = n.address?.split(':')[0];
    return nodeIp === ip;
  });
  
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
  
  // Also extract from geo data
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
 * Get ping for a specific IP from mainnet geo data
 */
export async function getMainnetPingForIp(ip: string): Promise<number | null> {
  const data = await getMainnetData();
  
  // First check geo data
  const geo = data.geo[ip];
  if (geo?.ping !== null && geo?.ping !== undefined) {
    return geo.ping;
  }
  
  // Then check node data
  const node = data.nodes.find(n => n.address?.split(':')[0] === ip);
  if (node?.ping !== null && node?.ping !== undefined) {
    return node.ping;
  }
  
  // Check cached ping
  const cachedPing = await getCachedPingData();
  return cachedPing[ip] ?? null;
}

/**
 * Get geo data for a specific IP
 */
export async function getMainnetGeoForIp(ip: string): Promise<MainnetGeoData | null> {
  const data = await getMainnetData();
  return data.geo[ip] || null;
}
