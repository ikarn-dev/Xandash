import { NextRequest, NextResponse } from 'next/server';
import { batchLocalGeo } from '@/libs/services/ip-geo-local';

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
 * Single IP fetch fallback using ipwho.is (HTTPS, reliable)
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
      // Step 1: Try local database lookup first (fast, no network)
      const localResults = batchLocalGeo(uncachedIPs);
      const stillMissing: string[] = [];
      
      for (const ip of uncachedIPs) {
        const localGeo = localResults.get(ip);
        if (localGeo) {
          const location: LocationData = {
            country: localGeo.country || 'Unknown',
            country_code: localGeo.country_code || '',
            city: localGeo.city || '',
            region: localGeo.region || '',
            provider: localGeo.provider || 'Unknown Provider',
            ip: ip,
            lat: localGeo.lat,
            lon: localGeo.lon,
          };
          results[ip] = location;
          geoCache.set(ip, location);
        } else {
          stillMissing.push(ip);
        }
      }
      
      // Step 2: For IPs not in local DB, try external API
      // Limit concurrent requests to avoid rate limiting
      const fetchPromises = stillMissing.slice(0, 10).map(async (ip) => {
        const location = await fetchGeoForIP(ip);
        results[ip] = location;
        geoCache.set(ip, location);
      });
      
      await Promise.allSettled(fetchPromises);
      
      // Mark remaining IPs as null (not found)
      for (const ip of stillMissing.slice(10)) {
        if (!results[ip]) {
          results[ip] = null;
          geoCache.set(ip, null);
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