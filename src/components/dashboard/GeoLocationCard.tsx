'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { InteractiveMap } from '@/components/ui';
import { getLocationsForIPs, extractIPFromAddress } from '@/libs/services/geolocation';
import { useNetwork } from '@/libs/context/network-context';
import { useNodesData } from '@/libs/context/nodes-data-context';

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

// Approximate lat/lon for countries (for map display when exact coords not available)
const COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
  'US': { lat: 37.0902, lon: -95.7129 },
  'DE': { lat: 51.1657, lon: 10.4515 },
  'FR': { lat: 46.2276, lon: 2.2137 },
  'GB': { lat: 55.3781, lon: -3.4360 },
  'NL': { lat: 52.1326, lon: 5.2913 },
  'CA': { lat: 56.1304, lon: -106.3468 },
  'AU': { lat: -25.2744, lon: 133.7751 },
  'JP': { lat: 36.2048, lon: 138.2529 },
  'SG': { lat: 1.3521, lon: 103.8198 },
  'IN': { lat: 20.5937, lon: 78.9629 },
  'FI': { lat: 61.9241, lon: 25.7482 },
  'SE': { lat: 60.1282, lon: 18.6435 },
  'PL': { lat: 51.9194, lon: 19.1451 },
};

export const GeoLocationCard: React.FC = () => {
  const { network, isMainnet } = useNetwork();
  // Use shared nodes data context - includes high watermark logic for mainnet
  const { nodes: sharedNodes, isLoading } = useNodesData();
  
  const [locations, setLocations] = useState<{ [ip: string]: LocationData | null }>({});
  const [locationsLoading, setLocationsLoading] = useState(false);
  
  // Track previous network for location cache clearing
  const prevNetworkRef = useRef(network);

  // Fetch geolocation for devnet nodes only (mainnet has geo data in node itself)
  useEffect(() => {
    // Clear locations on network change
    if (prevNetworkRef.current !== network) {
      prevNetworkRef.current = network;
      setLocations({});
    }
    
    // Skip geolocation fetch for mainnet (data comes from external source)
    if (isMainnet || sharedNodes.length === 0) return;
    
    const fetchLocations = async () => {
      setLocationsLoading(true);
      try {
        const uniqueIPs: string[] = Array.from(new Set(
          sharedNodes
            .map((node) => extractIPFromAddress(node.address || ''))
            .filter((ip: string) => ip)
        ));
        
        if (uniqueIPs.length > 0) {
          const locationData = await getLocationsForIPs(uniqueIPs);
          setLocations(locationData);
        }
      } catch (err) {
        console.error('Failed to fetch location data:', err);
      } finally {
        setLocationsLoading(false);
      }
    };

    fetchLocations();
  }, [sharedNodes, isMainnet, network]);

  // Process nodes into map locations
  const { mapValidators, countryStats, totalNodes } = useMemo(() => {
    const locationGroups = new Map<string, {
      lat: number;
      lng: number;
      city: string;
      country: string;
      count: number;
    }>();
    
    const countryMap = new Map<string, { country: string; country_code: string; count: number }>();

    sharedNodes.forEach((node) => {
      const ip = extractIPFromAddress(node.address || '');
      
      // For mainnet, use geo data from node itself (from external sources)
      // For devnet, use fetched location data
      let location: LocationData | null = null;
      
      if (isMainnet && node.country && node.country_code) {
        const countryCode = node.country_code.toUpperCase();
        const coords = COUNTRY_COORDS[countryCode];
        location = {
          country: node.country,
          country_code: node.country_code,
          city: '',
          region: '',
          provider: node.provider || 'Unknown',
          ip,
          lat: coords?.lat,
          lon: coords?.lon,
        };
      } else {
        location = locations[ip];
      }
      
      if (location && (location.lat || isMainnet)) {
        // Group by city/country for map markers
        const locationKey = isMainnet 
          ? `${location.country}-center`
          : `${location.city}-${location.country}`;
        const existing = locationGroups.get(locationKey);
        
        const lat = location.lat || COUNTRY_COORDS[location.country_code?.toUpperCase()]?.lat || 0;
        const lon = location.lon || COUNTRY_COORDS[location.country_code?.toUpperCase()]?.lon || 0;
        
        if (lat && lon) {
          if (existing) {
            existing.count++;
          } else {
            locationGroups.set(locationKey, {
              lat,
              lng: lon,
              city: location.city || location.country,
              country: location.country,
              count: 1
            });
          }
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
      totalNodes: sharedNodes.length
    };
  }, [sharedNodes, locations, isMainnet]);

  const loading = isLoading || (locationsLoading && !isMainnet);

  if (loading) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg h-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] flex flex-col relative overflow-hidden">
        {/* Stats Overlay Skeleton - Top Left */}
        <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-50 space-y-2 sm:space-y-3 bg-black/40 backdrop-blur-sm rounded-lg p-2 sm:p-3">
          <div className="text-left">
            <div className="h-8 w-16 bg-white/10 rounded mb-1"></div>
            <div className="h-3 w-12 bg-white/10 rounded"></div>
          </div>
          <div className="text-left">
            <div className="h-6 w-12 bg-white/10 rounded mb-1"></div>
            <div className="h-3 w-16 bg-white/10 rounded"></div>
          </div>
        </div>

        {/* Live indicator Skeleton - Top Right */}
        <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-50 flex items-center space-x-1 sm:space-x-2 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 sm:px-3 sm:py-2">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/30 rounded-full"></div>
          <div className="h-3 w-8 bg-white/10 rounded"></div>
        </div>

        {/* Country Stats Skeleton - Bottom Left */}
        <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 z-50 bg-black/40 backdrop-blur-sm rounded-lg p-2 sm:p-3">
          <div className="h-3 w-24 bg-white/10 rounded mb-2"></div>
          <div className="space-y-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-3 bg-white/10 rounded"></div>
                  <div className="h-3 w-16 bg-white/10 rounded"></div>
                </div>
                <div className="h-4 w-8 bg-white/10 rounded-full ml-2"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Skeleton Background */}
        <div className="absolute inset-0 z-0 bg-gray-800/50"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg h-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] flex flex-col relative overflow-hidden">
      {/* Stats Overlay - Top Left */}
      <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-50 space-y-2 sm:space-y-3 bg-black/40 backdrop-blur-sm rounded-lg p-2 sm:p-3">
        <div className="text-left">
          <div className="text-white text-xl sm:text-2xl md:text-3xl font-bold font-mono">{totalNodes}</div>
          <div className="text-white/60 text-xs sm:text-sm">pNodes</div>
        </div>
        <div className="text-left">
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