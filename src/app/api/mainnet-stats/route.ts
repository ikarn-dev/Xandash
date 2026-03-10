import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Fetch pod data from mainnet stats API (simple GET, no API key)
 */
async function fetchPodsData(): Promise<any[] | null> {
  const apiUrl = process.env.MAINNET_API_URL;

  if (!apiUrl) {
    return null;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    // Handle different response formats
    if (Array.isArray(data)) return data;
    if (data.pods && Array.isArray(data.pods)) return data.pods;
    if (data.result?.pods && Array.isArray(data.result.pods)) return data.result.pods;
    if (data.data?.pods && Array.isArray(data.data.pods)) return data.data.pods;
    if (data.result && Array.isArray(data.result)) return data.result;
    if (data.data && Array.isArray(data.data)) return data.data;

    return null;
  } catch (_error) {
    return null;
  }
}

export async function GET() {
  try {
    const pods = await fetchPodsData();

    if (!pods || pods.length === 0) {
      return NextResponse.json({ error: 'API not configured or failed' }, { status: 500 });
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
  } catch (_error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
