'use client';

import { useEffect, useState, useMemo } from 'react';
import { getLocationsForIPs, extractIPFromAddress } from '@/libs/services/geolocation';
import { getNodeStatus, type NodeStatus } from '@/libs/utils/node-status';
import { useNodesData } from '@/libs/context/nodes-data-context';

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

interface RawNodeData {
  pubkey?: string;
  address?: string;
  status?: string;
  uptime?: number;
  storage_committed?: number;
  storage_used?: number;
  version?: string;
  is_public?: boolean;
  last_seen_timestamp?: number;
  // Mainnet external data fields
  country?: string;
  country_code?: string;
  provider?: string;
}

export interface ValidatorLocation {
  id: string;
  lat: number;
  lng: number;
  count: number;
  city?: string;
  country?: string;
}

export interface CountryStats {
  country: string;
  country_code: string;
  count: number;
}

export interface CountryDetailedStats {
  country: string;
  country_code: string;
  totalNodes: number;
  onlineNodes: number;
  syncingNodes: number;
  offlineNodes: number;
  totalStorage: number;
  totalStorageUsed: number;
  avgUptime: number;
}

// Approximate lat/lon for countries (for map display when exact coords not available)
const COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
  'US': { lat: 37.0902, lon: -95.7129 },
  'DE': { lat: 51.1657, lon: 10.4515 },
  'FR': { lat: 46.2276, lon: 2.2137 },
  'GB': { lat: 55.3781, lon: -3.4360 },
  'NL': { lat: 52.1326, lon: 5.2913 },
  'CA': { lat: 56.1304, lon: -106.3468 },
  'AU': { lat: -25.2744, lon: 133.7751 },
  'JP': { lat: 36.2048, lon: 138.2529 },
  'SG': { lat: 1.3521, lon: 103.8198 },
  'IN': { lat: 20.5937, lon: 78.9629 },
  'BR': { lat: -14.2350, lon: -51.9253 },
  'KR': { lat: 35.9078, lon: 127.7669 },
  'RU': { lat: 61.5240, lon: 105.3188 },
  'CN': { lat: 35.8617, lon: 104.1954 },
  'FI': { lat: 61.9241, lon: 25.7482 },
  'SE': { lat: 60.1282, lon: 18.6435 },
  'NO': { lat: 60.4720, lon: 8.4689 },
  'PL': { lat: 51.9194, lon: 19.1451 },
  'ES': { lat: 40.4637, lon: -3.7492 },
  'IT': { lat: 41.8719, lon: 12.5674 },
  'CH': { lat: 46.8182, lon: 8.2275 },
  'AT': { lat: 47.5162, lon: 14.5501 },
  'BE': { lat: 50.5039, lon: 4.4699 },
  'IE': { lat: 53.1424, lon: -7.6921 },
  'PT': { lat: 39.3999, lon: -8.2245 },
  'CZ': { lat: 49.8175, lon: 15.4730 },
  'DK': { lat: 56.2639, lon: 9.5018 },
  'HU': { lat: 47.1625, lon: 19.5033 },
  'RO': { lat: 45.9432, lon: 24.9668 },
  'UA': { lat: 48.3794, lon: 31.1656 },
  'ZA': { lat: -30.5595, lon: 22.9375 },
  'MX': { lat: 23.6345, lon: -102.5528 },
  'AR': { lat: -38.4161, lon: -63.6167 },
  'CL': { lat: -35.6751, lon: -71.5430 },
  'CO': { lat: 4.5709, lon: -74.2973 },
  'TH': { lat: 15.8700, lon: 100.9925 },
  'VN': { lat: 14.0583, lon: 108.2772 },
  'MY': { lat: 4.2105, lon: 101.9758 },
  'ID': { lat: -0.7893, lon: 113.9213 },
  'PH': { lat: 12.8797, lon: 121.7740 },
  'HK': { lat: 22.3193, lon: 114.1694 },
  'TW': { lat: 23.6978, lon: 120.9605 },
  'NZ': { lat: -40.9006, lon: 174.8860 },
  'AE': { lat: 23.4241, lon: 53.8478 },
  'IL': { lat: 31.0461, lon: 34.8516 },
  'TR': { lat: 38.9637, lon: 35.2433 },
  'GR': { lat: 39.0742, lon: 21.8243 },
  'BG': { lat: 42.7339, lon: 25.4858 },
  'HR': { lat: 45.1000, lon: 15.2000 },
  'SK': { lat: 48.6690, lon: 19.6990 },
  'SI': { lat: 46.1512, lon: 14.9955 },
  'LT': { lat: 55.1694, lon: 23.8813 },
  'LV': { lat: 56.8796, lon: 24.6032 },
  'EE': { lat: 58.5953, lon: 25.0136 },
};

