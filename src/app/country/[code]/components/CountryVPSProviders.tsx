'use client';

import React, { useMemo } from 'react';
import { VPSProvidersChart } from '@/components/ui/VPSProvidersChart';

interface NodeData {
  pubkey: string;
  address: string;
  provider?: string;
  country?: string;
  country_code?: string;
}

interface LocationData {
  provider?: string;
  country?: string;
  country_code?: string;
}

interface CountryVPSProvidersProps {
  nodes: NodeData[];
  locations: { [ip: string]: LocationData | null };
  isLoading?: boolean;
}

export const CountryVPSProviders: React.FC<CountryVPSProvidersProps> = ({
  nodes,
  locations,
  isLoading = false
}) => {
  // Calculate VPS provider distribution from nodes
  const vpsProviderData = useMemo(() => {
    if (!nodes || nodes.length === 0) return [];

    const providerCounts = new Map<string, number>();
    
    nodes.forEach(node => {
      let provider = node.provider || '';
      
      // Also check locations for provider info
      if (!provider && node.address) {
        const ip = node.address.split(':')[0];
        const loc = locations[ip];
        if (loc?.provider) {
          provider = loc.provider;
        }
      }
      
      // Normalize provider names
      provider = provider.trim();
      if (!provider || provider === 'null' || provider === 'undefined' || provider === 'Unknown') {
        return; // Skip unknown providers
      }
      
      providerCounts.set(provider, (providerCounts.get(provider) || 0) + 1);
    });

    // Sort by count
    return Array.from(providerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([provider, count]) => ({ provider, count }));
  }, [nodes, locations]);

  // Don't render if no provider data
  if (!isLoading && vpsProviderData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-purple-500" />
        <h2 className="text-sm font-medium text-white/80">VPS Providers</h2>
      </div>
      
      <VPSProvidersChart
        data={vpsProviderData}
        isLoading={isLoading}
        height={200}
        title="VPS Providers"
        maxItems={10}
      />
    </div>
  );
};
