'use client';

import { DashboardLayout } from '@/components/layout';
import { NetworkTitleCard, NetworkCountriesCard, NetworkNodesCard, NetworkRegionsCard } from '@/components/dashboard';
import { useNetwork } from '@/libs/context/network-context';
import { useNetworkPageData } from './hooks';
import { CountryCard, CountryCardSkeleton, NetworkMap } from './components';

function NetworkPageContent() {
  const { network, isMainnet } = useNetwork();
  const { mapValidators, countryStats, countryDetailedStats, totalNodes, locatedNodes, loading, error } = useNetworkPageData(network);

  return (
    <div className="space-y-6 overflow-x-hidden">
      <NetworkTitleCard />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <NetworkNodesCard totalNodes={totalNodes} locatedNodes={locatedNodes} isLoading={loading} error={error} />
        <NetworkCountriesCard countryStats={countryStats} isLoading={loading} error={error} />
        <NetworkRegionsCard countryStats={countryStats} isLoading={loading} error={error} />
      </div>

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
