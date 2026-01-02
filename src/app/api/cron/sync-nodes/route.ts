import { NextRequest, NextResponse } from 'next/server';
import { callDirectRPC } from '@/libs/server';
import { saveAllNodeSnapshots, createIndexes } from '@/libs/db/node-service';

// Vercel Cron Job - runs every 1 minute automatically
// This endpoint is called by Vercel's cron scheduler defined in vercel.json
// It saves all node data to MongoDB regardless of user visits

async function syncAllNodes() {
  console.log('[CRON] Starting automatic node sync...');
  
  const rpcResponse = await callDirectRPC('get-pods-with-stats');
  if (!rpcResponse.success || !rpcResponse.data) {
    throw new Error('RPC failed to fetch nodes');
  }

  const nodes = (rpcResponse.data as any)?.pods || [];
  if (nodes.length === 0) {
    console.log('[CRON] No nodes returned from RPC');
    return { total: 0, newNodes: 0, statusChanges: 0, versionChanges: 0, storageChanges: 0, creditsChanges: 0 };
  }

  // Fetch pod credits in parallel
  const creditsMap = new Map<string, number>();
  try {
    const url = process.env.NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL || 'https://podcredits.xandeum.network/api/pods-credits';
    const res = await fetch(url, { 
      headers: { 'User-Agent': 'XanDash/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json();
      data.pods_credits?.forEach((c: any) => creditsMap.set(c.pod_id, c.credits));
    }
  } catch (e) {
    console.log('[CRON] Failed to fetch pod credits, continuing without them');
  }

  const result = await saveAllNodeSnapshots(nodes, creditsMap);
  console.log(`[CRON] Sync complete: ${result.total} nodes, ${result.newNodes} new, ${result.statusChanges} status changes`);
  
  return result;
}

// GET handler for external cron services (like cron-job.org)
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get authentication from query params or headers for external cron services
    const cronSecret = process.env.CRON_SECRET;
    const authFromQuery = request.nextUrl.searchParams.get('auth');
    const authFromHeader = request.headers.get('authorization');
    
    // Check authentication if CRON_SECRET is set
    if (cronSecret) {
      const isValidAuth = 
        authFromQuery === cronSecret || 
        authFromHeader === `Bearer ${cronSecret}` ||
        authFromHeader === cronSecret;
        
      if (!isValidAuth) {
        console.log('[CRON] Unauthorized access attempt');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[CRON] External cron job triggered');
    
    // Ensure indexes exist (idempotent operation)
    await createIndexes();
    
    const result = await syncAllNodes();
    const duration = Date.now() - startTime;

    const response = {
      success: true,
      message: 'External cron sync completed',
      ...result,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      source: 'external-cron',
    };

    console.log(`[CRON] External sync completed: ${result.total} nodes processed in ${duration}ms`);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[CRON] External sync error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'External cron sync failed',
      timestamp: new Date().toISOString(),
      source: 'external-cron',
    }, { status: 500 });
  }
}

// POST handler for manual triggers or external cron services with POST method
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get authentication from body, query params, or headers
    const cronSecret = process.env.CRON_SECRET;
    const authFromHeader = request.headers.get('authorization');
    const authFromQuery = request.nextUrl.searchParams.get('auth');
    
    let authFromBody = null;
    try {
      const body = await request.json();
      authFromBody = body.auth || body.secret;
    } catch {
      // Body is not JSON or empty, that's fine
    }
    
    // Check authentication if CRON_SECRET is set
    if (cronSecret) {
      const isValidAuth = 
        authFromQuery === cronSecret || 
        authFromHeader === `Bearer ${cronSecret}` ||
        authFromHeader === cronSecret ||
        authFromBody === cronSecret;
        
      if (!isValidAuth) {
        console.log('[CRON] Unauthorized POST access attempt');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[CRON] Manual/External POST sync triggered');

    await createIndexes();
    const result = await syncAllNodes();
    const duration = Date.now() - startTime;

    const response = {
      success: true,
      message: 'Manual/External sync completed',
      ...result,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      source: 'manual-or-external',
    };

    console.log(`[CRON] Manual/External sync completed: ${result.total} nodes processed in ${duration}ms`);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('[CRON] Manual/External sync error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Sync failed',
      timestamp: new Date().toISOString(),
      source: 'manual-or-external',
    }, { status: 500 });
  }
}
