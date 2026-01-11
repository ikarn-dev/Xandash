import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/libs/cache/LocalCache';
import { getNodeEvents, getLatestNodeSnapshot, getNodeStatsHistory, saveNodeSnapshot } from '@/libs/db/node-service';
import { getMainnetNodeByIp } from '@/libs/services/mainnet-data-service';
import { getDevnetNodeByIp } from '@/libs/services/devnet-data-service';
import net from 'net';

/**
 * Node Profile API
 * 
 * For mainnet: Uses dual-source staggered fetch with 30s cycle - external sources only
 * For devnet: Uses devnet API
 * MongoDB methods remain unchanged for historical data
 */

type NetworkType = 'devnet' | 'mainnet';

interface LocationData {
  country: string;
  country_code: string;
  city: string;
  region: string;
  provider: string;
  ip: string;
  lat?: number;
  lon?: number;
}

interface PingResult {
  ping: number | null;
  status: 'online' | 'offline' | 'timeout';
}

// Credits endpoint for devnet only
const DEVNET_CREDITS_URL = process.env.NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL || 'https://podcredits.xandeum.network/api/pods-credits';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');
    const quick = searchParams.get('quick') === 'true';
    const hoursParam = searchParams.get('hours');
    const network = (searchParams.get('network') as NetworkType) || 'devnet';
    const hours = hoursParam !== null ? parseInt(hoursParam) : 168;

    if (!ip) {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
    }

    if (network !== 'devnet' && network !== 'mainnet') {
      return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
    }

    const [locationData, currentNodeData, creditsData, dbHistory, dbEvents, dbSnapshot, pingData] = await Promise.all([
      fetchLocationData(ip).catch(() => null),
      fetchCurrentNodeData(ip, network).catch(() => null),
      quick ? Promise.resolve(null) : (network === 'devnet' ? fetchCreditsData().catch(() => null) : Promise.resolve(null)),
      getNodeStatsHistory(ip, hours, network).catch(() => []),
      getNodeEvents(ip, 100, network).catch(() => []),
      getLatestNodeSnapshot(ip, network).catch(() => null),
      pingNode(ip).catch(() => ({ ping: null, status: 'offline' as const })),
    ]);

    // Save node snapshot on visit (if we have live data)
    if (currentNodeData) {
      // For mainnet, credits come from external source data
      // For devnet, credits come from credits API
      const credits = network === 'mainnet' 
        ? (currentNodeData.credits || 0)
        : (creditsData?.find((c: any) => c.pod_id === currentNodeData.pubkey)?.credits || 0);
      saveNodeSnapshotOnVisit(ip, currentNodeData, credits, network).catch(err => {
        console.error('[NODE-PROFILE] Failed to save snapshot on visit:', err);
      });
    }

    let status = 'unknown';
    if (currentNodeData) {
      const timeDiff = Math.floor(Date.now() / 1000) - (currentNodeData.last_seen_timestamp || 0);
      status = timeDiff < 300 ? 'online' : timeDiff < 3600 ? 'syncing' : 'offline';
    } else if (dbSnapshot) {
      status = dbSnapshot.status;
    }

    let currentCredits = 0;
    const pubkey = currentNodeData?.pubkey || dbSnapshot?.pubkey;
    
    // For mainnet, credits come from external source data
    // For devnet, credits come from credits API
    if (network === 'mainnet') {
      currentCredits = currentNodeData?.credits || dbSnapshot?.credits || 0;
    } else if (pubkey && creditsData) {
      const entry = creditsData.find((c: any) => c.pod_id === pubkey);
      if (entry) currentCredits = entry.credits;
    }

    let previousCredits = 0;
    if (dbHistory.length > 0) {
      const maxHistoricalCredits = Math.max(...dbHistory.map(h => h.credits || 0));
      if (maxHistoricalCredits > currentCredits) {
        previousCredits = maxHistoricalCredits;
      }
    }

    if (currentCredits === 0 && dbSnapshot?.credits) {
      currentCredits = dbSnapshot.credits;
      if (dbHistory.length > 0) {
        const maxHistoricalCredits = Math.max(...dbHistory.map(h => h.credits || 0));
        if (maxHistoricalCredits > currentCredits) {
          previousCredits = maxHistoricalCredits - currentCredits;
        } else {
          previousCredits = 0;
        }
      }
    }

    const nodeData = currentNodeData || dbSnapshot;
    
    const response = {
      ip,
      network,
      location: locationData,
      ping: pingData,
      currentNode: nodeData ? {
        pubkey: nodeData.pubkey || '',
        address: nodeData.address || `${ip}:9001`,
        status,
        uptime: nodeData.uptime || 0,
        storage_committed: nodeData.storage_committed || 0,
        storage_used: nodeData.storage_used || 0,
        storage_usage_percent: nodeData.storage_usage_percent || 0,
        version: nodeData.version || '',
        rpc_port: nodeData.rpc_port || 0,
        is_public: nodeData.is_public || false,
        last_seen_timestamp: nodeData.last_seen_timestamp || 0,
        active_streams: nodeData.active_streams || 0,
        credits: currentCredits,
        previousCredits,
        totalCredits: currentCredits + previousCredits,
      } : null,
      dbHistory: dbHistory.length > 0 ? dbHistory : undefined,
      dbEvents: dbEvents.length > 0 ? dbEvents : undefined,
    };

    return NextResponse.json(response, {
      headers: { 
        'Cache-Control': 'no-store',
        'X-Network': network,
      },
    });
  } catch (error) {
    console.error('[NODE-PROFILE] API error:', error);
    return NextResponse.json({ error: 'Failed to fetch node profile' }, { status: 500 });
  }
}

