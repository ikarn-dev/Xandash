import { NextRequest, NextResponse } from 'next/server';
import { getMainnetNodeByIp } from '@/libs/services/mainnet-data-service';
import { getDevnetNodeByIp } from '@/libs/services/devnet-data-service';

/**
 * Minimal Node Profile API (for fast prefetching)
 * 
 * For mainnet: Uses dual-source staggered fetch with 30s cycle
 * For devnet: Uses devnet API
 */

// Minimal profile data for fast prefetching
export async function GET(request: NextRequest) {
  try {
    const ip = request.nextUrl.searchParams.get('ip');
    const network = request.nextUrl.searchParams.get('network') || 'devnet';
    
    if (!ip) {
      return NextResponse.json({ error: 'IP parameter required' }, { status: 400 });
    }

    // Only fetch essential data for prefetch
    const [locationData, currentNodeData] = await Promise.allSettled([
      fetchLocationData(ip),
      fetchCurrentNodeData(ip, network),
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
      network,
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
  // Try ip-api.com first (most reliable for server-side)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,isp`, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return {
          country: data.country || 'Unknown',
          country_code: (data.countryCode || '').toLowerCase(),
          city: data.city || 'Unknown',
          region: data.regionName || '',
          provider: data.isp || 'Unknown',
          ip,
          lat: data.lat,
          lon: data.lon,
        };
      }
    }
  } catch {
    // Continue to fallback
  }

  // Fallback to ipwho.is
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    
    const res = await fetch(`https://ipwho.is/${ip}`, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success) return null;
    
    return {
      country: data.country || 'Unknown',
      country_code: data.country_code?.toLowerCase() || '',
      city: data.city || 'Unknown',
      region: data.region || '',
      provider: data.connection?.isp || data.connection?.org || 'Unknown',
      ip,
      lat: data.latitude,
      lon: data.longitude,
    };
  } catch {
    return null;
  }
}

async function fetchCurrentNodeData(ip: string, network: string) {
  // For mainnet, use external data sources
  if (network === 'mainnet') {
    try {
      const externalNode = await getMainnetNodeByIp(ip);
      if (externalNode) return externalNode;
    } catch {
      return null;
    }
  }

  // For devnet, use devnet API
  try {
    const devnetNode = await getDevnetNodeByIp(ip);
    return devnetNode;
  } catch {
    return null;
  }
}