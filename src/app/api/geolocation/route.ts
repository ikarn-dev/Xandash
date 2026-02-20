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

// In-memory cache for geolocation data with TTL tracking
const geoCache = new Map<string, { data: LocationData | null; timestamp: number }>();

// Cache TTL: successful lookups last 24 hours
const CACHE_TTL = 24 * 60 * 60 * 1000;
// Failed lookups: retry after 5 minutes (not permanent)
const FAILED_CACHE_TTL = 5 * 60 * 1000;

// Rate limiting: ip-api.com free tier allows 45 req/min
// Each batch counts as 1 request. Track last request time.
let lastBatchRequestTime = 0;
const MIN_BATCH_INTERVAL_MS = 1500; // 1.5s between batch calls = ~40 req/min max

/**
 * Check if an IP address is a private/internal IP (RFC 1918, loopback, etc.)
 */
function isPrivateIP(ip: string): boolean {
  if (!ip) return true;

  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return true;

  const [a, b, c] = parts;

  if (a === 127) return true; // Loopback
  if (a === 10) return true; // Private Class A
  if (a === 172 && b >= 16 && b <= 31) return true; // Private Class B
  if (a === 192 && b === 168) return true; // Private Class C
  if (a === 169 && b === 254) return true; // Link-local
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 192 && b === 0 && c === 2) return true;
  if (a === 198 && b === 51 && c === 100) return true;
  if (a === 203 && b === 0 && c === 113) return true;
  if (a === 0 || a === 255) return true; // Broadcast/invalid

  return false;
}

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
 * Throttled batch fetch using ip-api.com (max 100 IPs per call)
 * Enforces minimum interval between requests to stay under rate limit
 */
async function batchFetchGeo(ips: string[]): Promise<Map<string, LocationData | null>> {
  const results = new Map<string, LocationData | null>();
  if (ips.length === 0) return results;

  // Enforce minimum interval between batch requests
  const now = Date.now();
  const timeSinceLastRequest = now - lastBatchRequestTime;
  if (timeSinceLastRequest < MIN_BATCH_INTERVAL_MS) {
    await new Promise(resolve => setTimeout(resolve, MIN_BATCH_INTERVAL_MS - timeSinceLastRequest));
  }

  try {
    lastBatchRequestTime = Date.now();
    const response = await fetch('http://ip-api.com/batch?fields=status,query,country,countryCode,regionName,city,lat,lon,isp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ips.slice(0, 100)), // ip-api.com batch limit is 100
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
    } else if (response.status === 429) {
      console.warn('[Geolocation] ip-api.com rate limited — backing off');
      // Increase interval dynamically
      lastBatchRequestTime = Date.now() + 30000; // Extra 30s cooldown
    }
  } catch {
    // Silent fail
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
    const now = Date.now();

    // Check cache first and handle private IPs
    for (const ip of ips) {
      const cached = geoCache.get(ip);
      if (cached) {
        // Check if cache is still valid
        const isSuccess = cached.data !== null;
        const ttl = isSuccess ? CACHE_TTL : FAILED_CACHE_TTL;
        if (now - cached.timestamp < ttl) {
          results[ip] = cached.data;
          continue;
        }
        // Expired — re-fetch (but still return stale data in response if fetch fails)
      }

      if (isPrivateIP(ip)) {
        const privateLocation = createPrivateIPLocation(ip);
        results[ip] = privateLocation;
        geoCache.set(ip, { data: privateLocation, timestamp: now });
      } else {
        uncachedPublicIPs.push(ip);
      }
    }

    if (uncachedPublicIPs.length > 0) {
      // CHUNK large batches: ip-api.com handles max 100 per request
      const CHUNK_SIZE = 100;
      const chunks: string[][] = [];
      for (let i = 0; i < uncachedPublicIPs.length; i += CHUNK_SIZE) {
        chunks.push(uncachedPublicIPs.slice(i, i + CHUNK_SIZE));
      }

      const stillMissing: string[] = [];

      // Process chunks sequentially with throttling
      for (const chunk of chunks) {
        const batchResults = await batchFetchGeo(chunk);

        for (const ip of chunk) {
          if (batchResults.has(ip)) {
            const location = batchResults.get(ip) ?? null;
            results[ip] = location;
            geoCache.set(ip, { data: location, timestamp: now });
          } else {
            stillMissing.push(ip);
          }
        }
      }

      // Fallback: for IPs not returned by batch, try individual lookup
      // Limit concurrent fallback requests to avoid overwhelming ipwho.is
      if (stillMissing.length > 0) {
        const FALLBACK_CONCURRENCY = 5;
        for (let i = 0; i < stillMissing.length; i += FALLBACK_CONCURRENCY) {
          const batch = stillMissing.slice(i, i + FALLBACK_CONCURRENCY);
          const fetchPromises = batch.map(async (ip) => {
            const location = await fetchGeoForIP(ip);
            results[ip] = location;
            geoCache.set(ip, { data: location, timestamp: now });
          });
          await Promise.allSettled(fetchPromises);
          // Small delay between fallback batches
          if (i + FALLBACK_CONCURRENCY < stillMissing.length) {
            await new Promise(r => setTimeout(r, 200));
          }
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