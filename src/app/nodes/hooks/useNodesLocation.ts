'use client';

import { useState, useEffect } from 'react';
import { getLocationsForIPs, extractIPFromAddress } from '@/libs/services/geolocation';
import type { ValidatorData } from '@/libs/server';

interface LocationData {
  country: string;
  country_code: string;
  city: string;
  region: string;
  provider: string;
  ip: string;
}

export function useNodesLocation(allValidators: ValidatorData[]) {
  const [locations, setLocations] = useState<{ [ip: string]: LocationData | null }>({});
  const [loadingLocations, setLoadingLocations] = useState(false);

  useEffect(() => {
    const loadGeolocationData = async () => {
      if (allValidators.length === 0) return;
      
      setLoadingLocations(true);
      try {
        const allIPs = Array.from(new Set(
          allValidators
            .map(v => extractIPFromAddress(v.address || ''))
            .filter(ip => ip && !locations[ip])
        ));
        
        if (allIPs.length > 0) {
          const newLocations = await getLocationsForIPs(allIPs);
          setLocations(prev => ({ ...prev, ...newLocations }));
        }
      } catch (error) {
        console.error('Failed to load geolocation data:', error);
      } finally {
        setLoadingLocations(false);
      }
    };

    loadGeolocationData();
  }, [allValidators]);

  return { locations, loadingLocations };
}
