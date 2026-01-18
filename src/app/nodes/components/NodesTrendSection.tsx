'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { TrendLineChart } from '@/components/ui/TrendLineChart';
import { useNodesData } from '@/libs/context/nodes-data-context';
import { useNetwork } from '@/libs/context/network-context';

// Format uptime hours
const formatUptime = (hours: number): string => {
  if (hours >= 24) return `${(hours / 24).toFixed(1)}d`;
  return `${hours.toFixed(1)}h`;
};

// Format node count
const formatCount = (value: number): string => value.toLocaleString();

// AI Summary component
const AISummary: React.FC<{ 
  stats: {
    total: number;
    online: number;
    syncing: number;
    offline: number;
    public: number;
    onlinePercentage: number;
  };
  avgUptime: number;
  totalStorage: number;
  versionCounts: Map<string, number>;
  storageDistribution: { label: string; count: number }[];
  uptimeDistribution: { label: string; count: number }[];
  providerCounts: Map<string, number>;
  isLoading: boolean;
  network: string;
}> = ({ stats, avgUptime, totalStorage, versionCounts, storageDistribution, uptimeDistribution, providerCounts, isLoading, network }) => {
  const [summary, setSummary] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isLoading || stats.total === 0) {
      setSummary('');
      return;
    }

    setIsGenerating(true);

    // Dynamic storage formatter
    const formatStorage = (bytes: number): string => {
      if (bytes >= 1024 ** 4) return `${(bytes / 1024 ** 4).toFixed(1)} TB`;
      if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
      if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
      return `${bytes} B`;
    };

    // Generate contextual summary based on actual data
    const generateSummary = () => {
      const lines: string[] = [];
      const networkName = network === 'mainnet' ? 'Mainnet' : 'Devnet';
      
      // Network health assessment - adjusted thresholds for realistic network conditions
      const healthStatus = stats.onlinePercentage >= 80 ? 'healthy' : 
                          stats.onlinePercentage >= 60 ? 'stable' : 
                          stats.onlinePercentage >= 40 ? 'moderate' : 'low';
      
      lines.push(`${networkName}: ${stats.total} nodes, ${stats.onlinePercentage.toFixed(1)}% online (${healthStatus}).`);

      // Version distribution insight
      const versions = Array.from(versionCounts.entries()).sort((a, b) => b[1] - a[1]);
      if (versions.length > 0) {
        const topVersion = versions[0];
        const topVersionPercent = ((topVersion[1] / stats.total) * 100).toFixed(0);
        if (versions.length > 1) {
          lines.push(`${topVersionPercent}% on v${topVersion[0]}, ${versions.length} versions active.`);
        } else {
          lines.push(`All nodes on v${topVersion[0]}.`);
        }
      }

      // Storage insight - dynamic formatting
      const avgStoragePerNode = stats.total > 0 ? totalStorage / stats.total : 0;
      lines.push(`${formatStorage(totalStorage)} total storage, ~${formatStorage(avgStoragePerNode)}/node avg.`);

      // Uptime insight
      const avgUptimeDays = avgUptime / 24;
      if (avgUptimeDays >= 1) {
        lines.push(`Avg uptime: ${avgUptimeDays.toFixed(1)} days.`);
      } else {
        lines.push(`Avg uptime: ${avgUptime.toFixed(1)} hours.`);
      }

      // VPS Providers insight
      const providers = Array.from(providerCounts.entries()).sort((a, b) => b[1] - a[1]);
      if (providers.length > 0) {
        const topProvider = providers[0];
        const topProviderPercent = ((topProvider[1] / stats.total) * 100).toFixed(0);
        if (providers.length > 1) {
          lines.push(`Top VPS: ${topProvider[0]} (${topProviderPercent}%), ${providers.length} providers total.`);
        } else {
          lines.push(`All nodes on ${topProvider[0]}.`);
        }
      }

      // Distribution insights
      const highUptimeNodes = uptimeDistribution.find(d => d.label === '1+ month')?.count || 0;
      const highUptimePercent = stats.total > 0 ? ((highUptimeNodes / stats.total) * 100).toFixed(0) : '0';
      if (parseInt(highUptimePercent) > 20) {
        lines.push(`${highUptimePercent}% nodes running 1+ month.`);
      }

      // Public nodes insight
      const publicPercent = stats.total > 0 ? ((stats.public / stats.total) * 100).toFixed(0) : '0';
      if (stats.public > 0) {
        lines.push(`${stats.public} public nodes (${publicPercent}%).`);
      }

      // Syncing/offline alert
      if (stats.syncing > 0 || stats.offline > 0) {
        const issues: string[] = [];
        if (stats.syncing > 0) issues.push(`${stats.syncing} syncing`);
        if (stats.offline > 0) issues.push(`${stats.offline} offline`);
        lines.push(`Status: ${issues.join(', ')}.`);
      }

      return lines.join(' ');
    };

    // Simulate brief generation delay for UX
    const timer = setTimeout(() => {
      setSummary(generateSummary());
      setIsGenerating(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [stats, avgUptime, totalStorage, versionCounts, storageDistribution, uptimeDistribution, providerCounts, isLoading, network]);

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
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 z-20">
        <div className="absolute top-0 left-0 w-2 h-px bg-white/20 group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.6)] transition-all duration-300" />
        <div className="absolute top-0 left-0 w-px h-2 bg-white/20 group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.6)] transition-all duration-300" />
      </div>
      <div className="absolute top-0 right-0 w-4 h-4 z-20">
        <div className="absolute top-0 right-0 w-2 h-px bg-white/20 group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.6)] transition-all duration-300" />
        <div className="absolute top-0 right-0 w-px h-2 bg-white/20 group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.6)] transition-all duration-300" />
      </div>
      <div className="absolute bottom-0 left-0 w-4 h-4 z-20">
        <div className="absolute bottom-0 left-0 w-2 h-px bg-white/20 group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.6)] transition-all duration-300" />
        <div className="absolute bottom-0 left-0 w-px h-2 bg-white/20 group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.6)] transition-all duration-300" />
      </div>
      <div className="absolute bottom-0 right-0 w-4 h-4 z-20">
        <div className="absolute bottom-0 right-0 w-2 h-px bg-white/20 group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.6)] transition-all duration-300" />
        <div className="absolute bottom-0 right-0 w-px h-2 bg-white/20 group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.6)] transition-all duration-300" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
          <circle cx="7.5" cy="14.5" r="1.5"/>
          <circle cx="16.5" cy="14.5" r="1.5"/>
        </svg>
        <span className="text-xs font-medium text-white/70">AI Trends Summary</span>
        {isGenerating && (
          <div className="w-3 h-3 border border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
        )}
      </div>
      <p className="text-sm text-white/80 leading-relaxed">
        {summary}
      </p>
    </div>
  );
};

