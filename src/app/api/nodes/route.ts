import { NextRequest, NextResponse } from 'next/server';
import { getMainnetData } from '@/libs/services/mainnet-data-service';
import { getDevnetData } from '@/libs/services/devnet-data-service';

/**
 * Nodes API
 * 
 * For mainnet: Uses dual-source staggered fetch with 30s cycle
 * For devnet: Uses devnet API
 */

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
    const network = searchParams.get('network') || 'devnet';
    
    if (page < 1 || limit < 1 || limit > 1000) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    let allNodes: any[] = [];
    let dataSource = 'api';

    if (network === 'mainnet') {
      // For mainnet, use external data sources
      try {
        const externalData = await getMainnetData();
        if (externalData.nodes.length > 0) {
          allNodes = externalData.nodes;
          dataSource = externalData.source;
        } else {
          console.warn('[Nodes API] No mainnet data available from external sources');
        }
      } catch (error) {
        console.error('[Nodes API] Mainnet sources failed:', error);
      }
    } else {
      // For devnet, use devnet API
      try {
        const devnetData = await getDevnetData();
        if (devnetData.nodes.length > 0) {
          allNodes = devnetData.nodes;
          dataSource = devnetData.source;
        } else {
          console.warn('[Nodes API] No devnet data available');
        }
      } catch (error) {
        console.error('[Nodes API] Devnet API failed:', error);
      }
    }
    
    let result;
    const serverTimestamp = Math.floor(Date.now() / 1000);
    
    if (includeAll) {
      result = {
        nodes: allNodes,
        total: allNodes.length,
        timestamp: Date.now(),
        serverTimestamp: serverTimestamp,
        network: network,
        source: dataSource
      };
    } else {
      const total = allNodes.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const paginatedNodes = allNodes.slice(startIndex, startIndex + limit);

      result = {
        nodes: paginatedNodes,
        pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
        serverTimestamp: serverTimestamp,
        network: network,
        source: dataSource
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
