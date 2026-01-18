import { NextRequest, NextResponse } from 'next/server';

/**
 * Mainnet RPC Health Check API Route
 * 
 * Provides a lightweight health check for the mainnet RPC endpoint
 * without returning full node data. Tests if the RPC connection is working.
 */

// Simple in-memory cache to avoid excessive RPC calls
let lastHealthCheck: {
  status: 'healthy' | 'unhealthy';
  timestamp: number;
  responseTime: number;
  error?: string;
} | null = null;
const HEALTH_CHECK_CACHE_TTL = 30 * 1000; // 30 seconds cache

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check for force refresh parameter
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Check if we have a recent cached result (unless force refresh)
    if (!forceRefresh && lastHealthCheck && Date.now() - lastHealthCheck.timestamp < HEALTH_CHECK_CACHE_TTL) {
      return NextResponse.json({
        status: lastHealthCheck.status,
        responseTime: lastHealthCheck.responseTime,
        cached: true,
        lastChecked: new Date(lastHealthCheck.timestamp).toISOString(),
        error: lastHealthCheck.error
      });
    }

    // Check environment variables
    const MAINNET_RPC_URL = process.env.MAINNET_RPC_DIRECT_URL;
    const MAINNET_RPC_KEY = process.env.MAINNET_RPC_API_KEY;

    if (!MAINNET_RPC_URL || !MAINNET_RPC_KEY) {
      const responseTime = Date.now() - startTime;
      const error = 'Mainnet RPC temporarily disabled - Cloudflare tunnel unavailable';

      lastHealthCheck = {
        status: 'unhealthy',
        timestamp: Date.now(),
        responseTime,
        error
      };

      return NextResponse.json({
        status: 'unhealthy',
        responseTime,
        cached: false,
        lastChecked: new Date().toISOString(),
        error
      }, { status: 503 });
    }

    // Try to make a simple RPC call to test connectivity
    let isHealthy = false;
    let error = '';
    let rpcDetails = '';

    try {


      const response = await fetch(MAINNET_RPC_URL, {
        method: 'POST',
        headers: {
          'X-API-Key': MAINNET_RPC_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'XanDash-HealthCheck/1.0',
        },
        body: JSON.stringify({ method: 'get-version' }), // Simple method to test connectivity
        signal: AbortSignal.timeout(10000),
      });

      rpcDetails = `Response status: ${response.status} ${response.statusText}`;


      if (response.ok) {
        const data = await response.json();

        // Consider it healthy if we get any response (even if it's an error response)
        isHealthy = true;
      } else {
        isHealthy = false;
        error = `RPC HTTP ${response.status}: ${response.statusText}`;

        // Try to get response body for more details
        try {
          const errorBody = await response.text();
          if (errorBody) {
            error += ` - ${errorBody.substring(0, 200)}`;
          }
        } catch { }
      }
    } catch (rpcError) {
      isHealthy = false;
      error = rpcError instanceof Error ? rpcError.message : 'RPC connection failed';
      console.error(`[Mainnet Health] RPC Error:`, rpcError);

      // Add more specific error details
      if (rpcError instanceof Error) {
        if (rpcError.name === 'AbortError') {
          error = 'RPC request timeout (10s)';
        } else if (rpcError.message.includes('ENOTFOUND')) {
          error = 'RPC server not found (DNS resolution failed)';
        } else if (rpcError.message.includes('ECONNREFUSED')) {
          error = 'RPC connection refused (server not responding)';
        }
      }
    }

    const responseTime = Date.now() - startTime;
    const status = isHealthy ? 'healthy' : 'unhealthy';

    // Cache the result
    lastHealthCheck = {
      status,
      timestamp: Date.now(),
      responseTime,
      error: isHealthy ? undefined : error
    };

    return NextResponse.json({
      status,
      responseTime,
      cached: false,
      lastChecked: new Date().toISOString(),
      error: isHealthy ? undefined : error
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Health check failed';

    // Cache the failure result
    lastHealthCheck = {
      status: 'unhealthy',
      timestamp: Date.now(),
      responseTime,
      error: errorMessage
    };

    return NextResponse.json({
      status: 'unhealthy',
      responseTime,
      cached: false,
      lastChecked: new Date().toISOString(),
      error: errorMessage
    }, { status: 503 });
  }
}