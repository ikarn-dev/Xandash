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
 * Batch fetch using ip-api.com batch endpoint
 * This is the most reliable for server-side as it handles up to 100 IPs at once
 * HTTP is allowed from server-side in Next.js
 */
async function batchFetchGeo(ips: string[]): Promise<Map<string, LocationData | null>> {
  const results = new Map<string, LocationData | null>();
  
  if (ips.length === 0) return results;
  
  try {
    // ip-api.com batch endpoint - POST with array of IPs
    // Max 100 IPs per request, 45 requests per minute
    const response = await fetch('http://ip-api.com/batch?fields=status,query,country,countryCode,regionName,city,lat,lon,isp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ips.slice(0, 100)),
      signal: AbortSignal.timeout(15000),
    });
    
    if (!response.ok) {
      console.error(`ip-api.com batch failed: ${response.status}`);
      return results;
    }
    
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
  } catch (error) {
    console.error('Batch geolocation error:', error);
  }
  
  return results;
}

/**
 * Single IP fetch fallback using multiple services
 */
async function fetchGeoForIP(ip: string): Promise<LocationData | null> {
  // Try ip-api.com single endpoint first (most reliable)
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,isp`, {
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        return {
          country: data.country || 'Unknown',
          country_code: (data.countryCode || '').toLowerCase(),
          city: data.city || 'Unknown',
          region: data.regionName || '',
          provider: data.isp || 'Unknown Provider',
          ip: ip,
          lat: data.lat,
          lon: data.lon,
        };
      }
    }
  } catch (e) {
    console.error(`ip-api.com single failed for ${ip}:`, e);
  }
  
  // Fallback to ipwho.is (HTTPS, no rate limits)
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
  } catch (e) {
    console.error(`ipwho.is failed for ${ip}:`, e);
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
      // Use batch endpoint for efficiency (up to 100 IPs at once)
      const batchResults = await batchFetchGeo(uncachedIPs);
      
      // Process batch results
      for (const ip of uncachedIPs) {
        if (batchResults.has(ip)) {
          const location = batchResults.get(ip);
          results[ip] = location ?? null;
          geoCache.set(ip, location ?? null);
        } else {
          // Batch didn't return this IP, try single fetch as fallback
          const location = await fetchGeoForIP(ip);
          results[ip] = location;
          geoCache.set(ip, location);
        }
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