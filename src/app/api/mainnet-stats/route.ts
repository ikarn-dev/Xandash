import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const podsUrl = process.env.NEW_MAINNET_API_URL;
    const apiKey = process.env.NEW_API_KEY;
    
    if (!podsUrl || !apiKey) {
      return NextResponse.json({ error: 'API not configured' }, { status: 500 });
    }

    // Fetch pods data to calculate storage stats
    const podsResponse = await fetch(podsUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    
    if (!podsResponse.ok) {
      return NextResponse.json({ error: `API error: ${podsResponse.status}` }, { status: podsResponse.status });
    }

    const podsData = await podsResponse.json();
    
    // Handle response format: {pods: [...], total_count: N}
    let pods: any[] = [];
    if (Array.isArray(podsData)) {
      pods = podsData;
    } else if (podsData.pods && Array.isArray(podsData.pods)) {
      pods = podsData.pods;
    }

    // Calculate totals from all pods
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

    // Also try to fetch network-level stats if available
    try {
      const baseUrl = podsUrl.replace('/pods-with-stats', '');
      const statsUrl = `${baseUrl}/stats`;
      
      const statsResponse = await fetch(statsUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        const stats = statsData.stats || statsData.data || statsData;
        // Use network-level stats if available (they're more accurate)
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
    } catch (e) {
      console.warn('[Mainnet Stats] Could not fetch network stats:', e);
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
