'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { NetworkTitleCard, NetworkCountriesCard, NetworkNodesCard, NetworkRegionsCard } from '@/components/dashboard';
import { useNetwork } from '@/libs/context/network-context';
import { useNodesData } from '@/libs/context/nodes-data-context';
import { useNetworkPageData } from './hooks';
import { CountryCard, CountryCardSkeleton, NetworkMap, NetworkTrendSection } from './components';
import { AISummary } from '@/components/ui/AISummary';

// Compare icon
const CompareIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 3h5v5M8 3H3v5M3 16v5h5M21 16v5h-5M12 8v8M8 12h8" />
  </svg>
);

function NetworkPageContent() {
  const router = useRouter();
  const { network, isMainnet } = useNetwork();
  const { nodes } = useNodesData();
  const { mapValidators, countryStats, countryDetailedStats, totalNodes, locatedNodes, loading, error } = useNetworkPageData(network);
  
  // Country comparison state
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Clear selection when network changes
  useEffect(() => {
    setSelectedForCompare([]);
  }, [network]);

  // Toggle country for comparison
  const handleToggleCompare = useCallback((countryCode: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(countryCode)) {
        return prev.filter(c => c !== countryCode);
      }
      if (prev.length >= 4) return prev;
      return [...prev, countryCode];
    });
  }, []);

  // Navigate to compare page
  const handleCompareSelected = useCallback(() => {
    if (selectedForCompare.length >= 2) {
      const params = new URLSearchParams();
      params.set('countries', selectedForCompare.join(','));
      params.set('auto', 'true');
      router.push(`/compare?${params.toString()}`);
    }
  }, [selectedForCompare, router]);

  // Clear selection
  const handleClearCompare = useCallback(() => {
    setSelectedForCompare([]);
  }, []);

  // Calculate network-wide stats for AI summary
  const networkStats = useMemo(() => {
    if (loading || countryDetailedStats.length === 0) return null;

    const totalOnline = countryDetailedStats.reduce((sum, c) => sum + c.onlineNodes, 0);
    const totalSyncing = countryDetailedStats.reduce((sum, c) => sum + c.syncingNodes, 0);
    const totalOffline = countryDetailedStats.reduce((sum, c) => sum + c.offlineNodes, 0);
    const totalStorage = countryDetailedStats.reduce((sum, c) => sum + c.totalStorage, 0);
    const totalStorageUsed = countryDetailedStats.reduce((sum, c) => sum + c.totalStorageUsed, 0);
    const avgUptime = countryDetailedStats.reduce((sum, c) => sum + c.avgUptime, 0) / countryDetailedStats.length;
    
    const topCountries = countryDetailedStats.slice(0, 5).map(c => `${c.country} (${c.totalNodes})`).join(', ');
    const onlinePercent = totalNodes > 0 ? ((totalOnline / totalNodes) * 100).toFixed(1) : '0';
    const storageEfficiency = totalStorage > 0 ? ((totalStorageUsed / totalStorage) * 100).toFixed(1) : '0';

    return {
      totalNodes,
      totalOnline,
      totalSyncing,
      totalOffline,
      onlinePercent,
      totalStorage,
      totalStorageUsed,
      storageEfficiency,
      avgUptime,
      countriesCount: countryDetailedStats.length,
      topCountries,
      locatedNodes
    };
  }, [countryDetailedStats, totalNodes, locatedNodes, loading]);

  // Calculate VPS provider stats for AI summary
  const vpsProviderStats = useMemo(() => {
    if (loading || !nodes || nodes.length === 0) return null;

    const providerCounts = new Map<string, number>();
    nodes.forEach(node => {
      const provider = node.provider?.trim();
      if (provider && provider !== 'Unknown' && provider !== 'null' && provider !== 'undefined') {
        providerCounts.set(provider, (providerCounts.get(provider) || 0) + 1);
      }
    });

    const sorted = Array.from(providerCounts.entries()).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;

    const topProviders = sorted.slice(0, 3).map(([name, count]) => `${name} (${count})`).join(', ');

    return {
      totalProviders: sorted.length,
      topProviders
    };
  }, [nodes, loading]);

  // Generate AI summary prompt for network overview
  const aiNetworkPrompt = useMemo(() => {
    if (!networkStats) return '';

    // Dynamic storage formatter
    const formatStorage = (bytes: number) => {
      if (bytes >= 1024 ** 4) return `${(bytes / 1024 ** 4).toFixed(2)}TB`;
      if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)}GB`;
      if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)}MB`;
      return `${bytes}B`;
    };

    const uptimeDays = (networkStats.avgUptime / 86400).toFixed(1);
    const networkName = isMainnet ? 'Mainnet' : 'Devnet';

    let prompt = `Summarize this ${networkName} network data in 1-2 simple sentences. Just state the facts, do NOT provide any recommendations or suggestions. Data: Total Nodes=${networkStats.totalNodes}, Online=${networkStats.totalOnline} (${networkStats.onlinePercent}%), Syncing=${networkStats.totalSyncing}, Offline=${networkStats.totalOffline}, Countries=${networkStats.countriesCount}, Top Countries=${networkStats.topCountries}, Total Storage=${formatStorage(networkStats.totalStorage)}, Used Storage=${formatStorage(networkStats.totalStorageUsed)} (${networkStats.storageEfficiency}% efficiency), Avg Uptime=${uptimeDays}d.`;

    // Add VPS provider info if available
    if (vpsProviderStats && vpsProviderStats.totalProviders > 0) {
      prompt += ` VPS Providers: ${vpsProviderStats.totalProviders} total, Top: ${vpsProviderStats.topProviders}.`;
    }

    return prompt;
  }, [networkStats, vpsProviderStats, isMainnet]);

  return (
    <div className="space-y-6 overflow-x-hidden">
      <NetworkTitleCard />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <NetworkNodesCard totalNodes={totalNodes} locatedNodes={locatedNodes} isLoading={loading} error={error} />
        <NetworkCountriesCard countryStats={countryStats} isLoading={loading} error={error} />
        <NetworkRegionsCard countryStats={countryStats} isLoading={loading} error={error} />
      </div>

      {/* Network Trends */}
      <NetworkTrendSection 
        countryDetailedStats={countryDetailedStats}
        isLoading={loading}
      />

      {/* AI Network Summary */}
      {!loading && networkStats && aiNetworkPrompt && (
        <AISummary 
          prompt={aiNetworkPrompt}
          title={`${isMainnet ? 'Mainnet' : 'Devnet'} Network Analysis`}
          autoLoad={true}
          network={isMainnet ? 'mainnet' : 'devnet'}
        />
      )}

      {/* World Map */}
      <NetworkMap 
        mapValidators={mapValidators} 
        countryStats={countryStats} 
        totalNodes={totalNodes} 
        isMainnet={isMainnet} 
        loading={loading} 
        error={error} 
      />

      {/* Country Stats Section */}
      {!loading && countryDetailedStats.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-white font-mono">// COUNTRIES</h2>
            <div className="flex items-center gap-3">
              {selectedForCompare.length > 0 && (
                <span className="text-purple-400 text-xs">{selectedForCompare.length} selected</span>
              )}
              <span className="text-white/40 text-xs sm:text-sm">{countryDetailedStats.length} countries</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {countryDetailedStats.map((country) => (
              <CountryCard 
                key={country.country} 
                country={country}
                isSelected={selectedForCompare.includes(country.country_code)}
                canSelect={selectedForCompare.length < 4 || selectedForCompare.includes(country.country_code)}
                onToggleCompare={handleToggleCompare}
              />
            ))}
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 sm:h-6 bg-white/10 rounded w-24 sm:w-32"></div>
            <div className="h-3 sm:h-4 bg-white/10 rounded w-20 sm:w-24"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <CountryCardSkeleton key={i} />)}
          </div>
        </div>
      )}

      {/* Floating Compare Button */}
      {mounted && selectedForCompare.length > 0 && createPortal(
        <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2 sm:gap-3 bg-black/95 border border-purple-500/30 rounded-full px-4 sm:px-5 py-2.5 sm:py-3 shadow-lg shadow-purple-500/20 backdrop-blur-xl safe-area-bottom">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex -space-x-1.5">
              {selectedForCompare.slice(0, 4).map((code, i) => {
                const country = countryDetailedStats.find(c => c.country_code === code);
                return (
                  <div key={i} className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center overflow-hidden">
                    {country?.country_code ? (
                      <img 
                        src={`https://flagcdn.com/16x12/${country.country_code.toLowerCase()}.png`}
                        alt=""
                        className="w-4 h-3 object-cover"
                      />
                    ) : (
                      <span className="text-[10px] sm:text-xs text-purple-400 font-bold">{i + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <span className="text-white/60 text-sm">{selectedForCompare.length} selected</span>
          </div>
          <div className="w-px h-6 sm:h-7 bg-white/10" />
          <button 
            onClick={handleClearCompare} 
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleCompareSelected}
            disabled={selectedForCompare.length < 2}
            className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-medium transition-all ${
              selectedForCompare.length >= 2
                ? 'bg-purple-500 text-white hover:bg-purple-400'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            }`}
          >
            <CompareIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Compare</span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function NetworkPage() {
  return (
    <DashboardLayout>
      <NetworkPageContent />
    </DashboardLayout>
  );
}
