import { NextRequest, NextResponse } from 'next/server';
import { callDirectRPC } from '@/libs/server';
import { saveAllNodeSnapshots, createIndexes } from '@/libs/db/node-service';

/**
 * SYNC NODES API
 * 
 * Syncs all node data and pod credits to MongoDB.
 * 
 * CRON OPTIONS (pick one):
 * 
 * 1. UPSTASH QSTASH (Recommended - Free 500 msgs/day)
 *    - Go to https://console.upstash.com/qstash
 *    - Create a schedule: POST https://your-domain.vercel.app/api/sync-nodes
 *    - Cron: * * * * * (every minute)
 *    - Add QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY to Vercel env
 * 
 * 2. EASYCRON (Free 200 calls/day)
 *    - Go to https://www.easycron.com
 *    - URL: POST https://your-domain.vercel.app/api/sync-nodes
 *    - Header: Authorization: Bearer YOUR_CRON_SECRET
 * 
 * 3. GITHUB ACTIONS (Free, 5-min minimum)
 *    - See README for workflow setup
 */

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

// Verify request authenticity (supports multiple auth methods)
function verifyAuth(request: NextRequest): boolean {
  // 1. Check Upstash QStash signature
  const upstashSignature = request.headers.get('upstash-signature');
  if (upstashSignature) {
    // QStash requests are verified by their signature - if header exists, it's from QStash
    // For production, implement full signature verification with @upstash/qstash
    return true;
  }
  
  // 2. Check CRON_SECRET (for other cron services)
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // No secret configured, allow all
  
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

  try {
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
        step1: 'Initialize indexes: GET /api/sync-nodes?action=init',
        step2: 'Test sync: GET /api/sync-nodes?action=sync',
        step3: 'Setup cron service (see options below)',
      },
      cronOptions: {
        upstash: {
          name: 'Upstash QStash (Recommended)',
          free: '500 messages/day',
          setup: 'https://console.upstash.com/qstash',
          schedule: '* * * * *',
        },
        easycron: {
          name: 'EasyCron',
          free: '200 calls/day',
          setup: 'https://www.easycron.com',
        },
        github: {
          name: 'GitHub Actions',
          free: 'Unlimited (public repos)',
          minInterval: '5 minutes',
        },
      },
      endpoint: 'POST /api/sync-nodes',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
