import { useState, useCallback, useRef } from 'react';

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
  error: string | null;
  fetchManagerAssets: (managerAddresses: string[]) => Promise<void>;
}

// Request timeout in milliseconds - aligned with server-side timeout (14s) plus buffer
const REQUEST_TIMEOUT_MS = 16000;
// Maximum retry attempts - allow 2 retries for transient failures
const MAX_RETRIES = 2;
// Base delay for exponential backoff (ms)
const BASE_RETRY_DELAY_MS = 300;

/**
 * Hook to fetch and cache manager assets data
 * Includes timeout handling, retry logic, and silent error recovery
 */
export function useManagerAssets(): UseManagerAssetsReturn {
  const [managerAssets, setManagerAssets] = useState<Map<string, ManagerAssetData>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track in-flight requests to prevent duplicates
  const inFlightRef = useRef<Set<string>>(new Set());

  const fetchManagerAssets = useCallback(async (managerAddresses: string[]) => {
    if (managerAddresses.length === 0) return;

    // Filter out addresses we already have recent data for (less than 2 minutes old for faster refresh)
    const now = Date.now();
    const addressesToFetch = managerAddresses.filter(address => {
      // Skip if already fetching this address
      if (inFlightRef.current.has(address)) return false;

      const existing = managerAssets.get(address);
      // Reduce cache time to 2 minutes for more responsive updates
      return !existing || (now - existing.last_updated) > 2 * 60 * 1000; // 2 minutes
    });

    if (addressesToFetch.length === 0) return;

    // Mark addresses as in-flight
    addressesToFetch.forEach(addr => inFlightRef.current.add(addr));
    setIsLoading(true);
    setError(null);

    // Process addresses in batches of 5 to match API limit
    const BATCH_SIZE = 5;
    const batches: string[][] = [];
    for (let i = 0; i < addressesToFetch.length; i += BATCH_SIZE) {
      batches.push(addressesToFetch.slice(i, i + BATCH_SIZE));
    }

    let successfulAddresses = new Set<string>();
    let allResults = new Map<string, ManagerAssetData>();

    // Process batches sequentially to avoid overwhelming the API
    for (const batch of batches) {
      let retryCount = 0;
      let batchSuccess = false;

      while (retryCount <= MAX_RETRIES && !batchSuccess) {
        // Create AbortController for timeout handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
          const response = await fetch('/api/manager-assets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              addresses: batch
            }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();

            if (data.managers) {
              Object.entries(data.managers).forEach(([address, assets]) => {
                allResults.set(address, assets as ManagerAssetData);
                successfulAddresses.add(address);
              });
              batchSuccess = true;
            }
          } else if (response.status === 429) {
            // Rate limited - wait longer before retry
            retryCount++;
            if (retryCount <= MAX_RETRIES) {
              await new Promise(resolve =>
                setTimeout(resolve, BASE_RETRY_DELAY_MS * Math.pow(2, retryCount))
              );
            }
          } else {
            // Other error - don't retry
            break;
          }
        } catch (err) {
          clearTimeout(timeoutId);

          // Handle abort/timeout silently
          if (err instanceof Error && err.name === 'AbortError') {
            // Timeout - try again with backoff
            retryCount++;
            if (retryCount <= MAX_RETRIES) {
              await new Promise(resolve =>
                setTimeout(resolve, BASE_RETRY_DELAY_MS * Math.pow(2, retryCount))
              );
            }
          } else {
            // Network error or other issue - log only in development
            if (process.env.NODE_ENV === 'development') {
              console.warn('[Manager Assets] Fetch failed:', err instanceof Error ? err.message : 'Unknown error');
            }
            break;
          }
        }
      }

      // Small delay between batches to avoid rate limiting
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Update state with all results
    if (allResults.size > 0) {
      setManagerAssets(prev => {
        const newMap = new Map(prev);
        allResults.forEach((assets, address) => {
          newMap.set(address, assets);
        });
        return newMap;
      });
    }

    // Clean up in-flight tracking
    addressesToFetch.forEach(addr => inFlightRef.current.delete(addr));
    setIsLoading(false);

    // Set placeholder data for failed addresses to prevent repeated requests
    const failedAddresses = addressesToFetch.filter(addr => !successfulAddresses.has(addr));
    if (failedAddresses.length > 0) {
      setManagerAssets(prev => {
        const newMap = new Map(prev);
        failedAddresses.forEach(address => {
          if (!newMap.has(address)) {
            newMap.set(address, {
              manager_pubkey: address,
              nft_count: 0,
              sbt_count: 0,
              xand_balance: 0,
              xeno_balance: 0,
              last_updated: Date.now(),
              nft_names: [],
              sbt_names: [],
              nft_previews: [],
              sbt_previews: [],
            });
          }
        });
        return newMap;
      });
    }
  }, [managerAssets]);

  return {
    managerAssets,
    isLoading,
    error,
    fetchManagerAssets,
  };
}