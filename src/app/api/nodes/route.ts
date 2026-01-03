import { NextRequest, NextResponse } from 'next/server';
import { callDirectRPC } from '@/libs/server';

// Force dynamic - no caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    
    if (page < 1 || limit < 1 || limit > 1000) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    const rpcResponse = await callDirectRPC('get-pods-with-stats');
    
    if (!rpcResponse.success || !rpcResponse.data) {
      throw new Error(rpcResponse.error || 'Failed to fetch nodes');
    }

    const responseData = rpcResponse.data as any;
    const allNodes = Array.isArray(responseData?.pods) ? responseData.pods : [];
    
    let result;
    
    // Include server timestamp for accurate client-side time diff calculation
    const serverTimestamp = Math.floor(Date.now() / 1000);
    
    if (includeAll) {
      result = {
        nodes: allNodes,
        total: allNodes.length,
        timestamp: Date.now(),
        serverTimestamp: serverTimestamp
      };
    } else {
      const total = allNodes.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedNodes = allNodes.slice(startIndex, startIndex + limit);

      result = {
        nodes: paginatedNodes,
        pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
        serverTimestamp: serverTimestamp
      };
    }

    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('Nodes API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}