/**
 * Background RPC Monitor Service
 * 
 * Continuously polls both devnet and mainnet RPC endpoints every 30 seconds
 * regardless of the current network selection. This ensures both networks
 * show accurate status even when not actively being used.
 */

import RpcStatusMonitor from './rpc-status-monitor';

class BackgroundRpcMonitor {
  private static instance: BackgroundRpcMonitor;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() { }

  static getInstance(): BackgroundRpcMonitor {
    if (!BackgroundRpcMonitor.instance) {
      BackgroundRpcMonitor.instance = new BackgroundRpcMonitor();
    }
    return BackgroundRpcMonitor.instance;
  }

  /**
   * Start background monitoring
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;

    // Initial check after a shorter delay to get status quickly
    setTimeout(() => {
      this.performHealthChecks();
    }, 2000); // 2 second delay instead of 5

    // Set up interval for RPC checks every 30 seconds
    this.intervalId = setInterval(() => {
      this.performRpcHealthChecks();
    }, 30000);


  }

  /**
   * Stop background monitoring
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;

  }

  /**
   * Perform health checks for both networks
   */
  private async performHealthChecks() {
    const monitor = RpcStatusMonitor.getInstance();

    // Check mainnet RPC
    await this.checkMainnetRpc(monitor);

    // Check devnet API
    await this.checkDevnetApi(monitor);
  }

  /**
   * Perform RPC health checks only (for frequent polling)
   */
  private async performRpcHealthChecks() {
    const monitor = RpcStatusMonitor.getInstance();

    // Check mainnet RPC
    await this.checkMainnetRpc(monitor);

    // Check devnet API
    await this.checkDevnetApi(monitor);
  }

  /**
   * Check mainnet RPC health
   */
  private async checkMainnetRpc(monitor: RpcStatusMonitor) {
    const startTime = Date.now();

    try {
      // Use dedicated health check endpoint
      const response = await fetch('/api/mainnet-health', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(15000),
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        const success = data.status === 'healthy';

        monitor.recordRpcCall({
          endpoint: '/api/mainnet-health',
          method: 'background-health-check',
          network: 'mainnet',
          success,
          responseTime: data.responseTime || responseTime,
          timestamp: new Date().toISOString(),
          error: success ? undefined : (data.error || 'Mainnet RPC unhealthy')
        });
      } else {
        // Even if the health check endpoint fails, try to get error info
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const data = await response.json();
          if (data.error) errorMessage = data.error;
        } catch { }

        monitor.recordRpcCall({
          endpoint: '/api/mainnet-health',
          method: 'background-health-check',
          network: 'mainnet',
          success: false,
          responseTime,
          timestamp: new Date().toISOString(),
          error: errorMessage
        });
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;

      monitor.recordRpcCall({
        endpoint: '/api/mainnet-health',
        method: 'background-health-check',
        network: 'mainnet',
        success: false,
        responseTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check devnet API health
   */
  private async checkDevnetApi(monitor: RpcStatusMonitor) {
    const startTime = Date.now();

    try {
      const response = await fetch('/api/nodes?includeAll=true&network=devnet', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(15000),
      });

      const responseTime = Date.now() - startTime;
      const success = response.ok;

      monitor.recordRpcCall({
        endpoint: '/api/nodes',
        method: 'background-health-check',
        network: 'devnet',
        success,
        responseTime,
        timestamp: new Date().toISOString(),
        error: success ? undefined : `HTTP ${response.status}: ${response.statusText}`
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;

      monitor.recordRpcCall({
        endpoint: '/api/nodes',
        method: 'background-health-check',
        network: 'devnet',
        success: false,
        responseTime,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get current status
   */
  isMonitoring(): boolean {
    return this.isRunning;
  }
}

export default BackgroundRpcMonitor;