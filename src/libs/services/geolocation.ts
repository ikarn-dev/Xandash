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

  // Use ip-api.com - most reliable for server-side
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,isp`, {
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      const data = await response.json();

      if (data.status === 'success') {
        const locationData: LocationData = {
          country: data.country || 'Unknown',
          country_code: (data.countryCode || '').toLowerCase(),
          city: data.city || 'Unknown',
          region: data.regionName || '',
          provider: data.isp || 'Unknown Provider',
          ip: ip,
          lat: data.lat,
          lon: data.lon
        };

        geoCache[ip] = locationData;
        return locationData;
      }
    }
  } catch (_error) {
    // Continue to fallback
  }

  // Fallback to ipwho.is - HTTPS, no strict rate limits
  try {
    const response = await fetch(`https://ipwho.is/${ip}`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      geoCache[ip] = null;
      return null;
    }

    const data = await response.json();

    if (!data.success) {
      geoCache[ip] = null;
      return null;
    }

    const locationData: LocationData = {
      country: data.country || 'Unknown',
      country_code: data.country_code?.toLowerCase() || '',
      city: data.city || 'Unknown',
      region: data.region || '',
      provider: data.connection?.isp || data.connection?.org || 'Unknown Provider',
      ip: ip,
      lat: data.latitude,
      lon: data.longitude
    };

    geoCache[ip] = locationData;
    return locationData;
  } catch (_error) {
    geoCache[ip] = null;
    return null;
  }
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
  } catch (_error) {

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

  // Filter out empty strings and "Unknown" values
  const parts = [location.city, location.region, location.country]
    .filter(part => part && part !== 'Unknown');

  if (parts.length === 0) return 'Unknown Location';
  return parts.join(', ');
}

export function getCountryFlagUrl(countryCode: string): string {
  if (!countryCode) return '';
  // Hardcoded flag CDN URL - no sensitive data
  return `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`;
}
