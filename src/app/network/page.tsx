'use client';

import { useMemo } from 'react';
import { DashboardLayout } from '@/components/layout';
import { NetworkTitleCard, NetworkCountriesCard, NetworkNodesCard, NetworkRegionsCard } from '@/components/dashboard';
import { useNetwork } from '@/libs/context/network-context';
import { useNetworkPageData } from './hooks';
import { CountryCard, CountryCardSkeleton, NetworkMap } from './components';
import { AISummary } from '@/components/ui/AISummary';

function NetworkPageContent() {
  const { network, isMainnet } = useNetwork();
  const { mapValidators, countryStats, countryDetailedStats, totalNodes, locatedNodes, loading, error } = useNetworkPageData(network);

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

  // Generate AI summary prompt for network overview
  const aiNetworkPrompt = useMemo(() => {
    if (!networkStats) return '';

    const formatStorage = (bytes: number) => {
      if (bytes >= 1024 * 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024 * 1024)).toFixed(2)}TB`;
      if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
    };

    const uptimeDays = (networkStats.avgUptime / 86400).toFixed(1);
    const networkName = isMainnet ? 'Mainnet' : 'Devnet';

    return `Summarize this ${networkName} network data in 1-2 simple sentences. Just state the facts, do NOT provide any recommendations or suggestions. Data: Total Nodes=${networkStats.totalNodes}, Online=${networkStats.totalOnline} (${networkStats.onlinePercent}%), Syncing=${networkStats.totalSyncing}, Offline=${networkStats.totalOffline}, Countries=${networkStats.countriesCount}, Top Countries=${networkStats.topCountries}, Total Storage=${formatStorage(networkStats.totalStorage)}, Used Storage=${formatStorage(networkStats.totalStorageUsed)} (${networkStats.storageEfficiency}% efficiency), Avg Uptime=${uptimeDays}d.`;
  }, [networkStats, isMainnet]);

  return (
    <div className="space-y-6 overflow-x-hidden">
      <NetworkTitleCard />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <NetworkNodesCard totalNodes={totalNodes} locatedNodes={locatedNodes} isLoading={loading} error={error} />
        <NetworkCountriesCard countryStats={countryStats} isLoading={loading} error={error} />
        <NetworkRegionsCard countryStats={countryStats} isLoading={loading} error={error} />
      </div>

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
            <span className="text-white/40 text-xs sm:text-sm">{countryDetailedStats.length} countries</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {countryDetailedStats.map((country) => (
              <CountryCard key={country.country} country={country} />
            ))}
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 sm:h-6 bg-gray-700/50 rounded w-24 sm:w-32 animate-pulse"></div>
            <div className="h-3 sm:h-4 bg-gray-700/50 rounded w-20 sm:w-24 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => <CountryCardSkeleton key={i} />)}
          </div>
        </div>
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
