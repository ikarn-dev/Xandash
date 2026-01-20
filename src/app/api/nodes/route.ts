import { NextRequest, NextResponse } from 'next/server';
import { calculateNodeScore } from '@/libs/utils/score-utils';
import { getMainnetData } from '@/libs/services/mainnet-data-service';
import { getDevnetData } from '@/libs/services/devnet-data-service';
import managersData from '../../../../managers_data/managers_node_data.json';

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

/**
 * Create a pubkey to manager mapping from managers JSON data
 */
function createPubkeyToManagerMap(): Map<string, string> {
  const pubkeyToManager = new Map<string, string>();

  managersData.managers.forEach(manager => {
    manager.nodes.forEach(node => {
      pubkeyToManager.set(node.pnode_pubkey, manager.manager_address);
    });
  });

  return pubkeyToManager;
}

/**
 * Enrich nodes with manager pubkey from JSON data
 */
function enrichNodesWithManagerData(nodes: any[], pubkeyToManagerMap: Map<string, string>): any[] {
  return nodes.map(node => {
    const managerAddress = pubkeyToManagerMap.get(node.pubkey);

    if (managerAddress) {
      // Node is registered to a manager
      return {
        ...node,
        manager_pubkey: managerAddress
      };
    }

    // Node has no manager
    return node;
  });
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


    // Calculate score and standardize status for all nodes
    if (allNodes.length > 0) {
      const now = Math.floor(Date.now() / 1000);
      allNodes = allNodes.map((node: any) => {
        // Recalculate status for consistency with 1h/2h logic
        const timeDiff = now - (node.last_seen_timestamp || now);
        let status = 'offline';
        if (timeDiff <= 3600) status = 'online';
        else if (timeDiff < 7200) status = 'syncing';

        // Calculate score if missing or recalc to ensure consistency
        // Use service score if available, otherwise calculate
        const score = typeof node.score === 'number' ? node.score : calculateNodeScore(node, now);

        return {
          ...node,
          status,
          score
        };
      });
    }

    // Enrich nodes with manager pubkey from JSON data
    if (allNodes.length > 0) {
      const pubkeyToManagerMap = createPubkeyToManagerMap();
      allNodes = enrichNodesWithManagerData(allNodes, pubkeyToManagerMap);
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