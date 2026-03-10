export interface VersionData {
  version: string;
  build?: string;
  commit?: string;
}

export interface NetworkStatsData {
  active_streams: number;
  cpu_percent: number;
  current_index: number;
  file_size: number;
  last_updated: number;
  packets_received: number;
  packets_sent: number;
  ram_total: number;
  ram_used: number;
  total_bytes: number;
  total_pages: number;
  uptime: number;
  // Storage stats from pods
  storage_committed: number;
  storage_used: number;
  avg_storage_per_pod: number;
  total_pods: number;
}

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
      signal: AbortSignal.timeout(10000),
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

// Server-side function to fetch version data
// Stats API doesn't serve version data — return default
export async function getVersionData(): Promise<{
  version: VersionData | null;
  error?: string;
}> {
  return {
    version: { version: '0.7.3' },
    error: 'Version data not available from stats API, using default'
  };
}

// Server-side function to fetch network stats data from pod data
export async function getNetworkStatsData(): Promise<{
  stats: NetworkStatsData | null;
  error?: string;
}> {
  try {
    const pods = await fetchPodsData();

    if (!pods || pods.length === 0) {
      return {
        stats: null,
        error: 'No pod data available'
      };
    }

    // Calculate storage stats from pods
    let storageCommitted = 0;
    let storageUsed = 0;

    pods.forEach((pod: any) => {
      storageCommitted += pod.storage_committed || 0;
      storageUsed += pod.storage_used || 0;
    });

    const totalPods = pods.length;
    const avgStoragePerPod = totalPods > 0 ? storageCommitted / totalPods : 0;

    const processedStats: NetworkStatsData = {
      active_streams: 0,
      cpu_percent: 0,
      current_index: 0,
      file_size: 0,
      last_updated: Math.floor(Date.now() / 1000),
      packets_received: 0,
      packets_sent: 0,
      ram_total: 8589934592,
      ram_used: 0,
      total_bytes: 0,
      total_pages: 0,
      uptime: 0,
      storage_committed: storageCommitted,
      storage_used: storageUsed,
      avg_storage_per_pod: avgStoragePerPod,
      total_pods: totalPods,
    };

    return { stats: processedStats };
  } catch (error) {
    return {
      stats: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Combined function to fetch all dashboard data
export async function getDashboardData(): Promise<{
  version: VersionData | null;
  stats: NetworkStatsData | null;
  errors: {
    version?: string;
    stats?: string;
  };
}> {
  const [versionResult, statsResult] = await Promise.all([
    getVersionData(),
    getNetworkStatsData()
  ]);

  return {
    version: versionResult.version,
    stats: statsResult.stats,
    errors: {
      version: versionResult.error,
      stats: statsResult.error,
    }
  };
}
