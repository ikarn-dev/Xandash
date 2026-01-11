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

// Server-side function to fetch version data from mainnet API
export async function getVersionData(): Promise<{
  version: VersionData | null;
  error?: string;
}> {
  try {
    const apiUrl = process.env.NEW_MAINNET_API_URL?.replace('/pods-with-stats', '/version');
    const apiKey = process.env.NEW_API_KEY;
    
    if (!apiUrl || !apiKey) {
      return {
        version: { version: '0.7.3' }, // Default version
        error: 'API not configured'
      };
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    if (!response.ok) {
      return {
        version: { version: '0.7.3' },
        error: `API error: ${response.status}`
      };
    }

    const data = await response.json();
    
    return {
      version: {
        version: data.version || data.data?.version || '0.7.3',
        build: data.build || data.data?.build,
        commit: data.commit || data.data?.commit,
      }
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
    const baseUrl = process.env.NEW_MAINNET_API_URL?.replace('/pods-with-stats', '');
    const apiKey = process.env.NEW_API_KEY;
    
    if (!baseUrl || !apiKey) {
      console.warn('[NetworkStats] API not configured - missing NEW_MAINNET_API_URL or NEW_API_KEY');
      return {
        stats: null,
        error: 'API not configured'
      };
    }

    const statsUrl = `${baseUrl}/stats`;
    const podsUrl = `${baseUrl}/pods-with-stats`;

    // Fetch both stats and pods data in parallel
    const [statsResponse, podsResponse] = await Promise.all([
      fetch(statsUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      }),
      fetch(podsUrl, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json',
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      })
    ]);
    
    if (!statsResponse.ok) {
      console.error('[NetworkStats] Stats API error:', statsResponse.status, statsResponse.statusText);
      return {
        stats: null,
        error: `Stats API error: ${statsResponse.status}`
      };
    }

    const statsData = await statsResponse.json();
    const stats = statsData.stats || statsData.data || statsData;
    
    // Calculate storage stats from pods
    let storageCommitted = 0;
    let storageUsed = 0;
    let totalPods = 0;

    if (podsResponse.ok) {
      const podsData = await podsResponse.json();
      const pods = podsData.pods || podsData.data?.pods || podsData.data || [];
      
      if (Array.isArray(pods)) {
        totalPods = pods.length;
        pods.forEach((pod: any) => {
          storageCommitted += pod.storage_committed || 0;
          storageUsed += pod.storage_used || 0;
        });
      }
    }

    const avgStoragePerPod = totalPods > 0 ? storageCommitted / totalPods : 0;
    
    // Process and normalize the stats data
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
      // Storage stats
      storage_committed: storageCommitted,
      storage_used: storageUsed,
      avg_storage_per_pod: avgStoragePerPod,
      total_pods: totalPods,
    };

    return {
      stats: processedStats
    };
  } catch (error) {
    console.error('[NetworkStats] Server-side fetch error:', error);
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
