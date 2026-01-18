/**
 * RPC Status Monitor Service
 * 
 * Monitors RPC calls made by the application and updates endpoint status
 * based on actual API call results. Integrates with the endpoint monitoring
 * system to provide real-time status updates.
 */

interface RpcCallResult {
  endpoint: string;
  method: string;
  network: 'devnet' | 'mainnet';
  success: boolean;
  responseTime: number;
  timestamp: string;
  error?: string;
}

interface EndpointStatus {
  name: string;
  network: 'devnet' | 'mainnet';
  status: 'operational' | 'degraded' | 'down';
  responseTime: number;
  uptime: number;
  lastChecked: string;
  recentCalls: RpcCallResult[];
}

class RpcStatusMonitor {
  private static instance: RpcStatusMonitor;
  private endpointStatuses = new Map<string, EndpointStatus>();
  private listeners: ((status: EndpointStatus) => void)[] = [];

  private constructor() {
    // Initialize default endpoints
    this.initializeEndpoints();
  }

  static getInstance(): RpcStatusMonitor {
    if (!RpcStatusMonitor.instance) {
      RpcStatusMonitor.instance = new RpcStatusMonitor();
    }
    return RpcStatusMonitor.instance;
  }

  private initializeEndpoints() {
    const endpoints = [
      { name: 'pNode Devnet', network: 'devnet' as const },
      { name: 'pNode Mainnet', network: 'mainnet' as const },
    ];

    endpoints.forEach(endpoint => {
      // Initialize with minimal data - let real health checks determine status
      this.endpointStatuses.set(endpoint.name, {
        name: endpoint.name,
        network: endpoint.network,
        status: 'down', // Start as down until first health check
        responseTime: 0,
        uptime: 0, // Start at 0% until we have real data
        lastChecked: new Date().toISOString(),
        recentCalls: [] // No initial calls - let background monitor populate
      });
    });
  }

  /**
   * Record an RPC call result
   */
  recordRpcCall(result: RpcCallResult) {
    const endpointName = result.network === 'mainnet' ? 'pNode Mainnet' : 'pNode Devnet';
    const status = this.endpointStatuses.get(endpointName);
    
    if (!status) return;

    // Add to recent calls (keep last 20 for better accuracy)
    status.recentCalls.push(result);
    if (status.recentCalls.length > 20) {
      status.recentCalls.shift();
    }

    // Update response time (use average of recent calls)
    const recentResponseTimes = status.recentCalls.map(call => call.responseTime);
    status.responseTime = Math.round(recentResponseTimes.reduce((sum, time) => sum + time, 0) / recentResponseTimes.length);
    status.lastChecked = result.timestamp;
    
    // Calculate success rate from recent calls
    const recentSuccessRate = status.recentCalls.length > 0 
      ? status.recentCalls.filter(call => call.success).length / status.recentCalls.length
      : 0;

    // Update endpoint status - be more conservative with initial calls
    if (status.recentCalls.length < 3) {
      // For first few calls, be more lenient
      if (result.success) {
        status.status = 'operational';
      } else {
        status.status = 'degraded';
      }
    } else {
      // Use normal thresholds once we have enough data
      if (recentSuccessRate >= 0.9) {
        status.status = 'operational';
      } else if (recentSuccessRate >= 0.7) {
        status.status = 'degraded';
      } else {
        status.status = 'down';
      }
    }

    // Calculate uptime from recent calls
    if (status.recentCalls.length === 0) {
      status.uptime = 0;
    } else if (status.recentCalls.length < 5) {
      // For initial calls, show actual percentage but don't go below 20%
      status.uptime = Math.max(20, recentSuccessRate * 100);
    } else {
      // Normal calculation once we have enough data
      status.uptime = recentSuccessRate * 100;
    }

    // Notify listeners
    this.notifyListeners(status);
  }

  /**
   * Get current status for an endpoint
   */
  getEndpointStatus(name: string): EndpointStatus | undefined {
    return this.endpointStatuses.get(name);
  }

  /**
   * Get all endpoint statuses
   */
  getAllStatuses(): EndpointStatus[] {
    return Array.from(this.endpointStatuses.values());
  }

  /**
   * Subscribe to status updates
   */
  subscribe(listener: (status: EndpointStatus) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(status: EndpointStatus) {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in RPC status listener:', error);
      }
    });
  }
}

// Utility function to wrap fetch calls and monitor them
export async function monitoredFetch(
  url: string,
  options: RequestInit & { 
    network?: 'devnet' | 'mainnet';
    method?: string;
  } = {}
): Promise<Response> {
  const startTime = Date.now();
  const monitor = RpcStatusMonitor.getInstance();
  
  try {
    const response = await fetch(url, options);
    const responseTime = Date.now() - startTime;
    
    // Determine network and method from URL and options
    const network = options.network || (url.includes('mainnet') ? 'mainnet' : 'devnet');
    const method = options.method || 'unknown';
    
    monitor.recordRpcCall({
      endpoint: url,
      method,
      network,
      success: response.ok,
      responseTime,
      timestamp: new Date().toISOString(),
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    });
    
    return response;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const network = options.network || (url.includes('mainnet') ? 'mainnet' : 'devnet');
    const method = options.method || 'unknown';
    
    monitor.recordRpcCall({
      endpoint: url,
      method,
      network,
      success: false,
      responseTime,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw error;
  }
}

export default RpcStatusMonitor;