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
 * Check if an IP address is a private/internal IP (RFC 1918, loopback, etc.)
 * These IPs cannot be geolocated by external services
 */
function isPrivateIP(ip: string): boolean {
  if (!ip) return true;

  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  const [a, b, c] = parts;

  // Loopback (127.x.x.x)
  if (a === 127) return true;

  // Private Class A (10.x.x.x)
  if (a === 10) return true;

  // Private Class B (172.16.x.x - 172.31.x.x)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // Private Class C (192.168.x.x)
  if (a === 192 && b === 168) return true;

  // Link-local (169.254.x.x)
  if (a === 169 && b === 254) return true;

  // CGNAT / Shared Address Space (100.64.x.x - 100.127.x.x)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // Reserved for documentation
  if (a === 192 && b === 0 && c === 2) return true;
  if (a === 198 && b === 51 && c === 100) return true;
  if (a === 203 && b === 0 && c === 113) return true;

  // Broadcast / invalid
  if (a === 0 || a === 255) return true;

  return false;
}

/**
 * Create a placeholder location entry for private IPs
 */
function createPrivateIPLocation(ip: string): LocationData {
  return {
    country: 'Private Network',
    country_code: 'xx',
    city: 'Local',
    region: '',
    provider: 'Private/Internal Network',
    ip: ip,
    lat: 0,
    lon: 0,
  };
}

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
    const uncachedPublicIPs: string[] = [];

    // Check cache first and handle private IPs
    for (const ip of ips) {
      if (geoCache.has(ip)) {
        results[ip] = geoCache.get(ip)!;
      } else if (isPrivateIP(ip)) {
        // Handle private IPs immediately - they can't be geolocated
        const privateLocation = createPrivateIPLocation(ip);
        results[ip] = privateLocation;
        geoCache.set(ip, privateLocation);
      } else {
        uncachedPublicIPs.push(ip);
      }
    }

    if (uncachedPublicIPs.length > 0) {
      // Step 1: Try batch API first (most efficient)
      const batchResults = await batchFetchGeo(uncachedPublicIPs);
      const stillMissing: string[] = [];

      for (const ip of uncachedPublicIPs) {
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