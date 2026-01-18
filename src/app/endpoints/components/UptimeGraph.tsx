'use client';

import React from 'react';

interface UptimeDataPoint {
  timestamp: string;
  status: 'up' | 'down';
  responseTime?: number;
}

interface RecentCall {
  endpoint: string;
  method: string;
  network: string;
  success: boolean;
  responseTime: number;
  timestamp: string;
}

interface EndpointStatus {
  name: string;
  url: string;
  status: 'operational' | 'degraded' | 'down';
  responseTime: number;
  uptime: number;
  lastChecked: string;
  network: 'devnet' | 'mainnet';
  uptimeHistory?: UptimeDataPoint[];
  recentCalls?: RecentCall[];
}

interface UptimeGraphProps {
  endpoint: EndpointStatus;
  className?: string;
  onUptimeCalculated?: (uptime: number) => void; // Add callback for uptime
}

export const UptimeGraph: React.FC<UptimeGraphProps> = ({ 
  endpoint, 
  className = '',
  onUptimeCalculated
}) => {
  // Convert recentCalls to uptimeHistory format if needed
  const convertRecentCallsToUptimeHistory = (calls: RecentCall[]): UptimeDataPoint[] => {
    return calls.map(call => ({
      timestamp: call.timestamp,
      status: call.success ? 'up' : 'down',
      responseTime: call.responseTime
    }));
  };

  const data = endpoint.uptimeHistory || 
    (endpoint.recentCalls ? convertRecentCallsToUptimeHistory(endpoint.recentCalls) : []);
  
  const uptime = endpoint.uptime || 0;
  // Group data by recent time periods (every 30 seconds for real-time view)
  const groupedData = React.useMemo(() => {
    if (!data.length) {
      // Show empty state instead of simulated data
      return [];
    }

    // Use actual data, filling gaps for continuous display
    const periods = [];
    const now = new Date();
    
    // Create time slots based on available data (30 minutes = 60 periods)
    const dataCount = Math.min(data.length, 60); // Changed from 90 to 60
    
    for (let i = dataCount - 1; i >= 0; i--) {
      const dataPoint = data[data.length - 1 - i];
      periods.push({
        timestamp: dataPoint.timestamp,
        status: dataPoint.status,
        responseTime: dataPoint.responseTime || 0
      });
    }
    
    return periods;
  }, [data, uptime]); // Add uptime as dependency to trigger updates

  // Calculate actual uptime from the graph data
  const actualUptime = React.useMemo(() => {
    if (groupedData.length === 0) return 0;
    const upCount = groupedData.filter(point => point.status === 'up').length;
    return Math.round((upCount / groupedData.length) * 100 * 10) / 10;
  }, [groupedData]);

  // Use actual uptime from graph data instead of endpoint.uptime
  const displayUptime = groupedData.length > 0 ? actualUptime : uptime;

  // Track previous uptime to prevent unnecessary callbacks
  const prevUptimeRef = React.useRef<number | undefined>(undefined);
  const callbackTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Notify parent component of calculated uptime (debounced)
  React.useEffect(() => {
    if (onUptimeCalculated && groupedData.length > 0 && actualUptime !== undefined) {
      // Only call if the uptime has actually changed
      if (prevUptimeRef.current !== actualUptime) {
        prevUptimeRef.current = actualUptime;
        
        // Clear any existing timeout
        if (callbackTimeoutRef.current) {
          clearTimeout(callbackTimeoutRef.current);
        }
        
        // Debounce the callback to prevent rapid updates
        callbackTimeoutRef.current = setTimeout(() => {
          onUptimeCalculated(actualUptime);
        }, 100);
      }
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (callbackTimeoutRef.current) {
        clearTimeout(callbackTimeoutRef.current);
      }
    };
  }, [actualUptime, onUptimeCalculated, groupedData.length]);

  const getStatusColor = (status: 'up' | 'down', responseTime?: number) => {
    if (status === 'down') return 'bg-red-500';
    if (responseTime && responseTime > 1000) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const getStatusText = (uptime: number) => {
    if (uptime >= 99.9) return 'Operational';
    if (uptime >= 95) return 'Degraded';
    return 'Down';
  };

  const getStatusTextColor = (uptime: number) => {
    if (uptime >= 99.9) return 'text-emerald-400';
    if (uptime >= 95) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className={`${className}`}>
      {/* Uptime Graph */}
      <div className="space-y-2">        
        {/* Graph bars - continuous real-time view */}
        <div className="flex h-12 bg-white/5 p-1 rounded">
          {groupedData.length > 0 ? (
            groupedData.map((point, index) => (
              <div
                key={index}
                className={`flex-1 ${getStatusColor(point.status, point.responseTime)} transition-all duration-200 hover:opacity-80 ${index > 0 ? 'ml-px' : ''}`}
                title={`${new Date(point.timestamp).toLocaleTimeString()}: ${point.status === 'up' ? 'Online' : 'Offline'} (${point.responseTime}ms)`}
              />
            ))
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/40 text-xs">
              No data yet
            </div>
          )}
        </div>
        
        {/* Timeline labels */}
        <div className="flex items-center justify-between text-[10px] text-white/40">
          <span>{groupedData.length > 0 ? `${groupedData.length} checks` : 'Waiting...'}</span>
          <span>Now</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-2 text-[10px] text-white/40">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-sm" />
          <span>Up</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-yellow-500 rounded-sm" />
          <span>Slow</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-sm" />
          <span>Down</span>
        </div>
      </div>
    </div>
  );
};