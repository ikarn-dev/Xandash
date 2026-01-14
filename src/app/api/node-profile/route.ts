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

// Hardcoded credits API URLs
const DEVNET_CREDITS_URL = 'https://podcredits.xandeum.network/api/pods-credits';
const MAINNET_CREDITS_URL = 'https://podcredits.xandeum.network/api/mainnet-pod-credits';

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
      // Use null to indicate "unknown/failed" vs 0 which is a valid value
      let liveCredits: number | null = null;
      
      // Try from liveCreditsData (fetched from credits API)
      if (liveCreditsData && currentNodeData.pubkey) {
        const creditsEntry = liveCreditsData.find((c: any) => c.pod_id === currentNodeData.pubkey);
        if (creditsEntry) {
          // API returned a value (could be 0 or positive)
          liveCredits = creditsEntry.credits ?? 0;
        }
      }
      
      // If API didn't return data for this node, try node data
      if (liveCredits === null && currentNodeData.credits !== undefined && currentNodeData.credits !== null) {
        liveCredits = currentNodeData.credits;
      }
      
      // Pass the credits (null means API failed, 0 means API returned 0)
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
    let previousMonthCredits = 0;
    let thisMonthCredits = 0;
    let totalCredits = 0;
    const pubkey = currentNodeData?.pubkey || dbSnapshot?.pubkey;
    
    if (pubkey && liveCreditsData) {
      const creditsEntry = liveCreditsData.find((c: any) => c.pod_id === pubkey);
      currentCredits = creditsEntry?.credits || 0;
    }

    // Calculate previous month credits and detect reset
    // Credits reset at month end, so we look for the max value before the reset point
    if (dbHistory.length > 0) {
      const sortedHistory = [...dbHistory].sort((a, b) => a.timestamp - b.timestamp);
      
      // Find the reset point (where credits dropped significantly)
      let resetIndex = -1;
      for (let i = 1; i < sortedHistory.length; i++) {
        const prev = sortedHistory[i - 1].credits || 0;
        const curr = sortedHistory[i].credits || 0;
        // Detect reset: credits dropped by more than 50% and previous was > 1000
        if (prev > 1000 && curr < prev * 0.5) {
          resetIndex = i;
          break;
        }
      }
      
      if (resetIndex > 0) {
        // We found a reset - calculate previous month max
        const beforeReset = sortedHistory.slice(0, resetIndex);
        previousMonthCredits = Math.max(...beforeReset.map(h => h.credits || 0));
        
        // This month credits is the current value from API
        thisMonthCredits = currentCredits;
        
        // Total is previous month + this month
        totalCredits = previousMonthCredits + thisMonthCredits;
      } else {
        // No reset found - all credits are from this period
        thisMonthCredits = currentCredits;
        totalCredits = currentCredits;
      }
    } else {
      thisMonthCredits = currentCredits;
      totalCredits = currentCredits;
    }

    // Fallback to database snapshot if no live credits and API didn't return data
    if (currentCredits === 0 && !liveCreditsData && dbSnapshot?.credits) {
      currentCredits = dbSnapshot.credits;
      thisMonthCredits = currentCredits;
      totalCredits = previousMonthCredits + thisMonthCredits;
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
        thisMonthCredits,
        previousMonthCredits,
        totalCredits,
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
async function saveNodeSnapshotOnVisit(ip: string, nodeData: any, credits: number | null, network: NetworkType): Promise<void> {
  const cacheKey = `snapshot-saved:${network}:${ip}`;
  const recentlySaved = await cache.get(cacheKey);
  if (recentlySaved) return;
  
  try {
    // Calculate status from last_seen_timestamp
    const timeDiff = Math.floor(Date.now() / 1000) - (nodeData.last_seen_timestamp || 0);
    let status: 'online' | 'offline' | 'syncing' = 'offline';
    if (timeDiff < 300) status = 'online';
    else if (timeDiff < 3600) status = 'syncing';
    
    await saveNodeSnapshot({
      ip,
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
      credits: credits ?? undefined, // Pass undefined if null to let saveNodeSnapshot handle it
      active_streams: nodeData.active_streams || 0,
    }, network);
    
    await cache.set(cacheKey, true, 60);
  } catch (err) {
    console.error(`[Profile] Failed to save snapshot for ${ip} on ${network}:`, err);
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
    
    // Use hardcoded network-specific credits API URL
    const url = network === 'mainnet' ? MAINNET_CREDITS_URL : DEVNET_CREDITS_URL;
    
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
