'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CopyBtn as CopyButton } from '@/components/ui/CopyBtn';
import { getCountryFlagUrl } from '@/libs/services/geolocation';
import { toast } from 'sonner';

// Custom SVG Icons
const ArrowLeftIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7"/>
  </svg>
);

const GlobeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const ServerIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
    <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
  </svg>
);

const ClockIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const HardDriveIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="12" x2="2" y2="12"/>
    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
  </svg>
);

const ActivityIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const MapPinIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const ZapIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const CpuIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/>
    <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/>
    <line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
  </svg>
);

const MemoryIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2"/><line x1="6" y1="10" x2="6" y2="14"/>
    <line x1="10" y1="10" x2="10" y2="14"/><line x1="14" y1="10" x2="14" y2="14"/><line x1="18" y1="10" x2="18" y2="14"/>
  </svg>
);

const NetworkIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
  </svg>
);

const CoinsIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/>
    <path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>
  </svg>
);

const CheckCircleIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const CalendarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const KeyIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
);

const ChartIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
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

interface NodeHistoryEntry {
  timestamp: number;
  response_time: number;
  uptime: number;
  storage_committed: number;
  storage_used: number;
  storage_usage_percent: number;
}

interface NodeMeta {
  name: string;
  pubkey: string;
}

interface CurrentNodeData {
  pubkey?: string;
  address?: string;
  status: string;
  uptime: number;
  storage_committed: number;
  storage_used: number;
  storage_usage_percent: number;
  version?: string;
  rpc_port?: number;
  is_public?: boolean;
  last_seen_timestamp?: number;
  cpu_usage?: number;
  ram_usage?: number;
  packets_rx?: number;
  packets_tx?: number;
  active_streams?: number;
  credits?: number;
  registered?: boolean;
  joined_at?: number;
  response_time?: number;
}

interface NodeProfileData {
  ip: string;
  location: LocationData | null;
  currentNode: CurrentNodeData | null;
  history: NodeHistoryEntry[];
  meta: NodeMeta | null;
}

interface NodeProfileClientProps {
  ip: string;
}

// Time range options
type TimeRange = '30m' | '1h' | '24h' | '1w';

const timeRangeOptions: { value: TimeRange; label: string; minutes: number }[] = [
  { value: '30m', label: '30m', minutes: 30 },
  { value: '1h', label: '1h', minutes: 60 },
  { value: '24h', label: '24h', minutes: 1440 },
  { value: '1w', label: '1w', minutes: 10080 },
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
          <polygon
            points={areaPoints}
            fill={`${color}20`}
          />
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

// Status Timeline Chart
const StatusChart = ({ 
  data, 
  height = 60 
}: { 
  data: { time: number; status: 'online' | 'syncing' | 'offline' }[];
  height?: number;
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white/40 text-sm">
        No data available
      </div>
    );
  }

  const statusColors = {
    online: '#10b981',
    syncing: '#f59e0b',
    offline: '#ef4444',
  };

  const barWidth = 100 / data.length;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
        {data.map((d, i) => (
          <rect
            key={i}
            x={i * barWidth}
            y="5"
            width={Math.max(barWidth - 0.5, 0.5)}
            height="30"
            fill={statusColors[d.status]}
            rx="1"
          />
        ))}
      </svg>
      <div className="flex justify-center gap-4 mt-1">
        <div className="flex items-center gap-1 text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-white/60">Online</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          <span className="text-white/60">Syncing</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <span className="text-white/60">Offline</span>
        </div>
      </div>
    </div>
  );
};