export function useNetworkPageData(network: string) {
  // Use shared nodes data context - includes high watermark logic for mainnet
  const { nodes: sharedNodes, geoData: sharedGeoData, isLoading: sharedLoading } = useNodesData();
  
  const [locations, setLocations] = useState<{ [ip: string]: LocationData | null }>({});
  const [error, setError] = useState<string | null>(null);
  const isMainnet = network === 'mainnet';

  // Transform shared nodes to RawNodeData format
  const nodes: RawNodeData[] = useMemo(() => {
    return sharedNodes.map(node => ({
      pubkey: node.pubkey,
      address: node.address,
      status: node.status,
      uptime: node.uptime,
      storage_committed: node.storage_committed,
      storage_used: node.storage_used,
      version: node.version,
      is_public: node.is_public,
      last_seen_timestamp: node.last_seen_timestamp,
      country: node.country,
      country_code: node.country_code,
      provider: node.provider,
    }));
  }, [sharedNodes]);

  // Fetch geolocation for devnet nodes
  useEffect(() => {
    if (isMainnet || nodes.length === 0) return;
    
    const fetchLocations = async () => {
      try {
        const uniqueIPs: string[] = Array.from(new Set(
          nodes.map((node: RawNodeData) => extractIPFromAddress(node.address || '')).filter(Boolean)
        ));
        
        if (uniqueIPs.length > 0) {
          const locationData = await getLocationsForIPs(uniqueIPs);
          setLocations(locationData);
        }
      } catch (err) {
        console.error('Failed to fetch location data:', err);
      }
    };

    fetchLocations();
  }, [nodes, isMainnet]);

  const processedData = useMemo(() => {
    const locationGroups = new Map<string, { lat: number; lng: number; city: string; country: string; count: number }>();
    const countryMap = new Map<string, { country: string; country_code: string; count: number }>();
    const countryDetailedMap = new Map<string, { country: string; country_code: string; nodes: RawNodeData[] }>();
    let validNodes = 0;
    const now = Math.floor(Date.now() / 1000);

    nodes.forEach((node) => {
      const ip = extractIPFromAddress(node.address || '');
      
      // For mainnet, use geo data from node itself (from external sources)
      // For devnet, use fetched location data
      let location: LocationData | null = null;
      
      if (isMainnet && node.country && node.country_code) {
        // Use geo data from external sources
        const countryCode = node.country_code.toUpperCase();
        const coords = COUNTRY_COORDS[countryCode];
        location = {
          country: node.country,
          country_code: node.country_code,
          city: '', // Empty - mainnet geo data doesn't have city
          region: '',
          provider: node.provider || 'Unknown',
          ip,
          lat: coords?.lat,
          lon: coords?.lon,
        };
      } else {
        location = locations[ip];
      }
      
      if (location?.country) {
        validNodes++;
        const countryKey = location.country;
        
        // For map display, use coords if available
        if (location.lat && location.lon) {
          const locationKey = `${location.city || 'Unknown'}-${location.country}`;
          const existing = locationGroups.get(locationKey);
          
          if (existing) existing.count++;
          else locationGroups.set(locationKey, { lat: location.lat, lng: location.lon, city: location.city || 'Unknown', country: location.country, count: 1 });
        } else {
          // Use country center coords for mainnet nodes without exact location
          const countryCode = location.country_code?.toUpperCase();
          const coords = COUNTRY_COORDS[countryCode];
          if (coords) {
            const locationKey = `${location.country}-center`;
            const existing = locationGroups.get(locationKey);
            
            if (existing) existing.count++;
            else locationGroups.set(locationKey, { lat: coords.lat, lng: coords.lon, city: location.country, country: location.country, count: 1 });
          }
        }
        
        const existingCountry = countryMap.get(countryKey);
        if (existingCountry) existingCountry.count++;
        else countryMap.set(countryKey, { country: location.country, country_code: location.country_code, count: 1 });

        const existingDetailed = countryDetailedMap.get(countryKey);
        if (existingDetailed) existingDetailed.nodes.push(node);
        else countryDetailedMap.set(countryKey, { country: location.country, country_code: location.country_code, nodes: [node] });
      }
    });

    const mapValidators: ValidatorLocation[] = Array.from(locationGroups.entries()).map(([, data], index) => ({
      id: `location-${index}`,
      lat: data.lat,
      lng: data.lng,
      count: data.count,
      city: data.city,
      country: data.country
    }));

    const countryStats: CountryStats[] = Array.from(countryMap.values()).sort((a, b) => b.count - a.count);

    const countryDetailedStats: CountryDetailedStats[] = Array.from(countryDetailedMap.values())
      .map(({ country, country_code, nodes: countryNodes }) => {
        let onlineNodes = 0, syncingNodes = 0, offlineNodes = 0;
        
        countryNodes.forEach(n => {
          const status = getNodeStatus(n.last_seen_timestamp || 0, now);
          if (status === 'online') onlineNodes++;
          else if (status === 'syncing') syncingNodes++;
          else offlineNodes++;
        });

        const totalStorage = countryNodes.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
        const totalStorageUsed = countryNodes.reduce((sum, n) => sum + (n.storage_used || 0), 0);
        const totalUptime = countryNodes.reduce((sum, n) => sum + (n.uptime || 0), 0);
        const avgUptime = countryNodes.length > 0 ? totalUptime / countryNodes.length : 0;

        return { country, country_code, totalNodes: countryNodes.length, onlineNodes, syncingNodes, offlineNodes, totalStorage, totalStorageUsed, avgUptime };
      })
      .sort((a, b) => b.totalNodes - a.totalNodes);

    return { mapValidators, countryStats, countryDetailedStats, totalNodes: nodes.length, locatedNodes: validNodes };
  }, [nodes, locations, isMainnet]);

  return { ...processedData, loading: sharedLoading, error };
}
