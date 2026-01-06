'use client';

import { useEffect, useState, useMemo } from 'react';
import { getLocationsForIPs, extractIPFromAddress } from '@/libs/services/geolocation';
import { getNodeStatus, type NodeStatus } from '@/libs/utils/node-status';

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

export function useNetworkPageData(network: string) {
  const [nodes, setNodes] = useState<RawNodeData[]>([]);
  const [locations, setLocations] = useState<{ [ip: string]: LocationData | null }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/nodes?includeAll=true&network=${network}`);
        if (!response.ok) throw new Error(`Failed to fetch nodes: ${response.statusText}`);
        
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        const allNodes = data.nodes || [];
        setNodes(allNodes);
        
        const uniqueIPs: string[] = Array.from(new Set(
          allNodes.map((node: RawNodeData) => extractIPFromAddress(node.address || '')).filter(Boolean)
        ));
        
        if (uniqueIPs.length > 0) {
          const locationData = await getLocationsForIPs(uniqueIPs);
          setLocations(locationData);
        }
      } catch (err) {
        console.error('Failed to fetch node data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [network]);

  const processedData = useMemo(() => {
    const locationGroups = new Map<string, { lat: number; lng: number; city: string; country: string; count: number }>();
    const countryMap = new Map<string, { country: string; country_code: string; count: number }>();
    const countryDetailedMap = new Map<string, { country: string; country_code: string; nodes: RawNodeData[] }>();
    let validNodes = 0;
    const now = Math.floor(Date.now() / 1000);

    nodes.forEach((node) => {
      const ip = extractIPFromAddress(node.address || '');
      const location = locations[ip];
      
      if (location?.lat && location?.lon) {
        validNodes++;
        const locationKey = `${location.city}-${location.country}`;
        const existing = locationGroups.get(locationKey);
        
        if (existing) existing.count++;
        else locationGroups.set(locationKey, { lat: location.lat, lng: location.lon, city: location.city, country: location.country, count: 1 });
        
        const countryKey = location.country;
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
  }, [nodes, locations]);

  return { ...processedData, loading, error };
}
