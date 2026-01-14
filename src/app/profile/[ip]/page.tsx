import { DashboardLayout } from '@/components/layout';
import { NodeProfileClient } from './NodeProfileClient';
import { ToastDismisser } from '@/components/ui/ToastDismisser';
import { getNodeStatsHistory, getNodeEvents, getLatestNodeSnapshot } from '@/libs/db/node-service';
import { ProfileCacheService } from '@/libs/services/profile-cache';
import { getMainnetNodeByIp } from '@/libs/services/mainnet-data-service';
import { getDevnetNodeByIp } from '@/libs/services/devnet-data-service';
import { generateMetadata } from './metadata';

interface PageProps {
  params: Promise<{ ip: string }>;
}

export { generateMetadata };

// Enable SSR with revalidation every 30 seconds
export const revalidate = 30;

// Server-side data fetching function
export async function getProfileData(ip: string) {
  try {
    // Fetch location data
    const locationData = await fetchLocationData(ip);
    
    // Fetch current node data from RPC
    const currentNodeData = await fetchCurrentNodeData(ip);
    
    // Fetch credits data
    const creditsData = await fetchCreditsData();
    
    // Fetch MongoDB data (7 days by default for SSR)
    const [dbHistory, dbEvents, dbSnapshot] = await Promise.all([
      getNodeStatsHistory(ip, 168).catch(() => []), // 7 days = 168 hours
      getNodeEvents(ip, 100).catch(() => []),
      getLatestNodeSnapshot(ip).catch(() => null),
    ]);

    // Calculate credits
    let currentCredits = 0;
    let previousMonthCredits = 0;
    let thisMonthCredits = 0;
    let totalCredits = 0;
    const pubkey = currentNodeData?.pubkey || dbSnapshot?.pubkey;
    
    if (pubkey && creditsData) {
      const entry = creditsData.find((c: any) => c.pod_id === pubkey);
      if (entry) currentCredits = entry.credits;
    }

    // Calculate previous month credits and detect reset
    if (dbHistory.length > 0) {
      const sortedHistory = [...dbHistory].sort((a, b) => a.timestamp - b.timestamp);
      
      // Find the reset point (where credits dropped significantly)
      let resetIndex = -1;
      for (let i = 1; i < sortedHistory.length; i++) {
        const prev = sortedHistory[i - 1].credits || 0;
        const curr = sortedHistory[i].credits || 0;
        if (prev > 1000 && curr < prev * 0.5) {
          resetIndex = i;
          break;
        }
      }
      
      if (resetIndex > 0) {
        const beforeReset = sortedHistory.slice(0, resetIndex);
        previousMonthCredits = Math.max(...beforeReset.map(h => h.credits || 0));
        thisMonthCredits = currentCredits;
        totalCredits = previousMonthCredits + thisMonthCredits;
      } else {
        thisMonthCredits = currentCredits;
        totalCredits = currentCredits;
      }
    } else {
      thisMonthCredits = currentCredits;
      totalCredits = currentCredits;
    }

    // Derive status
    let status = 'unknown';
    if (currentNodeData) {
      const timeDiff = Math.floor(Date.now() / 1000) - (currentNodeData.last_seen_timestamp || 0);
      status = timeDiff < 300 ? 'online' : timeDiff < 3600 ? 'syncing' : 'offline';
    } else if (dbSnapshot) {
      status = dbSnapshot.status;
    }

    // Build response - serialize MongoDB objects to plain objects
    const nodeData = currentNodeData || dbSnapshot;
    
    return {
      ip,
      location: locationData,
      currentNode: nodeData ? {
        pubkey: nodeData.pubkey || '',
        address: nodeData.address || `${ip}:9001`,
        status,
        uptime: nodeData.uptime || 0,
        storage_committed: nodeData.storage_committed || 0,
        storage_used: nodeData.storage_used || 0,
        storage_usage_percent: nodeData.storage_usage_percent || 0,
        version: nodeData.version || '',
        rpc_port: nodeData.rpc_port || 0,
        is_public: nodeData.is_public || false,
        last_seen_timestamp: nodeData.last_seen_timestamp || 0,
        credits: currentCredits,
        thisMonthCredits,
        previousMonthCredits,
        totalCredits,
      } : null,
      // Serialize MongoDB arrays to plain objects
      dbHistory: dbHistory.length > 0 ? dbHistory.map(serializeMongoObject) : undefined,
      dbEvents: dbEvents.length > 0 ? dbEvents.map(serializeMongoObject) : undefined,
    };
  } catch (error) {
    return null;
  }
}

