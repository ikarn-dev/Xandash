import { NextRequest, NextResponse } from 'next/server';

// In-memory cache
const responseTimeCache = new Map<string, { time: number; responseTime: number | null; status: string; error?: string }>();
const CACHE_TTL = 60 * 1000; // 1 minute

/**
 * Measure response time by pinging the node directly
 */
async function measureResponseTime(ip: string, port: number = 8899): Promise<{ responseTime: number | null; status: string; error?: string }> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    // Try to connect to the node's RPC port
    const response = await fetch(`http://${ip}:${port}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth',
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return { responseTime, status: 'online' };
    }
    
    return { responseTime, status: 'degraded' };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { responseTime: null, status: 'timeout', error: 'Request timeout' };
    }
    return { responseTime: null, status: 'offline', error: 'Connection failed' };
  }
}

// Fetch response time with caching
async function fetchResponseTime(ip: string): Promise<{ responseTime: number | null; status: string; error?: string }> {
  const cached = responseTimeCache.get(ip);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return { responseTime: cached.responseTime, status: cached.status, error: cached.error };
  }

  const result = await measureResponseTime(ip);
  responseTimeCache.set(ip, { time: Date.now(), ...result });
  return result;
}

// GET handler
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');

    if (!ip) {
      return NextResponse.json({ error: 'IP is required' }, { status: 400 });
    }

    const result = await fetchResponseTime(ip);

    return NextResponse.json({ 
      ip,
      responseTime: result.responseTime,
      status: result.status 
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch response time' }, { status: 500 });
  }
}

// POST handler for batch
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ips: string[] = body.ips || [];

    if (!Array.isArray(ips) || ips.length === 0) {
      return NextResponse.json({ error: 'IPs array is required' }, { status: 400 });
    }

    const limitedIPs = ips.slice(0, 25);
    const responseTimes: { [ip: string]: number | null } = {};
    const statuses: { [ip: string]: string } = {};
    
    const batchSize = 10;
    for (let i = 0; i < limitedIPs.length; i += batchSize) {
      const batch = limitedIPs.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (ip) => {
          const result = await fetchResponseTime(ip);
          return { ip, ...result };
        })
      );
      
      results.forEach(({ ip, responseTime, status }) => {
        responseTimes[ip] = responseTime;
        statuses[ip] = status;
      });
    }

    return NextResponse.json({ responseTimes, statuses }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch response times' }, { status: 500 });
  }
}