// Save node snapshot when user visits the profile page
async function saveNodeSnapshotOnVisit(ip: string, nodeData: any, credits: number, network: NetworkType): Promise<void> {
  const cacheKey = `snapshot-saved:${network}:${ip}`;
  const recentlySaved = await cache.get(cacheKey);
  if (recentlySaved) return;
  
  try {
    await saveNodeSnapshot({
      ip,
      pubkey: nodeData.pubkey || '',
      address: nodeData.address || `${ip}:9001`,
      status: nodeData.status || 'unknown',
      uptime: nodeData.uptime || 0,
      storage_committed: nodeData.storage_committed || 0,
      storage_used: nodeData.storage_used || 0,
      storage_usage_percent: nodeData.storage_usage_percent || 0,
      version: nodeData.version || '',
      rpc_port: nodeData.rpc_port || 0,
      is_public: nodeData.is_public || false,
      last_seen_timestamp: nodeData.last_seen_timestamp || 0,
      credits,
      active_streams: nodeData.active_streams || 0,
    }, network);
    
    await cache.set(cacheKey, true, 60);
    console.log(`[NODE-PROFILE] Saved snapshot for ${ip} on ${network}`);
  } catch (err) {
    console.error(`[NODE-PROFILE] Failed to save snapshot for ${ip}:`, err);
  }
}


async function fetchLocationData(ip: string): Promise<LocationData | null> {
  const cacheKey = `loc:${ip}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached as LocationData;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=country,countryCode,regionName,city,lat,lon,isp`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    
    if (!res.ok) return null;
    const data = await res.json();
    
    const location: LocationData = {
      country: data.country || 'Unknown',
      country_code: data.countryCode?.toLowerCase() || '',
      city: data.city || 'Unknown',
      region: data.regionName || '',
      provider: data.isp || 'Unknown',
      ip,
      lat: data.lat,
      lon: data.lon,
    };
    
    await cache.set(cacheKey, location, 86400);
    return location;
  } catch {
    return null;
  }
}

async function fetchCurrentNodeData(ip: string, network: NetworkType): Promise<any | null> {
  const cacheKey = `node:${network}:${ip}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  // For mainnet, use external data sources only
  if (network === 'mainnet') {
    try {
      const externalNode = await getMainnetNodeByIp(ip);
      if (externalNode) {
        console.log(`[NODE-PROFILE] Found mainnet node ${ip} from external source`);
        await cache.set(cacheKey, externalNode, 30);
        return externalNode;
      }
      // No fallback for mainnet - external sources only
      return null;
    } catch (error) {
      console.warn(`[NODE-PROFILE] External sources failed for ${ip}:`, error);
      return null;
    }
  }

  // For devnet, use devnet API
  try {
    const devnetNode = await getDevnetNodeByIp(ip);
    if (devnetNode) {
      console.log(`[NODE-PROFILE] Found devnet node ${ip}`);
      await cache.set(cacheKey, devnetNode, 30);
      return devnetNode;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchCreditsData(): Promise<any[] | null> {
  const cacheKey = `credits:devnet:all`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached as any[];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(DEVNET_CREDITS_URL, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    clearTimeout(timeout);
    
    if (!res.ok) return null;
    const data = await res.json();
    const credits = data.pods_credits || [];
    
    await cache.set(cacheKey, credits, 60);
    return credits;
  } catch {
    return null;
  }
}

// TCP ping to measure latency
async function pingNode(ip: string, port: number = 6000): Promise<PingResult> {
  const cacheKey = `ping:${ip}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached as PingResult;

  const result = await tcpPing(ip, port);
  
  // If port 6000 fails, try port 9001
  if (result.status !== 'online') {
    const result9001 = await tcpPing(ip, 9001);
    if (result9001.status === 'online') {
      await cache.set(cacheKey, result9001, 30);
      return result9001;
    }
  }
  
  await cache.set(cacheKey, result, 30);
  return result;
}

function tcpPing(ip: string, port: number, timeout: number = 3000): Promise<PingResult> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = new net.Socket();
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      const ping = Date.now() - startTime;
      socket.destroy();
      resolve({ ping, status: 'online' });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ ping: null, status: 'timeout' });
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve({ ping: null, status: 'offline' });
    });
    
    socket.connect(port, ip);
  });
}
