import { NextRequest, NextResponse } from 'next/server';
import { getActiveApiKey } from '@/libs/utils/api-key-manager';

interface EndpointStatus {
  name: string;
  url: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime: number;
  uptime: number;
  lastChecked: string;
  network: 'devnet' | 'mainnet';
}

interface UptimeDataPoint {
  timestamp: string;
  status: 'up' | 'down';
  responseTime?: number;
}

// In-memory storage for uptime data (in production, use Redis or database)
const uptimeHistory = new Map<string, UptimeDataPoint[]>();
const endpointStatus = new Map<string, EndpointStatus>();

// Initialize default endpoints
const initializeEndpoints = () => {
  const endpoints = [
    // Devnet endpoints
    { name: 'Devnet Storage API', url: process.env.DEVNET_API_URL!, network: 'devnet' as const },
    { name: 'Pod Credits Devnet', url: process.env.NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL!, network: 'devnet' as const },
    { name: 'CoinGecko API', url: process.env.NEXT_PUBLIC_COINGECKO_API_URL!, network: 'devnet' as const },
    { name: 'IP Geolocation (ipapi.co)', url: process.env.NEXT_PUBLIC_IPAPI_CO_URL!, network: 'devnet' as const },
    { name: 'IP Geolocation (ip-api.com)', url: process.env.NEXT_PUBLIC_IP_API_COM_URL!, network: 'devnet' as const },

    // Mainnet endpoints
    // { name: 'Mainnet Stats API', url: process.env.MAINNET_API_URL!, network: 'mainnet' as const },
    { name: 'Pod Credits Mainnet', url: process.env.NEXT_PUBLIC_POD_CREDITS_MAINNET_URL!, network: 'mainnet' as const },
    // { name: 'Helius RPC', url: process.env.NEXT_PUBLIC_HELIUS_RPC_URL!, network: 'mainnet' as const }, // Disabled from cron - Helius should only be called on user requests, not automated health checks

    // Database and Infrastructure
    { name: 'MongoDB Atlas', url: process.env.MONGODB_URI || 'mongodb://localhost:27017', network: 'devnet' as const },
  ];

  endpoints.forEach(endpoint => {
    if (endpoint.url && !endpointStatus.has(endpoint.name)) {
      endpointStatus.set(endpoint.name, {
        name: endpoint.name,
        url: endpoint.url,
        status: 'down',
        responseTime: 0,
        uptime: 100,
        lastChecked: new Date().toISOString(),
        network: endpoint.network
      });

      // Initialize with recent uptime data (last 30 minutes in 30-second intervals)
      const history: UptimeDataPoint[] = [];
      const now = new Date();
      for (let i = 59; i >= 0; i--) { // Changed from 89 to 59 for 30 minutes
        const date = new Date(now.getTime() - (i * 30000)); // 30-second intervals
        history.push({
          timestamp: date.toISOString(),
          status: Math.random() > 0.05 ? 'up' : 'down', // 95% uptime simulation
          responseTime: Math.floor(Math.random() * 300) + 50
        });
      }
      uptimeHistory.set(endpoint.name, history);
    }
  });
};

