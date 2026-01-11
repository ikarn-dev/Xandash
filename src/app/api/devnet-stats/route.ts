import { NextResponse } from 'next/server';

/**
 * Devnet Stats API
 * Fetches directly from devnet API and calculates storage stats
 */

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEVNET_API_URL = process.env.DEVNET_API_URL || '';

export async function GET() {
  try {
    if (!DEVNET_API_URL) {
      return NextResponse.json({ error: 'Devnet API URL not configured' }, { status: 500 });
    }

    console.log('[Devnet Stats] Fetching from:', DEVNET_API_URL);
    
    const response = await fetch(DEVNET_API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Devnet API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle response format: {pods: [...], total_count: N}
    let pods: any[] = [];
    
    if (Array.isArray(data)) {
      pods = data;
    } else if (data.pods && Array.isArray(data.pods)) {
      pods = data.pods;
    } else if (data.data?.pods && Array.isArray(data.data.pods)) {
      pods = data.data.pods;
    }

    console.log(`[Devnet Stats] API returned ${pods.length} pods`);

    // Calculate totals from all pods
    let storageCommitted = 0;
    let storageUsed = 0;

    pods.forEach((pod: any) => {
      storageCommitted += pod.storage_committed || 0;
      storageUsed += pod.storage_used || 0;
    });

    const totalPods = pods.length;
    const avgStoragePerPod = totalPods > 0 ? storageCommitted / totalPods : 0;

    console.log(`[Devnet Stats] Total pods: ${totalPods}, Storage committed: ${storageCommitted}, Storage used: ${storageUsed}`);

    const result = {
      storage_committed: storageCommitted,
      storage_used: storageUsed,
      avg_storage_per_pod: avgStoragePerPod,
      total_pods: totalPods,
      packets_received: 0,
      packets_sent: 0,
      total_bytes: 0,
      timestamp: Date.now(),
    };

    const res = NextResponse.json(result);
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return res;
  } catch (error) {
    console.error('[Devnet Stats] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch devnet stats' }, { status: 500 });
  }
}
