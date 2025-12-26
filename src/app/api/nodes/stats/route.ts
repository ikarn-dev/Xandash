import { NextResponse } from 'next/server';
import { cache } from '@/libs/cache/LocalCache';
import { callDirectRPC } from '@/libs/server';

export interface NodeStatsResponse {
  totalNodes: number;
  onlineNodes: number;
  totalConnections: number;
  avgCpu: number;
  avgMemory: number;
}

export async function GET() {
  try {
    const cacheKey = cache.keys.nodeStats();

    // Try to get from cache first
    const cachedStats = await cache.get<NodeStatsResponse>(cacheKey);
    if (cachedStats) {
      return NextResponse.json(cachedStats);
    }

    // Fetch from RPC
    const response = await callDirectRPC('get-pods-with-stats');
    
    if (!response.success || !response.data) {
      return NextResponse.json(
        { error: response.error || 'Failed to fetch nodes' },
        { status: 500 }
      );
    }

    // Handle the actual response structure: { pods: [], total_count: number }
    const responseData = response.data as any;
    const allNodes = Array.isArray(responseData?.pods) ? responseData.pods : [];
    
    // Calculate stats based on actual node data structure
    const now = Math.floor(Date.now() / 1000);
    const onlineNodes = allNodes.filter((n: any) => {
      const timeDiff = now - n.last_seen_timestamp;
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