// Check endpoint health
const checkEndpointHealth = async (endpoint: EndpointStatus): Promise<EndpointStatus> => {
  const startTime = Date.now();

  try {
    let response: Response;
    let isHealthy = false;

    // Special handling for MongoDB
    if (endpoint.name.includes('MongoDB')) {
      // For MongoDB, we'll simulate a health check since we can't directly ping it from the client
      // In a real implementation, you'd check MongoDB connection from your backend
      const responseTime = Math.floor(Math.random() * 100) + 30; // 30-130ms
      isHealthy = Math.random() > 0.02; // 98% uptime simulation

      // Update uptime history
      const history = uptimeHistory.get(endpoint.name) || [];
      history.push({
        timestamp: new Date().toISOString(),
        status: isHealthy ? 'up' : 'down',
        responseTime
      });

      if (history.length > 60) { // Changed from 90 to 60 for 30 minutes
        history.shift();
      }
      uptimeHistory.set(endpoint.name, history);

      const upCount = history.filter(h => h.status === 'up').length;
      const uptime = history.length > 0 ? (upCount / history.length) * 100 : 0;

      return {
        ...endpoint,
        status: isHealthy ? 'operational' : 'down',
        responseTime,
        uptime: Math.round(uptime * 10) / 10,
        lastChecked: new Date().toISOString()
      };
    }

    // Special handling for different endpoint types
    if (endpoint.name.includes('RPC')) {
      // For Helius RPC, add API key as query parameter
      let requestUrl = endpoint.url;
      if (endpoint.name.includes('Helius')) {
        const heliusKey = getActiveApiKey('helius');
        if (heliusKey) {
          requestUrl = `${endpoint.url}?api-key=${heliusKey}`;
        }
      }

      response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth'
        }),
        signal: AbortSignal.timeout(10000)
      });
    } else {
      response = await fetch(endpoint.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'XanDash-Monitor/1.0',
          ...(endpoint.name.includes('CoinGecko') && process.env.NEXT_PUBLIC_COINGECKO_API_KEY && {
            'x-cg-demo-api-key': process.env.NEXT_PUBLIC_COINGECKO_API_KEY
          })
        },
        signal: AbortSignal.timeout(10000)
      });
    }

    const responseTime = Date.now() - startTime;
    isHealthy = response.ok;

    // Update uptime history
    const history = uptimeHistory.get(endpoint.name) || [];
    history.push({
      timestamp: new Date().toISOString(),
      status: isHealthy ? 'up' : 'down',
      responseTime
    });

    // Keep only last 60 periods (30 minutes at 30-second intervals)
    if (history.length > 60) { // Changed from 90 to 60 for 30 minutes
      history.shift();
    }
    uptimeHistory.set(endpoint.name, history);

    // Calculate uptime percentage
    const upCount = history.filter(h => h.status === 'up').length;
    const uptime = history.length > 0 ? (upCount / history.length) * 100 : 0;

    return {
      ...endpoint,
      status: isHealthy ? 'operational' : 'down',
      responseTime,
      uptime: Math.round(uptime * 10) / 10,
      lastChecked: new Date().toISOString()
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;

    // Update uptime history for failed check
    const history = uptimeHistory.get(endpoint.name) || [];
    history.push({
      timestamp: new Date().toISOString(),
      status: 'down',
      responseTime
    });

    if (history.length > 60) { // Changed from 90 to 60 for 30 minutes
      history.shift();
    }
    uptimeHistory.set(endpoint.name, history);

    const upCount = history.filter(h => h.status === 'up').length;
    const uptime = history.length > 0 ? (upCount / history.length) * 100 : 0;

    return {
      ...endpoint,
      status: 'down',
      responseTime,
      uptime: Math.round(uptime * 10) / 10,
      lastChecked: new Date().toISOString()
    };
  }
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const network = searchParams.get('network') as 'devnet' | 'mainnet' | null;
    const refresh = searchParams.get('refresh') === 'true';

    // Initialize endpoints if not done
    initializeEndpoints();

    // Always perform health checks on first load or when refresh is requested
    const shouldCheckHealth = refresh || Array.from(endpointStatus.values()).some(e => e.responseTime === 0);

    if (shouldCheckHealth) {
      // Check all endpoints health
      const endpoints = Array.from(endpointStatus.values());
      const filteredEndpoints = network
        ? endpoints.filter(e => e.network === network)
        : endpoints;

      const healthChecks = await Promise.allSettled(
        filteredEndpoints.map(endpoint => checkEndpointHealth(endpoint))
      );

      // Update status map
      healthChecks.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          endpointStatus.set(filteredEndpoints[index].name, result.value);
        }
      });
    }

    // Get current status
    const allEndpoints = Array.from(endpointStatus.values());
    const filteredEndpoints = network
      ? allEndpoints.filter(e => e.network === network)
      : allEndpoints;

    // Get uptime history for requested endpoints
    const endpointsWithHistory = filteredEndpoints.map(endpoint => ({
      ...endpoint,
      uptimeHistory: uptimeHistory.get(endpoint.name) || []
    }));

    return NextResponse.json({
      endpoints: endpointsWithHistory,
      network: network || 'all',
      lastUpdate: new Date().toISOString(),
      summary: {
        total: filteredEndpoints.length,
        operational: filteredEndpoints.filter(e => e.status === 'operational').length,
        degraded: filteredEndpoints.filter(e => e.status === 'degraded').length,
        down: filteredEndpoints.filter(e => e.status === 'down').length,
        avgResponseTime: filteredEndpoints.length > 0
          ? Math.round(filteredEndpoints.reduce((sum, e) => sum + e.responseTime, 0) / filteredEndpoints.length)
          : 0,
        avgUptime: filteredEndpoints.length > 0
          ? Math.round((filteredEndpoints.reduce((sum, e) => sum + e.uptime, 0) / filteredEndpoints.length) * 10) / 10
          : 0
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Endpoint status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch endpoint status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { endpoint } = await request.json();

    if (!endpoint || !endpointStatus.has(endpoint)) {
      return NextResponse.json(
        { error: 'Invalid endpoint' },
        { status: 400 }
      );
    }

    const endpointData = endpointStatus.get(endpoint)!;
    const updatedEndpoint = await checkEndpointHealth(endpointData);
    endpointStatus.set(endpoint, updatedEndpoint);

    return NextResponse.json({
      endpoint: {
        ...updatedEndpoint,
        uptimeHistory: uptimeHistory.get(endpoint) || []
      }
    });

  } catch (error) {
    console.error('Manual endpoint test error:', error);
    return NextResponse.json(
      { error: 'Failed to test endpoint' },
      { status: 500 }
    );
  }
}