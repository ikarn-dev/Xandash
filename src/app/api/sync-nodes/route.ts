import { NextRequest, NextResponse } from 'next/server';
import { callDirectRPC } from '@/libs/server';
import { saveAllNodeSnapshots, createIndexes } from '@/libs/db/node-service';

// Manual sync endpoint - can be called externally via cron service or manually
export async function POST(request: NextRequest) {
  try {
    // Optional auth check
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rpcResponse = await callDirectRPC('get-pods-with-stats');
    if (!rpcResponse.success || !rpcResponse.data) {
      return NextResponse.json({ error: 'Failed to fetch nodes' }, { status: 500 });
    }

    const nodes = (rpcResponse.data as any)?.pods || [];
    if (nodes.length === 0) {
      return NextResponse.json({ message: 'No nodes to sync', total: 0 });
    }

    // Fetch credits
    const creditsMap = new Map<string, number>();
    try {
      const creditsUrl = process.env.NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL || 'https://podcredits.xandeum.network/api/pods-credits';
      const res = await fetch(creditsUrl, { headers: { 'User-Agent': 'XanDash/1.0' } });
      if (res.ok) {
        const data = await res.json();
        data.pods_credits?.forEach((c: any) => creditsMap.set(c.pod_id, c.credits));
      }
    } catch {}

    const result = await saveAllNodeSnapshots(nodes, creditsMap);

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'init') {
      await createIndexes();
      return NextResponse.json({ success: true, message: 'Indexes created' });
    }
    
    if (action === 'sync') {
      // Trigger sync via GET for easy testing
      const rpcResponse = await callDirectRPC('get-pods-with-stats');
      if (!rpcResponse.success) {
        return NextResponse.json({ error: 'RPC failed' }, { status: 500 });
      }
      
      const nodes = (rpcResponse.data as any)?.pods || [];
      const creditsMap = new Map<string, number>();
      
      try {
        const creditsUrl = process.env.NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL || 'https://podcredits.xandeum.network/api/pods-credits';
        const res = await fetch(creditsUrl, { headers: { 'User-Agent': 'XanDash/1.0' } });
        if (res.ok) {
          const data = await res.json();
          data.pods_credits?.forEach((c: any) => creditsMap.set(c.pod_id, c.credits));
        }
      } catch {}
      
      const result = await saveAllNodeSnapshots(nodes, creditsMap);
      return NextResponse.json({ success: true, ...result, timestamp: new Date().toISOString() });
    }

    return NextResponse.json({
      message: 'Sync API',
      note: 'Data syncs automatically when users visit the dashboard',
      endpoints: {
        'GET ?action=init': 'Create MongoDB indexes',
        'GET ?action=sync': 'Manual sync',
        'POST': 'Sync with auth (for external cron)',
      },
    });
  } catch (error) {
    console.error('Sync GET error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
