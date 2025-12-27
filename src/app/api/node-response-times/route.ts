import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for response times (server-side)
const responseTimeCache = new Map<string, { time: number; responseTime: number | null; status: string }>();
const CACHE_TTL = 60 * 1000; // 1 minute cache

const getRpcUrl = () => {
  const rpcEndpoint = process.env.RPC_ENDPOINT_PRIMARY || process.env.NEXT_PUBLIC_RPC_URL || process.env.RPC_BASE_URL || 'https://rpc1.pchednode.com/rpc';
  // Remove /rpc suffix if present to get base URL for geo endpoints
  return rpcEndpoint.replace(/\/rpc$/, '');
};

// Fetch response time for a single IP (with timeout)
async function fetchResponseTime(ip: string): Promise<{ responseTime: number | null; status: string }> {
  // Check cache first
  const cached = responseTimeCache.get(ip);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return { responseTime: cached.responseTime, status: cached.status };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const rpcUrl = getRpcUrl();
    const fetchUrl = `${rpcUrl}/geo/history?ip=${encodeURIComponent(ip)}`;
    
    const response = await fetch(fetchUrl, {
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        'User-Agent': 'XanDash/1.0',
      },
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const result = { responseTime: null, status: 'offline' };
      responseTimeCache.set(ip, { time: Date.now(), ...result });
      return result;
    }

    const data = await response.json();
    
    let responseTime: number | null = null;
    let status = 'offline';

    // Find CSV data and extract latest response time
    if (data && typeof data === 'object') {
      for (const key of Object.keys(data)) {
        if (key !== 'meta' && typeof data[key] === 'string' && data[key].includes(',')) {
          const lines = data[key].split('\n').filter((line: string) => line.trim());
          if (lines.length > 0) {
            // Get the last line (most recent)
            const lastLine = lines[lines.length - 1];
            const parts = lastLine.split(',');
            if (parts.length >= 2) {
              responseTime = parseFloat(parts[1]) || null;
              status = responseTime && responseTime > 0 ? 'online' : 'offline';
            }
          }
          break;
        }
      }
    }

    const result = { responseTime, status };
    responseTimeCache.set(ip, { time: Date.now(), ...result });
    return result;
  } catch (error) {
    // Cache failed attempts too to avoid repeated failures
    const result = { responseTime: null, status: 'unknown' };
    responseTimeCache.set(ip, { time: Date.now(), ...result });
    return result;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ips: string[] = body.ips || [];

    if (!Array.isArray(ips) || ips.length === 0) {
      return NextResponse.json({ error: 'IPs array is required' }, { status: 400 });
    }

    // Limit to 25 IPs per request
    const limitedIPs = ips.slice(0, 25);

    // Fetch response times in parallel with concurrency limit
    const responseTimes: { [ip: string]: number | null } = {};
    const statuses: { [ip: string]: string } = {};
    
    // Process in parallel batches of 5 for better performance
    const batchSize = 5;
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
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Batch response times error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch response times' },
      { status: 500 }
    );
  }
}
