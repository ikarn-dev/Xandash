import { NextRequest, NextResponse } from 'next/server';
import { cache } from '@/libs/cache/LocalCache';

interface LocationData {
  country: string;
  country_code: string;
  city: string;
  region: string;
  provider: string;
  ip: string;
  lat?: number;
  lon?: number;
}

interface NodeHistoryEntry {
  timestamp: number;
  response_time: number;
  uptime: number;
  storage_committed: number;
  storage_used: number;
  storage_usage_percent: number;
}

interface NodeMeta {
  name: string;
  pubkey: string;
}

// Get the RPC URL from environment
const getRpcUrl = () => {
  // Prioritize RPC_BASE_URL for geo endpoints (without /rpc suffix)
  if (process.env.RPC_BASE_URL) {
    return process.env.RPC_BASE_URL;
  }
  const rpcEndpoint = process.env.RPC_ENDPOINT_PRIMARY || process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc1.pchednode.com/rpc';
  // Remove /rpc suffix if present to get base URL for geo endpoints
  return rpcEndpoint.replace(/\/rpc$/, '');
};

// Fallback RPC URL - disabled as it's unreliable
const getFallbackRpcUrl = () => {
  return null; // Fallback disabled
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');
    const quick = searchParams.get('quick') === 'true';

    if (!ip) {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
    }

    // Fetch data in parallel
    const fetchPromises: Promise<any>[] = [
      fetchLocationData(ip).catch(() => null),
      fetchNodeHistory(ip).catch(() => ({ history: [], meta: null })),
      fetchCurrentNodeData(ip).catch(() => null),
    ];
    
    if (!quick) {
      fetchPromises.push(fetchCreditsData().catch(() => null));
    }

    const results = await Promise.all(fetchPromises);
    const locationData = results[0];
    const historyResult = results[1];
    const currentNodeData = results[2];
    const creditsData = quick ? null : results[3];

    // Derive status and response time from current node data or history
    let derivedStatus = 'unknown';
    let latestResponseTime = 0;
    
    if (currentNodeData) {
      derivedStatus = currentNodeData.status || 'unknown';
    }
    
    if (historyResult.history.length > 0) {
      const latestEntry = historyResult.history[0];
      latestResponseTime = latestEntry.response_time;
      if (latestEntry.response_time > 0) {
        derivedStatus = 'online';
      }
    }

    // Find credits
    let nodeCredits = 0;
    const nodePubkey = currentNodeData?.pubkey || historyResult.meta?.pubkey;
    if (nodePubkey && creditsData) {
      const creditEntry = creditsData.find((c: any) => c.pod_id === nodePubkey);
      if (creditEntry) {
        nodeCredits = creditEntry.credits;
      }
    }

    // Build the response - always use derived status from history as it's more accurate
    const response = {
      ip,
      location: locationData,
      currentNode: currentNodeData ? {
        ...currentNodeData,
        response_time: latestResponseTime,
        credits: nodeCredits,
        status: (currentNodeData.status === 'unknown' || currentNodeData.status === undefined) 
          ? derivedStatus 
          : (derivedStatus === 'online' ? 'online' : currentNodeData.status),
      } : {
        status: derivedStatus,
        response_time: latestResponseTime,
        credits: nodeCredits,
        uptime: historyResult.history[0]?.uptime || 0,
        storage_committed: historyResult.history[0]?.storage_committed || 0,
        storage_used: historyResult.history[0]?.storage_used || 0,
        storage_usage_percent: historyResult.history[0]?.storage_usage_percent || 0,
      },
      history: historyResult.history,
      meta: historyResult.meta,
    };

    const duration = Date.now() - startTime;

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Node profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch node profile' },
      { status: 500 }
    );
  }
}

