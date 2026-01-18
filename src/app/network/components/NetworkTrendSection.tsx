'use client';

import React, { useMemo } from 'react';
import { TrendLineChart } from '@/components/ui/TrendLineChart';
import { VPSProvidersChart } from '@/components/ui/VPSProvidersChart';
import { useNodesData } from '@/libs/context/nodes-data-context';

interface CountryDetailedStats {
  country: string;
  country_code: string;
  totalNodes: number;
  onlineNodes: number;
  syncingNodes: number;
  offlineNodes: number;
  totalStorage: number;
  totalStorageUsed: number;
  avgUptime: number;
  totalCredits: number;
}

interface NetworkTrendSectionProps {
  countryDetailedStats: CountryDetailedStats[];
  isLoading: boolean;
}

// Format uptime
const formatUptime = (hours: number): string => {
  if (hours >= 24) return `${(hours / 24).toFixed(1)}d`;
  return `${hours.toFixed(1)}h`;
};

// Format storage
const formatStorage = (tb: number): string => {
  if (tb >= 1) return `${tb.toFixed(1)}TB`;
  return `${(tb * 1024).toFixed(0)}GB`;
};

export const NetworkTrendSection: React.FC<NetworkTrendSectionProps> = ({
  countryDetailedStats,
  isLoading
}) => {
  const { nodes, geoData } = useNodesData();

  // Calculate VPS provider distribution from nodes data
  const vpsProviderData = useMemo(() => {
    if (!nodes || nodes.length === 0) return [];

    const providerCounts = new Map<string, number>();
    
    nodes.forEach(node => {
      let provider = node.provider || '';
      
      // Also check geoData for provider info
      if (!provider && node.address) {
        const ip = node.address.split(':')[0];
        const geo = geoData[ip];
        if (geo?.provider) {
          provider = geo.provider;
        }
      }
      
      // Normalize provider names
      provider = provider.trim();
      if (!provider || provider === 'null' || provider === 'undefined') {
        return; // Skip unknown providers
      }
      
      providerCounts.set(provider, (providerCounts.get(provider) || 0) + 1);
    });

    // Sort by count
    return Array.from(providerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([provider, count]) => ({ provider, count }));
  }, [nodes, geoData]);

  // Calculate top countries by uptime - show as ranking progression
  const uptimeData = useMemo(() => {
    if (!countryDetailedStats || countryDetailedStats.length === 0) return [];

    // Get top 5 countries by average uptime
    const sorted = [...countryDetailedStats]
      .filter(c => c.avgUptime > 0)
      .sort((a, b) => b.avgUptime - a.avgUptime) // Descending: highest first
      .slice(0, 5);

    // Create data points showing the ranking (5th to 1st place)
    // This creates an upward trend showing improvement in ranking
    return sorted.reverse().map((country, i) => ({
      timestamp: Date.now() / 1000 + i * 3600, // Spread across time for visualization
      value: country.avgUptime / 3600, // Convert to hours/days
      label: country.country
    }));
  }, [countryDetailedStats]);

  // Calculate top countries by storage - show as ranking progression
  const storageData = useMemo(() => {
    if (!countryDetailedStats || countryDetailedStats.length === 0) return [];

    // Get top 5 countries by total storage
    const sorted = [...countryDetailedStats]
      .filter(c => c.totalStorage > 0)
      .sort((a, b) => b.totalStorage - a.totalStorage) // Descending: highest first
      .slice(0, 5);

    // Create data points showing the ranking (5th to 1st place)
    // This creates an upward trend showing improvement in ranking
    return sorted.reverse().map((country, i) => ({
      timestamp: Date.now() / 1000 + i * 3600, // Spread across time for visualization
      value: country.totalStorage / (1024 ** 4), // Convert to TB
      label: country.country
    }));
  }, [countryDetailedStats]);

  // Get the top country (last in reversed array = highest value)
  const topUptimeCountry = uptimeData.length > 0 ? uptimeData[uptimeData.length - 1]?.label : '';
  const topStorageCountry = storageData.length > 0 ? storageData[storageData.length - 1]?.label : '';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-purple-500" />
        <h2 className="text-sm font-medium text-white/80">Network Trends</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <VPSProvidersChart
          data={vpsProviderData}
          isLoading={isLoading}
          height={180}
          maxItems={10}
        />

        <TrendLineChart
          data={uptimeData}
          title="Top 5 Countries by Uptime"
          subtitle={topUptimeCountry ? `#1: ${topUptimeCountry}` : 'Ranked by average uptime'}
          color="#10b981"
          valueFormatter={formatUptime}
          height={180}
          isLoading={isLoading}
          emptyMessage="No uptime data"
        />

        <TrendLineChart
          data={storageData}
          title="Top 5 Countries by Storage"
          subtitle={topStorageCountry ? `#1: ${topStorageCountry}` : 'Ranked by total storage'}
          color="#06b6d4"
          valueFormatter={formatStorage}
          height={180}
          isLoading={isLoading}
          emptyMessage="No storage data"
        />
      </div>
    </div>
  );
};
