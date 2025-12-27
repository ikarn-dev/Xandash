import { NextRequest, NextResponse } from 'next/server';

// In-memory cache
const responseTimeCache = new Map<string, { time: number; responseTime: number | null; status: string }>();
const CACHE_TTL = 60 * 1000; // 1 minute

const getRpcUrl = () => {
  if (process.env.RPC_BASE_URL) {
    return process.env.RPC_BASE_URL;
  }
  const rpcEndpoint = process.env.RPC_ENDPOINT_PRIMARY || process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc1.pchednode.com/rpc';
  return rpcEndpoint.replace(/\/rpc$/, '');
};

// Fetch response time from geo/history endpoint only - no mock data
async function fetchResponseTime(ip: string): Promise<{ responseTime: number | null; status: string }> {
  const cached = responseTimeCache.get(ip);
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return { responseTime: cached.responseTime, status: cached.status };
  }

  const fetchUrl = `${getRpcUrl()}/geo/history?ip=${encodeURIComponent(ip)}`;

  try {
    const response = await fetch(fetchUrl, {
      method: 'GET',
      cache: 'no-store',
      headers: { 'User-Agent': 'XanDash/1.0' },
    });

    if (!response.ok) {
      const result = { responseTime: null, status: 'unknown' };
      responseTimeCache.set(ip, { time: Date.now(), ...result });
      return result;
    }

    const data = await response.json();
    let responseTime: number | null = null;
    let status = 'offline';

    if (data && typeof data === 'object') {
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

    const result = { responseTime, status };
    responseTimeCache.set(ip, { time: Date.now(), ...result });
    return result;
  } catch (error) {
    const result = { responseTime: null, status: 'unknown' };
    responseTimeCache.set(ip, { time: Date.now(), ...result });
    return result;
  }
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
