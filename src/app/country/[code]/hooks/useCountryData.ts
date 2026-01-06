'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useNetwork } from '@/libs/context/network-context';
import { getLocationsForIPs, extractIPFromAddress } from '@/libs/services/geolocation';
import { getNodeStatus } from '@/libs/utils/node-status';

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

interface NodeData {
  pubkey: string;
  address: string;
  status: string;
  uptime: number;
  storage_committed: number;
  storage_used: number;
  storage_usage_percent: number;
  version: string;
  rpc_port: number;
  is_public: boolean;
  last_seen_timestamp: number;
  credits?: number;
}

interface PodCredit {
  credits: number;
  pod_id: string;
}

export function useCountryData(countryCode: string) {
  const { network } = useNetwork();
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [locations, setLocations] = useState<{ [ip: string]: LocationData | null }>({});
  const [countryName, setCountryName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [nodesRes, creditsRes] = await Promise.all([
          fetch(`/api/nodes?includeAll=true&network=${network}`),
          fetch(`/api/pod-credits?network=${network}`)
        ]);

        const nodesData = await nodesRes.json();
        const creditsData = await creditsRes.json();

        const allNodes = nodesData.nodes || [];
        const podCredits: PodCredit[] = creditsData.pods_credits || [];

        const uniqueIPs: string[] = Array.from(new Set(
          allNodes.map((node: any) => extractIPFromAddress(node.address || '')).filter(Boolean)
        ));

        const locationData = await getLocationsForIPs(uniqueIPs);
        setLocations(locationData);

        const countryNodes = allNodes.filter((node: any) => {
          const ip = extractIPFromAddress(node.address || '');
          const loc = locationData[ip];
          return loc && loc.country_code?.toLowerCase() === countryCode.toLowerCase();
        });

        const firstLoc = Object.values(locationData).find(
          loc => loc && loc.country_code?.toLowerCase() === countryCode.toLowerCase()
        );
        if (firstLoc) {
          setCountryName(firstLoc.country);
        }

        const nodesWithCredits = countryNodes.map((node: any) => {
          const nodeCredits = podCredits.find((c) => c.pod_id === node.pubkey);
          return { ...node, credits: nodeCredits?.credits || 0 };
        });

        setNodes(nodesWithCredits);
        
        if (nodesWithCredits.length > 0) {
          toast.success(`Loaded ${nodesWithCredits.length} nodes from ${firstLoc?.country || countryCode.toUpperCase()}`);
        } else {
          toast.info('No nodes found in this country');
        }
      } catch (err) {
        console.error('Error fetching country data:', err);
        toast.error('Failed to load country data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [countryCode, network]);

  const stats = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    let onlineCount = 0, syncingCount = 0, offlineCount = 0;
    
    nodes.forEach(n => {
      const status = getNodeStatus(n.last_seen_timestamp || 0, now);
      if (status === 'online') onlineCount++;
      else if (status === 'syncing') syncingCount++;
      else offlineCount++;
    });

    const totalCredits = nodes.reduce((sum, n) => sum + (n.credits || 0), 0);
    const totalStorage = nodes.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
    const totalStorageUsed = nodes.reduce((sum, n) => sum + (n.storage_used || 0), 0);
    const avgStorageUsage = nodes.length > 0 
      ? nodes.reduce((sum, n) => sum + (n.storage_usage_percent || 0), 0) / nodes.length 
      : 0;
    const avgUptime = nodes.length > 0 
      ? nodes.reduce((sum, n) => sum + (n.uptime || 0), 0) / nodes.length 
      : 0;
    const onlinePercent = nodes.length > 0 ? (onlineCount / nodes.length) * 100 : 0;

    return {
      totalNodes: nodes.length,
      onlineNodes: onlineCount,
      syncingNodes: syncingCount,
      offlineNodes: offlineCount,
      totalCredits,
      totalStorage,
      totalStorageUsed,
      avgStorageUsage,
      avgUptime,
      onlinePercent
    };
  }, [nodes]);

  const mapNodes = useMemo(() => {
    return nodes.map(node => {
      const ip = extractIPFromAddress(node.address || '');
      const loc = locations[ip];
      return {
        lat: loc?.lat || 0,
        lon: loc?.lon || 0,
        city: loc?.city
      };
    }).filter(n => n.lat !== 0 && n.lon !== 0);
  }, [nodes, locations]);

  return {
    loading,
    nodes,
    locations,
    countryName,
    stats,
    mapNodes
  };
}
