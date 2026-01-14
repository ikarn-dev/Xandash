/**
 * Local IP Geolocation Service
 * Uses embedded IP range data for fast, reliable server-side geolocation
 * No external API calls needed - works offline and avoids rate limits
 */

export interface GeoResult {
  country: string;
  country_code: string;
  city: string;
  region: string;
  provider: string;
  ip: string;
  lat?: number;
  lon?: number;
}

// IP range entry: [startIP (as number), endIP (as number), countryCode, countryName, lat, lon]
type IPRange = [number, number, string, string, number, number];

// Country coordinates for approximate location (capital cities)
const COUNTRY_COORDS: Record<string, { lat: number; lon: number; name: string }> = {
  'US': { lat: 38.8951, lon: -77.0364, name: 'United States' },
  'DE': { lat: 52.5200, lon: 13.4050, name: 'Germany' },
  'FR': { lat: 48.8566, lon: 2.3522, name: 'France' },
  'GB': { lat: 51.5074, lon: -0.1278, name: 'United Kingdom' },
  'NL': { lat: 52.3676, lon: 4.9041, name: 'Netherlands' },
  'CA': { lat: 45.4215, lon: -75.6972, name: 'Canada' },
  'AU': { lat: -35.2809, lon: 149.1300, name: 'Australia' },
  'JP': { lat: 35.6762, lon: 139.6503, name: 'Japan' },
  'SG': { lat: 1.3521, lon: 103.8198, name: 'Singapore' },
  'IN': { lat: 28.6139, lon: 77.2090, name: 'India' },
  'FI': { lat: 60.1699, lon: 24.9384, name: 'Finland' },
  'SE': { lat: 59.3293, lon: 18.0686, name: 'Sweden' },
  'PL': { lat: 52.2297, lon: 21.0122, name: 'Poland' },
  'BR': { lat: -15.7975, lon: -47.8919, name: 'Brazil' },
  'KR': { lat: 37.5665, lon: 126.9780, name: 'South Korea' },
  'RU': { lat: 55.7558, lon: 37.6173, name: 'Russia' },
  'CN': { lat: 39.9042, lon: 116.4074, name: 'China' },
  'IT': { lat: 41.9028, lon: 12.4964, name: 'Italy' },
  'ES': { lat: 40.4168, lon: -3.7038, name: 'Spain' },
  'CH': { lat: 46.9480, lon: 7.4474, name: 'Switzerland' },
};