// Helper function to serialize MongoDB objects to plain objects
function serializeMongoObject(obj: any): any {
  if (!obj) return obj;
  
  // Handle primitive types
  if (typeof obj !== 'object') return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(serializeMongoObject);
  }
  
  // Handle Date objects
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  // Handle MongoDB ObjectId and other objects with toString method
  if (obj.toString && typeof obj.toString === 'function' && obj.constructor.name === 'ObjectId') {
    return obj.toString();
  }
  
  // Handle objects with toJSON method
  if (obj.toJSON && typeof obj.toJSON === 'function') {
    return serializeMongoObject(obj.toJSON());
  }
  
  // Handle plain objects
  const serialized: any = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (key === '_id') {
        // Convert ObjectId to string
        serialized[key] = value?.toString() || value;
      } else if (value instanceof Date) {
        // Convert Date objects to ISO strings
        serialized[key] = value.toISOString();
      } else if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'ObjectId') {
        // Handle ObjectId specifically
        serialized[key] = value.toString();
      } else if (value && typeof value === 'object' && value.toJSON) {
        // Handle objects with toJSON methods (like Mongoose documents)
        serialized[key] = serializeMongoObject(value.toJSON());
      } else if (Array.isArray(value)) {
        // Recursively serialize arrays
        serialized[key] = value.map(serializeMongoObject);
      } else if (value && typeof value === 'object' && value.constructor === Object) {
        // Recursively serialize plain objects only
        serialized[key] = serializeMongoObject(value);
      } else {
        // Primitive values and other types
        serialized[key] = value;
      }
    }
  }
  
  return serialized;
}

async function fetchLocationData(ip: string) {
  // Try ip-api.com first (most reliable for server-side)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,isp`, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success') {
        return {
          country: data.country || 'Unknown',
          country_code: (data.countryCode || '').toLowerCase(),
          city: data.city || 'Unknown',
          region: data.regionName || '',
          provider: data.isp || 'Unknown',
          ip,
          lat: data.lat,
          lon: data.lon,
        };
      }
    }
  } catch {
    // Continue to fallback
  }

  // Fallback to ipwho.is
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    
    const res = await fetch(`https://ipwho.is/${ip}`, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success) return null;
    
    return {
      country: data.country || 'Unknown',
      country_code: data.country_code?.toLowerCase() || '',
      city: data.city || 'Unknown',
      region: data.region || '',
      provider: data.connection?.isp || data.connection?.org || 'Unknown',
      ip,
      lat: data.latitude,
      lon: data.longitude,
    };
  } catch {
    return null;
  }
}

async function fetchCurrentNodeData(ip: string) {
  try {
    // Try mainnet first
    const mainnetNode = await getMainnetNodeByIp(ip);
    if (mainnetNode) return mainnetNode;
    
    // Fallback to devnet
    const devnetNode = await getDevnetNodeByIp(ip);
    return devnetNode;
  } catch {
    return null;
  }
}

// Hardcoded credits URL for devnet
const DEVNET_CREDITS_URL = 'https://podcredits.xandeum.network/api/pods-credits';

async function fetchCreditsData() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(DEVNET_CREDITS_URL, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    clearTimeout(timeout);
    
    if (!res.ok) return null;
    const data = await res.json();
    return data.pods_credits || [];
  } catch {
    return null;
  }
}

export default async function ProfilePage({ params }: PageProps) {
  const { ip } = await params;
  const decodedIP = decodeURIComponent(ip);

  // Try to get cached data first
  let initialData = await ProfileCacheService.getCachedProfile(decodedIP);
  
  // If no cached data or data is stale, fetch fresh data
  if (!initialData || Date.now() - initialData.cachedAt > 300000) { // 5 minutes
    const freshData = await getProfileData(decodedIP);
    
    // Cache the fresh data and create cached data object
    if (freshData) {
      await ProfileCacheService.cacheProfile(decodedIP, freshData);
      initialData = {
        ...freshData,
        cachedAt: Date.now()
      };
    } else {
      initialData = null;
    }
  }

  return (
    <DashboardLayout>
      <ToastDismisser toastId="node-profile-loading" />
      <NodeProfileClient ip={decodedIP} initialData={initialData} />
    </DashboardLayout>
  );
}
