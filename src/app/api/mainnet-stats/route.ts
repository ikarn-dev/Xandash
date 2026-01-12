import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Make RPC call to Gossip Direct API
 */
async function makeRpcCall<T>(method: string): Promise<T | null> {
  const rpcUrl = process.env.MAINNET_RPC_DIRECT_URL;
  const apiKey = process.env.MAINNET_RPC_API_KEY;
  
  if (!rpcUrl || !apiKey) {
    return null;
  }

  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ method }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`RPC error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[Mainnet Stats] RPC call failed (${method}):`, error);
    return null;
  }
}

export async function GET() {
  try {
    // Fetch pods and stats data in parallel
    const [podsData, statsData] = await Promise.all([
      makeRpcCall<any>('get-pods-with-stats'),
      makeRpcCall<any>('get-stats')
    ]);
    
    if (!podsData) {
      return NextResponse.json({ error: 'API not configured or failed' }, { status: 500 });
    }

    // Extract pods from response
    let pods: any[] = [];
    if (Array.isArray(podsData)) {
      pods = podsData;
    } else if (podsData.pods && Array.isArray(podsData.pods)) {
      pods = podsData.pods;
    } else if (podsData.result?.pods && Array.isArray(podsData.result.pods)) {
      pods = podsData.result.pods;
    } else if (podsData.data?.pods && Array.isArray(podsData.data.pods)) {
      pods = podsData.data.pods;
    } else if (Array.isArray(podsData.result)) {
      pods = podsData.result;
    } else if (Array.isArray(podsData.data)) {
      pods = podsData.data;
    }

    // Calculate totals from pods
    let storageCommitted = 0;
    let storageUsed = 0;
    let packetsReceived = 0;
    let packetsSent = 0;
    let totalBytes = 0;

    pods.forEach((pod: any) => {
      storageCommitted += pod.storage_committed || 0;
      storageUsed += pod.storage_used || 0;
      packetsReceived += pod.packets_received || 0;
      packetsSent += pod.packets_sent || 0;
      totalBytes += pod.total_bytes || 0;
    });

    const totalPods = pods.length;
    const avgStoragePerPod = totalPods > 0 ? storageCommitted / totalPods : 0;

    // Use network-level stats if available
    if (statsData) {
      const stats = statsData.stats || statsData.result?.stats || statsData.data?.stats || 
                    statsData.result || statsData.data || statsData;
      
      if (stats.packets_received || stats.packetsReceived) {
        packetsReceived = stats.packets_received ?? stats.packetsReceived ?? packetsReceived;
      }
      if (stats.packets_sent || stats.packetsSent) {
        packetsSent = stats.packets_sent ?? stats.packetsSent ?? packetsSent;
      }
      if (stats.total_bytes || stats.totalBytes) {
        totalBytes = stats.total_bytes ?? stats.totalBytes ?? totalBytes;
      }
    }
    
    return NextResponse.json({
      storage_committed: storageCommitted,
      storage_used: storageUsed,
      avg_storage_per_pod: avgStoragePerPod,
      total_pods: totalPods,
      packets_received: packetsReceived,
      packets_sent: packetsSent,
      total_bytes: totalBytes,
      timestamp: Date.now(),
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (error) {
    console.error('Mainnet stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
