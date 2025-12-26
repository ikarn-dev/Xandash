'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CopyBtn as CopyButton } from '@/components/ui/CopyBtn';
import { getCountryFlagUrl, getLocationsForIPs, extractIPFromAddress } from '@/libs/services/geolocation';
import { toast } from 'sonner';

// Custom SVG Icons
const ArrowLeftIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const NodesIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/>
    <path d="M12 8v4M8.5 16.5L12 12M15.5 16.5L12 12"/>
  </svg>
);

const StorageIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z"/>
    <path d="M8 4v4M16 4v4M4 11h16"/>
  </svg>
);

const CreditsIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="8"/>
    <path d="M12 6v12M15 9.5c-.5-1-1.5-1.5-3-1.5-2 0-3 1-3 2.5s1 2 3 2.5c2 .5 3 1.5 3 2.5s-1 2.5-3 2.5c-1.5 0-2.5-.5-3-1.5"/>
  </svg>
);

const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
  </svg>
);

const MapPinIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const GlobeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

// Interfaces
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

interface CountryProfileClientProps {
  countryCode: string;
}

// Time range options
type TimeRange = '30m' | '1h' | '24h' | '1w';

const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: '30m', label: '30m' },
  { value: '1h', label: '1h' },
  { value: '24h', label: '24h' },
  { value: '1w', label: '1w' },
];

// Simple Line Chart Component
const LineChart = ({ 
  data, 
  color = '#10b981', 
  height = 120,
  showArea = true,
  label = '',
  valueFormatter = (v: number) => v.toFixed(2)
}: { 
  data: { time: number; value: number }[];
  color?: string;
  height?: number;
  showArea?: boolean;
  label?: string;
  valueFormatter?: (v: number) => string;
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white/40 text-sm">
        No data available
      </div>
    );
  }

  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  
  const width = 100;
  const padding = 2;
  
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - ((d.value - minValue) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `${padding},${height - padding} ${points} ${width - padding},${height - padding}`;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
        {showArea && (
          <polygon points={areaPoints} fill={`${color}20`} />
        )}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="absolute top-1 left-2 text-xs text-white/60">{label}</div>
      <div className="absolute top-1 right-2 text-xs font-mono" style={{ color }}>
        {valueFormatter(values[values.length - 1] || 0)}
      </div>
      <div className="absolute bottom-1 left-2 text-xs text-white/40">
        {valueFormatter(minValue)}
      </div>
      <div className="absolute bottom-1 right-2 text-xs text-white/40">
        {valueFormatter(maxValue)}
      </div>
    </div>
  );
};


