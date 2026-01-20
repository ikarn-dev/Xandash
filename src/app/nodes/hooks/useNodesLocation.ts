'use client';

import { useState, useEffect, useRef } from 'react';
import { getLocationsForIPs, extractIPFromAddress } from '@/libs/services/geolocation';
import { useNetwork } from '@/libs/context/network-context';
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
  const { network } = useNetwork();
  const [locations, setLocations] = useState<{ [ip: string]: LocationData | null }>({});
  const [loadingLocations, setLoadingLocations] = useState(false);
  const previousNetworkRef = useRef(network);

  // Clear locations when network changes to prevent stale data
  useEffect(() => {
    if (previousNetworkRef.current !== network) {
      previousNetworkRef.current = network;
      setLocations({});
    }
  }, [network]);

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
  }, [allValidators, network]);

  return { locations, loadingLocations };
}
