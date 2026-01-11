import { NextRequest, NextResponse } from 'next/server';
import { saveAllNodeSnapshots, createIndexes } from '@/libs/db/node-service';
import { getMainnetData, getMainnetCreditsMap } from '@/libs/services/mainnet-data-service';
import { getDevnetData } from '@/libs/services/devnet-data-service';

/**
 * SYNC NODES API
 * 
 * Syncs all node data and pod credits to MongoDB.
 * Supports both devnet and mainnet networks.
 * 
 * For mainnet: Uses dual-source staggered fetch (30s cycle) - external sources only
 * For devnet: Uses devnet API
 * MongoDB methods remain unchanged for historical data storage
 */

type NetworkType = 'devnet' | 'mainnet';

// Credits endpoint for devnet only
const DEVNET_CREDITS_URL = process.env.NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL || 'https://podcredits.xandeum.network/api/pods-credits';

/**
 * Sync mainnet nodes using external data sources only
 */
async function syncMainnetNodes(): Promise<{
  total: number;
  newNodes: number;
  statusChanges: number;
  versionChanges: number;
  storageChanges: number;
  creditsChanges: number;
  source: string;
}> {
  console.log('[SYNC] Syncing mainnet nodes from external sources...');
  
  try {
    const externalData = await getMainnetData(true);
    
    if (externalData.nodes.length > 0) {
      const creditsMap = await getMainnetCreditsMap();
      const result = await saveAllNodeSnapshots(externalData.nodes, creditsMap, 'mainnet');
      
      console.log(`[SYNC] Synced ${result.total} mainnet nodes (source: ${externalData.source})`);
      return { ...result, source: externalData.source };
    }
    
    console.warn('[SYNC] No mainnet data available from external sources');
    return { total: 0, newNodes: 0, statusChanges: 0, versionChanges: 0, storageChanges: 0, creditsChanges: 0, source: 'none' };
  } catch (error) {
    console.error('[SYNC] External sources failed:', error);
    return { total: 0, newNodes: 0, statusChanges: 0, versionChanges: 0, storageChanges: 0, creditsChanges: 0, source: 'error' };
  }
}

/**
 * Sync devnet nodes using devnet API
 */
async function syncDevnetNodes(): Promise<{
  total: number;
  newNodes: number;
  statusChanges: number;
  versionChanges: number;
  storageChanges: number;
  creditsChanges: number;
}> {
  const devnetData = await getDevnetData(true);
  
  if (devnetData.nodes.length === 0) {
    console.warn('[SYNC] No devnet data available');
    return { total: 0, newNodes: 0, statusChanges: 0, versionChanges: 0, storageChanges: 0, creditsChanges: 0 };
  }

  const creditsMap = new Map<string, number>();
  try {
    const res = await fetch(DEVNET_CREDITS_URL, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json();
      data.pods_credits?.forEach((c: any) => creditsMap.set(c.pod_id, c.credits));
    }
  } catch (err) {
    console.warn('[SYNC] Failed to fetch credits for devnet:', err);
  }

  return await saveAllNodeSnapshots(devnetData.nodes, creditsMap, 'devnet');
}

async function syncAllNodes(network: NetworkType = 'devnet') {
  if (network === 'mainnet') {
    return syncMainnetNodes();
  }
  return syncDevnetNodes();
}

function verifyAuth(request: NextRequest): boolean {
  const upstashSignature = request.headers.get('upstash-signature');
  if (upstashSignature) return true;
  
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  
  const auth = request.headers.get('authorization');
  const queryAuth = request.nextUrl.searchParams.get('auth');
  
  return auth === `Bearer ${secret}` || auth === secret || queryAuth === secret;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const network = (searchParams.get('network') as NetworkType) || 'devnet';
  
  if (network !== 'devnet' && network !== 'mainnet') {
    return NextResponse.json({ error: 'Invalid network. Use devnet or mainnet' }, { status: 400 });
  }

  try {
    const result = await syncAllNodes(network);
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      network,
      ...result,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`[SYNC] Error for ${network}:`, error);
    return NextResponse.json({ error: error.message || 'Sync failed', network }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const network = (searchParams.get('network') as NetworkType) || 'devnet';

  if (network !== 'devnet' && network !== 'mainnet') {
    return NextResponse.json({ error: 'Invalid network. Use devnet or mainnet' }, { status: 400 });
  }

  try {
    if (action === 'init') {
      const targetNetwork = searchParams.get('network') as NetworkType | undefined;
      await createIndexes(targetNetwork);
      return NextResponse.json({ 
        success: true, 
        message: targetNetwork 
          ? `MongoDB indexes created for ${targetNetwork}` 
          : 'MongoDB indexes created for both networks'
      });
    }
    
    if (action === 'sync') {
      const startTime = Date.now();
      const result = await syncAllNodes(network);
      return NextResponse.json({
        success: true,
        network,
        ...result,
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      message: 'XanDash Sync API',
      networks: ['devnet', 'mainnet'],
      note: 'Mainnet uses dual-source staggered fetch with 30s cycle',
      setup: {
        step1: 'Initialize indexes: GET /api/sync-nodes?action=init',
        step2_devnet: 'Test devnet sync: GET /api/sync-nodes?action=sync&network=devnet',
        step2_mainnet: 'Test mainnet sync: GET /api/sync-nodes?action=sync&network=mainnet',
      },
      endpoints: {
        devnet: 'POST /api/sync-nodes?network=devnet',
        mainnet: 'POST /api/sync-nodes?network=mainnet',
      },
      collections: {
        devnet: ['node_snapshots', 'node_events'],
        mainnet: ['mainnet_node_snapshots', 'mainnet_node_events'],
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
