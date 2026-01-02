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

// GET handler for Vercel Cron
// Vercel cron jobs call GET by default
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Verify this is a legitimate Vercel cron request
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Check for Vercel's cron signature or our custom secret
    const isVercelCron = request.headers.get('x-vercel-cron') === '1';
    const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`;
    
    // In production, require either Vercel cron header or valid secret
    if (process.env.NODE_ENV === 'production' && !isVercelCron && !hasValidSecret) {
      // Allow without auth if no CRON_SECRET is set (for easier setup)
      if (cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Ensure indexes exist (idempotent operation)
    await createIndexes();
    
    const result = await syncAllNodes();
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Cron sync completed',
      ...result,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      nextRun: 'In 1 minute (automatic)',
    });
  } catch (error: any) {
    console.error('[CRON] Sync error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Cron sync failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

// POST handler for manual triggers or external cron services
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await createIndexes();
    const result = await syncAllNodes();
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Manual sync completed',
      ...result,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[CRON] Manual sync error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Sync failed',
    }, { status: 500 });
  }
}
