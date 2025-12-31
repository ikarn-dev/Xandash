import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/libs/cache/LocalCache';
import { callDirectRPC } from '@/libs/server';
import { getNodeHistory as getDbNodeHistory, getNodeEvents, getLatestNodeSnapshot } from '@/libs/db/node-service';

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

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');
    const quick = searchParams.get('quick') === 'true';

    if (!ip) {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
    }

    // Fetch ALL data in parallel for maximum speed
    const [locationData, currentNodeData, creditsData, dbHistory, dbEvents, dbSnapshot] = await Promise.all([
      fetchLocationData(ip).catch(() => null),
      fetchCurrentNodeData(ip).catch(() => null),
      quick ? Promise.resolve(null) : fetchCreditsData().catch(() => null),
      getDbNodeHistory(ip, 50).catch(() => []),
      getNodeEvents(ip, 20).catch(() => []),
      getLatestNodeSnapshot(ip).catch(() => null),
    ]);

    // Derive status
    let status = 'unknown';
    if (currentNodeData) {
      const timeDiff = Math.floor(Date.now() / 1000) - (currentNodeData.last_seen_timestamp || 0);
      status = timeDiff < 300 ? 'online' : timeDiff < 3600 ? 'syncing' : 'offline';
    } else if (dbSnapshot) {
      status = dbSnapshot.status;
    }

    // Find credits
    let credits = 0;
    const pubkey = currentNodeData?.pubkey || dbSnapshot?.pubkey;
    if (pubkey && creditsData) {
      const entry = creditsData.find((c: any) => c.pod_id === pubkey);
      if (entry) credits = entry.credits;
    }

    // Build response - prefer live data, fallback to DB
    const nodeData = currentNodeData || dbSnapshot;
    
    const response = {
      ip,
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
        credits,
      } : null,
      dbHistory: dbHistory.length > 0 ? dbHistory : undefined,
      dbEvents: dbEvents.length > 0 ? dbEvents : undefined,
    };

    console.log(`Node profile ${ip}: ${Date.now() - startTime}ms`);

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Node profile error:', error);
    return NextResponse.json({ error: 'Failed to fetch node profile' }, { status: 500 });
  }
}

async function fetchLocationData(ip: string): Promise<LocationData | null> {
  const cacheKey = `loc:${ip}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached as LocationData;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout
    
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
    
    await cache.set(cacheKey, location, 86400); // Cache 24h
    return location;
  } catch {
    return null;
  }
}

async function fetchCurrentNodeData(ip: string): Promise<any | null> {
  // Check cache first
  const cacheKey = `node:${ip}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  try {
    const rpcResponse = await callDirectRPC('get-pods-with-stats');
    if (!rpcResponse.success || !rpcResponse.data) return null;

    const nodes = (rpcResponse.data as any)?.pods || [];
    const node = nodes.find((n: any) => {
      const nodeIp = n.address?.split(':')[0];
      return nodeIp === ip;
    });

    if (node) {
      await cache.set(cacheKey, node, 30); // Cache 30s
      return node;
    }
    return null;
  } catch {
    return null;
  }
}

async function fetchCreditsData(): Promise<any[] | null> {
  const cacheKey = 'credits:all';
  const cached = await cache.get(cacheKey);
  if (cached) return cached as any[];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
    
    const url = process.env.NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL || 'https://podcredits.xandeum.network/api/pods-credits';
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'XanDash/1.0' },
    });
    clearTimeout(timeout);
    
    if (!res.ok) return null;
    const data = await res.json();
    const credits = data.pods_credits || [];
    
    await cache.set(cacheKey, credits, 60); // Cache 1min
    return credits;
  } catch {
    return null;
  }
}
