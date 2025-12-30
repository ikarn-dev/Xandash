import { NextRequest, NextResponse } from 'next/server';
import { callDirectRPC } from '@/libs/server';
import { saveAllNodeSnapshots } from '@/libs/db/node-service';

export interface PaginatedNodesResponse {
  nodes: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Background sync - non-blocking
async function backgroundSync(nodes: any[]) {
  try {
    // Fetch credits
    const creditsMap = new Map<string, number>();
    try {
      const creditsUrl = process.env.NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL || 'https://podcredits.xandeum.network/api/pods-credits';
      const creditsRes = await fetch(creditsUrl, { headers: { 'User-Agent': 'XanDash/1.0' } });
      if (creditsRes.ok) {
        const data = await creditsRes.json();
        data.pods_credits?.forEach((c: any) => creditsMap.set(c.pod_id, c.credits));
      }
    } catch {}
    
    await saveAllNodeSnapshots(nodes, creditsMap);
  } catch (e) {
    console.error('Background sync error:', e);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeAll = searchParams.get('includeAll') === 'true';
    const sync = searchParams.get('sync') !== 'false'; // Enable sync by default
    
    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Always fetch fresh data directly from RPC - no caching
    const rpcResponse = await callDirectRPC('get-pods-with-stats');
    
    if (!rpcResponse.success || !rpcResponse.data) {
      throw new Error(rpcResponse.error || 'Failed to fetch nodes');
    }

    // Handle the actual response structure: { pods: [], total_count: number }
    const responseData = rpcResponse.data as any;
    const allNodes = Array.isArray(responseData?.pods) ? responseData.pods : [];
    
    // Trigger background sync to MongoDB (non-blocking)
    if (sync && allNodes.length > 0) {
      backgroundSync(allNodes).catch(() => {});
    }
    
    let result;
    
    if (includeAll) {
      result = {
        nodes: allNodes,
        total: allNodes.length,
        timestamp: Date.now()
      };
    } else {
      const total = allNodes.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedNodes = allNodes.slice(startIndex, endIndex);

      result = {
        nodes: paginatedNodes,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    }

    // No caching - always return fresh data
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Nodes API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}