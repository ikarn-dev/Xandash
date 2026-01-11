import { NextRequest, NextResponse } from 'next/server';

// In-memory cache
const responseTimeCache = new Map<string, { time: number; responseTime: number | null; status: string; error?: string }>();
const CACHE_TTL = 60 * 1000; // 1 minute

// Get the Geo History API URL from environment
const getGeoHistoryUrl = () => {
  return process.env.MAINNET_EXTERNAL_GEO_URL?.replace('/geo/batch', '') || '';
};

// Fetch response time from geo/history endpoint
async function fetchResponseTimeFromHistory(ip: string): Promise<{ responseTime: number | null; status: string; error?: string }> {
  const primaryUrl = getGeoHistoryUrl();
  
  if (!primaryUrl) {
    return { responseTime: null, status: 'unknown', error: 'Geo API not configured' };
  }

  const fetchUrl = `${primaryUrl}/geo/history?ip=${encodeURIComponent(ip)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeout);

    if (!response.ok) {
      return { responseTime: null, status: 'unknown', error: 'Geo API error' };
    }

    const data = await response.json();
    let responseTime: number | null = null;
    let status = 'offline';

    if (data && typeof data === 'object') {
      // Check for direct response time value
      if (typeof data.response_time === 'number') {
        responseTime = data.response_time;
        status = 'online';
      } else if (typeof data.ping === 'number') {
        responseTime = data.ping;
        status = 'online';
      } else if (typeof data.latency === 'number') {
        responseTime = data.latency;
        status = 'online';
      } else {
        // Try CSV parsing
        const possibleKeys = ['csv_data', 'data', 'history', 'csv', 'result'];
        let csvData = '';
        
        for (const key of possibleKeys) {
          if (data[key] && typeof data[key] === 'string' && data[key].includes(',')) {
            csvData = data[key];
            break;
          }
        }
        
        if (!csvData) {
          for (const key of Object.keys(data)) {
            if (key !== 'meta' && typeof data[key] === 'string' && data[key].includes(',')) {
              csvData = data[key];
              break;
            }
          }
        }
        
        if (csvData) {
          const lines = csvData.split('\n').filter((line: string) => line.trim());
          if (lines.length > 0) {
            const lastLine = lines[lines.length - 1];
            const parts = lastLine.split(',');
            if (parts.length >= 2) {
              responseTime = parseFloat(parts[1]) || null;
              status = responseTime && responseTime > 0 ? 'online' : 'offline';
            }
          }
        }
      }
    }

    return { responseTime, status };
  } catch (error: any) {
    return { responseTime: null, status: 'unknown', error: 'Fetch failed' };
  }
}

// Fetch response time with caching
async function fetchResponseTime(ip: string): Promise<{ responseTime: number | null; status: string; error?: string }> {
  const cached = responseTimeCache.get(ip);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return { responseTime: cached.responseTime, status: cached.status, error: cached.error };
  }

  const result = await fetchResponseTimeFromHistory(ip);
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
