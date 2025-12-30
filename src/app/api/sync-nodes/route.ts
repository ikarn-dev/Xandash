import { NextRequest, NextResponse } from 'next/server';
import { callDirectRPC } from '@/libs/server';
import { saveAllNodeSnapshots, createIndexes } from '@/libs/db/node-service';

// This endpoint syncs all nodes data to MongoDB
// Called by Vercel cron every minute - runs twice with 30s delay for effective 30s intervals

async function syncNodes(): Promise<{
  total: number;
  newNodes: number;
  statusChanges: number;
  versionChanges: number;
  storageChanges: number;
  creditsChanges: number;
}> {
  // Fetch all nodes from RPC
  const rpcResponse = await callDirectRPC('get-pods-with-stats');
  
  if (!rpcResponse.success || !rpcResponse.data) {
    throw new Error('Failed to fetch nodes from RPC');
  }

  const responseData = rpcResponse.data as any;
  const nodes = Array.isArray(responseData?.pods) ? responseData.pods : [];

  if (nodes.length === 0) {
    return { total: 0, newNodes: 0, statusChanges: 0, versionChanges: 0, storageChanges: 0, creditsChanges: 0 };
  }

  // Fetch credits data
  const creditsMap = new Map<string, number>();
  try {
    const creditsUrl = process.env.NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL || 'https://podcredits.xandeum.network/api/pods-credits';
    const creditsResponse = await fetch(creditsUrl, {
      headers: { 'User-Agent': 'XanDash/1.0' },
    });
    
    if (creditsResponse.ok) {
      const creditsData = await creditsResponse.json();
      if (creditsData.pods_credits) {
        creditsData.pods_credits.forEach((c: any) => {
          creditsMap.set(c.pod_id, c.credits);
        });
      }
    }
  } catch (error) {
    console.warn('Failed to fetch credits:', error);
  }

  // Save all nodes to MongoDB
  return await saveAllNodeSnapshots(nodes, creditsMap);
}

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for Vercel cron jobs (optional security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Allow if no secret configured, or if secret matches
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Also check for Vercel cron header
      const vercelCron = request.headers.get('x-vercel-cron');
      if (!vercelCron) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // First sync immediately
    const result1 = await syncNodes();
    console.log(`Sync 1 complete: ${result1.total} nodes, ${result1.newNodes} new, ${result1.statusChanges} status changes`);

    // Wait 30 seconds then sync again (for effective 30s intervals with 1-minute cron)
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Second sync
    const result2 = await syncNodes();
    console.log(`Sync 2 complete: ${result2.total} nodes, ${result2.newNodes} new, ${result2.statusChanges} status changes`);

    return NextResponse.json({
      success: true,
      message: 'Nodes synced to database (2x with 30s interval)',
      sync1: result1,
      sync2: result2,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync nodes error:', error);
    return NextResponse.json(
      { error: 'Failed to sync nodes' },
      { status: 500 }
    );
  }
}

// GET endpoint to check sync status and create indexes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'init') {
      await createIndexes();
      return NextResponse.json({ success: true, message: 'Indexes created' });
    }
    
    // Manual single sync
    if (action === 'sync') {
      const result = await syncNodes();
      return NextResponse.json({
        success: true,
        message: 'Manual sync complete',
        ...result,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      message: 'Sync API ready',
      endpoints: {
        'POST /api/sync-nodes': 'Sync all nodes to database (runs twice with 30s delay)',
        'GET /api/sync-nodes?action=init': 'Initialize database indexes',
        'GET /api/sync-nodes?action=sync': 'Manual single sync',
      },
    });
  } catch (error) {
    console.error('Sync nodes GET error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
