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

interface GeolocationCache {
  [ip: string]: LocationData | null;
}

// In-memory cache for geolocation data
const geoCache: GeolocationCache = {};

export async function getLocationForIP(ip: string): Promise<LocationData | null> {
  // Check cache first
  if (geoCache[ip] !== undefined) {
    return geoCache[ip];
  }

  // Try multiple geolocation services
  const services = [
    {
      name: 'ipapi.co',
      url: `${process.env.NEXT_PUBLIC_IPAPI_CO_URL || 'https://ipapi.co'}/${ip}/json/`,
      parser: (data: any) => ({
        country: data.country_name || 'Unknown',
        country_code: data.country_code?.toLowerCase() || '',
        city: data.city || 'Unknown',
        region: data.region || '',
        provider: data.org || 'Unknown Provider',
        ip: ip,
        lat: data.latitude,
        lon: data.longitude
      })
    },
    {
      name: 'ip-api.com',
      url: `${process.env.NEXT_PUBLIC_IP_API_COM_URL || 'http://ip-api.com'}/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,isp,org`,
      parser: (data: any) => ({
        country: data.country || 'Unknown',
        country_code: data.countryCode?.toLowerCase() || '',
        city: data.city || 'Unknown',
        region: data.regionName || '',
        provider: data.isp || 'Unknown Provider',
        ip: ip,
        lat: data.lat,
        lon: data.lon
      })
    }
  ];

  for (const service of services) {
    try {
      const response = await fetch(service.url);
      
      if (!response.ok) {
        continue; // Try next service
      }

      const data = await response.json();
      
      // Handle API errors
      if (data.error || data.status === 'fail') {
        console.warn(`${service.name} API error for ${ip}:`, data.message || data.reason);
        continue; // Try next service
      }

      const locationData = service.parser(data);
      
      // Cache the result
      geoCache[ip] = locationData;
      return locationData;
    } catch (error) {
      console.warn(`Failed to get location from ${service.name} for IP ${ip}:`, error);
      continue; // Try next service
    }
  }

  // If all services failed
  console.error(`All geolocation services failed for IP ${ip}`);
  geoCache[ip] = null;
  return null;
}

export async function getLocationsForIPs(ips: string[]): Promise<{ [ip: string]: LocationData | null }> {
  if (ips.length === 0) {
    return {};
  }
  
  try {
    // Use our batch API endpoint
    const response = await fetch('/api/geolocation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ips }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const results = await response.json();
    
    // Update local cache
    Object.entries(results).forEach(([ip, location]) => {
      geoCache[ip] = location as LocationData | null;
    });
    
    return results;
  } catch (error) {
    console.error('Failed to fetch batch geolocation data:', error);
    
    // Fallback: return empty results for all IPs
    const fallbackResults: { [ip: string]: LocationData | null } = {};
    ips.forEach(ip => {
      fallbackResults[ip] = null;
    });
    return fallbackResults;
  }
}

export function extractIPFromAddress(address: string): string {
  // Remove port number if present (e.g., "192.168.1.1:9001" -> "192.168.1.1")
  return address.split(':')[0];
}

export function formatLocation(location: LocationData | null): string {
  if (!location) return 'Unknown Location';
  
  const parts = [location.city, location.region, location.country].filter(Boolean);
  return parts.join(', ');
}

export function getCountryFlagUrl(countryCode: string): string {
  if (!countryCode) return '';
  const flagCdnUrl = process.env.NEXT_PUBLIC_FLAG_CDN_URL || 'https://flagcdn.com';
  return `${flagCdnUrl}/24x18/${countryCode}.png`;
}
