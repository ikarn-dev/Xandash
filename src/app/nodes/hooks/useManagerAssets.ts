import { useState, useEffect, useCallback } from 'react';

export interface ManagerAssetData {
  manager_pubkey: string;
  nft_count: number;
  sbt_count: number;
  xand_balance: number;
  xeno_balance?: number;
  last_updated: number;
  nft_names: string[];
  sbt_names: string[];
  nft_previews?: { name: string; image: string | null }[];
  sbt_previews?: { name: string; image: string | null }[];
}

interface UseManagerAssetsReturn {
  managerAssets: Map<string, ManagerAssetData>;
  isLoading: boolean;
  fetchManagerAssets: (managerAddresses: string[]) => Promise<void>;
}

/**
 * Hook to fetch and cache manager assets data
 */
export function useManagerAssets(): UseManagerAssetsReturn {
  const [managerAssets, setManagerAssets] = useState<Map<string, ManagerAssetData>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  const fetchManagerAssets = useCallback(async (managerAddresses: string[]) => {
    if (managerAddresses.length === 0) return;

    // Filter out addresses we already have recent data for (less than 5 minutes old)
    const now = Date.now();
    const addressesToFetch = managerAddresses.filter(address => {
      const existing = managerAssets.get(address);
      return !existing || (now - existing.last_updated) > 5 * 60 * 1000; // 5 minutes
    });

    if (addressesToFetch.length === 0) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/manager-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addresses: addressesToFetch
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.managers) {
          setManagerAssets(prev => {
            const newMap = new Map(prev);

            Object.entries(data.managers).forEach(([address, assets]) => {
              newMap.set(address, assets as ManagerAssetData);
            });

            return newMap;
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch manager assets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [managerAssets]);

  return {
    managerAssets,
    isLoading,
    fetchManagerAssets,
  };
}