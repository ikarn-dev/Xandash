'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { CopyBtn } from './CopyBtn';

interface NodeData {
  pod_id: string;
  address: string;
  pubkey: string;
  status: string;
  is_public: boolean;
  uptime: number;
  version: string;
  rpc_port: number;
  storage_committed: number;
  storage_available: number;
  storage_used?: number;
  storage_usage_percent?: number;
  cpu_percent?: number;
  cpu_usage?: number;
  memory_usage?: number;
  ram_used?: number;
  ram_total?: number;
  network_in?: number;
  network_out?: number;
  packets_sent?: number;
  packets_received?: number;
  total_bytes?: number;
  active_streams?: number;
  location?: {
    country?: string;
    city?: string;
    region?: string;
    country_code?: string;
  };
  last_seen?: string;
  last_seen_timestamp?: number;
  [key: string]: any;
}

interface NodeProfileCardProps {
  node: NodeData;
  onCopy?: (text: string, type: string) => void;
  className?: string;
}

// Custom SVG Icons matching app theme
const UptimeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" className="text-cyan-500/30" />
    <path d="M12 6v6l4 2" className="text-cyan-400" strokeLinecap="round" />
  </svg>
);

const StorageIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="4" width="16" height="6" rx="1" className="text-purple-400" />
    <rect x="4" y="14" width="16" height="6" rx="1" className="text-purple-400/50" />
    <circle cx="7" cy="7" r="1" fill="currentColor" className="text-purple-300" />
    <circle cx="7" cy="17" r="1" fill="currentColor" className="text-purple-300/50" />
  </svg>
);

const VersionIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" className="text-green-400" />
    <path d="M9 12l2 2 4-4" className="text-green-300" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PortIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" className="text-orange-400" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" className="text-orange-300" strokeLinecap="round" />
    <circle cx="12" cy="12" r="8" className="text-orange-400/30" strokeDasharray="4 2" />
  </svg>
);

const LocationIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" className="text-red-400" />
    <circle cx="12" cy="9" r="2.5" className="text-red-300" />
  </svg>
);

const NetworkIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 17l6-6 4 4 6-6" className="text-blue-400" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 11v-6h-6" className="text-blue-300" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PublicIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" className="text-blue-400" />
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" className="text-blue-300" />
  </svg>
);

