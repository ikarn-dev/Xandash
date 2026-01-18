'use client';

import { useCountryData } from './hooks';
import {
  CountryHeader,
  CountryOverview,
  CountryStatsCards,
  CountryCharts,
  CountryNodesTable,
  CountryMap,
  CountryVPSProviders,
  MapPinIcon
} from './components';

interface CountryProfileClientProps {
  countryCode: string;
}

// Loading skeleton
const CountryProfileSkeleton = () => (
  <div className="space-y-4 sm:space-y-6 animate-pulse">
    <div className="h-12 sm:h-16 bg-white/5 rounded-lg"></div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <div className="lg:col-span-2 h-48 sm:h-64 bg-white/5 rounded-lg"></div>
      <div className="h-48 sm:h-64 bg-white/5 rounded-lg"></div>
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-20 sm:h-28 bg-white/5 rounded-lg"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 sm:h-40 bg-white/5 rounded-lg"></div>
      ))}
    </div>
    <div className="h-64 sm:h-80 bg-white/5 rounded-lg"></div>
  </div>
);

export function CountryProfileClient({ countryCode }: CountryProfileClientProps) {
  const { loading, nodes, locations, countryName, stats, mapNodes, network } = useCountryData(countryCode);

  if (loading) {
    return <CountryProfileSkeleton />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <CountryHeader
        countryCode={countryCode}
        countryName={countryName}
        totalNodes={stats.totalNodes}
        onlineNodes={stats.onlineNodes}
        syncingNodes={stats.syncingNodes}
        offlineNodes={stats.offlineNodes}
      />

      {/* Map and Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Map */}
        <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-lg overflow-hidden">
          <div className="p-3 sm:p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white">Node Locations</h2>
            </div>
          </div>
          <div className="h-[200px] sm:h-[250px] md:h-[300px]">
            {mapNodes.length > 0 ? (
              <CountryMap nodes={mapNodes} countryName={countryName} />
            ) : (
              <div className="flex items-center justify-center h-full text-white/40 text-sm">
                No location data available
              </div>
            )}
          </div>
        </div>

        {/* Overview */}
        <CountryOverview
          totalNodes={stats.totalNodes}
          onlineNodes={stats.onlineNodes}
          syncingNodes={stats.syncingNodes}
          offlineNodes={stats.offlineNodes}
          totalStorage={stats.totalStorage}
          totalStorageUsed={stats.totalStorageUsed}
          avgUptime={stats.avgUptime}
        />
      </div>

      {/* Stats Cards */}
      <CountryStatsCards
        totalCredits={stats.totalCredits}
        onlinePercent={stats.onlinePercent}
        totalStorage={stats.totalStorage}
        totalStorageUsed={stats.totalStorageUsed}
        avgUptime={stats.avgUptime}
      />

      {/* Charts */}
      <CountryCharts
        onlinePercent={stats.onlinePercent}
        totalCredits={stats.totalCredits}
        avgStorageUsage={stats.avgStorageUsage}
        onlineNodes={stats.onlineNodes}
      />

      {/* VPS Providers */}
      <CountryVPSProviders
        nodes={nodes}
        locations={locations}
        isLoading={loading}
      />

      {/* Nodes Table */}
      <CountryNodesTable
        nodes={nodes}
        locations={locations}
        countryName={countryName}
        network={network}
      />
    </div>
  );
}
