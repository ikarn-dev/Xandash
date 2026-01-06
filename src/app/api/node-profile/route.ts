import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/libs/cache/LocalCache';
import { callDirectRPC } from '@/libs/server';
import { getNodeEvents, getLatestNodeSnapshot, getNodeStatsHistory, saveNodeSnapshot } from '@/libs/db/node-service';
import { fetchMainnetPubkeys } from '@/libs/services/mainnet-filter-service';

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

// Credits endpoints for each network
const CREDITS_ENDPOINTS = {
  devnet: process.env.NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL || 'https://podcredits.xandeum.network/api/pods-credits',
  mainnet: process.env.NEXT_PUBLIC_POD_CREDITS_MAINNET_URL || 'https://podcredits.xandeum.network/api/mainnet-pod-credits',
};

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

    // For mainnet, we need to check if the node is a mainnet node
    let mainnetPubkeys: Map<string, number> | null = null;
    if (network === 'mainnet') {
      mainnetPubkeys = await fetchMainnetPubkeys().catch(() => new Map());
    }

    const [locationData, currentNodeData, creditsData, dbHistory, dbEvents, dbSnapshot] = await Promise.all([
      fetchLocationData(ip).catch(() => null),
      fetchCurrentNodeData(ip, network, mainnetPubkeys).catch(() => null),
      quick ? Promise.resolve(null) : fetchCreditsData(network).catch(() => null),
      getNodeStatsHistory(ip, hours, network).catch(() => []),
      getNodeEvents(ip, 100, network).catch(() => []),
      getLatestNodeSnapshot(ip, network).catch(() => null),
    ]);

    // Save node snapshot on visit (if we have live data)
    if (currentNodeData) {
      const credits = creditsData?.find((c: any) => c.pod_id === currentNodeData.pubkey)?.credits || 0;
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
    
    if (pubkey && creditsData) {
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

async function fetchCurrentNodeData(ip: string, network: NetworkType, mainnetPubkeys: Map<string, number> | null): Promise<any | null> {
  const cacheKey = `node:${network}:${ip}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  try {
    // Always use the same RPC endpoint (devnet RPC has all nodes)
    const rpcResponse = await callDirectRPC('get-pods-with-stats');
    if (!rpcResponse.success || !rpcResponse.data) return null;

    const nodes = (rpcResponse.data as any)?.pods || [];
    const node = nodes.find((n: any) => {
      const nodeIp = n.address?.split(':')[0];
      return nodeIp === ip;
    });

    if (!node) return null;

    // For mainnet, verify the node is a mainnet node
    if (network === 'mainnet' && mainnetPubkeys) {
      if (!mainnetPubkeys.has(node.pubkey)) {
        // Node exists but is not a mainnet node
        console.log(`[NODE-PROFILE] Node ${ip} is not a mainnet node`);
        return null;
      }
      // Add mainnet credits to the node data
      node.mainnet_credits = mainnetPubkeys.get(node.pubkey) || 0;
    }

    await cache.set(cacheKey, node, 30);
    return node;
  } catch {
    return null;
  }
}

async function fetchCreditsData(network: NetworkType): Promise<any[] | null> {
  const cacheKey = `credits:${network}:all`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached as any[];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const url = CREDITS_ENDPOINTS[network];
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'XanDash/1.0' },
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
