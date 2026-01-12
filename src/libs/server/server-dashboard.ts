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
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`RPC error: ${response.status}`);
    }

    return await response.json() as T;
  } catch (error) {
    return null;
  }
}

// Server-side function to fetch version data from mainnet API
export async function getVersionData(): Promise<{
  version: VersionData | null;
  error?: string;
}> {
  try {
    const data = await makeRpcCall<any>('get-version');
    
    if (!data) {
      return {
        version: { version: '0.7.3' },
        error: 'API not configured or failed'
      };
    }

    // Handle different response formats
    const version = data.version || data.result?.version || data.data?.version || '0.7.3';
    const build = data.build || data.result?.build || data.data?.build;
    const commit = data.commit || data.result?.commit || data.data?.commit;
    
    return {
      version: { version, build, commit }
    };
  } catch (error) {
    console.error('Server-side version fetch error:', error);
    return {
      version: { version: '0.7.3' },
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Server-side function to fetch network stats data from mainnet API
export async function getNetworkStatsData(): Promise<{
  stats: NetworkStatsData | null;
  error?: string;
}> {
  try {
    // Fetch both stats and pods data in parallel
    const [statsData, podsData] = await Promise.all([
      makeRpcCall<any>('get-stats'),
      makeRpcCall<any>('get-pods-with-stats')
    ]);
    
    if (!statsData) {
      return {
        stats: null,
        error: 'Stats API error'
      };
    }

    // Extract stats from response
    const stats = statsData.stats || statsData.result?.stats || statsData.data?.stats || statsData.result || statsData.data || statsData;
    
    // Calculate storage stats from pods
    let storageCommitted = 0;
    let storageUsed = 0;
    let totalPods = 0;

    if (podsData) {
      const pods = podsData.pods || podsData.result?.pods || podsData.data?.pods || 
                   (Array.isArray(podsData.result) ? podsData.result : []) ||
                   (Array.isArray(podsData.data) ? podsData.data : []) ||
                   (Array.isArray(podsData) ? podsData : []);
      
      if (Array.isArray(pods)) {
        totalPods = pods.length;
        pods.forEach((pod: any) => {
          storageCommitted += pod.storage_committed || 0;
          storageUsed += pod.storage_used || 0;
        });
      }
    }

    const avgStoragePerPod = totalPods > 0 ? storageCommitted / totalPods : 0;
    
    const processedStats: NetworkStatsData = {
      active_streams: stats.active_streams ?? 0,
      cpu_percent: stats.cpu_percent ?? stats.cpu ?? 0,
      current_index: stats.current_index ?? stats.index ?? 0,
      file_size: stats.file_size ?? stats.fileSize ?? 0,
      last_updated: stats.last_updated ?? stats.lastUpdated ?? Math.floor(Date.now() / 1000),
      packets_received: stats.packets_received ?? stats.packetsReceived ?? stats.packets_recv ?? 0,
      packets_sent: stats.packets_sent ?? stats.packetsSent ?? 0,
      ram_total: stats.ram_total ?? stats.ramTotal ?? stats.memory_total ?? 8589934592,
      ram_used: stats.ram_used ?? stats.ramUsed ?? stats.memory_used ?? 0,
      total_bytes: stats.total_bytes ?? stats.totalBytes ?? stats.bytes_total ?? 0,
      total_pages: stats.total_pages ?? stats.totalPages ?? 0,
      uptime: stats.uptime ?? 0,
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
