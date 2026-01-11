'use client';

import { useState, useEffect } from 'react';
import { ChartIcon } from './ProfileIcons';
import { LineChart, StatusChart } from './ProfileCharts';
import { formatCredits } from './utils';
import { TimeRange, timeRangeOptions, DbNodeSnapshot, CurrentNodeData } from './types';
import { CornerAccents } from '@/components/ui/CornerAccents';
import { PingChart } from '@/components/ui/PingChart';
import { useNetwork } from '@/libs/context/network-context';

interface ProfileChartsSectionProps {
  displayHistory: DbNodeSnapshot[];
  node: CurrentNodeData | null;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  filteredDbHistoryLength: number;
  isShowingFallbackData: boolean;
  ip?: string;
}

export const ProfileChartsSection = ({
  displayHistory,
  node,
  timeRange,
  setTimeRange,
  filteredDbHistoryLength,
  isShowingFallbackData,
  ip
}: ProfileChartsSectionProps) => {
  const { network } = useNetwork();
  const [pingHistory, setPingHistory] = useState<Array<{ timestamp: number; ping: number | null; status: string }>>([]);
  const [loadingPing, setLoadingPing] = useState(false);

  // Fetch ping history from MongoDB for mainnet only
  useEffect(() => {
    if (!ip || network !== 'mainnet') {
      setPingHistory([]);
      return;
    }

    const fetchPingHistory = async () => {
      setLoadingPing(true);
      try {
        // Get hours based on time range
        const hours = timeRangeOptions.find(r => r.value === timeRange)?.hours || 24;
        
        const response = await fetch(`/api/ping-history?ip=${ip}&hours=${hours}&network=mainnet`);
        if (response.ok) {
          const data = await response.json();
          if (data.history && data.history.length > 0) {
            setPingHistory(data.history);
          } else {
            // No history in DB, try to get current ping from mainnet-rpc
            const rpcResponse = await fetch('/api/mainnet-rpc');
            if (rpcResponse.ok) {
              const rpcData = await rpcResponse.json();
              const geo = rpcData.geo?.[ip];
              if (geo?.ping !== null && geo?.ping !== undefined) {
                const now = Math.floor(Date.now() / 1000);
                setPingHistory([
                  { timestamp: now, ping: geo.ping, status: 'online' },
                ]);
              }
            }
          }
        }
      } catch (error) {
        console.error('[Profile] Failed to fetch ping history:', error);
      } finally {
        setLoadingPing(false);
      }
    };

    fetchPingHistory();
  }, [ip, network, timeRange]);

  // Generate chart data from MongoDB snapshots
  const statusData = displayHistory.map(h => ({ time: h.timestamp, status: h.status }));
  const uptimeData = displayHistory.map(h => ({ time: h.timestamp, value: h.uptime / 3600 }));
  const creditsData = displayHistory.map(h => ({ time: h.timestamp, value: h.credits || 0 }));
  const storageData = displayHistory.map(h => ({ time: h.timestamp, value: h.storage_committed / (1024**3) }));

  // Add current live data point
  const currentCredits = node?.credits || 0;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  
  if (node) {
    statusData.push({ time: currentTimestamp, status: node.status });
    uptimeData.push({ time: currentTimestamp, value: node.uptime / 3600 });
    creditsData.push({ time: currentTimestamp, value: currentCredits });
    storageData.push({ time: currentTimestamp, value: node.storage_committed / (1024**3) });
    
    if (displayHistory.length < 2) {
      const oneHourAgo = currentTimestamp - 3600;
      statusData.unshift({ time: oneHourAgo, status: node.status });
      uptimeData.unshift({ time: oneHourAgo, value: Math.max(0, (node.uptime - 3600) / 3600) });
      creditsData.unshift({ time: oneHourAgo, value: Math.max(0, currentCredits - 10) });
      storageData.unshift({ time: oneHourAgo, value: node.storage_committed / (1024**3) });
    }
  }

  return (
    <div className="relative bg-black border border-white/10 group hover:border-white/20 transition-all duration-300">
      <CornerAccents color="cyan" />
      
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/20">
              <ChartIcon className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Historical Performance</h2>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span>{displayHistory.length} snapshots</span>
                {isShowingFallbackData && (
                  <span className="text-amber-400/70">(extended data)</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex items-center gap-0.5 bg-black/60 p-0.5 border border-white/10 overflow-x-auto scrollbar-hide">
              {timeRangeOptions.map(opt => (
                <button 
                  key={opt.value} 
                  onClick={() => setTimeRange(opt.value)}
                  className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                    timeRange === opt.value 
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                      : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-white/30 font-mono whitespace-nowrap">
              {timeRange === 'all' ? `${displayHistory.length} total` : 
               filteredDbHistoryLength > 0 ? `${filteredDbHistoryLength} in range` : 'Extended'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts Grid - overflow-visible for tooltips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/5 p-px">
        {/* Node Status */}
        <div className="bg-black p-3 sm:p-4 overflow-visible">
          <h3 className="text-xs font-medium text-white/60 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500"></span>
            Node Status
          </h3>
          <StatusChart data={statusData} height={60} />
        </div>
        
        {/* Ping Latency - Mainnet only */}
        <div className="bg-black p-3 sm:p-4 overflow-visible">
          <h3 className="text-xs font-medium text-white/60 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-cyan-500"></span>
            Ping Latency
            {network === 'devnet' && <span className="text-white/30 text-[10px]">(N/A)</span>}
          </h3>
          {network === 'devnet' ? (
            <div className="flex items-center justify-center h-[100px] text-white/30 text-xs">
              Ping data not available for Devnet
            </div>
          ) : loadingPing ? (
            <div className="flex items-center justify-center h-[100px] text-white/30 text-xs">Loading...</div>
          ) : pingHistory.length === 0 ? (
            <div className="flex items-center justify-center h-[100px] text-white/30 text-xs">
              No ping history available
            </div>
          ) : (
            <PingChart data={pingHistory} height={100} showStats={true} />
          )}
        </div>
        
        {/* Uptime */}
        <div className="bg-black p-3 sm:p-4 overflow-visible">
          <h3 className="text-xs font-medium text-white/60 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-blue-500"></span>
            Uptime
          </h3>
          <LineChart data={uptimeData} color="#3b82f6" height={100} label="Hours" valueFormatter={v => `${v.toFixed(1)}h`} highlightCurrent={true} />
        </div>
        
        {/* Credits */}
        <div className="bg-black p-3 sm:p-4 overflow-visible">
          <h3 className="text-xs font-medium text-white/60 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500"></span>
            Credits
          </h3>
          <LineChart data={creditsData} color="#10b981" height={100} label="Credits" valueFormatter={formatCredits} highlightCurrent={true} />
        </div>
        
        {/* Storage */}
        <div className="bg-black p-3 sm:p-4 overflow-visible col-span-1 sm:col-span-2">
          <h3 className="text-xs font-medium text-white/60 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-500"></span>
            Storage
          </h3>
          <LineChart data={storageData} color="#f59e0b" height={100} label="GB" valueFormatter={v => `${v.toFixed(1)} GB`} highlightCurrent={true} />
        </div>
      </div>
    </div>
  );
};
