'use client';

import { useState, useMemo } from 'react';
import { NodesIcon, StorageIcon, CreditsIcon, ClockIcon } from './CountryIcons';
import { LineChart } from './LineChart';
import { formatCredits, timeRangeOptions, TimeRange } from './utils';

interface CountryChartsProps {
  onlinePercent: number;
  totalCredits: number;
  avgStorageUsage: number;
  onlineNodes: number;
}

export const CountryCharts = ({
  onlinePercent,
  totalCredits,
  avgStorageUsage,
  onlineNodes
}: CountryChartsProps) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');

  // Generate mock chart data based on stats
  const chartData = useMemo(() => {
    const now = Date.now();
    const points = 24;
    const interval = 3600000; // 1 hour

    return {
      uptime: Array.from({ length: points }, (_, i) => ({
        time: now - (points - i) * interval,
        value: onlinePercent * (0.85 + Math.random() * 0.3)
      })),
      credits: Array.from({ length: points }, (_, i) => ({
        time: now - (points - i) * interval,
        value: totalCredits * (0.9 + Math.random() * 0.2) * (i / points)
      })),
      storage: Array.from({ length: points }, (_, i) => ({
        time: now - (points - i) * interval,
        value: avgStorageUsage * (0.8 + Math.random() * 0.4)
      })),
      nodes: Array.from({ length: points }, (_, i) => ({
        time: now - (points - i) * interval,
        value: onlineNodes * (0.9 + Math.random() * 0.2)
      }))
    };
  }, [onlinePercent, totalCredits, avgStorageUsage, onlineNodes]);

  return (
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
          <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
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
  );
};