// Node Location Map Component
const NodeLocationMap = ({ lat, lon, city, country }: { lat: number; lon: number; city?: string; country?: string }) => {
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

    const map = L.map(mapRef.current, {
      center: [lat, lon],
      zoom: 5,
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

    // Add marker for node location
    const customIcon = L.divIcon({
      html: `
        <div style="
          width: 24px;
          height: 24px;
          background: radial-gradient(circle, rgba(16, 185, 129, 1) 0%, rgba(16, 185, 129, 0.6) 70%);
          border: 2px solid rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.8);
          animation: pulse 2s infinite;
        "></div>
      `,
      className: 'custom-node-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const marker = L.marker([lat, lon], { icon: customIcon });
    
    const tooltipContent = `
      <div style="
        background: rgba(0, 0, 0, 0.95);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid rgba(16, 185, 129, 0.5);
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="font-weight: bold; color: #10b981;">${city || 'Unknown'}, ${country || 'Unknown'}</div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.6);">${lat.toFixed(4)}°, ${lon.toFixed(4)}°</div>
      </div>
    `;

    marker.bindTooltip(tooltipContent, {
      permanent: false,
      direction: 'top',
      offset: [0, -15],
      className: 'custom-tooltip',
    });

    marker.addTo(map);
    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, L, lat, lon, city, country]);

  if (!isClient || !L) {
    return (
      <div className="w-full h-full min-h-[200px] bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-white/60 text-sm">Loading map...</div>
      </div>
    );
  }

  return (
    <>
      <div ref={mapRef} className="w-full h-full min-h-[200px] rounded-lg overflow-hidden" />
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
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


// Main Component
export function NodeProfileClient({ ip }: NodeProfileClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NodeProfileData | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const controller = new AbortController();
        
        const response = await fetch(`/api/node-profile?ip=${encodeURIComponent(ip)}`, {
          signal: controller.signal,
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch node profile: ${response.status}`);
        }
        
        const profileData = await response.json();
        setData(profileData);
        toast.success('Node profile loaded');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching node profile:', err);
          setError('Failed to load node profile');
          toast.error('Failed to load node profile');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [ip]);

  // Filter history data based on time range
  const filteredHistory = data?.history?.filter(entry => {
    const now = Date.now();
    const entryTime = entry.timestamp * 1000;
    const rangeMinutes = timeRangeOptions.find(r => r.value === timeRange)?.minutes || 1440;
    return now - entryTime <= rangeMinutes * 60 * 1000;
  }) || [];

  // Prepare chart data
  const responseTimeData = filteredHistory.map(h => ({ time: h.timestamp, value: h.response_time })).reverse();
  const uptimeData = filteredHistory.map(h => ({ time: h.timestamp, value: h.uptime / 3600 })).reverse();
  const storageUsageData = filteredHistory.map(h => ({ time: h.timestamp, value: h.storage_usage_percent * 100 })).reverse();
  
  // Status data (derive from response time - if response_time > 0, node was online)
  const statusData = filteredHistory.map(h => ({
    time: h.timestamp,
    status: h.response_time > 0 ? 'online' as const : 'offline' as const
  })).reverse();

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
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatTimestamp = (ts: number) => {
    if (!ts) return 'N/A';
    return new Date(ts * 1000).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online': return 'text-emerald-400';
      case 'syncing': return 'text-amber-400';
      default: return 'text-red-400';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online': return 'bg-emerald-500/20 border-emerald-500/50';
      case 'syncing': return 'bg-amber-500/20 border-amber-500/50';
      default: return 'bg-red-500/20 border-red-500/50';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 bg-white/5 rounded-lg"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 bg-white/5 rounded-lg"></div>
          <div className="h-64 bg-white/5 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-red-400 text-lg">{error}</div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const node = data?.currentNode;
  const location = data?.location;
  const meta = data?.meta;

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
              onClick={() => router.back()}
              className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white font-mono">
                  {meta?.name || `Node ${ip}`}
                </h1>
                <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium border ${getStatusBgColor(node?.status || 'offline')}`}>
                  <span className={getStatusColor(node?.status || 'offline')}>
                    {node?.status?.toUpperCase() || 'OFFLINE'}
                  </span>
                </span>
                {node?.response_time !== undefined && node.response_time > 0 && (
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-cyan-500/20 border border-cyan-500/50 text-cyan-400">
                    {node.response_time.toFixed(0)}ms
                  </span>
                )}
                {node?.is_public && (
                  <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-blue-500/20 border border-blue-500/50 text-blue-400">
                    PUBLIC
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1 text-white/60 text-xs sm:text-sm">
                <span>{ip}</span>
                <CopyButton text={ip} />
                {node?.version && (
                  <>
                    <span className="text-white/30">•</span>
                    <span>v{node.version}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Map and Location Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-lg overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white">Node Location</h2>
            </div>
          </div>
          <div className="h-[200px] sm:h-[250px] md:h-[300px]">
            {location?.lat && location?.lon ? (
              <NodeLocationMap 
                lat={location.lat} 
                lon={location.lon} 
                city={location.city}
                country={location.country}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white/40 text-sm">
                Location data unavailable
              </div>
            )}
          </div>
        </div>

        {/* Location Details */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <GlobeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white">Location Details</h2>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3">
              {location?.country_code && (
                <img 
                  src={getCountryFlagUrl(location.country_code)} 
                  alt={location.country}
                  className="w-5 h-3.5 sm:w-6 sm:h-4 object-cover rounded"
                />
              )}
              <div>
                <div className="text-white font-medium text-sm sm:text-base">{location?.country || 'Unknown'}</div>
                <div className="text-white/60 text-xs sm:text-sm">{location?.city || 'Unknown'}{location?.region ? `, ${location.region}` : ''}</div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-2 sm:pt-3 space-y-1.5 sm:space-y-2">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-white/60">Provider</span>
                <span className="text-white">{location?.provider || 'Unknown'}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-white/60">Latitude</span>
                <span className="text-white font-mono">{location?.lat?.toFixed(4) || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-white/60">Longitude</span>
                <span className="text-white font-mono">{location?.lon?.toFixed(4) || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-white/60">Address</span>
                <div className="flex items-center gap-1">
                  <span className="text-white font-mono text-[10px] sm:text-xs">{node?.address || ip}</span>
                  <CopyButton text={node?.address || ip} />
                </div>
              </div>
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-white/60">RPC Port</span>
                <span className="text-white font-mono">{node?.rpc_port || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
        {/* Response Time */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center gap-1.5 sm:gap-2 text-cyan-400/70 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            <span>Response</span>
          </div>
          <div className={`text-base sm:text-lg md:text-xl font-bold ${(node?.response_time || 0) > 0 ? 'text-cyan-400' : 'text-white/40'}`}>
            {(node?.response_time || 0) > 0 ? `${(node?.response_time || 0).toFixed(0)}ms` : 'N/A'}
          </div>
        </div>

        {/* Uptime */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 hover:border-blue-500/30 transition-colors">
          <div className="flex items-center gap-1.5 sm:gap-2 text-blue-400/70 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Uptime</span>
          </div>
          <div className="text-base sm:text-lg md:text-xl font-bold text-blue-400">{formatUptime(node?.uptime || 0)}</div>
        </div>

        {/* Storage Committed */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 hover:border-orange-500/30 transition-colors">
          <div className="flex items-center gap-1.5 sm:gap-2 text-orange-400/70 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z"/>
              <path d="M8 4v4M16 4v4M4 11h16"/>
            </svg>
            <span>Storage</span>
          </div>
          <div className="text-base sm:text-lg md:text-xl font-bold text-orange-400">{formatBytes(node?.storage_committed || 0)}</div>
        </div>

        {/* Storage Used */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 hover:border-yellow-500/30 transition-colors">
          <div className="flex items-center gap-1.5 sm:gap-2 text-yellow-400/70 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
            <span>Used</span>
          </div>
          <div className="text-base sm:text-lg md:text-xl font-bold text-yellow-400">{formatBytes(node?.storage_used || 0)}</div>
        </div>

        {/* Usage Percent */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 hover:border-purple-500/30 transition-colors">
          <div className="flex items-center gap-1.5 sm:gap-2 text-purple-400/70 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            <span>Usage</span>
          </div>
          <div className="text-base sm:text-lg md:text-xl font-bold text-purple-400">
            {((node?.storage_usage_percent || 0) * 100).toFixed(2)}%
          </div>
        </div>

        {/* Credits */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-400/70 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="8"/>
              <path d="M12 6v12M15 9.5c-.5-1-1.5-1.5-3-1.5-2 0-3 1-3 2.5s1 2 3 2.5c2 .5 3 1.5 3 2.5s-1 2.5-3 2.5c-1.5 0-2.5-.5-3-1.5"/>
            </svg>
            <span>Credits</span>
          </div>
          <div className="text-base sm:text-lg md:text-xl font-bold text-emerald-400">
            {(node?.credits || 0) > 0 ? `+${(node?.credits || 0).toLocaleString()}` : '0'}
          </div>
        </div>

        {/* Active Streams */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 hover:border-pink-500/30 transition-colors col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 sm:gap-2 text-pink-400/70 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">
            <svg className="w-3 h-3 sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0"/>
              <circle cx="12" cy="20" r="1" fill="currentColor"/>
            </svg>
            <span>Streams</span>
          </div>
          <div className="text-base sm:text-lg md:text-xl font-bold text-pink-400">{node?.active_streams || 0}</div>
        </div>
      </div>


      {/* Historical Charts Section */}
      <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2">
            <ChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white">Historical Performance</h2>
          </div>
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1">
            {timeRangeOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs sm:text-sm font-medium transition-colors ${
                  timeRange === option.value
                    ? 'bg-white/20 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4">
          {/* Node Status Chart */}
          <div className="bg-black/20 border border-white/5 rounded-lg p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-white/80 mb-2 sm:mb-3 flex items-center gap-2">
              <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
              Node Status
            </h3>
            <StatusChart data={statusData} height={60} />
          </div>

          {/* Response Time Chart */}
          <div className="bg-black/20 border border-white/5 rounded-lg p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-white/80 mb-2 sm:mb-3 flex items-center gap-2">
              <ZapIcon className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
              Response Time (ms)
            </h3>
            <LineChart 
              data={responseTimeData} 
              color="#f59e0b" 
              height={80}
              label="Response"
              valueFormatter={(v) => `${v.toFixed(0)}ms`}
            />
          </div>

          {/* Uptime Chart */}
          <div className="bg-black/20 border border-white/5 rounded-lg p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-white/80 mb-2 sm:mb-3 flex items-center gap-2">
              <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
              Uptime (hours)
            </h3>
            <LineChart 
              data={uptimeData} 
              color="#3b82f6" 
              height={80}
              label="Uptime"
              valueFormatter={(v) => `${v.toFixed(1)}h`}
            />
          </div>

          {/* Storage Usage Chart */}
          <div className="bg-black/20 border border-white/5 rounded-lg p-3 sm:p-4">
            <h3 className="text-xs sm:text-sm font-medium text-white/80 mb-2 sm:mb-3 flex items-center gap-2">
              <HardDriveIcon className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
              Storage Usage (%)
            </h3>
            <LineChart 
              data={storageUsageData} 
              color="#a855f7" 
              height={80}
              label="Storage"
              valueFormatter={(v) => `${v.toFixed(2)}%`}
            />
          </div>
        </div>
      </div>

      {/* Detailed Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Node Identity */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <KeyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white">Node Identity</h2>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div>
              <div className="text-white/60 text-xs sm:text-sm mb-1">Public Key</div>
              <div className="flex items-center gap-2">
                <code className="text-[10px] sm:text-xs text-white/80 bg-black/40 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-mono break-all">
                  {meta?.pubkey || node?.pubkey || 'N/A'}
                </code>
                {(meta?.pubkey || node?.pubkey) && (
                  <CopyButton text={meta?.pubkey || node?.pubkey || ''} />
                )}
              </div>
            </div>
            <div>
              <div className="text-white/60 text-xs sm:text-sm mb-1">Node Name</div>
              <div className="text-white text-sm sm:text-base">{meta?.name || 'Unnamed Node'}</div>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60 text-xs sm:text-sm">Registered</span>
              <span className={`text-xs sm:text-sm ${node?.registered ? 'text-emerald-400' : 'text-white/40'}`}>
                {node?.registered ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60 text-xs sm:text-sm">Joined</span>
              <span className="text-white text-xs sm:text-sm">{formatTimestamp(node?.joined_at || 0)}</span>
            </div>
          </div>
        </div>

        {/* Network Activity */}
        <div className="bg-black/40 border border-white/10 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <NetworkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white">Network Activity</h2>
          </div>
          <div className="space-y-2 sm:space-y-3">
            <div className="flex justify-between">
              <span className="text-white/60 text-xs sm:text-sm">Packets Received</span>
              <span className="text-white font-mono text-xs sm:text-sm">{(node?.packets_rx || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60 text-xs sm:text-sm">Packets Transmitted</span>
              <span className="text-white font-mono text-xs sm:text-sm">{(node?.packets_tx || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60 text-xs sm:text-sm">Active Streams</span>
              <span className="text-white font-mono text-xs sm:text-sm">{node?.active_streams || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60 text-xs sm:text-sm">Last Seen</span>
              <span className="text-white text-xs sm:text-sm">{formatTimestamp(node?.last_seen_timestamp || 0)}</span>
            </div>
          </div>
        </div>
      </div>


      {/* History Table */}
      {filteredHistory.length > 0 && (
        <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-white">History Log</h2>
              <span className="text-white/40 text-sm">({filteredHistory.length} entries)</span>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-black/80">
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-white/60 text-xs font-medium uppercase">Timestamp</th>
                  <th className="text-right px-4 py-3 text-white/60 text-xs font-medium uppercase">Response Time</th>
                  <th className="text-right px-4 py-3 text-white/60 text-xs font-medium uppercase">Uptime</th>
                  <th className="text-right px-4 py-3 text-white/60 text-xs font-medium uppercase">Storage Committed</th>
                  <th className="text-right px-4 py-3 text-white/60 text-xs font-medium uppercase">Storage Used</th>
                  <th className="text-right px-4 py-3 text-white/60 text-xs font-medium uppercase">Usage %</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.slice(0, 50).map((entry, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-2 text-white/80 text-sm font-mono">
                      {new Date(entry.timestamp * 1000).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right text-white/80 text-sm font-mono">
                      {entry.response_time.toFixed(0)}ms
                    </td>
                    <td className="px-4 py-2 text-right text-white/80 text-sm font-mono">
                      {formatUptime(entry.uptime)}
                    </td>
                    <td className="px-4 py-2 text-right text-white/80 text-sm font-mono">
                      {formatBytes(entry.storage_committed)}
                    </td>
                    <td className="px-4 py-2 text-right text-white/80 text-sm font-mono">
                      {formatBytes(entry.storage_used)}
                    </td>
                    <td className="px-4 py-2 text-right text-white/80 text-sm font-mono">
                      {(entry.storage_usage_percent * 100).toFixed(4)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
