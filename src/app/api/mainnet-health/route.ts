import { NextRequest, NextResponse } from 'next/server';

/**
 * Mainnet API Health Check Route
 * 
 * Provides a lightweight health check for the mainnet stats API endpoint
 * without returning full node data. Tests if the API connection is working.
 */

// Simple in-memory cache to avoid excessive calls
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
    const MAINNET_API_URL = process.env.MAINNET_API_URL;

    if (!MAINNET_API_URL) {
      const responseTime = Date.now() - startTime;
      const error = 'Mainnet API endpoint not configured';

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

    // Try to make a simple GET request to test connectivity
    let isHealthy = false;
    let error = '';

    try {
      const response = await fetch(MAINNET_API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'XanDash-HealthCheck/1.0',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        // Consider it healthy if we get any successful response
        isHealthy = true;
      } else {
        isHealthy = false;
        error = `API HTTP ${response.status}: ${response.statusText}`;

        // Try to get response body for more details
        try {
          const errorBody = await response.text();
          if (errorBody) {
            error += ` - ${errorBody.substring(0, 200)}`;
          }
        } catch { }
      }
    } catch (apiError) {
      isHealthy = false;
      error = apiError instanceof Error ? apiError.message : 'API connection failed';

      // Add more specific error details
      if (apiError instanceof Error) {
        if (apiError.name === 'AbortError') {
          error = 'API request timeout (10s)';
        } else if (apiError.message.includes('ENOTFOUND')) {
          error = 'API server not found (DNS resolution failed)';
        } else if (apiError.message.includes('ECONNREFUSED')) {
          error = 'API connection refused (server not responding)';
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