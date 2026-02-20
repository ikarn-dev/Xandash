'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

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
  creditsExhausted: boolean;
  fetchManagerAssets: (managerAddresses: string[]) => Promise<void>;
}

// ============================================================================
// LOCALSTORAGE PERSISTENCE
// ============================================================================

const STORAGE_KEY = 'xandash_manager_assets';
const STORAGE_MAX_AGE = 5 * 60 * 1000; // 5 minutes - matches server cache TTL
const CREDITS_EXHAUSTED_KEY = 'xandash_helius_credits_exhausted';
const CREDITS_EXHAUSTED_TTL = 10 * 60 * 1000; // 10 minutes - matches circuit breaker probe interval

/** Load manager assets from localStorage */
function loadFromStorage(): Map<string, ManagerAssetData> {
  try {
    if (typeof window === 'undefined') return new Map();
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const parsed: { data: Record<string, ManagerAssetData>; timestamp: number } = JSON.parse(raw);
    // Only use if not expired
    if (Date.now() - parsed.timestamp > STORAGE_MAX_AGE) {
      // Don't clear it — stale data is still useful as fallback
      // Just return it so UI can display something
    }
    const map = new Map<string, ManagerAssetData>();
    for (const [key, value] of Object.entries(parsed.data)) {
      map.set(key, value);
    }
    return map;
  } catch {
    return new Map();
  }
}

/** Save manager assets to localStorage */
function saveToStorage(assets: Map<string, ManagerAssetData>): void {
  try {
    if (typeof window === 'undefined') return;
    const data: Record<string, ManagerAssetData> = {};
    assets.forEach((value, key) => {
      data[key] = value;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

/** Check if we know credits are exhausted (cached client-side) */
function isCreditsExhaustedCached(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    const raw = localStorage.getItem(CREDITS_EXHAUSTED_KEY);
    if (!raw) return false;
    const { timestamp } = JSON.parse(raw);
    return Date.now() - timestamp < CREDITS_EXHAUSTED_TTL;
  } catch {
    return false;
  }
}

/** Mark credits as exhausted in localStorage */
function setCreditsExhaustedCache(exhausted: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    if (exhausted) {
      localStorage.setItem(CREDITS_EXHAUSTED_KEY, JSON.stringify({ timestamp: Date.now() }));
    } else {
      localStorage.removeItem(CREDITS_EXHAUSTED_KEY);
    }
  } catch {
    // silent
  }
}

// ============================================================================
// HOOK
// ============================================================================

// Request timeout in milliseconds
const REQUEST_TIMEOUT_MS = 16000;
// Maximum retry attempts
const MAX_RETRIES = 2;
// Base delay for exponential backoff (ms)
const BASE_RETRY_DELAY_MS = 300;

/**
 * Hook to fetch and cache manager assets data
 * Includes localStorage persistence, circuit breaker awareness, and deduplication
 */
export function useManagerAssets(): UseManagerAssetsReturn {
  const [managerAssets, setManagerAssets] = useState<Map<string, ManagerAssetData>>(() => loadFromStorage());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditsExhausted, setCreditsExhausted] = useState<boolean>(() => isCreditsExhaustedCached());

  // Track in-flight requests to prevent duplicates
  const inFlightRef = useRef<Set<string>>(new Set());

  // Persist to localStorage whenever managerAssets changes (with new data)
  const persistRef = useRef(false);
  useEffect(() => {
    if (persistRef.current && managerAssets.size > 0) {
      saveToStorage(managerAssets);
      persistRef.current = false;
    }
  }, [managerAssets]);

  const fetchManagerAssets = useCallback(async (managerAddresses: string[]) => {
    if (managerAddresses.length === 0) return;

    // Filter out addresses we already have recent data for
    const now = Date.now();
    const addressesToFetch = managerAddresses.filter(address => {
      // Skip if already fetching this address
      if (inFlightRef.current.has(address)) return false;

      const existing = managerAssets.get(address);
      // Skip if cached and less than 5 minutes old
      return !existing || (now - existing.last_updated) > STORAGE_MAX_AGE;
    });

    if (addressesToFetch.length === 0) return;

    // If credits are exhausted AND we have cached data for all addresses, skip entirely
    if (creditsExhausted) {
      const allCached = managerAddresses.every(addr => managerAssets.has(addr));
      if (allCached) {
        return; // Serve from cache, don't hit the server
      }
    }

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

    // Helper to process a single batch with retries
    const processBatch = async (batch: string[]) => {
      let retryCount = 0;
      let batchSuccess = false;

      while (retryCount <= MAX_RETRIES && !batchSuccess) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
          const response = await fetch('/api/manager-assets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ addresses: batch }),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          // Check for credit exhaustion header
          const exhaustedHeader = response.headers.get('x-credits-exhausted');
          if (exhaustedHeader === 'true') {
            if (!creditsExhausted) {
              toast.warning('Helius API credits exhausted — showing cached data', {
                id: 'helius-credits-exhausted',
                duration: 8000,
                description: 'Blockchain asset data may be outdated until credits reset.',
              });
            }
            setCreditsExhausted(true);
            setCreditsExhaustedCache(true);
          } else if (response.ok) {
            // Credits are available — clear exhaustion flag
            if (creditsExhausted) {
              toast.success('Helius API credits recovered', {
                id: 'helius-credits-recovered',
                duration: 5000,
              });
              setCreditsExhausted(false);
              setCreditsExhaustedCache(false);
            }
          }

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
            retryCount++;
            if (retryCount <= MAX_RETRIES) {
              await new Promise(resolve =>
                setTimeout(resolve, BASE_RETRY_DELAY_MS * Math.pow(2, retryCount))
              );
            }
          } else {
            break;
          }
        } catch (err) {
          clearTimeout(timeoutId);

          if (err instanceof Error && err.name === 'AbortError') {
            retryCount++;
            if (retryCount <= MAX_RETRIES) {
              await new Promise(resolve =>
                setTimeout(resolve, BASE_RETRY_DELAY_MS * Math.pow(2, retryCount))
              );
            }
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.warn('[Manager Assets] Fetch failed:', err instanceof Error ? err.message : 'Unknown error');
            }
            break;
          }
        }
      }
    };

    // Process batches sequentially to avoid overwhelming the server
    for (const batch of batches) {
      await processBatch(batch);
      // Small delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Update state with all results
    if (allResults.size > 0) {
      persistRef.current = true; // Flag to persist on next state update
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

    // Set placeholder data for failed addresses (prevent repeated requests)
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
  }, [managerAssets, creditsExhausted]);

  return {
    managerAssets,
    isLoading,
    error,
    creditsExhausted,
    fetchManagerAssets,
  };
}