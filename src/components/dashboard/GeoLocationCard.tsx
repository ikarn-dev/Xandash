'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { InteractiveMap } from '@/components/ui';
import { getLocationsForIPs, extractIPFromAddress } from '@/libs/services/geolocation';
import { useNetwork } from '@/libs/context/network-context';

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

interface RawNodeData {
  pubkey?: string;
  address?: string;
  status?: string;
  uptime?: number;
  storage_committed?: number;
  storage_used?: number;
  storage_usage_percent?: number;
  version?: string;
  rpc_port?: number;
  is_public?: boolean;
  last_seen_timestamp?: number;
}

export const GeoLocationCard: React.FC = () => {
  const { network } = useNetwork();
  const [nodes, setNodes] = useState<RawNodeData[]>([]);
  const [locations, setLocations] = useState<{ [ip: string]: LocationData | null }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Use ref to track if this is the first load (survives re-renders and interval callbacks)
  const hasLoadedRef = useRef(false);
  const prevNetworkRef = useRef(network);

  // Fetch nodes and location data - refetch when network changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if network changed - if so, show loading skeleton
        const networkChanged = prevNetworkRef.current !== network;
        if (networkChanged) {
          prevNetworkRef.current = network;
          hasLoadedRef.current = false;
        }
        
        // Only show loading skeleton on initial load or network change
        if (!hasLoadedRef.current) {
          setLoading(true);
        } else {
          // For auto-refresh, just show subtle updating state
          setIsUpdating(true);
        }
        
        // Fetch nodes from API with network parameter
        const response = await fetch(`/api/nodes?includeAll=true&network=${network}`);
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
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch node data:', err);
        // Only set error if we don't have existing data
        if (nodes.length === 0) {
          setError(err instanceof Error ? err.message : 'Failed to load data');
        }
      } finally {
        setLoading(false);
        hasLoadedRef.current = true;
        // Delay removing updating state for smooth transition
        setTimeout(() => setIsUpdating(false), 300);
      }
    };

    fetchData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [network]); // eslint-disable-line react-hooks/exhaustive-deps

  // Process nodes into map locations
  const { mapValidators, countryStats, totalNodes } = useMemo(() => {
    const locationGroups = new Map<string, {
      lat: number;
      lng: number;
      city: string;
      country: string;
      count: number;
      nodes: RawNodeData[];
    }>();
    
    const countryMap = new Map<string, { country: string; country_code: string; count: number }>();

    nodes.forEach((node) => {
      const ip = extractIPFromAddress(node.address || '');
      const location = locations[ip];
      
      if (location && location.lat && location.lon) {
        // Group by city/country for map markers
        const locationKey = `${location.city}-${location.country}`;
        const existing = locationGroups.get(locationKey);
        
        if (existing) {
          existing.count++;
          existing.nodes.push(node);
        } else {
          locationGroups.set(locationKey, {
            lat: location.lat,
            lng: location.lon,
            city: location.city,
            country: location.country,
            count: 1,
            nodes: [node]
          });
        }
      }
      
      // Count ALL nodes by country (including unknown locations)
      if (location && location.country) {
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
      } else {
        // Count unknown locations
        const unknownKey = 'Unknown';
        const existingUnknown = countryMap.get(unknownKey);
        if (existingUnknown) {
          existingUnknown.count++;
        } else {
          countryMap.set(unknownKey, {
            country: 'Unknown',
            country_code: '',
            count: 1
          });
        }
      }
    });

    const mapValidators: ValidatorLocation[] = Array.from(locationGroups.entries()).map(([, data], idx) => ({
      id: `location-${idx}`,
      lat: data.lat,
      lng: data.lng,
      count: data.count,
      city: data.city,
      country: data.country
    }));

    const countryStats: CountryStats[] = Array.from(countryMap.values())
      .sort((a, b) => b.count - a.count);

    return {
      mapValidators,
      countryStats,
      totalNodes: nodes.length // Total including unknown locations
    };
  }, [nodes, locations]);

  if (loading) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg h-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-white/60 text-sm">Loading pNode locations...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg h-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-sm mb-2">Failed to load pNode data</div>
          <div className="text-white/40 text-xs">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg h-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] flex flex-col relative overflow-hidden">
      {/* Stats Overlay - Top Left */}
      <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-50 space-y-2 sm:space-y-3 bg-black/40 backdrop-blur-sm rounded-lg p-2 sm:p-3">
        <div className={`text-left transition-all duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
          <div className="text-white text-xl sm:text-2xl md:text-3xl font-bold font-mono">{totalNodes}</div>
          <div className="text-white/60 text-xs sm:text-sm">pNodes</div>
        </div>
        <div className={`text-left transition-all duration-300 ${isUpdating ? 'opacity-60' : 'opacity-100'}`}>
          <div className="text-white text-lg sm:text-xl md:text-2xl font-bold font-mono">{countryStats.length}</div>
          <div className="text-white/60 text-xs sm:text-sm">Countries</div>
        </div>
      </div>

      {/* Live indicator - Top Right */}
      <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-50 flex items-center space-x-1 sm:space-x-2 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 sm:px-3 sm:py-2">
        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse"></div>
        <span className="text-white text-xs sm:text-sm font-medium">Live</span>
      </div>

      {/* Country Stats - Bottom Left */}
      <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 z-50 bg-black/40 backdrop-blur-sm rounded-lg p-2 sm:p-3 max-h-32 sm:max-h-48">
        <div className="text-white/80 text-xs font-medium mb-1 sm:mb-2">pNodes by Country</div>
        <div 
          className="space-y-1 max-w-36 sm:max-w-48 max-h-24 sm:max-h-40 pr-2"
          style={{
            overflowY: 'auto',
            scrollbarWidth: 'none', /* Firefox */
            msOverflowStyle: 'none', /* IE and Edge */
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none; /* Chrome, Safari, Opera */
            }
          `}</style>
          {countryStats.map((country, index) => (
            <div key={country.country} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1 sm:space-x-2 flex-1 min-w-0">
                {country.country_code ? (
                  <img 
                    src={`${process.env.NEXT_PUBLIC_FLAG_CDN_URL || 'https://flagcdn.com'}/16x12/${country.country_code.toLowerCase()}.png`}
                    alt={country.country}
                    className="w-3 h-2 sm:w-4 sm:h-3 object-cover rounded-sm flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-3 h-2 sm:w-4 sm:h-3 bg-gray-500 rounded-sm flex-shrink-0 flex items-center justify-center">
                    <span className="text-white text-xs">?</span>
                  </div>
                )}
                <span className="text-white truncate text-xs">{country.country}</span>
              </div>
              <div className="bg-white/20 text-white px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-mono ml-1 sm:ml-2 flex-shrink-0">
                {country.count}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Map - Full background */}
      <div className="absolute inset-0 z-0">
        <InteractiveMap 
          validators={mapValidators}
          className="w-full h-full"
        />
      </div>
    </div>
  );
};