import { NextRequest, NextResponse } from 'next/server';
import { callDirectRPC } from '@/libs/server';
import { saveAllNodeSnapshots, createIndexes } from '@/libs/db/node-service';

// Simple sync function
async function syncAllNodes() {
  const rpcResponse = await callDirectRPC('get-pods-with-stats');
  if (!rpcResponse.success || !rpcResponse.data) {
    throw new Error('RPC failed');
  }

  const nodes = (rpcResponse.data as any)?.pods || [];
  if (nodes.length === 0) return { total: 0, newNodes: 0, statusChanges: 0, versionChanges: 0, storageChanges: 0, creditsChanges: 0 };

  // Fetch credits in parallel
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
  } catch {}

  return await saveAllNodeSnapshots(nodes, creditsMap);
}

// POST - Main sync endpoint (for external cron services)
// Use with: cron-job.org, easycron.com, or uptimerobot
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Optional auth
    const auth = request.headers.get('authorization');
    const secret = process.env.CRON_SECRET;
    if (secret && auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await syncAllNodes();
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      ...result,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}

// GET - For manual sync and setup
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    if (action === 'init') {
      await createIndexes();
      return NextResponse.json({ success: true, message: 'MongoDB indexes created' });
    }
    
    if (action === 'sync') {
      const startTime = Date.now();
      const result = await syncAllNodes();
      return NextResponse.json({
        success: true,
        ...result,
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    // Return setup instructions
    return NextResponse.json({
      message: 'XanDash Sync API',
      setup: {
        step1: 'Initialize indexes: GET https://xandash.vercel.app/api/sync-nodes?action=init',
        step2: 'Test sync: GET https://xandash.vercel.app/api/sync-nodes?action=sync',
        step3: 'Setup external cron (see below)',
      },
      externalCron: {
        description: 'Use a free cron service to call this endpoint every 30-60 seconds',
        services: [
          'https://cron-job.org (free, 1-minute intervals)',
          'https://www.easycron.com (free tier)',
        ],
        endpoint: 'POST https://xandash.vercel.app/api/sync-nodes',
        headers: 'Authorization: Bearer YOUR_CRON_SECRET (optional)',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