// Common IP ranges for major cloud providers and regions
// Format: [startIPNum, endIPNum, countryCode, countryName, lat, lon]
// This is a subset - external API fallback handles unknown ranges
const IP_RANGES: IPRange[] = ([
  // AWS US regions (multiple ranges)
  [50331648, 50397183, 'US', 'United States', 37.7749, -122.4194],
  [52428800, 52494335, 'US', 'United States', 39.0438, -77.4874],
  [872415232, 889192447, 'US', 'United States', 37.7749, -122.4194], // 52.0.0.0/8
  [218103808, 218169343, 'US', 'United States', 39.0438, -77.4874], // 13.x.x.x
  // AWS EU regions  
  [52559872, 52625407, 'DE', 'Germany', 50.1109, 8.6821],
  [52625408, 52690943, 'IE', 'Ireland', 53.3498, -6.2603],
  [52690944, 52756479, 'GB', 'United Kingdom', 51.5074, -0.1278],
  // AWS Asia Pacific
  [52756480, 52822015, 'JP', 'Japan', 35.6762, 139.6503],
  [52822016, 52887551, 'SG', 'Singapore', 1.3521, 103.8198],
  [52887552, 52953087, 'AU', 'Australia', -33.8688, 151.2093],
  [52953088, 53018623, 'KR', 'South Korea', 37.5665, 126.9780],
  [53018624, 53084159, 'IN', 'India', 19.0760, 72.8777],
  // Google Cloud (35.x.x.x ranges)
  [578813952, 578879487, 'US', 'United States', 37.4220, -122.0841],
  [587202560, 587268095, 'US', 'United States', 37.4220, -122.0841],
  [587268096, 587333631, 'NL', 'Netherlands', 52.3676, 4.9041],
  [587333632, 587399167, 'BE', 'Belgium', 50.8503, 4.3517],
  [587399168, 587464703, 'TW', 'Taiwan', 25.0330, 121.5654],
  // Azure (multiple ranges)
  [168427520, 168493055, 'US', 'United States', 47.6062, -122.3321],
  [335544320, 352321535, 'US', 'United States', 37.3861, -122.0839], // 20.x.x.x
  [671088640, 687865855, 'US', 'United States', 47.6062, -122.3321], // 40.x.x.x
  // DigitalOcean (multiple regions)
  [170393600, 170459135, 'US', 'United States', 40.7128, -74.0060],
  [170459136, 170524671, 'NL', 'Netherlands', 52.3676, 4.9041],
  [170524672, 170590207, 'SG', 'Singapore', 1.3521, 103.8198],
  [170590208, 170655743, 'GB', 'United Kingdom', 51.5074, -0.1278],
  [170655744, 170721279, 'DE', 'Germany', 50.1109, 8.6821],
  [170721280, 170786815, 'CA', 'Canada', 43.6532, -79.3832],
  [170786816, 170852351, 'IN', 'India', 12.9716, 77.5946],
  // Hetzner (Germany/Finland)
  [1540358144, 1540423679, 'DE', 'Germany', 49.4521, 11.0767],
  [1559494656, 1559560191, 'FI', 'Finland', 60.1699, 24.9384],
  [1559560192, 1559625727, 'DE', 'Germany', 50.1109, 8.6821],
  [2499805184, 2499870719, 'DE', 'Germany', 49.4521, 11.0767], // 148.251.x.x
  [2516582400, 2516647935, 'DE', 'Germany', 49.4521, 11.0767], // 150.x.x.x
  // OVH (France/Germany/Canada)
  [1396703232, 1396768767, 'FR', 'France', 50.6292, 3.0573],
  [1396768768, 1396834303, 'DE', 'Germany', 50.1109, 8.6821],
  [1396834304, 1396899839, 'CA', 'Canada', 45.5017, -73.5673],
  [2315255808, 2315321343, 'FR', 'France', 48.8566, 2.3522], // 138.x.x.x
  // Vultr (multiple regions)
  [140509184, 140574719, 'US', 'United States', 40.7128, -74.0060],
  [149946368, 150011903, 'NL', 'Netherlands', 52.3676, 4.9041],
  [150011904, 150077439, 'JP', 'Japan', 35.6762, 139.6503],
  [150077440, 150142975, 'SG', 'Singapore', 1.3521, 103.8198],
  [150142976, 150208511, 'AU', 'Australia', -33.8688, 151.2093],
  // Linode (multiple regions)
  [1208483840, 1208549375, 'US', 'United States', 33.4484, -112.0740],
  [1208549376, 1208614911, 'DE', 'Germany', 50.1109, 8.6821],
  [1208614912, 1208680447, 'GB', 'United Kingdom', 51.5074, -0.1278],
  [1208680448, 1208745983, 'JP', 'Japan', 35.6762, 139.6503],
  [1208745984, 1208811519, 'SG', 'Singapore', 1.3521, 103.8198],
  // Contabo (Germany)
  [2952790016, 2952855551, 'DE', 'Germany', 49.4521, 11.0767], // 176.x.x.x
  [2969567232, 2969632767, 'DE', 'Germany', 50.1109, 8.6821],
  // Scaleway (France/Netherlands)
  [3254779904, 3254845439, 'FR', 'France', 48.8566, 2.3522], // 194.x.x.x
  [3254845440, 3254910975, 'NL', 'Netherlands', 52.3676, 4.9041],
  // Oracle Cloud
  [2315386880, 2315452415, 'US', 'United States', 33.4484, -112.0740],
  [2315452416, 2315517951, 'DE', 'Germany', 50.1109, 8.6821],
  // Alibaba Cloud
  [770703360, 770768895, 'CN', 'China', 31.2304, 121.4737],
  [770768896, 770834431, 'SG', 'Singapore', 1.3521, 103.8198],
  // Common residential/ISP ranges (major providers)
  [3232235520, 3232301055, 'US', 'United States', 37.7749, -122.4194], // 192.168.x.x private
  [167772160, 184549375, 'US', 'United States', 37.0902, -95.7129], // 10.x.x.x private
] as IPRange[]).sort((a, b) => a[0] - b[0]);

/**
 * Convert IP string to 32-bit number
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return 0;
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}


/**
 * Binary search for IP in ranges
 */
function findIPRange(ipNum: number): IPRange | null {
  let left = 0;
  let right = IP_RANGES.length - 1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const range = IP_RANGES[mid];
    
    if (ipNum >= range[0] && ipNum <= range[1]) {
      return range;
    } else if (ipNum < range[0]) {
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }
  
  return null;
}

/**
 * Get geolocation from local database
 * Returns null if IP not found in local ranges
 */
export function getLocalGeo(ip: string): GeoResult | null {
  const ipNum = ipToNumber(ip);
  if (ipNum === 0) return null;
  
  const range = findIPRange(ipNum);
  if (!range) return null;
  
  const [, , countryCode, countryName, lat, lon] = range;
  
  return {
    country: countryName,
    country_code: countryCode.toLowerCase(),
    city: '',
    region: '',
    provider: 'Unknown Provider',
    ip,
    lat,
    lon,
  };
}

/**
 * Get geolocation with country code fallback
 * If we know the country code but not the exact location
 */
export function getGeoFromCountryCode(ip: string, countryCode: string): GeoResult | null {
  const code = countryCode.toUpperCase();
  const coords = COUNTRY_COORDS[code];
  
  if (!coords) return null;
  
  return {
    country: coords.name,
    country_code: code.toLowerCase(),
    city: '',
    region: '',
    provider: 'Unknown Provider',
    ip,
    lat: coords.lat,
    lon: coords.lon,
  };
}

/**
 * Batch lookup for multiple IPs
 */
export function batchLocalGeo(ips: string[]): Map<string, GeoResult | null> {
  const results = new Map<string, GeoResult | null>();
  
  for (const ip of ips) {
    results.set(ip, getLocalGeo(ip));
  }
  
  return results;
}

