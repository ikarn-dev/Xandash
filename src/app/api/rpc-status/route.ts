import { NextRequest, NextResponse } from 'next/server';
import RpcStatusMonitor from '@/libs/services/rpc-status-monitor';

/**
 * RPC Status API Route
 * 
 * Provides real-time status of RPC endpoints based on actual API calls
 * made by the application. This integrates with the endpoint monitoring
 * system to show live status updates.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network') as 'devnet' | 'mainnet' | null;
    
    const monitor = RpcStatusMonitor.getInstance();
    const allStatuses = monitor.getAllStatuses();
    
    // Filter by network if specified
    const filteredStatuses = network 
      ? allStatuses.filter(status => status.network === network)
      : allStatuses;
    
    // Transform to match endpoint monitoring format
    const endpoints = filteredStatuses.map(status => ({
      name: status.name,
      url: status.network === 'mainnet' ? 'mainnet-rpc' : 'devnet-api',
      status: status.status,
      responseTime: status.responseTime,
      uptime: status.uptime,
      lastChecked: status.lastChecked,
      network: status.network,
      recentCalls: status.recentCalls || [], // Ensure recentCalls is always an array
      uptimeHistory: (status.recentCalls || []).map(call => ({
        timestamp: call.timestamp,
        status: call.success ? 'up' : 'down' as 'up' | 'down',
        responseTime: call.responseTime
      }))
    }));
    
    // Calculate summary
    const summary = {
      total: filteredStatuses.length,
      operational: filteredStatuses.filter(s => s.status === 'operational').length,
      degraded: filteredStatuses.filter(s => s.status === 'degraded').length,
      down: filteredStatuses.filter(s => s.status === 'down').length,
      avgResponseTime: filteredStatuses.length > 0 
        ? Math.round(filteredStatuses.reduce((sum, s) => sum + s.responseTime, 0) / filteredStatuses.length)
        : 0,
      avgUptime: filteredStatuses.length > 0
        ? Math.round((filteredStatuses.reduce((sum, s) => sum + s.uptime, 0) / filteredStatuses.length) * 10) / 10
        : 0
    };
    
    return NextResponse.json({
      endpoints,
      network: network || 'all',
      lastUpdate: new Date().toISOString(),
      summary,
      source: 'rpc-monitor'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
  } catch (error) {
    console.error('RPC status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RPC status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { endpoint } = await request.json();
    
    const monitor = RpcStatusMonitor.getInstance();
    const status = monitor.getEndpointStatus(endpoint);
    
    if (!status) {
      return NextResponse.json(
        { error: 'Endpoint not found' },
        { status: 404 }
      );
    }
    
    // Return current status (no manual testing for RPC endpoints)
    return NextResponse.json({
      endpoint: {
        name: status.name,
        url: status.network === 'mainnet' ? 'mainnet-rpc' : 'devnet-api',
        status: status.status,
        responseTime: status.responseTime,
        uptime: status.uptime,
        lastChecked: status.lastChecked,
        network: status.network,
        recentCalls: status.recentCalls || [], // Ensure recentCalls is always an array
        uptimeHistory: (status.recentCalls || []).map(call => ({
          timestamp: call.timestamp,
          status: call.success ? 'up' : 'down' as 'up' | 'down',
          responseTime: call.responseTime
        }))
      }
    });
    
  } catch (error) {
    console.error('RPC status test error:', error);
    return NextResponse.json(
      { error: 'Failed to get RPC status' },
      { status: 500 }
    );
  }
}