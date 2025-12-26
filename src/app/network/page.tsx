'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { InteractiveMap } from '@/components/ui';
import { 
  NetworkTitleCard, 
  NetworkCountriesCard, 
  NetworkNodesCard, 
  NetworkRegionsCard 
} from '@/components/dashboard';
import { getLocationsForIPs, extractIPFromAddress } from '@/libs/services/geolocation';

interface LocationData {
  country: string;
  country_code: string;
  city: string;
  region: string;
  provider: string;
  ip: string;
  lat?: number;
  lon?: number;
}

interface ValidatorLocation {
  id: string;
  lat: number;
  lng: number;
  count: number;
  city?: string;
  country?: string;
}

interface CountryStats {
  country: string;
  country_code: string;
  count: number;
}

interface CountryDetailedStats {
  country: string;
  country_code: string;
  totalNodes: number;
  onlineNodes: number;
  offlineNodes: number;
  totalStorage: number;
  totalStorageUsed: number;
  avgUptime: number;
}

interface RawNodeData {
  pubkey?: string;
  address?: string;
  status?: string;
  uptime?: number;
  storage_committed?: number;
  storage_used?: number;
  version?: string;
  is_public?: boolean;
  last_seen_timestamp?: number;
}

function NetworkPageContent() {
  const router = useRouter();
  const [nodes, setNodes] = useState<RawNodeData[]>([]);
  const [locations, setLocations] = useState<{ [ip: string]: LocationData | null }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format storage size
  const formatStorage = (bytes: number) => {
    if (bytes >= 1024 ** 4) return (bytes / 1024 ** 4).toFixed(2) + ' TB';
    if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(2) + ' GB';
    if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  // Format uptime
  const formatUptime = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0h';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  // Fetch nodes and location data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch('/api/nodes?includeAll=true');
        if (!response.ok) {
          throw new Error(`Failed to fetch nodes: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        
        const allNodes = data.nodes || [];
        setNodes(allNodes);
        
        // Extract unique IPs
        const uniqueIPs: string[] = Array.from(new Set(
          allNodes
            .map((node: RawNodeData) => extractIPFromAddress(node.address || ''))
            .filter((ip: string) => ip)
        ));
        
        if (uniqueIPs.length > 0) {
          const locationData = await getLocationsForIPs(uniqueIPs);
          setLocations(locationData);
        }
        
      } catch (err) {
        console.error('Failed to fetch node data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process nodes into map locations and stats
  const { mapValidators, countryStats, countryDetailedStats, totalNodes, locatedNodes } = useMemo(() => {
    const locationGroups = new Map<string, {
      lat: number;
      lng: number;
      city: string;
      country: string;
      count: number;
    }>();
    
    const countryMap = new Map<string, { country: string; country_code: string; count: number }>();
    const countryDetailedMap = new Map<string, {
      country: string;
      country_code: string;
      nodes: RawNodeData[];
    }>();
    let validNodes = 0;

    nodes.forEach((node) => {
      const ip = extractIPFromAddress(node.address || '');
      const location = locations[ip];
      
      if (location && location.lat && location.lon) {
        validNodes++;
        
        const locationKey = `${location.city}-${location.country}`;
        const existing = locationGroups.get(locationKey);
        
        if (existing) {
          existing.count++;
        } else {
          locationGroups.set(locationKey, {
            lat: location.lat,
            lng: location.lon,
            city: location.city,
            country: location.country,
            count: 1,
          });
        }
        
        // Count by country
        const countryKey = location.country;
        const existingCountry = countryMap.get(countryKey);
        if (existingCountry) {
          existingCountry.count++;
        } else {
          countryMap.set(countryKey, {
            country: location.country,
            country_code: location.country_code,
            count: 1
          });
        }

        // Detailed country stats
        const existingDetailed = countryDetailedMap.get(countryKey);
        if (existingDetailed) {
          existingDetailed.nodes.push(node);
        } else {
          countryDetailedMap.set(countryKey, {
            country: location.country,
            country_code: location.country_code,
            nodes: [node]
          });
        }
      }
    });

    const mapValidators: ValidatorLocation[] = Array.from(locationGroups.entries()).map(([key, data], index) => ({
      id: `location-${index}`,
      lat: data.lat,
      lng: data.lng,
      count: data.count,
      city: data.city,
      country: data.country
    }));

    const countryStats: CountryStats[] = Array.from(countryMap.values())
      .sort((a, b) => b.count - a.count);

    // Calculate detailed stats for each country
    const now = Math.floor(Date.now() / 1000);
    const countryDetailedStats: CountryDetailedStats[] = Array.from(countryDetailedMap.values())
      .map(({ country, country_code, nodes: countryNodes }) => {
        // Check online status based on last_seen_timestamp (within 5 minutes = online)
        const onlineNodes = countryNodes.filter(n => {
          const lastSeen = n.last_seen_timestamp || 0;
          const timeDiff = now - lastSeen;
          return timeDiff < 300; // 5 minutes
        }).length;
        const offlineNodes = countryNodes.length - onlineNodes;
        const totalStorage = countryNodes.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
        const totalStorageUsed = countryNodes.reduce((sum, n) => sum + (n.storage_used || 0), 0);
        const totalUptime = countryNodes.reduce((sum, n) => sum + (n.uptime || 0), 0);
        const avgUptime = countryNodes.length > 0 ? totalUptime / countryNodes.length : 0;

        return {
          country,
          country_code,
          totalNodes: countryNodes.length,
          onlineNodes,
          offlineNodes,
          totalStorage,
          totalStorageUsed,
          avgUptime
        };
      })
      .sort((a, b) => b.totalNodes - a.totalNodes);

    return {
      mapValidators,
      countryStats,
      countryDetailedStats,
      totalNodes: nodes.length,
      locatedNodes: validNodes
    };
  }, [nodes, locations]);

  return (
    <div className="space-y-6">
      {/* Title Card */}
      <NetworkTitleCard />

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <NetworkNodesCard 
          totalNodes={totalNodes}
          locatedNodes={locatedNodes}
          isLoading={loading}
          error={error}
        />
        <NetworkCountriesCard 
          countryStats={countryStats}
          isLoading={loading}
          error={error}
        />
        <NetworkRegionsCard 
          countryStats={countryStats}
          isLoading={loading}
          error={error}
        />
      </div>

      {/* World Map */}
      <div className="relative bg-black border border-white/10 rounded-lg overflow-hidden group hover:border-white/20 transition-all duration-300 min-h-[280px] sm:min-h-[350px] md:min-h-[450px] lg:min-h-[500px]">
        {/* Corner Accents */}
        <div className="absolute top-0 left-0 w-6 h-6 z-20">
          <div className="absolute top-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute top-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>
        <div className="absolute top-0 right-0 w-6 h-6 z-20">
          <div className="absolute top-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute top-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-6 h-6 z-20">
          <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute bottom-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-6 h-6 z-20">
          <div className="absolute bottom-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute bottom-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>

        {/* Stats Overlay - Top Left */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 md:top-6 md:left-6 z-50 space-y-2 sm:space-y-3 bg-black/60 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/10">
          <div className="text-left">
            <div className="text-white text-xl sm:text-2xl md:text-3xl font-bold font-mono">{totalNodes}</div>
            <div className="text-white/60 text-[10px] sm:text-xs md:text-sm">pNodes</div>
          </div>
          <div className="text-left">
            <div className="text-white text-lg sm:text-xl md:text-2xl font-bold font-mono">{countryStats.length}</div>
            <div className="text-white/60 text-[10px] sm:text-xs md:text-sm">Countries</div>
          </div>
        </div>

        {/* Live indicator - Top Right */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-6 md:right-6 z-50 flex items-center space-x-1.5 sm:space-x-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 border border-white/10">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-white text-xs sm:text-sm font-medium">Live</span>
        </div>

        {/* Country Stats - Bottom Left */}
        {countryStats.length > 0 && (
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 md:bottom-6 md:left-6 z-50 bg-black/60 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-white/10 max-h-28 sm:max-h-40 md:max-h-48">
            <div className="text-white/80 text-[10px] sm:text-xs font-medium mb-1.5 sm:mb-2 font-mono">// TOP COUNTRIES</div>
            <div className="space-y-1 max-w-32 sm:max-w-40 md:max-w-48 max-h-16 sm:max-h-28 md:max-h-32 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {countryStats.slice(0, 5).map((country) => (
                <div key={country.country} className="flex items-center justify-between text-[10px] sm:text-xs">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 flex-1 min-w-0">
                    {country.country_code ? (
                      <img 
                        src={`${process.env.NEXT_PUBLIC_FLAG_CDN_URL || 'https://flagcdn.com'}/16x12/${country.country_code.toLowerCase()}.png`}
                        alt={country.country}
                        className="w-3 h-2 sm:w-4 sm:h-3 object-cover rounded-sm flex-shrink-0"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-3 h-2 sm:w-4 sm:h-3 bg-gray-500 rounded-sm flex-shrink-0" />
                    )}
                    <span className="text-white truncate">{country.country}</span>
                  </div>
                  <div className="bg-white/20 text-white px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono ml-1.5 sm:ml-2 flex-shrink-0">
                    {country.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-white/60 text-sm">Loading network data...</div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-40">
            <div className="text-center">
              <div className="text-red-400 text-sm mb-2">Failed to load network data</div>
              <div className="text-white/40 text-xs">{error}</div>
            </div>
          </div>
        )}

        {/* Interactive Map */}
        <div className="absolute inset-0 z-0">
          <InteractiveMap 
            validators={mapValidators}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Country Stats Section */}
      {!loading && countryDetailedStats.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-white font-mono">// COUNTRIES</h2>
            <span className="text-white/40 text-xs sm:text-sm">{countryDetailedStats.length} countries</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {countryDetailedStats.map((country) => {
              const onlinePercent = country.totalNodes > 0 ? (country.onlineNodes / country.totalNodes) * 100 : 0;
              const totalBars = 45;
              const greenBars = Math.round((onlinePercent / 100) * totalBars);
              
              return (
                <div 
                  key={country.country}
                  onClick={() => router.push(`/country/${encodeURIComponent(country.country_code.toLowerCase())}`)}
                  className="relative bg-black border border-white/10 p-3 sm:p-4 md:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden cursor-pointer"
                >
                  {/* Corner Accents */}
                  <div className="absolute top-0 left-0 w-6 h-6">
                    <div className="absolute top-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
                    <div className="absolute top-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
                  </div>
                  <div className="absolute top-0 right-0 w-6 h-6">
                    <div className="absolute top-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
                    <div className="absolute top-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-6 h-6">
                    <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
                    <div className="absolute bottom-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
                  </div>
                  <div className="absolute bottom-0 right-0 w-6 h-6">
                    <div className="absolute bottom-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
                    <div className="absolute bottom-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
                  </div>

                  {/* Header with Flag and Node Count */}
                  <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      {country.country_code ? (
                        <img 
                          src={`${process.env.NEXT_PUBLIC_FLAG_CDN_URL || 'https://flagcdn.com'}/24x18/${country.country_code.toLowerCase()}.png`}
                          alt={country.country}
                          className="w-5 h-3.5 sm:w-6 sm:h-4 object-cover rounded-sm"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-5 h-3.5 sm:w-6 sm:h-4 bg-gray-600 rounded-sm" />
                      )}
                      <span className="text-white font-medium text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{country.country}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-white text-xl sm:text-2xl font-bold font-mono">{country.totalNodes}</div>
                      <div className="text-white/40 text-[9px] sm:text-[10px]">nodes</div>
                    </div>
                  </div>

                  {/* Status Stats Row */}
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4 relative z-10">
                    <div className="text-center">
                      <div className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-wider mb-0.5 sm:mb-1">Online</div>
                      <div className="text-green-400 text-base sm:text-lg font-bold font-mono">{country.onlineNodes}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-wider mb-0.5 sm:mb-1">Offline</div>
                      <div className="text-red-400 text-base sm:text-lg font-bold font-mono">{country.offlineNodes}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-wider mb-0.5 sm:mb-1">Uptime</div>
                      <div className="text-blue-400 text-base sm:text-lg font-bold font-mono">{onlinePercent.toFixed(0)}%</div>
                    </div>
                  </div>

                  {/* Uptime Bar Graph */}
                  <div className="w-full mb-3 sm:mb-4 relative z-10">
                    <svg 
                      className="w-full" 
                      height="16" 
                      viewBox="0 0 200 20" 
                      preserveAspectRatio="none"
                    >
                      {Array.from({ length: totalBars }).map((_, index) => (
                        <rect
                          key={index}
                          x={index * 4.5}
                          y={0}
                          width={3}
                          height={20}
                          rx={1}
                          fill={index < greenBars ? '#10b981' : '#374151'}
                        />
                      ))}
                    </svg>
                  </div>

                  {/* Storage Stats */}
                  <div className="space-y-1.5 sm:space-y-2 relative z-10 border-t border-white/5 pt-3 sm:pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-[10px] sm:text-xs">Total Storage</span>
                      <span className="text-white font-mono text-xs sm:text-sm">{formatStorage(country.totalStorage)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-[10px] sm:text-xs">Storage Used</span>
                      <span className="text-white font-mono text-xs sm:text-sm">{formatStorage(country.totalStorageUsed)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-[10px] sm:text-xs">Avg Uptime</span>
                      <span className="text-white font-mono text-xs sm:text-sm">{formatUptime(country.avgUptime)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading Skeleton for Country Stats */}
      {loading && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 sm:h-6 bg-gray-700/50 rounded w-24 sm:w-32 animate-pulse"></div>
            <div className="h-3 sm:h-4 bg-gray-700/50 rounded w-20 sm:w-24 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="relative bg-black border border-white/10 p-3 sm:p-4 md:p-6 animate-pulse">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-4 bg-gray-700/50 rounded"></div>
                    <div className="h-5 bg-gray-700/50 rounded w-24"></div>
                  </div>
                  <div className="text-right">
                    <div className="h-8 bg-gray-700/50 rounded w-10 mb-1"></div>
                    <div className="h-3 bg-gray-700/50 rounded w-8"></div>
                  </div>
                </div>
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="text-center">
                      <div className="h-3 bg-gray-700/50 rounded w-12 mx-auto mb-1"></div>
                      <div className="h-6 bg-gray-700/50 rounded w-8 mx-auto"></div>
                    </div>
                  ))}
                </div>
                {/* Bar */}
                <div className="h-5 bg-gray-700/50 rounded mb-4"></div>
                {/* Storage Stats */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="flex justify-between">
                      <div className="h-3 bg-gray-700/50 rounded w-20"></div>
                      <div className="h-3 bg-gray-700/50 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
