import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/libs/cache/LocalCache';
import { getMainnetData } from '@/libs/services/mainnet-data-service';
import { getDevnetData } from '@/libs/services/devnet-data-service';

export interface NodeStatsResponse {
  totalNodes: number;
  onlineNodes: number;
  totalConnections: number;
  avgCpu: number;
  avgMemory: number;
  network?: string;
  source?: string;
}

export async function GET(request: NextRequest) {
  try {
    const network = request.nextUrl.searchParams.get('network') || 'devnet';
    const cacheKey = `${cache.keys.nodeStats()}:${network}`;

    // Try to get from cache first
    const cachedStats = await cache.get<NodeStatsResponse>(cacheKey);
    if (cachedStats) {
      return NextResponse.json(cachedStats);
    }

    let allNodes: any[] = [];
    let dataSource = 'api';

    if (network === 'mainnet') {
      try {
        const externalData = await getMainnetData();
        if (externalData.nodes.length > 0) {
          allNodes = externalData.nodes;
          dataSource = externalData.source;
        }
      } catch {
        // Mainnet fetch failed
      }
    } else {
      // For devnet, use devnet API
      try {
        const devnetData = await getDevnetData();
        if (devnetData.nodes.length > 0) {
          allNodes = devnetData.nodes;
          dataSource = devnetData.source;
        }
      } catch {
        // Devnet fetch failed
      }
    }
    
    // Calculate stats based on actual node data structure
    const now = Math.floor(Date.now() / 1000);
    const onlineNodes = allNodes.filter((n: any) => {
      const timeDiff = now - (n.last_seen_timestamp || 0);
      return timeDiff < 300; // Less than 5 minutes = online
    });
    
    const totalConnections = 0; // Not available in current data structure
    const avgCpu = 0; // Not available in current data structure  
    const avgMemory = onlineNodes.length > 0
      ? Math.round(onlineNodes.reduce((sum: number, node: any) => sum + (node.storage_usage_percent || 0), 0) / onlineNodes.length)
      : 0;

    const stats: NodeStatsResponse = {
      totalNodes: allNodes.length,
      onlineNodes: onlineNodes.length,
      totalConnections,
      avgCpu,
      avgMemory,
      network,
      source: dataSource,
    };

    // Cache the result for 60 seconds
    await cache.set(cacheKey, stats, 60);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Node stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}