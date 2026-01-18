'use client';

import React, { useState } from 'react';
import { Server, Globe, Clock, Activity, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { UptimeGraph } from './UptimeGraph';
import { CornerAccents } from '@/components/ui';

interface UptimeDataPoint {
  timestamp: string;
  status: 'up' | 'down';
  responseTime?: number;
}

interface EndpointStatus {
  name: string;
  url: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime: number;
  uptime: number;
  lastChecked: string;
  network: 'devnet' | 'mainnet';
  uptimeHistory: UptimeDataPoint[];
}

interface NetworkEndpointSectionProps {
  network: 'devnet' | 'mainnet';
  endpoints: EndpointStatus[];
  onTestEndpoint: (endpointName: string) => Promise<void>;
  testingEndpoints: Set<string>;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'operational':
      return <CheckCircle className="w-4 h-4 text-emerald-400" />;
    case 'degraded':
      return <AlertCircle className="w-4 h-4 text-yellow-400" />;
    case 'down':
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    default:
      return <AlertCircle className="w-4 h-4 text-white/40" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'operational':
      return 'text-emerald-400';
    case 'degraded':
      return 'text-yellow-400';
    case 'down':
      return 'text-red-400';
    default:
      return 'text-white/40';
  }
};

const getResponseTimeColor = (responseTime: number) => {
  if (responseTime < 200) return 'text-emerald-400';
  if (responseTime < 500) return 'text-yellow-400';
  if (responseTime < 1000) return 'text-orange-400';
  return 'text-red-400';
};

const formatResponseTime = (ms: number) => {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const formatLastChecked = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

export const NetworkEndpointSection: React.FC<NetworkEndpointSectionProps> = ({
  network,
  endpoints,
  onTestEndpoint,
  testingEndpoints
}) => {
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());

  const toggleExpanded = (endpointName: string) => {
    const newExpanded = new Set(expandedEndpoints);
    if (newExpanded.has(endpointName)) {
      newExpanded.delete(endpointName);
    } else {
      newExpanded.add(endpointName);
    }
    setExpandedEndpoints(newExpanded);
  };

  const networkIcon = network === 'mainnet' ?
    <Server className="w-5 h-5 text-blue-400" /> :
    <Globe className="w-5 h-5 text-emerald-400" />;

  const networkColor = network === 'mainnet' ? 'text-blue-400' : 'text-emerald-400';
  const networkBorder = network === 'mainnet' ? 'border-blue-500/20' : 'border-emerald-500/20';

  // Calculate network summary
  const operational = endpoints.filter(e => e.status === 'operational').length;
  const degraded = endpoints.filter(e => e.status === 'degraded').length;
  const down = endpoints.filter(e => e.status === 'down').length;
  const avgUptime = endpoints.length > 0
    ? endpoints.reduce((sum, e) => sum + e.uptime, 0) / endpoints.length
    : 0;
  const avgResponseTime = endpoints.length > 0
    ? endpoints.reduce((sum, e) => sum + e.responseTime, 0) / endpoints.length
    : 0;

  return (
    <div className="space-y-4">
      {/* Network Header */}
      <div className={`relative bg-black border ${networkBorder} p-4 group hover:border-opacity-40 transition-all`}>
        <CornerAccents />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {networkIcon}
            <div>
              <h2 className={`text-lg font-semibold ${networkColor} capitalize`}>
                {network} Network
              </h2>
              <p className="text-white/60 text-sm">
                {endpoints.length} endpoints monitored
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-emerald-400 text-lg font-bold">{operational}</div>
              <div className="text-white/40 text-xs">Operational</div>
            </div>
            {degraded > 0 && (
              <div className="text-center">
                <div className="text-yellow-400 text-lg font-bold">{degraded}</div>
                <div className="text-white/40 text-xs">Degraded</div>
              </div>
            )}
            {down > 0 && (
              <div className="text-center">
                <div className="text-red-400 text-lg font-bold">{down}</div>
                <div className="text-white/40 text-xs">Down</div>
              </div>
            )}
            <div className="text-center">
              <div className="text-white text-lg font-bold">{avgUptime.toFixed(1)}%</div>
              <div className="text-white/40 text-xs">Avg Uptime</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-bold ${getResponseTimeColor(avgResponseTime)}`}>
                {formatResponseTime(avgResponseTime)}
              </div>
              <div className="text-white/40 text-xs">Avg Response</div>
            </div>
          </div>
        </div>
      </div>

      {/* Endpoints List */}
      <div className="space-y-3">
        {endpoints.map((endpoint) => (
          <div key={endpoint.name} className="space-y-0">
            {/* Endpoint Card */}
            <div className="relative bg-black border border-white/10 hover:border-white/20 transition-all group">
              <CornerAccents />
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getStatusIcon(endpoint.status)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium truncate">
                          {endpoint.name}
                        </h3>
                        <span className={`text-sm font-medium ${getStatusColor(endpoint.status)} capitalize`}>
                          {endpoint.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-white/40">
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          <span>{endpoint.uptime.toFixed(1)}% uptime</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className={getResponseTimeColor(endpoint.responseTime)}>
                            {formatResponseTime(endpoint.responseTime)}
                          </span>
                        </div>
                        <span>Last checked {formatLastChecked(endpoint.lastChecked)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpanded(endpoint.name)}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs transition-all"
                    >
                      {expandedEndpoints.has(endpoint.name) ? 'Hide Graph' : 'Show Graph'}
                    </button>
                    <button
                      onClick={() => onTestEndpoint(endpoint.name)}
                      disabled={testingEndpoints.has(endpoint.name)}
                      className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    >
                      {testingEndpoints.has(endpoint.name) ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        'Test Now'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Uptime Graph (Expandable) */}
            {expandedEndpoints.has(endpoint.name) && (
              <UptimeGraph
                endpoint={endpoint}
                className="border-t-0"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};