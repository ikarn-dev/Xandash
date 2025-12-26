import { callDirectRPC } from './server-rpc';

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
}

// Server-side function to fetch version data
export async function getVersionData(): Promise<{
  version: VersionData | null;
  error?: string;
}> {
  try {
    const response = await callDirectRPC('get-version');
    
    if (!response.success || !response.data) {
      return {
        version: null,
        error: response.error || 'Failed to fetch version'
      };
    }

    const versionData = response.data as any;
    
    return {
      version: {
        version: versionData.version || '0.7.3',
        build: versionData.build,
        commit: versionData.commit,
      }
    };
  } catch (error) {
    console.error('Server-side version fetch error:', error);
    return {
      version: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Server-side function to fetch network stats data
export async function getNetworkStatsData(): Promise<{
  stats: NetworkStatsData | null;
  error?: string;
}> {
  try {
    const response = await callDirectRPC('get-stats');
    
    if (!response.success || !response.data) {
      return {
        stats: null,
        error: response.error || 'Failed to fetch network stats'
      };
    }

    const statsData = response.data as any;
    
    // Process and normalize the stats data
    const processedStats: NetworkStatsData = {
      active_streams: statsData.active_streams || 0,
      cpu_percent: statsData.cpu_percent || 0,
      current_index: statsData.current_index || 0,
      file_size: statsData.file_size || 0,
      last_updated: statsData.last_updated || Date.now(),
      packets_received: statsData.packets_received || 0,
      packets_sent: statsData.packets_sent || 0,
      ram_total: statsData.ram_total || 8589934592, // Default 8GB
      ram_used: statsData.ram_used || 0,
      total_bytes: statsData.total_bytes || 0,
      total_pages: statsData.total_pages || 0,
      uptime: statsData.uptime || 0,
    };

    return {
      stats: processedStats
    };
  } catch (error) {
    console.error('Server-side network stats fetch error:', error);
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
