'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

interface NodeEventLog {
  _id?: string;
  ip: string;
  pubkey: string;
  event_type: 'node_online' | 'node_offline' | 'node_new' | 'status_change' | 'version_change' | 'storage_change' | 'credits_change';
  previous_value?: string | number;
  new_value?: string | number;
  previous_status?: string;
  new_status?: string;
  previous_version?: string;
  new_version?: string;
  details?: Record<string, any>;
  timestamp: number;
  created_at: string;
}

interface DbNodeSnapshot {
  ip: string;
  pubkey: string;
  status: string;
  uptime: number;
  storage_committed: number;
  storage_used: number;
  storage_usage_percent: number;
  credits: number;
  version?: string;
  timestamp: number;
  created_at: string;
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
  active_streams?: number;
  credits?: number;
  previousCredits?: number;
  totalCredits?: number;
}

interface NodeProfileData {
  ip: string;
  location: LocationData | null;
  currentNode: CurrentNodeData | null;
  history: any[];
  meta: { name: string; pubkey: string } | null;
  dbHistory?: DbNodeSnapshot[];
  dbEvents?: NodeEventLog[];
}

interface NodeProfileClientProps {
  ip: string;
}

type TimeRange = '7h' | '24h' | '7d' | 'all';

const timeRangeOptions: { value: TimeRange; label: string; hours: number }[] = [
  { value: '7h', label: '7hr', hours: 7 },
  { value: '24h', label: '24hr', hours: 24 },
  { value: '7d', label: '7days', hours: 168 },
  { value: 'all', label: 'All time', hours: 0 }, // 0 means no time limit
];

const eventTypeConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  node_online: { color: 'text-green-400', bgColor: 'bg-green-500/20', label: 'Online' },
  node_offline: { color: 'text-red-400', bgColor: 'bg-red-500/20', label: 'Offline' },
  node_new: { color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'New Node' },
  status_change: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', label: 'Status Change' },
  version_change: { color: 'text-purple-400', bgColor: 'bg-purple-500/20', label: 'Version Update' },
  storage_change: { color: 'text-orange-400', bgColor: 'bg-orange-500/20', label: 'Storage Change' },
  credits_change: { color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', label: 'Credits Change' },
};


