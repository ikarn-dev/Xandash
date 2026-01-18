'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { TrendLineChart } from '@/components/ui/TrendLineChart';
import { useNetwork } from '@/libs/context/network-context';

interface NodeData {
  pod_id: string;
  credits: number;
  uptime: number;
  storage_used: number;
  storage_committed: number;
  address?: string;
}

interface LeaderboardTrendSectionProps {
  data: NodeData[];
  isLoading: boolean;
}

// Format credits
const formatCredits = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
};

// Format storage dynamically
const formatStorage = (bytes: number): string => {
  if (bytes >= 1024 ** 4) return `${(bytes / 1024 ** 4).toFixed(1)}TB`;
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)}GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)}MB`;
  return `${bytes}B`;
};

// AI Summary for leaderboard
const LeaderboardAISummary: React.FC<{
  data: NodeData[];
  totalCredits: number;
  avgCredits: number;
  avgUptime: number;
  avgStorage: number;
  topByCredits: NodeData | null;
  topByUptime: NodeData | null;
  topByStorage: NodeData | null;
  isLoading: boolean;
  network: string;
}> = ({ 
  data, totalCredits, avgCredits, avgUptime, avgStorage, 
  topByCredits, topByUptime, topByStorage, isLoading, network 
}) => {
  const [summary, setSummary] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isLoading || data.length === 0) {
      setSummary('');
      return;
    }

    setIsGenerating(true);

    const generateSummary = () => {
      const lines: string[] = [];
      const networkName = network === 'mainnet' ? 'Mainnet' : 'Devnet';

      lines.push(`${networkName}: ${data.length} pods ranked.`);
      lines.push(`Total ${formatCredits(totalCredits)} credits, avg ${formatCredits(avgCredits)}/pod.`);

      if (topByCredits) {
        lines.push(`Credits leader: ${topByCredits.pod_id.slice(0, 8)}... (${formatCredits(topByCredits.credits)}).`);
      }

      const avgUptimeDays = avgUptime / 24;
      if (avgUptimeDays >= 1) {
        lines.push(`Avg uptime: ${avgUptimeDays.toFixed(1)} days.`);
      } else {
        lines.push(`Avg uptime: ${avgUptime.toFixed(1)} hours.`);
      }

      if (topByUptime && topByUptime.uptime > 0) {
        const topUptimeDays = topByUptime.uptime / 86400;
        lines.push(`Uptime leader: ${topByUptime.pod_id.slice(0, 8)}... (${topUptimeDays.toFixed(1)}d).`);
      }

      // Dynamic storage formatting
      const avgStorageBytes = avgStorage * (1024 ** 3); // Convert GB back to bytes
      if (avgStorageBytes > 0) {
        lines.push(`Avg storage: ${formatStorage(avgStorageBytes)}/pod.`);
      }

      if (topByStorage && topByStorage.storage_committed > 0) {
        lines.push(`Storage leader: ${topByStorage.pod_id.slice(0, 8)}... (${formatStorage(topByStorage.storage_committed)}).`);
      }

      return lines.join(' ');
    };

    const timer = setTimeout(() => {
      setSummary(generateSummary());
      setIsGenerating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [data, totalCredits, avgCredits, avgUptime, avgStorage, topByCredits, topByUptime, topByStorage, isLoading, network]);

  if (isLoading) {
    return (
      <div className="bg-[#0a0a0a] border border-white/10 p-4 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 bg-white/10" />
          <div className="h-4 w-24 bg-white/10" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-white/5" />
          <div className="h-3 w-3/4 bg-white/5" />
        </div>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="bg-[#0a0a0a] border border-white/10 p-4 group relative">
      <div className="absolute top-0 left-0 w-4 h-4 z-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-2 h-px bg-white/20 group-hover:bg-yellow-400 group-hover:shadow-[0_0_8px_rgba(250,204,21,0.6)] transition-all duration-300" />
        <div className="absolute top-0 left-0 w-px h-2 bg-white/20 group-hover:bg-yellow-400 group-hover:shadow-[0_0_8px_rgba(250,204,21,0.6)] transition-all duration-300" />
      </div>
      <div className="absolute top-0 right-0 w-4 h-4 z-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-2 h-px bg-white/20 group-hover:bg-yellow-400 group-hover:shadow-[0_0_8px_rgba(250,204,21,0.6)] transition-all duration-300" />
        <div className="absolute top-0 right-0 w-px h-2 bg-white/20 group-hover:bg-yellow-400 group-hover:shadow-[0_0_8px_rgba(250,204,21,0.6)] transition-all duration-300" />
      </div>
      <div className="absolute bottom-0 left-0 w-4 h-4 z-20 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-2 h-px bg-white/20 group-hover:bg-yellow-400 group-hover:shadow-[0_0_8px_rgba(250,204,21,0.6)] transition-all duration-300" />
        <div className="absolute bottom-0 left-0 w-px h-2 bg-white/20 group-hover:bg-yellow-400 group-hover:shadow-[0_0_8px_rgba(250,204,21,0.6)] transition-all duration-300" />
      </div>
      <div className="absolute bottom-0 right-0 w-4 h-4 z-20 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-2 h-px bg-white/20 group-hover:bg-yellow-400 group-hover:shadow-[0_0_8px_rgba(250,204,21,0.6)] transition-all duration-300" />
        <div className="absolute bottom-0 right-0 w-px h-2 bg-white/20 group-hover:bg-yellow-400 group-hover:shadow-[0_0_8px_rgba(250,204,21,0.6)] transition-all duration-300" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
          <circle cx="7.5" cy="14.5" r="1.5"/>
          <circle cx="16.5" cy="14.5" r="1.5"/>
        </svg>
        <span className="text-xs font-medium text-white/70">AI Leaderboard Summary</span>
        {isGenerating && (
          <div className="w-3 h-3 border border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
        )}
      </div>
      <p className="text-sm text-white/80 leading-relaxed">{summary}</p>
    </div>
  );
};

export const LeaderboardTrendSection: React.FC<LeaderboardTrendSectionProps> = ({
  data,
  isLoading
}) => {
  const { network } = useNetwork();

  const {
    creditsDistData,
    uptimeDistData,
    storageDistData,
    totalCredits,
    avgCredits,
    avgUptime,
    avgStorage,
    topByCredits,
    topByUptime,
    topByStorage
  } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        creditsDistData: [],
        uptimeDistData: [],
        storageDistData: [],
        totalCredits: 0,
        avgCredits: 0,
        avgUptime: 0,
        avgStorage: 0,
        topByCredits: null,
        topByUptime: null,
        topByStorage: null
      };
    }

    const now = Math.floor(Date.now() / 1000);

    const sortedByCredits = [...data].sort((a, b) => b.credits - a.credits);
    const sortedByUptime = [...data].sort((a, b) => b.uptime - a.uptime);
    const sortedByStorage = [...data].sort((a, b) => b.storage_committed - a.storage_committed);

    // Credits distribution
    const creditsRanges = [
      { min: 0, max: 1000, label: '<1K' },
      { min: 1000, max: 5000, label: '1-5K' },
      { min: 5000, max: 10000, label: '5-10K' },
      { min: 10000, max: 25000, label: '10-25K' },
      { min: 25000, max: Infinity, label: '25K+' }
    ];

    const creditsDistData = creditsRanges.map((range, i) => ({
      timestamp: now - (4 - i) * 3600,
      value: data.filter(n => n.credits >= range.min && n.credits < range.max).length,
      label: range.label
    }));

    // Uptime distribution (hours)
    const uptimeRanges = [
      { min: 0, max: 24, label: '<1 day' },
      { min: 24, max: 168, label: '1-7 days' },
      { min: 168, max: 720, label: '1-4 weeks' },
      { min: 720, max: Infinity, label: '1+ month' }
    ];

    const uptimeDistData = uptimeRanges.map((range, i) => ({
      timestamp: now - (3 - i) * 3600,
      value: data.filter(n => {
        const hours = (n.uptime || 0) / 3600;
        return hours >= range.min && hours < range.max;
      }).length,
      label: range.label
    }));

    // Storage distribution
    const storageRanges = [
      { min: 0, max: 100 * 1024 ** 3, label: '<100GB' },
      { min: 100 * 1024 ** 3, max: 500 * 1024 ** 3, label: '100-500GB' },
      { min: 500 * 1024 ** 3, max: 1024 ** 4, label: '500GB-1TB' },
      { min: 1024 ** 4, max: 2 * 1024 ** 4, label: '1-2TB' },
      { min: 2 * 1024 ** 4, max: Infinity, label: '2TB+' }
    ];

    const storageDistData = storageRanges.map((range, i) => ({
      timestamp: now - (4 - i) * 3600,
      value: data.filter(n => {
        const s = n.storage_committed || 0;
        return s >= range.min && s < range.max;
      }).length,
      label: range.label
    }));

    const totalCredits = data.reduce((sum, n) => sum + n.credits, 0);
    const avgCredits = data.length > 0 ? totalCredits / data.length : 0;
    const totalUptime = data.reduce((sum, n) => sum + (n.uptime || 0), 0);
    const avgUptime = data.length > 0 ? (totalUptime / data.length) / 3600 : 0;
    const totalStorage = data.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
    const avgStorage = data.length > 0 ? (totalStorage / data.length) / (1024 ** 3) : 0;

    return {
      creditsDistData,
      uptimeDistData,
      storageDistData,
      totalCredits,
      avgCredits,
      avgUptime,
      avgStorage,
      topByCredits: sortedByCredits[0] || null,
      topByUptime: sortedByUptime[0] || null,
      topByStorage: sortedByStorage[0] || null
    };
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-yellow-500" />
        <h2 className="text-sm font-medium text-white/80">Leaderboard Trends</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TrendLineChart
          data={creditsDistData}
          title="Credits"
          subtitle="Pods with 25K+ credits"
          color="#22c55e"
          valueFormatter={(v) => v.toLocaleString()}
          height={180}
          isLoading={isLoading}
          emptyMessage="No credits data"
        />

        <TrendLineChart
          data={uptimeDistData}
          title="Uptime"
          subtitle="Pods running 1+ month"
          color="#3b82f6"
          valueFormatter={(v) => v.toLocaleString()}
          height={180}
          isLoading={isLoading}
          emptyMessage="No uptime data"
        />

        <TrendLineChart
          data={storageDistData}
          title="Storage"
          subtitle="Pods with 2TB+ storage"
          color="#06b6d4"
          valueFormatter={(v) => v.toLocaleString()}
          height={180}
          isLoading={isLoading}
          emptyMessage="No storage data"
        />
      </div>

      <LeaderboardAISummary
        data={data}
        totalCredits={totalCredits}
        avgCredits={avgCredits}
        avgUptime={avgUptime}
        avgStorage={avgStorage}
        topByCredits={topByCredits}
        topByUptime={topByUptime}
        topByStorage={topByStorage}
        isLoading={isLoading}
        network={network}
      />
    </div>
  );
};
