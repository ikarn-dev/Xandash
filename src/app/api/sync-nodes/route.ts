import { NextRequest, NextResponse } from 'next/server';
import { callDirectRPC } from '@/libs/server';
import { saveAllNodeSnapshots, createIndexes } from '@/libs/db/node-service';
import { fetchMainnetPubkeys, filterMainnetNodes } from '@/libs/services/mainnet-filter-service';

/**
 * SYNC NODES API
 * 
 * Syncs all node data and pod credits to MongoDB.
 * Supports both devnet and mainnet networks.
 * 
 * For mainnet: filters nodes by pubkeys from mainnet credits API
 */

type NetworkType = 'devnet' | 'mainnet';

// Credits endpoints for each network
const CREDITS_ENDPOINTS = {
  devnet: process.env.NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL || 'https://podcredits.xandeum.network/api/pods-credits',
  mainnet: process.env.NEXT_PUBLIC_POD_CREDITS_MAINNET_URL || 'https://podcredits.xandeum.network/api/mainnet-pod-credits',
};

async function syncAllNodes(network: NetworkType = 'devnet') {
  // Always use the same RPC endpoint (devnet RPC has all nodes)
  const rpcResponse = await callDirectRPC('get-pods-with-stats');
  
  if (!rpcResponse.success || !rpcResponse.data) {
    throw new Error(`RPC failed for ${network}`);
  }

  let nodes = (rpcResponse.data as any)?.pods || [];
  
  // For mainnet, filter nodes by mainnet pubkeys
  if (network === 'mainnet') {
    const mainnetPubkeys = await fetchMainnetPubkeys();
    if (mainnetPubkeys.size === 0) {
      console.warn('[SYNC] No mainnet pubkeys found, skipping mainnet sync');
      return { total: 0, newNodes: 0, statusChanges: 0, versionChanges: 0, storageChanges: 0, creditsChanges: 0 };
    }
    nodes = filterMainnetNodes(nodes, mainnetPubkeys);
    console.log(`[SYNC] Filtered to ${nodes.length} mainnet nodes`);
  }
  
  if (nodes.length === 0) {
    return { total: 0, newNodes: 0, statusChanges: 0, versionChanges: 0, storageChanges: 0, creditsChanges: 0 };
  }

  // Fetch credits from network-specific endpoint
  const creditsMap = new Map<string, number>();
  try {
    const creditsUrl = CREDITS_ENDPOINTS[network];
    const res = await fetch(creditsUrl, { 
      headers: { 'User-Agent': 'XanDash/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json();
      data.pods_credits?.forEach((c: any) => creditsMap.set(c.pod_id, c.credits));
    }
  } catch (err) {
    console.warn(`[SYNC] Failed to fetch credits for ${network}:`, err);
  }

  // Save to network-specific collections
  return await saveAllNodeSnapshots(nodes, creditsMap, network);
}

// Verify request authenticity
function verifyAuth(request: NextRequest): boolean {
  const upstashSignature = request.headers.get('upstash-signature');
  if (upstashSignature) return true;
  
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  
  const auth = request.headers.get('authorization');
  const queryAuth = request.nextUrl.searchParams.get('auth');
  
  return auth === `Bearer ${secret}` || auth === secret || queryAuth === secret;
}

// POST - Main sync endpoint (for cron services)
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

// GET - For manual sync and setup
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
      note: 'Mainnet nodes are filtered from devnet RPC by pubkeys in mainnet credits API',
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
