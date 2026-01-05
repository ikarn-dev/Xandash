import { NextRequest, NextResponse } from 'next/server';
import { callDirectRPC } from '@/libs/server';

// Minimal profile data for fast prefetching
export async function GET(request: NextRequest) {
  try {
    const ip = request.nextUrl.searchParams.get('ip');
    if (!ip) {
      return NextResponse.json({ error: 'IP parameter required' }, { status: 400 });
    }

    // Only fetch essential data for prefetch
    const [locationData, currentNodeData] = await Promise.allSettled([
      fetchLocationData(ip),
      fetchCurrentNodeData(ip),
    ]);

    const location = locationData.status === 'fulfilled' ? locationData.value : null;
    const node = currentNodeData.status === 'fulfilled' ? currentNodeData.value : null;

    // Derive basic status
    let status = 'unknown';
    if (node) {
      const timeDiff = Math.floor(Date.now() / 1000) - (node.last_seen_timestamp || 0);
      status = timeDiff < 300 ? 'online' : timeDiff < 3600 ? 'syncing' : 'offline';
    }

    return NextResponse.json({
      ip,
      location,
      currentNode: node ? {
        pubkey: node.pubkey || '',
        address: node.address || `${ip}:9001`,
        status,
        uptime: node.uptime || 0,
        storage_committed: node.storage_committed || 0,
        storage_used: node.storage_used || 0,
        storage_usage_percent: node.storage_usage_percent || 0,
        version: node.version || '',
        rpc_port: node.rpc_port || 0,
        is_public: node.is_public || false,
        last_seen_timestamp: node.last_seen_timestamp || 0,
      } : null,
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to fetch minimal profile data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function fetchLocationData(ip: string) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // Faster timeout
    
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=country,countryCode,regionName,city,lat,lon,isp`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);
    
    if (!res.ok) return null;
    const data = await res.json();
    
    return {
      country: data.country || 'Unknown',
      country_code: data.countryCode?.toLowerCase() || '',
      city: data.city || 'Unknown',
      region: data.regionName || '',
      provider: data.isp || 'Unknown',
      ip,
      lat: data.lat,
      lon: data.lon,
    };
  } catch {
    return null;
  }
}

async function fetchCurrentNodeData(ip: string) {
  try {
    const rpcResponse = await callDirectRPC('get-pods-with-stats');
    if (!rpcResponse.success || !rpcResponse.data) return null;

    const nodes = (rpcResponse.data as any)?.pods || [];
    const node = nodes.find((n: any) => {
      const nodeIp = n.address?.split(':')[0];
      return nodeIp === ip;
    });

    return node || null;
  } catch {
    return null;
  }
}