export const NodesTrendSection: React.FC = () => {
  const { nodes, stats, isLoading, dataFetchTime } = useNodesData();
  const { network } = useNetwork();

  // Generate trend data from current snapshot
  const { 
    storageDistribution, 
    uptimeDistribution,
    versionCounts,
    providerCounts,
    avgUptime,
    totalStorage,
    storageDistData,
    uptimeDistData
  } = useMemo(() => {
    if (!nodes || nodes.length === 0) {
      return {
        storageDistribution: [],
        uptimeDistribution: [],
        versionCounts: new Map<string, number>(),
        providerCounts: new Map<string, number>(),
        avgUptime: 0,
        totalStorage: 0,
        storageDistData: [],
        uptimeDistData: []
      };
    }

    const now = dataFetchTime || Math.floor(Date.now() / 1000);

    // Storage distribution - group nodes by storage ranges
    const storageRanges = [
      { min: 0, max: 100 * 1024 ** 3, label: '<100GB' },
      { min: 100 * 1024 ** 3, max: 500 * 1024 ** 3, label: '100-500GB' },
      { min: 500 * 1024 ** 3, max: 1024 ** 4, label: '500GB-1TB' },
      { min: 1024 ** 4, max: Infinity, label: '1TB+' }
    ];

    const storageDist = storageRanges.map((range, i) => {
      const count = nodes.filter(n => 
        n.storage_committed >= range.min && n.storage_committed < range.max
      ).length;
      return { label: range.label, count };
    });

    const storageDistData = storageRanges.map((range, i) => {
      const count = nodes.filter(n => 
        n.storage_committed >= range.min && n.storage_committed < range.max
      ).length;
      return {
        timestamp: now - (storageRanges.length - 1 - i) * 3600, // Reversed: start from oldest
        value: count,
        label: range.label
      };
    });

    // Uptime distribution - group by uptime ranges (in hours)
    const uptimeRanges = [
      { min: 0, max: 24, label: '<1 day' },
      { min: 24, max: 168, label: '1-7 days' },
      { min: 168, max: 720, label: '1-4 weeks' },
      { min: 720, max: Infinity, label: '1+ month' }
    ];

    const uptimeDist = uptimeRanges.map((range, i) => {
      const count = nodes.filter(n => {
        const uptimeHours = (n.uptime || 0) / 3600;
        return uptimeHours >= range.min && uptimeHours < range.max;
      }).length;
      return { label: range.label, count };
    });

    const uptimeDistData = uptimeRanges.map((range, i) => {
      const count = nodes.filter(n => {
        const uptimeHours = (n.uptime || 0) / 3600;
        return uptimeHours >= range.min && uptimeHours < range.max;
      }).length;
      return {
        timestamp: now - (uptimeRanges.length - 1 - i) * 3600, // Reversed: start from oldest
        value: count,
        label: range.label
      };
    });

    // Version distribution
    const versionCounts = new Map<string, number>();
    nodes.forEach(n => {
      const version = n.version || 'Unknown';
      versionCounts.set(version, (versionCounts.get(version) || 0) + 1);
    });

    // VPS Provider distribution
    const providerCounts = new Map<string, number>();
    nodes.forEach(n => {
      const provider = n.provider?.trim();
      if (provider && provider !== 'Unknown' && provider !== 'null' && provider !== 'undefined') {
        providerCounts.set(provider, (providerCounts.get(provider) || 0) + 1);
      }
    });

    // Calculate averages
    const onlineNodes = nodes.filter(n => n.status === 'online');
    const avgUptime = onlineNodes.length > 0
      ? onlineNodes.reduce((sum, n) => sum + (n.uptime || 0), 0) / onlineNodes.length / 3600
      : 0;
    
    const totalStorage = nodes.reduce((sum, n) => sum + (n.storage_committed || 0), 0);

    return {
      storageDistribution: storageDist,
      uptimeDistribution: uptimeDist,
      versionCounts,
      providerCounts,
      avgUptime,
      totalStorage,
      storageDistData,
      uptimeDistData
    };
  }, [nodes, dataFetchTime]);

  // Calculate average uptime distribution for chart
  const avgUptimeData = useMemo(() => {
    if (!nodes || nodes.length === 0) return [];
    
    const now = dataFetchTime || Math.floor(Date.now() / 1000);
    
    const uptimeValues = nodes
      .filter(n => n.status === 'online')
      .map(n => (n.uptime || 0) / 3600);
    
    if (uptimeValues.length === 0) return [];
    
    uptimeValues.sort((a, b) => a - b);
    const percentiles = [10, 25, 50, 75, 90];
    
    return percentiles.map((p, i) => {
      const idx = Math.floor((p / 100) * uptimeValues.length);
      return {
        timestamp: now - (percentiles.length - 1 - i) * 3600, // Reversed: start from oldest
        value: uptimeValues[Math.min(idx, uptimeValues.length - 1)],
        label: `${p}th percentile`
      };
    });
  }, [nodes, dataFetchTime]);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-emerald-500" />
        <h2 className="text-sm font-medium text-white/80">Network Trends</h2>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-visible">
        {/* Nodes by Storage */}
        <div className="overflow-visible">
          <TrendLineChart
            data={storageDistData}
            title="Storage Distribution"
            subtitle={`${storageDistData.find(d => d.label === '1TB+')?.value || 0} nodes with 1TB+ storage`}
            color="#8b5cf6"
            valueFormatter={formatCount}
            height={180}
            isLoading={isLoading}
            emptyMessage="No storage data"
          />
        </div>

        {/* Nodes by Uptime */}
        <div className="overflow-visible">
          <TrendLineChart
            data={uptimeDistData}
            title="Uptime Distribution"
            subtitle={`${uptimeDistData.find(d => d.label === '1+ month')?.value || 0} nodes running 1+ month`}
            color="#06b6d4"
            valueFormatter={formatCount}
            height={180}
            isLoading={isLoading}
            emptyMessage="No uptime data"
          />
        </div>

        {/* Average Uptime Trend */}
        <div className="overflow-visible">
          <TrendLineChart
            data={avgUptimeData}
            title="Uptime Percentiles"
            subtitle={`90th percentile: ${avgUptimeData.find(d => d.label === '90th percentile')?.value ? formatUptime(avgUptimeData.find(d => d.label === '90th percentile')!.value) : 'N/A'}`}
            color="#10b981"
            valueFormatter={formatUptime}
            height={180}
            isLoading={isLoading}
            emptyMessage="No uptime data"
          />
        </div>
      </div>

      {/* AI Summary */}
      <AISummary
        stats={stats}
        avgUptime={avgUptime}
        totalStorage={totalStorage}
        versionCounts={versionCounts}
        storageDistribution={storageDistribution}
        uptimeDistribution={uptimeDistribution}
        providerCounts={providerCounts}
        isLoading={isLoading}
        network={network}
      />
    </div>
  );
};