// Country Map Component
const CountryMap = ({ nodes, countryName }: { nodes: { lat: number; lon: number; city?: string }[]; countryName: string }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    const loadLeaflet = async () => {
      const leaflet = await import('leaflet');
      setL(leaflet.default);
    };
    loadLeaflet();
  }, []);

  useEffect(() => {
    if (!isClient || !L || !mapRef.current || mapInstanceRef.current) return;
    if (nodes.length === 0) return;

    // Calculate center from all nodes
    const avgLat = nodes.reduce((sum, n) => sum + n.lat, 0) / nodes.length;
    const avgLon = nodes.reduce((sum, n) => sum + n.lon, 0) / nodes.length;

    const map = L.map(mapRef.current, {
      center: [avgLat, avgLon],
      zoom: 4,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true,
      attributionControl: false,
    });

    const mapTilesUrl = process.env.NEXT_PUBLIC_MAP_TILES_URL || 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    L.tileLayer(mapTilesUrl, {
      attribution: '',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Add markers for each node
    nodes.forEach((node) => {
      const customIcon = L.divIcon({
        html: `
          <div style="
            width: 16px;
            height: 16px;
            background: radial-gradient(circle, rgba(16, 185, 129, 1) 0%, rgba(16, 185, 129, 0.6) 70%);
            border: 2px solid rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            box-shadow: 0 0 12px rgba(16, 185, 129, 0.8);
          "></div>
        `,
        className: 'custom-node-marker',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([node.lat, node.lon], { icon: customIcon });
      
      if (node.city) {
        marker.bindTooltip(`<div style="background: rgba(0,0,0,0.9); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">${node.city}</div>`, {
          permanent: false,
          direction: 'top',
          offset: [0, -10],
          className: 'custom-tooltip',
        });
      }

      marker.addTo(map);
    });

    // Fit bounds to show all markers
    if (nodes.length > 1) {
      const bounds = L.latLngBounds(nodes.map(n => [n.lat, n.lon]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, L, nodes, countryName]);

  if (!isClient || !L) {
    return (
      <div className="w-full h-full min-h-[250px] bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-white/60 text-sm">Loading map...</div>
      </div>
    );
  }

  return (
    <>
      <div ref={mapRef} className="w-full h-full min-h-[250px] rounded-lg overflow-hidden" />
      <style jsx global>{`
        .custom-node-marker { background: transparent !important; border: none !important; }
        .leaflet-tooltip.custom-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .leaflet-tooltip.custom-tooltip::before { display: none !important; }
      `}</style>
    </>
  );
};

// Format helpers
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number) => {
  if (!seconds) return '0h';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
};

const formatTimestamp = (ts: number) => {
  if (!ts) return 'N/A';
  return new Date(ts * 1000).toLocaleDateString();
};

const formatCredits = (credits: number) => {
  if (credits >= 1000000) return (credits / 1000000).toFixed(2) + 'M';
  if (credits >= 1000) return (credits / 1000).toFixed(1) + 'K';
  return credits.toFixed(0);
};

// Main Component
export function CountryProfileClient({ countryCode }: CountryProfileClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [locations, setLocations] = useState<{ [ip: string]: LocationData | null }>({});
  const [credits, setCredits] = useState<PodCredit[]>([]);
  const [countryName, setCountryName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch nodes and credits in parallel
        const [nodesRes, creditsRes] = await Promise.all([
          fetch('/api/nodes?includeAll=true'),
          fetch('/api/pod-credits')
        ]);

        const nodesData = await nodesRes.json();
        const creditsData = await creditsRes.json();

        const allNodes = nodesData.nodes || [];
        const podCredits = creditsData.pods_credits || [];
        setCredits(podCredits);

        // Get unique IPs
        const uniqueIPs: string[] = Array.from(new Set(
          allNodes.map((node: any) => extractIPFromAddress(node.address || '')).filter(Boolean)
        ));

        // Fetch locations
        const locationData = await getLocationsForIPs(uniqueIPs);
        setLocations(locationData);

        // Filter nodes by country code
        const countryNodes = allNodes.filter((node: any) => {
          const ip = extractIPFromAddress(node.address || '');
          const loc = locationData[ip];
          return loc && loc.country_code?.toLowerCase() === countryCode.toLowerCase();
        });

        // Set country name from first matching location
        const firstLoc = Object.values(locationData).find(
          loc => loc && loc.country_code?.toLowerCase() === countryCode.toLowerCase()
        );
        if (firstLoc) {
          setCountryName(firstLoc.country);
        }

        // Add credits to nodes
        const nodesWithCredits = countryNodes.map((node: any) => {
          const nodeCredits = podCredits.find((c: PodCredit) => c.pod_id === node.pubkey);
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
  }, [countryCode]);


  // Calculate stats
  const stats = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const onlineNodes = nodes.filter(n => {
      const lastSeen = n.last_seen_timestamp || 0;
      return now - lastSeen < 300; // 5 minutes
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
    const onlinePercent = nodes.length > 0 ? (onlineNodes.length / nodes.length) * 100 : 0;

    return {
      totalNodes: nodes.length,
      onlineNodes: onlineNodes.length,
      offlineNodes: nodes.length - onlineNodes.length,
      totalCredits,
      totalStorage,
      totalStorageUsed,
      avgStorageUsage,
      avgUptime,
      onlinePercent
    };
  }, [nodes]);

  // Map data
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

  // Filtered nodes for table
  const filteredNodes = useMemo(() => {
    if (!searchQuery) return nodes;
    const query = searchQuery.toLowerCase();
    return nodes.filter(node => {
      const ip = extractIPFromAddress(node.address || '');
      return (
        ip.includes(query) ||
        node.pubkey?.toLowerCase().includes(query) ||
        locations[ip]?.city?.toLowerCase().includes(query)
      );
    });
  }, [nodes, searchQuery, locations]);

  // Generate mock chart data based on stats
  const chartData = useMemo(() => {
    const now = Date.now();
    const points = 24;
    const interval = 3600000; // 1 hour

    return {
      uptime: Array.from({ length: points }, (_, i) => ({
        time: now - (points - i) * interval,
        value: stats.onlinePercent * (0.85 + Math.random() * 0.3)
      })),
      credits: Array.from({ length: points }, (_, i) => ({
        time: now - (points - i) * interval,
        value: stats.totalCredits * (0.9 + Math.random() * 0.2) * (i / points)
      })),
      storage: Array.from({ length: points }, (_, i) => ({
        time: now - (points - i) * interval,
        value: stats.avgStorageUsage * (0.8 + Math.random() * 0.4)
      })),
      nodes: Array.from({ length: points }, (_, i) => ({
        time: now - (points - i) * interval,
        value: stats.onlineNodes * (0.9 + Math.random() * 0.2)
      }))
    };
  }, [stats]);

  const handleNodeClick = (node: NodeData) => {
    const ip = extractIPFromAddress(node.address || '');
    if (ip) {
      router.push(`/profile/${encodeURIComponent(ip)}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        <div className="h-12 sm:h-16 bg-white/5 rounded-lg"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 h-48 sm:h-64 bg-white/5 rounded-lg"></div>
          <div className="h-48 sm:h-64 bg-white/5 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 sm:h-28 bg-white/5 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="relative bg-black border border-white/10 p-3 sm:p-4 md:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-6 h-6">
          <div className="absolute top-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute top-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>
        <div className="absolute top-0 right-0 w-6 h-6">
          <div className="absolute top-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute top-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-6 h-6">
          <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute bottom-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-6 h-6">
          <div className="absolute bottom-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute bottom-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push('/network')}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="flex items-center gap-2 sm:gap-4">
              {countryCode && (
                <img 
                  src={getCountryFlagUrl(countryCode)} 
                  alt={countryName}
                  className="w-8 h-5 sm:w-12 sm:h-8 object-cover rounded shadow-lg"
                />
              )}
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white font-mono">{countryName || countryCode.toUpperCase()}</h1>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 text-white/60 text-[10px] sm:text-xs md:text-sm">
                  <span>{stats.totalNodes} nodes</span>
                  <span className="text-white/30">•</span>
                  <span className="text-emerald-400">{stats.onlineNodes} online</span>
                  <span className="text-white/30">•</span>
                  <span className="text-red-400">{stats.offlineNodes} offline</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Map and Stats Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-lg overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white">Node Locations</h2>
            </div>
          </div>
          <div className="h-[200px] sm:h-[250px] md:h-[300px]">
            {mapNodes.length > 0 ? (
              <CountryMap nodes={mapNodes} countryName={countryName} />
            ) : (
              <div className="flex items-center justify-center h-full text-white/40 text-sm">
                No location data available
              </div>
            )}
          </div>
        </div>

        {/* Country Overview */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <GlobeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white">Overview</h2>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-xs sm:text-sm">Total Nodes</span>
              <span className="text-white font-mono text-lg sm:text-xl font-bold">{stats.totalNodes}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-xs sm:text-sm">Online</span>
              <span className="text-emerald-400 font-mono text-base sm:text-lg">{stats.onlineNodes}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-xs sm:text-sm">Offline</span>
              <span className="text-red-400 font-mono text-base sm:text-lg">{stats.offlineNodes}</span>
            </div>
            <div className="border-t border-white/10 pt-3 sm:pt-4">
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-white/60 text-xs sm:text-sm">Total Storage</span>
                <span className="text-white font-mono text-xs sm:text-sm">{formatBytes(stats.totalStorage)}</span>
              </div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <span className="text-white/60 text-xs sm:text-sm">Storage Used</span>
                <span className="text-white font-mono text-xs sm:text-sm">{formatBytes(stats.totalStorageUsed)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-xs sm:text-sm">Avg Uptime</span>
                <span className="text-white font-mono text-xs sm:text-sm">{formatUptime(stats.avgUptime)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
        {/* Total Credits */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-400/70 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">
            <CreditsIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Total Credits</span>
          </div>
          <div className="text-base sm:text-lg md:text-xl font-bold text-emerald-400">{formatCredits(stats.totalCredits)}</div>
        </div>

        {/* Online Percent */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 hover:border-green-500/30 transition-colors">
          <div className="flex items-center gap-1.5 sm:gap-2 text-green-400/70 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">
            <NodesIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Online Rate</span>
          </div>
          <div className="text-base sm:text-lg md:text-xl font-bold text-green-400">{stats.onlinePercent.toFixed(1)}%</div>
        </div>

        {/* Total Storage */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 hover:border-orange-500/30 transition-colors">
          <div className="flex items-center gap-1.5 sm:gap-2 text-orange-400/70 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">
            <StorageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Total Storage</span>
          </div>
          <div className="text-base sm:text-lg md:text-xl font-bold text-orange-400">{formatBytes(stats.totalStorage)}</div>
        </div>

        {/* Storage Usage */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 hover:border-blue-500/30 transition-colors">
          <div className="flex items-center gap-1.5 sm:gap-2 text-blue-400/70 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">
            <StorageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Storage Used</span>
          </div>
          <div className="text-base sm:text-lg md:text-xl font-bold text-blue-400">{formatBytes(stats.totalStorageUsed)}</div>
        </div>

        {/* Avg Uptime */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 hover:border-purple-500/30 transition-colors col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 sm:gap-2 text-purple-400/70 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Avg Uptime</span>
          </div>
          <div className="text-base sm:text-lg md:text-xl font-bold text-purple-400">{formatUptime(stats.avgUptime)}</div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Online Nodes */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <NodesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
              <h3 className="text-white font-medium text-sm sm:text-base">Online Nodes</h3>
            </div>
            <div className="flex gap-1">
              {timeRangeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTimeRange(opt.value)}
                  className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded ${
                    timeRange === opt.value 
                      ? 'bg-white/20 text-white' 
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <LineChart 
            data={chartData.nodes} 
            color="#22c55e" 
            height={100}
            valueFormatter={(v) => Math.round(v).toString()}
          />
        </div>

        {/* Credits Earned */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <CreditsIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            <h3 className="text-white font-medium text-sm sm:text-base">Credits Earned</h3>
          </div>
          <LineChart 
            data={chartData.credits} 
            color="#10b981" 
            height={100}
            valueFormatter={(v) => formatCredits(v)}
          />
        </div>

        {/* Uptime Rate */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <h3 className="text-white font-medium text-sm sm:text-base">Uptime Rate</h3>
          </div>
          <LineChart 
            data={chartData.uptime} 
            color="#22d3ee" 
            height={100}
            valueFormatter={(v) => v.toFixed(1) + '%'}
          />
        </div>

        {/* Storage Usage */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <StorageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
            <h3 className="text-white font-medium text-sm sm:text-base">Storage Usage</h3>
          </div>
          <LineChart 
            data={chartData.storage} 
            color="#f97316" 
            height={100}
            valueFormatter={(v) => v.toFixed(1) + '%'}
          />
        </div>
      </div>


      {/* Nodes Table */}
      <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2">
              <NodesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white/60" />
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white">Nodes in {countryName}</h2>
              <span className="text-white/40 text-xs sm:text-sm">({filteredNodes.length})</span>
            </div>
            <div className="relative">
              <SearchIcon className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder:text-white/40 focus:outline-none focus:border-white/30 w-full sm:w-64"
              />
            </div>
          </div>
        </div>

        <style jsx>{`
          .table-scroll::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="overflow-x-auto table-scroll" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">IP Address</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">Public Key</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">City</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">Uptime</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">Storage</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">Credits</th>
                <th className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs font-medium uppercase tracking-wider whitespace-nowrap">Access</th>
              </tr>
            </thead>
            <tbody>
              {filteredNodes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 sm:px-4 py-6 sm:py-8 text-center text-white/40 text-xs sm:text-sm">
                    {searchQuery ? 'No nodes match your search' : 'No nodes found in this country'}
                  </td>
                </tr>
              ) : (
                filteredNodes.map((node) => {
                  const ip = extractIPFromAddress(node.address || '');
                  const loc = locations[ip];
                  const now = Math.floor(Date.now() / 1000);
                  const isOnline = (now - (node.last_seen_timestamp || 0)) < 300;

                  return (
                    <tr 
                      key={node.pubkey}
                      onClick={() => handleNodeClick(node)}
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-white font-mono text-[10px] sm:text-xs md:text-sm">{ip}</span>
                          <CopyButton text={ip} />
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap ${
                          isOnline 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <span className="text-white/60 font-mono text-[10px] sm:text-xs truncate max-w-[80px] sm:max-w-[120px]">
                            {node.pubkey?.slice(0, 8)}...{node.pubkey?.slice(-6)}
                          </span>
                          <CopyButton text={node.pubkey} />
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-white/60 text-[10px] sm:text-xs md:text-sm whitespace-nowrap">{loc?.city || 'Unknown'}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-white font-mono text-[10px] sm:text-xs md:text-sm whitespace-nowrap">{formatUptime(node.uptime)}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 text-white font-mono text-[10px] sm:text-xs md:text-sm whitespace-nowrap">{formatBytes(node.storage_committed)}</td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <span className="text-emerald-400 font-mono text-[10px] sm:text-xs md:text-sm whitespace-nowrap">{formatCredits(node.credits || 0)}</span>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3">
                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs whitespace-nowrap ${
                          node.is_public 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : 'bg-white/10 text-white/40'
                        }`}>
                          {node.is_public ? 'PUBLIC' : 'PRIVATE'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
