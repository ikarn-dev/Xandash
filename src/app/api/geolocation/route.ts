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

// Check if we're in production/Vercel environment
const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

async function fetchGeoWithHttps(ip: string): Promise<LocationData | null> {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.error) return null;
    
    return {
      country: data.country_name || 'Unknown',
      country_code: data.country_code?.toLowerCase() || '',
      city: data.city || 'Unknown',
      region: data.region || '',
      provider: data.org || 'Unknown Provider',
      ip: ip,
      lat: data.latitude,
      lon: data.longitude,
    };
  } catch {
    return null;
  }
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
      if (isProduction) {
        // In production, use HTTPS with ipapi.co (individual requests)
        const batchSize = 30; // Limit concurrent requests
        
        for (let i = 0; i < uncachedIPs.length; i += batchSize) {
          const batch = uncachedIPs.slice(i, i + batchSize);
          
          const batchResults = await Promise.allSettled(
            batch.map(ip => fetchGeoWithHttps(ip))
          );
          
          batchResults.forEach((result, index) => {
            const ip = batch[index];
            if (result.status === 'fulfilled' && result.value) {
              results[ip] = result.value;
              geoCache.set(ip, result.value);
            } else {
              results[ip] = null;
              geoCache.set(ip, null);
            }
          });
          
          // Small delay between batches
          if (i + batchSize < uncachedIPs.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      } else {
        // In development, use ip-api.com batch endpoint (HTTP)
        const batchSize = 100;
        
        for (let i = 0; i < uncachedIPs.length; i += batchSize) {
          const batch = uncachedIPs.slice(i, i + batchSize);
          
          try {
            const batchUrl = process.env.NEXT_PUBLIC_IP_API_BATCH_URL || 'http://ip-api.com/batch';
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            const response = await fetch(batchUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(batch.map(ip => ({
                query: ip,
                fields: 'status,message,country,countryCode,region,regionName,city,lat,lon,isp,org,query'
              }))),
              signal: controller.signal,
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              const batchResults = await response.json();
              
              batchResults.forEach((result: any, index: number) => {
                const ip = batch[index];
                
                if (result.status === 'success') {
                  const locationData: LocationData = {
                    country: result.country || 'Unknown',
                    country_code: result.countryCode?.toLowerCase() || '',
                    city: result.city || 'Unknown',
                    region: result.regionName || result.region || '',
                    provider: result.isp || result.org || 'Unknown Provider',
                    ip: ip,
                    lat: result.lat,
                    lon: result.lon
                  };
                  
                  results[ip] = locationData;
                  geoCache.set(ip, locationData);
                } else {
                  results[ip] = null;
                  geoCache.set(ip, null);
                }
              });
            } else {
              batch.forEach(ip => {
                results[ip] = null;
                geoCache.set(ip, null);
              });
            }
          } catch (error) {
            batch.forEach(ip => {
              results[ip] = null;
              geoCache.set(ip, null);
            });
          }
          
          if (i + batchSize < uncachedIPs.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
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