// Enhanced Line Chart Component with hover and animations
const LineChart = ({ 
  data, 
  color = '#10b981', 
  height = 100,
  label = '',
  valueFormatter = (v: number) => v.toFixed(0),
  highlightCurrent = false
}: { 
  data: { time: number; value: number }[];
  color?: string;
  height?: number;
  label?: string;
  valueFormatter?: (v: number) => string;
  highlightCurrent?: boolean;
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; value: number; time: number } | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);

  console.log(`[LINECHART] ${label} received data:`, {
    length: data?.length || 0,
    sample: data?.slice(-3) || [],
    hasData: !!(data && data.length > 0),
    highlightCurrent
  });

  useEffect(() => {
    // Trigger animation on data change
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [data]);

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
    const y = height - padding - ((d.value - minValue) / range) * (height - 2 * padding - 10);
    return { x, y, value: d.value, time: d.time };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const areaPath = `M ${points[0]?.x || 0},${height - padding} ${pathData} L ${points[points.length - 1]?.x || 0},${height - padding} Z`;

  // Get the last point for highlighting
  const lastPoint = points[points.length - 1];

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * width;
    
    // Find closest point
    let closestPoint = points[0];
    let minDistance = Math.abs(mouseX - points[0].x);
    
    points.forEach(point => {
      const distance = Math.abs(mouseX - point.x);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });
    
    setHoveredPoint(closestPoint);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="relative w-full" style={{ height }}>
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full cursor-crosshair" 
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path 
          d={areaPath} 
          fill={`url(#gradient-${label})`}
          className={isAnimating ? 'animate-pulse' : ''}
        />
        
        {/* Main line */}
        <path 
          d={pathData} 
          fill="none" 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={`transition-all duration-300 ${isAnimating ? 'animate-pulse' : ''}`}
          style={{
            filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.3))',
            strokeDasharray: isAnimating ? '5,5' : 'none',
            animation: isAnimating ? 'dash 1s linear infinite' : 'none'
          }}
        />
        
        {/* Data points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={hoveredPoint === point ? "2" : "1"}
            fill={color}
            stroke="white"
            strokeWidth="0.5"
            className={`transition-all duration-200 ${hoveredPoint === point ? 'opacity-100' : 'opacity-60'}`}
          />
        ))}
        
        {/* Current value highlight */}
        {highlightCurrent && lastPoint && (
          <circle 
            cx={lastPoint.x} 
            cy={lastPoint.y} 
            r="2.5" 
            fill={color} 
            stroke="white" 
            strokeWidth="1"
            className="animate-pulse"
          />
        )}
        
        {/* Hover line */}
        {hoveredPoint && (
          <line
            x1={hoveredPoint.x}
            y1={padding}
            x2={hoveredPoint.x}
            y2={height - padding}
            stroke="white"
            strokeWidth="0.5"
            strokeOpacity="0.5"
            strokeDasharray="2,2"
          />
        )}
      </svg>
      
      {/* Labels */}
      <div className="absolute top-1 left-2 text-[10px] text-white/50">{label}</div>
      <div className={`absolute top-1 right-2 text-[11px] font-mono font-bold ${highlightCurrent ? 'bg-black/40 px-1 rounded' : ''}`} style={{ color }}>
        {valueFormatter(values[values.length - 1] || 0)}
        {highlightCurrent && <span className="text-white/60 text-[9px] ml-1">LIVE</span>}
      </div>
      <div className="absolute bottom-1 left-2 text-[9px] text-white/30 font-mono">{valueFormatter(minValue)}</div>
      <div className="absolute bottom-1 right-2 text-[9px] text-white/30 font-mono">{valueFormatter(maxValue)}</div>
      
      {/* Hover tooltip */}
      {hoveredPoint && (
        <div 
          className="absolute bg-black/80 border border-white/20 rounded px-2 py-1 text-xs text-white pointer-events-none z-10"
          style={{
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
            transform: 'translate(-50%, -120%)'
          }}
        >
          <div className="font-mono" style={{ color }}>{valueFormatter(hoveredPoint.value)}</div>
          <div className="text-white/60 text-[10px]">
            {new Date(hoveredPoint.time * 1000).toLocaleString()}
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -10;
          }
        }
      `}</style>
    </div>
  );
};

// Enhanced Status Timeline Chart with animations
const StatusChart = ({ data, height = 50 }: { data: { time: number; status: string }[]; height?: number }) => {
  const [isAnimating, setIsAnimating] = useState(true);

  console.log(`[STATUSCHART] received data:`, {
    length: data?.length || 0,
    sample: data?.slice(0, 3) || [],
    hasData: !!(data && data.length > 0)
  });

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 800);
    return () => clearTimeout(timer);
  }, [data]);

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-white/40 text-sm">No data</div>;
  }

  const statusColors: Record<string, string> = { online: '#10b981', syncing: '#f59e0b', offline: '#ef4444' };
  const barWidth = 100 / data.length;

  return (
    <div className="relative w-full" style={{ height }}>
      <svg viewBox="0 0 100 30" className="w-full h-full" preserveAspectRatio="none">
        {data.map((d, i) => (
          <rect 
            key={i} 
            x={i * barWidth} 
            y="2" 
            width={barWidth} 
            height="26" 
            fill={statusColors[d.status] || '#374151'}
            className={isAnimating ? 'animate-pulse' : 'transition-all duration-300'}
            style={{
              animationDelay: `${i * 50}ms`,
              opacity: isAnimating ? 0.7 : 1
            }}
          />
        ))}
      </svg>
      <div className="flex justify-center gap-3 mt-1">
        <div className="flex items-center gap-1 text-[10px]"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-white/50">Online</span></div>
        <div className="flex items-center gap-1 text-[10px]"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="text-white/50">Syncing</span></div>
        <div className="flex items-center gap-1 text-[10px]"><div className="w-2 h-2 rounded-full bg-red-500"></div><span className="text-white/50">Offline</span></div>
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
    import('leaflet').then(leaflet => setL(leaflet.default));
  }, []);

  useEffect(() => {
    if (!isClient || !L || !mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [lat, lon], zoom: 5, minZoom: 2, maxZoom: 10,
      zoomControl: true, scrollWheelZoom: true, attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19
    }).addTo(map);

    const customIcon = L.divIcon({
      html: `<div style="width:20px;height:20px;background:radial-gradient(circle,rgba(16,185,129,1) 0%,rgba(16,185,129,0.6) 70%);border:2px solid rgba(255,255,255,0.8);border-radius:50%;box-shadow:0 0 15px rgba(16,185,129,0.8);"></div>`,
      className: 'custom-node-marker', iconSize: [20, 20], iconAnchor: [10, 10],
    });

    L.marker([lat, lon], { icon: customIcon }).addTo(map);
    mapInstanceRef.current = map;

    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [isClient, L, lat, lon]);

  if (!isClient || !L) return <div className="w-full h-full min-h-[180px] bg-gray-900 rounded-lg flex items-center justify-center"><div className="text-white/60 text-sm">Loading map...</div></div>;

  return <div ref={mapRef} className="w-full h-full min-h-[180px] rounded-lg overflow-hidden" />;
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

const getTimeAgo = (timestamp: number) => {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
};


// Main Component
export function NodeProfileClient({ ip }: NodeProfileClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NodeProfileData | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async (showToast = false, rangeHours?: number) => {
    try {
      let hours: number;
      if (rangeHours !== undefined) {
        hours = rangeHours;
      } else {
        const selectedRange = timeRangeOptions.find(r => r.value === timeRange);
        hours = selectedRange?.hours || 168; // Default to 7 days
        // For "All time", fetch all available data (use a very large number)
        if (timeRange === 'all') {
          hours = 8760; // 1 year worth of hours - should cover all data
        }
      }
      
      console.log(`[PROFILE] Fetching data for IP: ${ip}, hours: ${hours}, timeRange: ${timeRange}`);
      
      const response = await fetch(`/api/node-profile?ip=${encodeURIComponent(ip)}&source=both&hours=${hours}`);
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
      
      const profileData = await response.json();
      console.log(`[PROFILE] Received data:`, {
        ip: profileData.ip,
        hasCurrentNode: !!profileData.currentNode,
        dbHistoryCount: profileData.dbHistory?.length || 0,
        dbEventsCount: profileData.dbEvents?.length || 0,
        currentCredits: profileData.currentNode?.credits,
        previousCredits: profileData.currentNode?.previousCredits,
        totalCredits: profileData.currentNode?.totalCredits,
      });
      
      setData(profileData);
      setLastUpdate(new Date());
      if (showToast) toast.success('Data refreshed');
    } catch (err: any) {
      console.error('[PROFILE] Error fetching node profile:', err);
      if (!data) {
        setError('Failed to load node profile');
        toast.error('Failed to load node profile');
      }
    } finally {
      setLoading(false);
    }
  }, [ip, data, timeRange]);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    fetchData(true, 168); // Fetch 7 days of data initially (default)
  }, [ip]);

  // Refetch when time range changes
  useEffect(() => {
    let hours: number;
    if (timeRange === 'all') {
      hours = 8760; // 1 year worth of hours for "All time"
    } else {
      hours = timeRangeOptions.find(r => r.value === timeRange)?.hours || 168; // Default to 7 days
    }
    fetchData(false, hours);
  }, [timeRange]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchData(false), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Filter MongoDB history based on time range (data is already sorted by timestamp ascending from API)
  const filteredDbHistory = data?.dbHistory?.filter(entry => {
    // If "All time" is selected, show all data
    if (timeRange === 'all') return true;
    
    const now = Date.now();
    const entryTime = entry.timestamp * 1000;
    const rangeHours = timeRangeOptions.find(r => r.value === timeRange)?.hours || 7;
    const isWithinRange = now - entryTime <= rangeHours * 3600 * 1000;
    return isWithinRange;
  }) || [];

  // Always ensure we have meaningful data to display
  // If filtered data is too sparse (less than 5 points), show more recent data
  // Exception: for "All time", always use all available data
  const minDataPoints = 5;
  let displayHistory = filteredDbHistory;
  
  if (timeRange !== 'all' && filteredDbHistory.length < minDataPoints && (data?.dbHistory?.length || 0) > 0) {
    // Show recent data to ensure charts are meaningful
    const recentDataCount = Math.min(50, data?.dbHistory?.length || 0);
    displayHistory = data?.dbHistory?.slice(-recentDataCount) || [];
  }
  
  // Always show at least some data if we have any in the database
  const hasAnyData = (data?.dbHistory?.length || 0) > 0;
  const isShowingFallbackData = timeRange !== 'all' && displayHistory.length > filteredDbHistory.length;

  console.log(`[PROFILE-CLIENT] Filtered data for ${timeRange}:`, {
    totalDbHistory: data?.dbHistory?.length || 0,
    filteredCount: filteredDbHistory.length,
    displayCount: displayHistory.length,
    hasAnyData,
    isShowingFallbackData,
    timeRange,
    rangeHours: timeRange === 'all' ? 'all' : (timeRangeOptions.find(r => r.value === timeRange)?.hours || 168),
    firstEntry: displayHistory[0] ? new Date(displayHistory[0].timestamp * 1000).toISOString() : 'none',
    lastEntry: displayHistory[displayHistory.length - 1] ? new Date(displayHistory[displayHistory.length - 1].timestamp * 1000).toISOString() : 'none',
    oldestInDb: data?.dbHistory?.[0] ? new Date(data.dbHistory[0].timestamp * 1000).toISOString() : 'none',
    newestInDb: data?.dbHistory?.[data.dbHistory.length - 1] ? new Date(data.dbHistory[data.dbHistory.length - 1].timestamp * 1000).toISOString() : 'none'
  });

  // Get node data first
  const node = data?.currentNode;

  // Generate chart data from MongoDB snapshots (data is already in chronological order)
  const statusData = displayHistory.map(h => ({ time: h.timestamp, status: h.status }));
  const uptimeData = displayHistory.map(h => ({ time: h.timestamp, value: h.uptime / 3600 }));
  const creditsData = displayHistory.map(h => ({ time: h.timestamp, value: h.credits || 0 }));
  const storageData = displayHistory.map(h => ({ time: h.timestamp, value: h.storage_committed / (1024**3) }));

  // Add current live data point to charts if we have current node data
  const currentCredits = node?.credits || 0;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  
  if (node) {
    // Always add current data point to make charts more current and ensure we have data
    statusData.push({ time: currentTimestamp, status: node.status });
    uptimeData.push({ time: currentTimestamp, value: node.uptime / 3600 });
    creditsData.push({ time: currentTimestamp, value: currentCredits });
    storageData.push({ time: currentTimestamp, value: node.storage_committed / (1024**3) });
    
    // If we have very little historical data, add a baseline point from 1 hour ago
    if (displayHistory.length < 2) {
      const oneHourAgo = currentTimestamp - 3600;
      statusData.unshift({ time: oneHourAgo, status: node.status });
      uptimeData.unshift({ time: oneHourAgo, value: Math.max(0, (node.uptime - 3600) / 3600) });
      creditsData.unshift({ time: oneHourAgo, value: Math.max(0, currentCredits - 10) }); // Assume small credit change
      storageData.unshift({ time: oneHourAgo, value: node.storage_committed / (1024**3) });
    }
  }

  console.log(`[PROFILE-CLIENT] Chart data generated:`, {
    statusData: statusData.length,
    uptimeData: uptimeData.length,
    creditsData: creditsData.length,
    storageData: storageData.length,
    currentCredits,
    sampleCredits: creditsData.slice(-3),
    sampleUptime: uptimeData.slice(-3),
    creditsRange: creditsData.length > 0 ? `${Math.min(...creditsData.map(d => d.value))} - ${Math.max(...creditsData.map(d => d.value))}` : 'none'
  });

  const location = data?.location;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-white/5 rounded-lg"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-[200px] bg-white/5 rounded-lg"></div>
          <div className="h-[200px] bg-white/5 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-red-400 text-lg">{error}</div>
        <button onClick={() => router.back()} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white">Go Back</button>
      </div>
    );
  }


  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="relative bg-black border border-white/10 p-4 group hover:border-white/20 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white">
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white font-mono">Node {ip}</h1>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBgColor(node?.status || 'offline')}`}>
                  <span className={getStatusColor(node?.status || 'offline')}>{node?.status?.toUpperCase() || 'UNKNOWN'}</span>
                </span>
                {node?.is_public && <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 border border-blue-500/50 text-blue-400">PUBLIC</span>}
              </div>
              <div className="flex items-center gap-2 mt-1 text-white/60 text-sm">
                <span>{ip}</span><CopyButton text={ip} />
                {node?.version && <><span className="text-white/30">•</span><span>v{node.version}</span></>}
                {lastUpdate && <><span className="text-white/30">•</span><span className="text-white/40 text-xs">Updated {lastUpdate.toLocaleTimeString()}</span></>}
              </div>
            </div>
          </div>
          <button onClick={() => fetchData(true)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-white text-sm">Refresh</button>
        </div>
      </div>

      {/* Map and Location */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-white/10 flex items-center gap-2">
            <MapPinIcon className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Node Location</h2>
          </div>
          <div className="h-[180px]">
            {location?.lat && location?.lon ? <NodeLocationMap lat={location.lat} lon={location.lon} city={location.city} country={location.country} /> : <div className="flex items-center justify-center h-full text-white/40 text-sm">Location unavailable</div>}
          </div>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3">
            <GlobeIcon className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Location Details</h2>
          </div>
          <div className="space-y-2 text-sm">
            {location?.country_code && <img src={getCountryFlagUrl(location.country_code)} alt={location.country} className="w-6 h-4 object-cover rounded mb-2" />}
            <div className="flex justify-between"><span className="text-white/60">Country</span><span className="text-white">{location?.country || 'Unknown'}</span></div>
            <div className="flex justify-between"><span className="text-white/60">City</span><span className="text-white">{location?.city || 'Unknown'}</span></div>
            <div className="flex justify-between"><span className="text-white/60">Provider</span><span className="text-white text-xs">{location?.provider || 'Unknown'}</span></div>
            <div className="flex justify-between"><span className="text-white/60">RPC Port</span><span className="text-white font-mono">{node?.rpc_port || 'N/A'}</span></div>
          </div>
        </div>
      </div>


      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div className="bg-black/40 border border-white/10 rounded-lg p-3 hover:border-blue-500/30">
          <div className="flex items-center gap-1.5 text-blue-400/70 text-xs mb-1"><ClockIcon className="w-3 h-3" /><span>Uptime</span></div>
          <div className="text-lg font-bold text-blue-400">{formatUptime(node?.uptime || 0)}</div>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-lg p-3 hover:border-orange-500/30">
          <div className="flex items-center gap-1.5 text-orange-400/70 text-xs mb-1"><ServerIcon className="w-3 h-3" /><span>Storage</span></div>
          <div className="text-lg font-bold text-orange-400">{formatBytes(node?.storage_committed || 0)}</div>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-lg p-3 hover:border-yellow-500/30">
          <div className="flex items-center gap-1.5 text-yellow-400/70 text-xs mb-1"><ServerIcon className="w-3 h-3" /><span>Used</span></div>
          <div className="text-lg font-bold text-yellow-400">{formatBytes(node?.storage_used || 0)}</div>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-lg p-3 hover:border-emerald-500/30">
          <div className="flex items-center gap-1.5 text-emerald-400/70 text-xs mb-1"><ActivityIcon className="w-3 h-3" /><span>Credits</span></div>
          <div className="space-y-1">
            <div className="text-lg font-bold text-emerald-400">{(node?.totalCredits || node?.credits || 0).toLocaleString()}</div>
            <div className="text-xs text-white/50 space-y-0.5">
              <div>
                <span className="text-emerald-400/70">Current:</span> {(node?.credits || 0).toLocaleString()}
              </div>
              {node?.previousCredits && node.previousCredits > 0 && (
                <div>
                  <span className="text-amber-400/70">Previous:</span> {node.previousCredits.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-lg p-3 hover:border-purple-500/30">
          <div className="flex items-center gap-1.5 text-purple-400/70 text-xs mb-1"><ActivityIcon className="w-3 h-3" /><span>Streams</span></div>
          <div className="text-lg font-bold text-purple-400">{node?.active_streams || 0}</div>
        </div>
      </div>

      {/* Charts from MongoDB Data */}
      {(hasAnyData || node) && (
        <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-semibold text-white">Historical Performance</h2>
              <span className="text-white/40 text-xs">({displayHistory.length} snapshots)</span>
              {isShowingFallbackData && (
                <span className="text-amber-400/70 text-xs">(showing extended data)</span>
              )}
            </div>
            <div className="flex items-center gap-1 bg-black/40 rounded p-0.5">
              {timeRangeOptions.map(opt => (
                <button key={opt.value} onClick={() => setTimeRange(opt.value)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${timeRange === opt.value ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white'}`}>
                  {opt.label}
                </button>
              ))}
              <div className="ml-2 text-xs text-white/40">
                {timeRange === 'all' ? `All ${displayHistory.length} records` : 
                 filteredDbHistory.length > 0 ? `${filteredDbHistory.length} in range` : 'Extended view'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
            <div className="bg-black/20 border border-white/5 rounded-lg p-3">
              <h3 className="text-xs font-medium text-white/70 mb-2">Node Status</h3>
              <StatusChart data={statusData} height={50} />
            </div>
            <div className="bg-black/20 border border-white/5 rounded-lg p-3">
              <h3 className="text-xs font-medium text-white/70 mb-2">Uptime (hours)</h3>
              <LineChart data={uptimeData} color="#3b82f6" height={80} label="Uptime" valueFormatter={v => `${v.toFixed(1)}h`} highlightCurrent={true} />
            </div>
            <div className="bg-black/20 border border-white/5 rounded-lg p-3">
              <h3 className="text-xs font-medium text-white/70 mb-2">Credits</h3>
              <LineChart 
                data={creditsData} 
                color="#10b981" 
                height={80} 
                label="Credits" 
                valueFormatter={v => {
                  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
                  return v.toLocaleString();
                }} 
                highlightCurrent={true} 
              />
            </div>
            <div className="bg-black/20 border border-white/5 rounded-lg p-3">
              <h3 className="text-xs font-medium text-white/70 mb-2">Storage (GB)</h3>
              <LineChart data={storageData} color="#f59e0b" height={80} label="Storage" valueFormatter={v => `${v.toFixed(1)} GB`} highlightCurrent={true} />
            </div>
          </div>
        </div>
      )}

      {/* Node Events Table */}
      {data?.dbEvents && data.dbEvents.length > 0 && (
        <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-white/10 flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-white">Recent Events</h2>
            <span className="text-white/30 text-xs">({data.dbEvents.length})</span>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-black/80">
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-2 text-white/60 text-xs font-medium uppercase">Timestamp</th>
                  <th className="text-left px-4 py-2 text-white/60 text-xs font-medium uppercase">Event Type</th>
                  <th className="text-left px-4 py-2 text-white/60 text-xs font-medium uppercase">Details</th>
                  <th className="text-right px-4 py-2 text-white/60 text-xs font-medium uppercase">Time Ago</th>
                </tr>
              </thead>
              <tbody>
                {data.dbEvents.slice(0, 50).map((event, idx) => {
                  const config = eventTypeConfig[event.event_type] || { color: 'text-white/50', bgColor: '', label: event.event_type };
                  const eventDate = new Date(event.timestamp * 1000);
                  const timeAgo = getTimeAgo(event.timestamp);
                  
                  return (
                    <tr key={event._id || idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-white/70 text-xs font-mono">{eventDate.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            event.event_type === 'node_online' ? 'bg-emerald-400' :
                            event.event_type === 'node_offline' ? 'bg-red-400' :
                            event.event_type === 'node_new' ? 'bg-amber-400' :
                            event.event_type === 'version_change' ? 'bg-purple-400' :
                            event.event_type === 'storage_change' ? 'bg-orange-400' :
                            event.event_type === 'credits_change' ? 'bg-cyan-400' :
                            'bg-white/40'
                          }`} />
                          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white/70 text-sm">
                          {event.event_type === 'status_change' && (
                            <span><span className="text-white/50">{event.previous_status}</span> → <span className="text-emerald-400">{event.new_status}</span></span>
                          )}
                          {event.event_type === 'version_change' && (
                            <span><span className="text-white/50">{event.previous_version || String(event.previous_value)}</span> → <span className="text-emerald-400">{event.new_version || String(event.new_value)}</span></span>
                          )}
                          {event.event_type === 'node_new' && (
                            <span>v{event.details?.version || '?'} • {formatBytes(event.details?.storage_committed || 0)} • {(event.details?.credits || 0).toLocaleString()} credits</span>
                          )}
                          {event.event_type === 'node_online' && (
                            <span>Node came online{event.previous_status ? ` from ${event.previous_status}` : ''}</span>
                          )}
                          {event.event_type === 'node_offline' && (
                            <span>Node went offline{event.previous_status ? ` from ${event.previous_status}` : ''}</span>
                          )}
                          {event.event_type === 'storage_change' && (
                            <span><span className="text-white/50">{(Number(event.previous_value) * 100).toFixed(1)}%</span> → <span className="text-orange-400">{(Number(event.new_value) * 100).toFixed(1)}%</span></span>
                          )}
                          {event.event_type === 'credits_change' && (
                            <span><span className="text-white/50">{Number(event.previous_value)?.toLocaleString()}</span> → <span className="text-cyan-400">{Number(event.new_value)?.toLocaleString()}</span></span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-white/60 text-xs">{timeAgo}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stored Snapshots Table */}
      {hasAnyData && displayHistory.length > 0 && (
        <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-white/10 flex items-center gap-2">
            <ServerIcon className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Stored Snapshots</h2>
            <span className="text-white/40 text-xs">({displayHistory.length} snapshots)</span>
            {isShowingFallbackData && (
              <span className="text-amber-400/70 text-xs">(showing extended data)</span>
            )}
          </div>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-black/80">
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-2 text-white/60 text-xs font-medium uppercase">Timestamp</th>
                  <th className="text-center px-4 py-2 text-white/60 text-xs font-medium uppercase">Status</th>
                  <th className="text-right px-4 py-2 text-white/60 text-xs font-medium uppercase">Uptime</th>
                  <th className="text-right px-4 py-2 text-white/60 text-xs font-medium uppercase">Storage</th>
                  <th className="text-right px-4 py-2 text-white/60 text-xs font-medium uppercase">Credits</th>
                </tr>
              </thead>
              <tbody>
                {[...displayHistory].reverse().slice(0, 50).map((snapshot, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-2 text-white/70 text-xs font-mono">{new Date(snapshot.timestamp * 1000).toLocaleString()}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBgColor(snapshot.status)} ${getStatusColor(snapshot.status)}`}>
                        {snapshot.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-white/70 text-xs font-mono">{formatUptime(snapshot.uptime)}</td>
                    <td className="px-4 py-2 text-right text-white/70 text-xs font-mono">{formatBytes(snapshot.storage_committed)}</td>
                    <td className="px-4 py-2 text-right text-cyan-400 text-xs font-mono font-bold">{snapshot.credits?.toLocaleString() || 0}</td>
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
