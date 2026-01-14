import { NextRequest, NextResponse } from 'next/server';

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

// In-memory cache for geolocation data
const geoCache = new Map<string, LocationData | null>();

/**
 * Batch fetch using ip-api.com batch endpoint (up to 100 IPs)
 * This is the most efficient for multiple IPs
 */
async function batchFetchGeo(ips: string[]): Promise<Map<string, LocationData | null>> {
  const results = new Map<string, LocationData | null>();
  
  if (ips.length === 0) return results;
  
  try {
    // ip-api.com batch endpoint - POST with array of IPs
    const response = await fetch('http://ip-api.com/batch?fields=status,query,country,countryCode,regionName,city,lat,lon,isp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ips.slice(0, 100)),
      signal: AbortSignal.timeout(10000),
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.status === 'success' && item.query) {
            results.set(item.query, {
              country: item.country || 'Unknown',
              country_code: (item.countryCode || '').toLowerCase(),
              city: item.city || 'Unknown',
              region: item.regionName || '',
              provider: item.isp || 'Unknown Provider',
              ip: item.query,
              lat: item.lat,
              lon: item.lon,
            });
          } else if (item.query) {
            results.set(item.query, null);
          }
        }
      }
    }
  } catch {
    // Silent fail - will use single IP fallback
  }
  
  return results;
}

/**
 * Single IP fetch using ipwho.is (HTTPS, reliable fallback)
 */
async function fetchGeoForIP(ip: string): Promise<LocationData | null> {
  try {
    const response = await fetch(`https://ipwho.is/${ip}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return {
          country: data.country || 'Unknown',
          country_code: (data.country_code || '').toLowerCase(),
          city: data.city || 'Unknown',
          region: data.region || '',
          provider: data.connection?.isp || data.connection?.org || 'Unknown Provider',
          ip: ip,
          lat: data.latitude,
          lon: data.longitude,
        };
      }
    }
  } catch {
    // Silent fail
  }
  
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { ips } = await request.json();
    
    if (!Array.isArray(ips) || ips.length === 0) {
      return NextResponse.json({ error: 'Invalid IPs array' }, { status: 400 });
    }

    const results: { [ip: string]: LocationData | null } = {};
    const uncachedIPs: string[] = [];
    
    // Check cache first
    for (const ip of ips) {
      if (geoCache.has(ip)) {
        results[ip] = geoCache.get(ip)!;
      } else {
        uncachedIPs.push(ip);
      }
    }
    
    if (uncachedIPs.length > 0) {
      // Step 1: Try batch API first (most efficient)
      const batchResults = await batchFetchGeo(uncachedIPs);
      const stillMissing: string[] = [];
      
      for (const ip of uncachedIPs) {
        if (batchResults.has(ip)) {
          const location = batchResults.get(ip);
          results[ip] = location ?? null;
          geoCache.set(ip, location ?? null);
        } else {
          stillMissing.push(ip);
        }
      }
      
      // Step 2: For IPs not returned by batch, try individual fallback
      if (stillMissing.length > 0) {
        const fetchPromises = stillMissing.map(async (ip) => {
          const location = await fetchGeoForIP(ip);
          results[ip] = location;
          geoCache.set(ip, location);
        });
        
        await Promise.allSettled(fetchPromises);
      }
    }
    
    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    });
    
  } catch (error) {
    console.error('Geolocation batch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch geolocation data' },
      { status: 500 }
    );
  }
}