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

export async function getLocationForIP(ip: string): Promise<LocationData | null> {
  // Check cache first
  if (geoCache[ip] !== undefined) {
    return geoCache[ip];
  }

  // Handle private IPs - they can't be geolocated
  if (isPrivateIP(ip)) {
    const privateLocation = createPrivateIPLocation(ip);
    geoCache[ip] = privateLocation;
    return privateLocation;
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
