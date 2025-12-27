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

export async function POST(request: NextRequest) {
  try {
    const { ips } = await request.json();
    
    if (!Array.isArray(ips) || ips.length === 0) {
      return NextResponse.json({ error: 'Invalid IPs array' }, { status: 400 });
    }

    console.log(`🌍 Batch geolocation request for ${ips.length} IPs`);
    
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
    
    console.log(`📦 Found ${Object.keys(results).length} cached, fetching ${uncachedIPs.length} new`);
    
    if (uncachedIPs.length > 0) {
      // Use ip-api.com batch endpoint (supports up to 100 IPs per request)
      const batchSize = 100;
      
      for (let i = 0; i < uncachedIPs.length; i += batchSize) {
        const batch = uncachedIPs.slice(i, i + batchSize);
        
        try {
          // ip-api.com batch endpoint
          const batchUrl = process.env.NEXT_PUBLIC_IP_API_BATCH_URL || 'http://ip-api.com/batch';
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
          
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
                console.warn(`Failed to get location for ${ip}: ${result.message}`);
                results[ip] = null;
                geoCache.set(ip, null);
              }
            });
          } else {
            console.error(`Batch API failed with status ${response.status}`);
            // Fallback: mark all IPs in this batch as failed
            batch.forEach(ip => {
              results[ip] = null;
              geoCache.set(ip, null);
            });
          }
        } catch (error) {
          console.error(`Batch request failed:`, error);
          // Fallback: mark all IPs in this batch as failed
          batch.forEach(ip => {
            results[ip] = null;
            geoCache.set(ip, null);
          });
        }
        
        // Small delay between batches to be respectful
        if (i + batchSize < uncachedIPs.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
    
    console.log(`✅ Geolocation batch complete: ${Object.keys(results).length} results`);
    
    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
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