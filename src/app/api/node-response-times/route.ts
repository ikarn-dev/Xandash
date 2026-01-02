import { NextRequest, NextResponse } from 'next/server';

// In-memory cache
const responseTimeCache = new Map<string, { time: number; responseTime: number | null; status: string; error?: string }>();
const CACHE_TTL = 60 * 1000; // 1 minute

const getRpcUrl = () => {
  if (process.env.RPC_BASE_URL) {
    return process.env.RPC_BASE_URL;
  }
  const rpcEndpoint = process.env.RPC_ENDPOINT_PRIMARY || 'http://161.97.97.41:6000/rpc';
  return rpcEndpoint.replace(/\/rpc$/, '');
};

// Get the Geo History API URL
const getGeoHistoryUrl = () => {
  if (process.env.GEO_HISTORY_API_URL) {
    return process.env.GEO_HISTORY_API_URL;
  }
  return getRpcUrl();
};

// Active public node endpoints (is_public: true, status: ACTIVE) as backups
const PUBLIC_NODE_ENDPOINTS = [
  'http://161.97.97.41:6000',
  'http://173.212.203.145:6000',
  'http://173.212.220.65:6000',
  'http://62.171.138.27:6000',
  'http://84.21.171.111:6000',
  'http://173.212.207.32:6000',
  'http://62.171.135.107:6000',
  'http://173.249.3.118:6000',
  'http://144.126.137.111:6000',
];

// Fetch response time from geo/history endpoint
async function fetchResponseTimeFromHistory(ip: string): Promise<{ responseTime: number | null; status: string; error?: string }> {
  const primaryUrl = getGeoHistoryUrl();
  
  const urls = [
    `${primaryUrl}/geo/history?ip=${encodeURIComponent(ip)}`,
    ...PUBLIC_NODE_ENDPOINTS
      .filter(url => url !== primaryUrl)
      .slice(0, 2)
      .map(url => `${url}/geo/history?ip=${encodeURIComponent(ip)}`)
  ];

  for (const fetchUrl of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(fetchUrl, {
        method: 'GET',
        cache: 'no-store',
        headers: { 
          'User-Agent': 'XanDash/1.0',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeout);

      if (!response.ok) {
        continue;
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

      if (responseTime !== null) {
        return { responseTime, status };
      }
    } catch (error: any) {
      // Silently handle geo/history fetch errors
    }
  }

  return { responseTime: null, status: 'unknown', error: 'No ping data available' };
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
