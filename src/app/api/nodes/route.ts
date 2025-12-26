import { NextRequest, NextResponse } from 'next/server';
import { callDirectRPC } from '@/libs/server';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeAll = searchParams.get('includeAll') === 'true';
    
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