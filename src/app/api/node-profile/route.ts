import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/libs/cache/LocalCache';
import { getNodeEvents, getLatestNodeSnapshot, getNodeStatsHistory, saveNodeSnapshot } from '@/libs/db/node-service';
import { getMainnetNodeByIp } from '@/libs/services/mainnet-data-service';
import { getDevnetNodeByIp } from '@/libs/services/devnet-data-service';

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

// Credits endpoint for devnet only - from env vars
const DEVNET_CREDITS_URL = process.env.NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL || '';

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

    const [locationData, currentNodeData, liveCreditsData, dbHistory, dbEvents, dbSnapshot] = await Promise.all([
      fetchLocationData(ip).catch(() => null),
      fetchCurrentNodeData(ip, network).catch(() => null),
      quick ? Promise.resolve(null) : fetchLiveCreditsData(network).catch(() => null),
      getNodeStatsHistory(ip, hours, network).catch(() => []),
      getNodeEvents(ip, 100, network).catch(() => []),
      getLatestNodeSnapshot(ip, network).catch(() => null),
    ]);

    // Save node snapshot on visit (if we have live data)
    if (currentNodeData) {
      // Get live credits for the node's pubkey
      let liveCredits = 0;
      if (liveCreditsData && currentNodeData.pubkey) {
        const creditsEntry = liveCreditsData.find((c: any) => c.pod_id === currentNodeData.pubkey);
        liveCredits = creditsEntry?.credits || 0;
      }
      
      saveNodeSnapshotOnVisit(ip, currentNodeData, liveCredits, network).catch(() => {});
    }

    let status = 'unknown';
    if (currentNodeData) {
      const timeDiff = Math.floor(Date.now() / 1000) - (currentNodeData.last_seen_timestamp || 0);
      status = timeDiff < 300 ? 'online' : timeDiff < 3600 ? 'syncing' : 'offline';
    } else if (dbSnapshot) {
      status = dbSnapshot.status;
    }

    // Get live credits from credits API
    let currentCredits = 0;
    let previousCredits = 0;
    const pubkey = currentNodeData?.pubkey || dbSnapshot?.pubkey;
    
    if (pubkey && liveCreditsData) {
      const creditsEntry = liveCreditsData.find((c: any) => c.pod_id === pubkey);
      currentCredits = creditsEntry?.credits || 0;
    }

    // Calculate previous credits from historical data
    if (dbHistory.length > 0) {
      const historicalCredits = dbHistory.map(h => h.credits || 0);
      const maxHistoricalCredits = Math.max(...historicalCredits);
      
      // If we have current credits, previous is the difference
      if (currentCredits > 0) {
        // Find the most recent historical value that's different from current
        const recentHistorical = historicalCredits.find(c => c !== currentCredits && c > 0);
        previousCredits = recentHistorical || 0;
      } else {
        // If no current credits, use the latest historical value
        currentCredits = maxHistoricalCredits;
      }
    }

    // Fallback to database snapshot if no live credits
    if (currentCredits === 0 && dbSnapshot?.credits) {
      currentCredits = dbSnapshot.credits;
    }

    const nodeData = currentNodeData || dbSnapshot;
    
    const response = {
      ip,
      network,
      location: locationData,
      liveCredits: liveCreditsData,
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
  } catch {
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
  } catch {
    // Failed to save snapshot silently
  }
}


async function fetchLocationData(ip: string): Promise<LocationData | null> {
  const cacheKey = `loc:${ip}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached as LocationData;

  // Try ip-api.com first (most reliable for server-side)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,isp`, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        const location: LocationData = {
          country: data.country || 'Unknown',
          country_code: (data.countryCode || '').toLowerCase(),
          city: data.city || 'Unknown',
          region: data.regionName || '',
          provider: data.isp || 'Unknown',
          ip,
          lat: data.lat,
          lon: data.lon,
        };
        
        await cache.set(cacheKey, location, 86400);
        return location;
      }
    }
  } catch {
    // Continue to fallback
  }

  // Fallback to ipwho.is
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    
    const res = await fetch(`https://ipwho.is/${ip}`, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success) return null;
    
    const location: LocationData = {
      country: data.country || 'Unknown',
      country_code: data.country_code?.toLowerCase() || '',
      city: data.city || 'Unknown',
      region: data.region || '',
      provider: data.connection?.isp || data.connection?.org || 'Unknown',
      ip,
      lat: data.latitude,
      lon: data.longitude,
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
        await cache.set(cacheKey, externalNode, 30);
        return externalNode;
      }
      // No fallback for mainnet - external sources only
      return null;
    } catch {
      return null;
    }
  }

  // For devnet, use devnet API
  try {
    const devnetNode = await getDevnetNodeByIp(ip);
    if (devnetNode) {
      await cache.set(cacheKey, devnetNode, 30);
      return devnetNode;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchLiveCreditsData(network: NetworkType): Promise<any[] | null> {
  const cacheKey = `credits:${network}:live`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached as any[];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    // Use network-specific credits API URL
    const url = network === 'mainnet' 
      ? process.env.NEXT_PUBLIC_POD_CREDITS_MAINNET_URL
      : process.env.NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL;
    
    if (!url) {
      console.warn(`[Profile] ${network} credits URL not configured`);
      return null;
    }
    
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    clearTimeout(timeout);
    
    if (!res.ok) return null;
    const data = await res.json();
    const credits = data.pods_credits || [];
    
    await cache.set(cacheKey, credits, 60); // Cache for 1 minute
    return credits;
  } catch {
    return null;
  }
}
