import { NextRequest, NextResponse } from 'next/server';
import { getMainnetData, getTimeUntilNextCall } from '@/libs/services/mainnet-data-service';

/**
 * Mainnet Data API Route
 * 
 * Fetches mainnet node data using staggered dual-source approach:
 * - 0s: Source A fetch
 * - 15s: Source B fetch  
 * - 30s: Cycle restarts
 * 
 * Data is merged: larger source provides base count, 
 * smaller source updates matching pubkeys
 */

// Local cache for quick responses
let localCache: { data: any; timestamp: number } | null = null;
const LOCAL_CACHE_TTL = 10 * 1000; // 10 seconds

// GET - Fetch all mainnet nodes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Check local cache first
    if (!forceRefresh && localCache && Date.now() - localCache.timestamp < LOCAL_CACHE_TTL) {
      const timeUntilNext = await getTimeUntilNextCall();
      return NextResponse.json({
        ...localCache.data,
        cached: true,
        localCacheAge: Date.now() - localCache.timestamp,
        cooldownRemaining: timeUntilNext,
      });
    }

    // Fetch from mainnet data service
    const mainnetData = await getMainnetData(forceRefresh);
    const timeUntilNext = await getTimeUntilNextCall();

    // Update local cache
    localCache = { 
      data: {
        nodes: mainnetData.nodes,
        geo: mainnetData.geo,
        total: mainnetData.total,
        source: mainnetData.source,
        timestamp: mainnetData.timestamp,
      },
      timestamp: Date.now(),
    };

    return NextResponse.json({
      nodes: mainnetData.nodes,
      geo: mainnetData.geo,
      total: mainnetData.total,
      cached: mainnetData.cached,
      source: mainnetData.source,
      timestamp: mainnetData.timestamp,
      cooldownRemaining: timeUntilNext,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch mainnet nodes' },
      { status: 500 }
    );
  }
}

// POST - Legacy geo data endpoint
export async function POST(request: NextRequest) {
  try {
    const mainnetData = await getMainnetData();
    return NextResponse.json(mainnetData.geo, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch geo data' },
      { status: 500 }
    );
  }
}

// Export cache helpers for other services
export function getNodesCache() {
  if (localCache && Date.now() - localCache.timestamp < LOCAL_CACHE_TTL) {
    return localCache.data.nodes;
  }
  return null;
}

export function getGeoCache() {
  if (localCache && Date.now() - localCache.timestamp < LOCAL_CACHE_TTL) {
    return localCache.data.geo;
  }
  return null;
}

export function getCacheAge(): number {
  return localCache ? Date.now() - localCache.timestamp : -1;
}

export function isCacheValid(): boolean {
  return localCache !== null && Date.now() - localCache.timestamp < LOCAL_CACHE_TTL;
}
