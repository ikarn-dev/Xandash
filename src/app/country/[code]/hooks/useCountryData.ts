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
  // Mainnet external data fields
  country?: string;
  country_code?: string;
  provider?: string;
}

interface PodCredit {
  credits: number;
  pod_id: string;
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

// Country code to name mapping
const COUNTRY_NAMES: Record<string, string> = {
  'us': 'United States',
  'de': 'Germany',
  'fr': 'France',
  'gb': 'United Kingdom',
  'nl': 'Netherlands',
  'ca': 'Canada',
  'au': 'Australia',
  'jp': 'Japan',
  'sg': 'Singapore',
  'in': 'India',
  'br': 'Brazil',
  'kr': 'South Korea',
  'ru': 'Russia',
  'cn': 'China',
  'fi': 'Finland',
  'se': 'Sweden',
  'no': 'Norway',
  'pl': 'Poland',
  'es': 'Spain',
  'it': 'Italy',
  'ch': 'Switzerland',
  'at': 'Austria',
  'be': 'Belgium',
  'ie': 'Ireland',
  'pt': 'Portugal',
  'cz': 'Czech Republic',
  'dk': 'Denmark',
  'hu': 'Hungary',
  'ro': 'Romania',
  'ua': 'Ukraine',
  'za': 'South Africa',
  'mx': 'Mexico',
  'ar': 'Argentina',
  'cl': 'Chile',
  'co': 'Colombia',
  'th': 'Thailand',
  'vn': 'Vietnam',
  'my': 'Malaysia',
  'id': 'Indonesia',
  'ph': 'Philippines',
  'hk': 'Hong Kong',
  'tw': 'Taiwan',
  'nz': 'New Zealand',
  'ae': 'United Arab Emirates',
  'il': 'Israel',
  'tr': 'Turkey',
  'gr': 'Greece',
  'bg': 'Bulgaria',
  'hr': 'Croatia',
  'sk': 'Slovakia',
  'si': 'Slovenia',
  'lt': 'Lithuania',
  'lv': 'Latvia',
  'ee': 'Estonia',
};

export function useCountryData(countryCode: string) {
  const { network } = useNetwork();
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [locations, setLocations] = useState<{ [ip: string]: LocationData | null }>({});
  const [countryName, setCountryName] = useState('');
  const isMainnet = network === 'mainnet';

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

        let countryNodes: NodeData[] = [];
        let locationData: { [ip: string]: LocationData | null } = {};

        if (isMainnet) {
          // For mainnet, filter by country_code from external data
          countryNodes = allNodes.filter((node: any) => {
            return node.country_code?.toLowerCase() === countryCode.toLowerCase();
          });

          // Build location data from node's external geo data
          countryNodes.forEach((node: any) => {
            const ip = extractIPFromAddress(node.address || '');
            if (ip && node.country) {
              const coords = COUNTRY_COORDS[node.country_code?.toUpperCase()];
              locationData[ip] = {
                country: node.country,
                country_code: node.country_code,
                city: '', // Empty - mainnet geo data doesn't have city
                region: '',
                provider: node.provider || 'Unknown',
                ip,
                lat: coords?.lat,
                lon: coords?.lon,
              };
            }
          });

          // Set country name from first node or fallback to mapping
          const firstNode = countryNodes[0];
          if (firstNode?.country) {
            setCountryName(firstNode.country);
          } else {
            setCountryName(COUNTRY_NAMES[countryCode.toLowerCase()] || countryCode.toUpperCase());
          }
        } else {
          // For devnet, fetch geolocation data
          const uniqueIPs: string[] = Array.from(new Set(
            allNodes.map((node: any) => extractIPFromAddress(node.address || '')).filter(Boolean)
          ));

          locationData = await getLocationsForIPs(uniqueIPs);

          countryNodes = allNodes.filter((node: any) => {
            const ip = extractIPFromAddress(node.address || '');
            const loc = locationData[ip];
            return loc && loc.country_code?.toLowerCase() === countryCode.toLowerCase();
          });

          const firstLoc = Object.values(locationData).find(
            loc => loc && loc.country_code?.toLowerCase() === countryCode.toLowerCase()
          );
          if (firstLoc) {
            setCountryName(firstLoc.country);
          } else {
            setCountryName(COUNTRY_NAMES[countryCode.toLowerCase()] || countryCode.toUpperCase());
          }
        }

        setLocations(locationData);

        // Add credits to nodes
        const nodesWithCredits = countryNodes.map((node: any) => {
          // For mainnet, credits may already be in node data from external source
          const externalCredits = node.credits;
          const apiCredits = podCredits.find((c) => c.pod_id === node.pubkey)?.credits;
          return { ...node, credits: externalCredits ?? apiCredits ?? 0 };
        });

        setNodes(nodesWithCredits);
        
        if (nodesWithCredits.length > 0) {
          toast.success(`Loaded ${nodesWithCredits.length} nodes from ${countryName || countryCode.toUpperCase()}`);
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
  }, [countryCode, network, isMainnet]);

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
      
      // For mainnet, use country center coords if no exact location
      if (!loc?.lat || !loc?.lon) {
        const coords = COUNTRY_COORDS[countryCode.toUpperCase()];
        if (coords) {
          return {
            lat: coords.lat,
            lon: coords.lon,
            city: loc?.city || countryName
          };
        }
      }
      
      return {
        lat: loc?.lat || 0,
        lon: loc?.lon || 0,
        city: loc?.city
      };
    }).filter(n => n.lat !== 0 && n.lon !== 0);
  }, [nodes, locations, countryCode, countryName]);

  return {
    loading,
    nodes,
    locations,
    countryName,
    stats,
    mapNodes,
    network
  };
}
