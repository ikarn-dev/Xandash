'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChartIcon } from './ProfileIcons';
import { LineChart, StatusChart } from './ProfileCharts';
import { formatCredits } from './utils';
import { TimeRange, timeRangeOptions, DbNodeSnapshot, CurrentNodeData, PingRecord } from './types';
import { CornerAccents } from '@/components/ui/CornerAccents';
import { useNetwork } from '@/libs/context/network-context';

interface ProfileChartsSectionProps {
  displayHistory: DbNodeSnapshot[];
  node: CurrentNodeData | null;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  filteredDbHistoryLength: number;
  isShowingFallbackData: boolean;
  ip?: string;
  pingHistory?: PingRecord[];
  liveCredits?: any[];
}

export const ProfileChartsSection = ({
  displayHistory,
  node,
  timeRange,
  setTimeRange,
  filteredDbHistoryLength,
  isShowingFallbackData,
  ip,
  pingHistory,
  liveCredits
}: ProfileChartsSectionProps) => {
  const { network, isMainnet } = useNetwork();

  // Generate chart data from MongoDB snapshots
  const statusData = displayHistory.map(h => ({ time: h.timestamp, status: h.status }));
  const uptimeData = displayHistory.map(h => ({ time: h.timestamp, value: h.uptime / 3600 }));
  const storageData = displayHistory.map(h => ({ time: h.timestamp, value: h.storage_committed / (1024**3) }));

  // Generate credits data combining historical and live data
  const creditsData = useMemo(() => {
    const historicalCredits = displayHistory.map(h => ({ time: h.timestamp, value: h.credits || 0 }));
    
    // Get live credits for this node
    let liveCreditsValue = node?.credits || 0;
    if (liveCredits && node?.pubkey) {
      const liveEntry = liveCredits.find((c: any) => c.pod_id === node.pubkey);
      if (liveEntry) {
        liveCreditsValue = liveEntry.credits || 0;
      }
    }
    
    // Add current live data point if we have it
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const allCreditsData = [...historicalCredits];
    
    if (liveCreditsValue > 0) {
      // Only add live data if it's different from the most recent historical data
      const mostRecent = historicalCredits[historicalCredits.length - 1];
      if (!mostRecent || mostRecent.value !== liveCreditsValue) {
        allCreditsData.push({ time: currentTimestamp, value: liveCreditsValue });
      }
    }
    
    return allCreditsData;
  }, [displayHistory, node, liveCredits]);

  // Generate ping data from ping history
  const pingData = useMemo(() => {
    if (!pingHistory || pingHistory.length === 0) return [];
    
    // Filter ping history based on time range
    const now = Date.now() / 1000;
    const rangeHours = timeRangeOptions.find(r => r.value === timeRange)?.hours || 168;
    const cutoffTime = timeRange === 'all' ? 0 : now - (rangeHours * 3600);
    
    return pingHistory
      .filter(p => p.timestamp >= cutoffTime && p.ping !== null)
      .map(p => ({ time: p.timestamp, value: p.ping as number }))
      .sort((a, b) => a.time - b.time);
  }, [pingHistory, timeRange]);

  const hasPingData = pingData.length > 0;

  // Add current live data point for other metrics
  const currentTimestamp = Math.floor(Date.now() / 1000);
  
  if (node) {
    statusData.push({ time: currentTimestamp, status: node.status });
    uptimeData.push({ time: currentTimestamp, value: node.uptime / 3600 });
    storageData.push({ time: currentTimestamp, value: node.storage_committed / (1024**3) });
    
    // Add fallback data points if we have very little historical data
    if (displayHistory.length < 2) {
      const oneHourAgo = currentTimestamp - 3600;
      statusData.unshift({ time: oneHourAgo, status: node.status });
      uptimeData.unshift({ time: oneHourAgo, value: Math.max(0, (node.uptime - 3600) / 3600) });
      storageData.unshift({ time: oneHourAgo, value: node.storage_committed / (1024**3) });
      
      // For credits, use a small increment from current value
      const currentCreditsValue = creditsData[creditsData.length - 1]?.value || 0;
      if (currentCreditsValue > 0) {
        creditsData.unshift({ time: oneHourAgo, value: Math.max(0, currentCreditsValue - 10) });
      }
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
        
        {/* Ping Latency */}
        <div className="bg-black p-3 sm:p-4 overflow-visible">
          <h3 className="text-xs font-medium text-white/60 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-cyan-500"></span>
            Ping Latency
            {!hasPingData && <span className="text-white/30 text-[10px]">(N/A)</span>}
          </h3>
          {hasPingData ? (
            <LineChart 
              data={pingData} 
              color="#06b6d4" 
              height={100} 
              label="ms" 
              valueFormatter={v => `${Math.round(v)}ms`} 
              highlightCurrent={false}
            />
          ) : (
            <div className="flex items-center justify-center h-[100px] text-white/30 text-xs">
              Ping data not available
            </div>
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