// Animated bar chart component
const AnimatedBar: React.FC<{
  value: number;
  max: number;
  color: string;
  delay?: number;
}> = ({ value, max, color, delay = 0 }) => {
  const [width, setWidth] = useState(0);
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  useEffect(() => {
    const timer = setTimeout(() => setWidth(percentage), delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  );
};

// Mini sparkline component based on actual data
const MiniSparkline: React.FC<{ sent: number; received: number; color: string }> = ({ sent, received, color }) => {
  // Generate a simple visualization based on the ratio
  const total = sent + received;
  const height = 24;
  const width = 60;

  // Create a simple wave pattern
  const points = [];
  for (let i = 0; i <= 10; i++) {
    const x = (i / 10) * width;
    const variance = Math.sin(i * 0.8) * 8 + Math.cos(i * 1.2) * 4;
    const y = height / 2 + variance;
    points.push(`${x},${y}`);
  }

  return (
    <svg width={width} height={height} className="opacity-80">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points.join(' ')}
      />
    </svg>
  );
};

export const NodeProfileCard: React.FC<NodeProfileCardProps> = ({
  node,
  onCopy,
  className = ""
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'online': return '#22c55e';
      case 'offline': return '#ef4444';
      case 'maintenance': return '#eab308';
      case 'syncing': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getLocationString = () => {
    if (!node.location) return null;
    const parts = [node.location.city, node.location.region, node.location.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const getCountryFlag = () => {
    if (node.location?.country_code) {
      const flagCdnUrl = process.env.NEXT_PUBLIC_FLAG_CDN_URL || 'https://flagcdn.com';
      return `${flagCdnUrl}/24x18/${node.location.country_code.toLowerCase()}.png`;
    }
    return null;
  };

  // Determine online status from last_seen_timestamp
  const getOnlineStatus = useMemo(() => {
    if (node.last_seen_timestamp) {
      const now = Math.floor(Date.now() / 1000);
      const timeDiff = now - node.last_seen_timestamp;
      if (timeDiff < 300) return 'online';
      if (timeDiff < 3600) return 'maintenance';
      return 'offline';
    }
    return node.status || 'offline';
  }, [node.last_seen_timestamp, node.status]);

  const actualStatus = getOnlineStatus;

  // Get actual storage percentage from API data
  // storage_usage_percent from API is a decimal (e.g., 0.0001 = 0.01%)
  const storagePercent = node.storage_usage_percent
    ? node.storage_usage_percent * 100 // Convert decimal to percentage
    : (node.storage_committed && node.storage_used
      ? (node.storage_used / node.storage_committed) * 100
      : 0);

  // Calculate storage used from percentage if not directly available
  const storageUsed = node.storage_used ??
    (node.storage_committed && node.storage_usage_percent
      ? node.storage_committed * node.storage_usage_percent
      : 0);

  // Check if we have network data available
  const hasNetworkData = (node.packets_sent ?? 0) > 0 || (node.packets_received ?? 0) > 0 || (node.total_bytes ?? 0) > 0;
  const packetsSent = node.packets_sent ?? 0;
  const packetsReceived = node.packets_received ?? 0;
  const totalBytes = node.total_bytes ?? 0;

  // Calculate max for network bars (use total or a reasonable default)
  const maxPackets = Math.max(packetsSent, packetsReceived, 1);

  return (
    <div
      className={`relative bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        } ${className}`}
    >
      {/* Corner accents - WHITE */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/50 rounded-tl-xl" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white/50 rounded-tr-xl" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/50 rounded-bl-xl" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/50 rounded-br-xl" />

      <div className="p-4">
        {/* Header - Only show IP and status indicator, no "Unknown" text */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: getStatusColor(actualStatus) }}
            />
            <h3 className="text-white font-semibold text-sm">
              {node.address?.split(':')[0] || node.pod_id || 'Unknown'}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            {node.is_public && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-white/10 text-white/80 rounded-full text-xs border border-white/20">
                <PublicIcon />
                <span>Public</span>
              </div>
            )}
          </div>
        </div>

        {/* Location Bar - Only show if location exists */}
        {getLocationString() && (
          <div className="flex items-center space-x-2 mb-4 p-2 bg-white/5 rounded-lg">
            <LocationIcon />
            {getCountryFlag() && (
              <img src={getCountryFlag()!} alt="Country flag" className="w-5 h-4 rounded-sm" />
            )}
            <span className="text-white/80 text-xs">{getLocationString()}</span>
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-white/5 rounded-lg p-2 text-center group hover:bg-cyan-500/10 transition-colors">
            <div className="flex justify-center mb-1 text-cyan-400 group-hover:scale-110 transition-transform">
              <UptimeIcon />
            </div>
            <div className="text-white/50 text-[10px]">Uptime</div>
            <div className="text-white text-xs font-bold">{formatUptime(node.uptime || 0)}</div>
          </div>

          <div className="bg-white/5 rounded-lg p-2 text-center group hover:bg-purple-500/10 transition-colors">
            <div className="flex justify-center mb-1 text-purple-400 group-hover:scale-110 transition-transform">
              <StorageIcon />
            </div>
            <div className="text-white/50 text-[10px]">Storage</div>
            <div className="text-white text-xs font-bold">{formatBytes(node.storage_committed || 0)}</div>
          </div>

          <div className="bg-white/5 rounded-lg p-2 text-center group hover:bg-green-500/10 transition-colors">
            <div className="flex justify-center mb-1 text-green-400 group-hover:scale-110 transition-transform">
              <VersionIcon />
            </div>
            <div className="text-white/50 text-[10px]">Version</div>
            <div className="text-white text-xs font-bold">{node.version || 'N/A'}</div>
          </div>

          <div className="bg-white/5 rounded-lg p-2 text-center group hover:bg-orange-500/10 transition-colors">
            <div className="flex justify-center mb-1 text-orange-400 group-hover:scale-110 transition-transform">
              <PortIcon />
            </div>
            <div className="text-white/50 text-[10px]">RPC Port</div>
            <div className="text-white text-xs font-bold">{node.rpc_port || 'N/A'}</div>
          </div>
        </div>

        {/* Storage Usage - Single metric since CPU/Memory not available per-node */}
        <div className="bg-white/5 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <StorageIcon />
              <span className="text-white/60 text-xs">Storage Usage</span>
            </div>
            <span className="text-white/80 text-xs font-mono">
              {formatBytes(storageUsed)} / {formatBytes(node.storage_committed || 0)}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <AnimatedBar
                value={storagePercent}
                max={100}
                color="#a855f7"
                delay={100}
              />
            </div>
            <span className="text-white text-sm font-bold min-w-[50px] text-right">
              {storagePercent.toFixed(4)}%
            </span>
          </div>
        </div>

        {/* Network Activity - Only show if data available */}
        {hasNetworkData && (
          <div className="bg-white/5 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <NetworkIcon />
                <span className="text-white/50 text-xs">Network Activity</span>
              </div>
              <MiniSparkline sent={packetsSent} received={packetsReceived} color="#3b82f6" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-green-400">↑ Sent</span>
                  <span className="text-white/60">{formatNumber(packetsSent)}</span>
                </div>
                <AnimatedBar value={packetsSent} max={maxPackets} color="#22c55e" delay={200} />
              </div>
              <div>
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className="text-blue-400">↓ Received</span>
                  <span className="text-white/60">{formatNumber(packetsReceived)}</span>
                </div>
                <AnimatedBar value={packetsReceived} max={maxPackets} color="#3b82f6" delay={400} />
              </div>
            </div>
            {totalBytes > 0 && (
              <div className="mt-2 text-center text-white/40 text-[10px]">
                Total: {formatBytes(totalBytes)}
              </div>
            )}
          </div>
        )}

        {/* Technical Details - Compact */}
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
            <div className="flex-1 min-w-0">
              <div className="text-white/40 text-[10px]">Address</div>
              <div className="text-white text-xs font-mono truncate">{node.address || 'N/A'}</div>
            </div>
            {node.address && <CopyBtn text={node.address} onCopy={onCopy} type="Address" />}
          </div>

          <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
            <div className="flex-1 min-w-0">
              <div className="text-white/40 text-[10px]">Public Key</div>
              <div className="text-white text-xs font-mono truncate">
                {node.pubkey ? `${node.pubkey.substring(0, 12)}...${node.pubkey.slice(-8)}` : 'N/A'}
              </div>
            </div>
            {node.pubkey && <CopyBtn text={node.pubkey} onCopy={onCopy} type="Public Key" />}
          </div>
        </div>
      </div>
    </div>
  );
};