async function fetchLocationData(ip: string): Promise<LocationData | null> {
  try {
    // Check cache first
    const cacheKey = `location:${ip}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached as LocationData;

    const apiUrl = process.env.NEXT_PUBLIC_IP_API_COM_URL || 'http://ip-api.com';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(
      `${apiUrl}/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,isp,org`,
      { 
        signal: controller.signal,
        next: { revalidate: 3600 } 
      }
    );
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status === 'fail') {
      return null;
    }

    const locationData: LocationData = {
      country: data.country || 'Unknown',
      country_code: data.countryCode?.toLowerCase() || '',
      city: data.city || 'Unknown',
      region: data.regionName || data.region || '',
      provider: data.isp || data.org || 'Unknown Provider',
      ip: ip,
      lat: data.lat,
      lon: data.lon,
    };

    // Cache for 1 hour
    await cache.set(cacheKey, locationData, 3600);
    return locationData;
  } catch (error) {
    return null;
  }
}

async function fetchNodeHistory(ip: string): Promise<{ history: NodeHistoryEntry[], meta: NodeMeta | null }> {
  const fallbackUrl = getFallbackRpcUrl();
  const urls = [
    `${getRpcUrl()}/geo/history?ip=${encodeURIComponent(ip)}`,
    ...(fallbackUrl ? [`${fallbackUrl}/geo/history?ip=${encodeURIComponent(ip)}`] : [])
  ];

  for (const historyUrl of urls) {
    try {
      const response = await fetch(historyUrl, {
        cache: 'no-store',
        headers: {
          'User-Agent': 'XanDash/1.0',
        },
      });

      if (!response.ok) {
        continue; // Try next URL
      }

      const data = await response.json();
      
      const history: NodeHistoryEntry[] = [];
      let meta: NodeMeta | null = null;
      
      // Extract meta if present
      if (data && typeof data === 'object' && data.meta) {
        meta = {
          name: data.meta.name || '',
          pubkey: data.meta.pubkey || '',
        };
      }
      
      // Find the CSV data - check multiple possible keys
      let csvData = '';
      
      if (typeof data === 'string') {
        csvData = data;
      } else if (data && typeof data === 'object') {
        // Try common keys first - including csv_data which is the actual key used by the API
        const possibleKeys = ['csv_data', 'data', 'history', 'csv', 'result'];
        for (const key of possibleKeys) {
          if (data[key] && typeof data[key] === 'string' && data[key].includes(',')) {
            csvData = data[key];
            break;
          }
        }
        
        // If not found, search all keys
        if (!csvData) {
          for (const key of Object.keys(data)) {
            if (key !== 'meta' && typeof data[key] === 'string' && data[key].includes(',')) {
              csvData = data[key];
              break;
            }
          }
        }
        
        // Also check if data itself is an array of history entries
        if (!csvData && Array.isArray(data)) {
          for (const entry of data) {
            if (entry && typeof entry === 'object' && entry.timestamp) {
              history.push({
                timestamp: entry.timestamp || 0,
                response_time: entry.response_time || entry.responseTime || 0,
                uptime: entry.uptime || 0,
                storage_committed: entry.storage_committed || entry.storageCommitted || 0,
                storage_used: entry.storage_used || entry.storageUsed || 0,
                storage_usage_percent: entry.storage_usage_percent || entry.storageUsagePercent || 0,
              });
            }
          }
        }
      }
      
      // Parse CSV data if found
      if (csvData) {
        const lines = csvData.split('\n').filter((line: string) => line.trim());
        
        for (const line of lines) {
          const parts = line.split(',');
          if (parts.length >= 2) {
            const timestamp = parseInt(parts[0], 10);
            if (!isNaN(timestamp) && timestamp > 0) {
              history.push({
                timestamp,
                response_time: parseFloat(parts[1]) || 0,
                uptime: parts.length > 2 ? parseInt(parts[2], 10) || 0 : 0,
                storage_committed: parts.length > 4 ? parseInt(parts[4], 10) || 0 : 0,
                storage_used: parts.length > 5 ? parseInt(parts[5], 10) || 0 : 0,
                storage_usage_percent: parts.length > 6 ? parseFloat(parts[6]) || 0 : 0,
              });
            }
          }
        }
      }
      
      if (history.length > 0) {
        return { 
          history: history.slice(-100).reverse(), 
          meta 
        };
      }
    } catch (error) {
      console.error(`Failed to fetch node history for ${ip} from ${historyUrl}:`, error);
      // Continue to next URL
    }
  }

  // All URLs failed
  return { history: [], meta: null };
}

async function fetchCurrentNodeData(ip: string): Promise<any | null> {
  try {
    // Fetch directly from RPC instead of internal API to avoid Vercel issues
    const rpcEndpoint = process.env.RPC_ENDPOINT_PRIMARY || 'https://rpc1.pchednode.com/rpc';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(rpcEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'XanDash/1.0',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'get-pods-with-stats',
        params: {},
        id: Date.now(),
      }),
      signal: controller.signal,
      cache: 'no-store',
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`RPC call failed: ${response.status}`);
      return null;
    }

    const rpcResult = await response.json();
    
    if (rpcResult.error || !rpcResult.result) {
      return null;
    }
    
    const nodes = rpcResult.result?.pods || [];

    // Find node matching the IP
    const matchingNode = nodes.find((node: any) => {
      const nodeIP = node.address?.split(':')[0];
      return nodeIP === ip;
    });

    if (matchingNode) {
      // Derive status from last_seen_timestamp if not provided
      const now = Math.floor(Date.now() / 1000);
      const timeDiff = now - (matchingNode.last_seen_timestamp || 0);
      let nodeStatus = matchingNode.status;
      
      // If status is not set or is 'unknown', derive from last_seen_timestamp
      if (!nodeStatus || nodeStatus === 'unknown') {
        if (timeDiff < 300) nodeStatus = 'online'; // Less than 5 minutes
        else if (timeDiff < 3600) nodeStatus = 'syncing'; // Less than 1 hour
        else nodeStatus = 'offline';
      }
      
      return {
        pubkey: matchingNode.pubkey || '',
        address: matchingNode.address || '',
        status: nodeStatus,
        uptime: matchingNode.uptime || 0,
        storage_committed: matchingNode.storage_committed || 0,
        storage_used: matchingNode.storage_used || 0,
        storage_usage_percent: matchingNode.storage_usage_percent || 0,
        version: matchingNode.version || '',
        rpc_port: matchingNode.rpc_port || 0,
        is_public: matchingNode.is_public || false,
        last_seen_timestamp: matchingNode.last_seen_timestamp || 0,
        // Additional fields that might be available
        cpu_usage: matchingNode.cpu_usage || 0,
        ram_usage: matchingNode.ram_usage || 0,
        packets_rx: matchingNode.packets_rx || 0,
        packets_tx: matchingNode.packets_tx || 0,
        active_streams: matchingNode.active_streams || 0,
        credits: matchingNode.credits || 0,
        registered: matchingNode.registered || false,
        joined_at: matchingNode.joined_at || matchingNode.created_at || 0,
      };
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch current node data for ${ip}:`, error);
    return null;
  }
}

async function fetchCreditsData(): Promise<any[] | null> {
  try {
    // Check cache first
    const cacheKey = 'pod-credits:all';
    const cached = await cache.get(cacheKey);
    if (cached) return cached as any[];

    // Fetch directly from external API instead of internal route (fixes Vercel serverless issues)
    const externalUrl = process.env.NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL || 'https://podcredits.xandeum.network/api/pods-credits';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(externalUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'XanDash/1.0',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Credits fetch failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const credits = data.pods_credits || [];
    
    // Cache for 2 minutes
    await cache.set(cacheKey, credits, 120);
    return credits;
  } catch (error) {
    console.error('Failed to fetch credits:', error);
    return null;
  }
}
