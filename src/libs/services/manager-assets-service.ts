/**
 * Manager Assets Service
 * 
 * Handles fetching and caching of manager NFT/SBT data for nodes
 * 
 * Rate Limit Protection:
 * - Global request queue with throttling (200ms between requests)
 * - In-flight request deduplication
 * - Reduced batch concurrency (2 managers at a time)
 * - Extended cache TTL (2 hours)
 * - Exponential backoff on rate limits
 */

import {
  getActiveApiKey,
  reportRateLimitHit,
  reportSuccess,
  isRateLimitError
} from '@/libs/utils/api-key-manager';

export interface NFTPreview {
  name: string;
  image: string | null;
}

interface ManagerAssetData {
  manager_pubkey: string;
  nft_count: number;
  sbt_count: number;
  xand_balance: number;
  xeno_balance: number;
  last_updated: number;
  nft_names: string[];
  sbt_names: string[];
  nft_previews: NFTPreview[];
  sbt_previews: NFTPreview[];
}

interface NFTAsset {
  id: string;
  content: {
    metadata: {
      name: string;
      symbol: string;
      description?: string;
    };
  };
}

// ============================================================================
// RATE LIMIT PROTECTION: Global Request Queue & Throttling
// ============================================================================

// Minimum delay between Helius API requests (200ms = max 5 req/sec)
const HELIUS_REQUEST_DELAY_MS = 200;

// Track last request time for throttling
let lastHeliusRequestTime = 0;

// In-flight request deduplication map
const inFlightRequests = new Map<string, Promise<ManagerAssetData | null>>();

/**
 * Throttled fetch for Helius API - ensures minimum delay between requests
 */
async function throttledHeliusFetch(url: string, options: RequestInit): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastHeliusRequestTime;

  if (timeSinceLastRequest < HELIUS_REQUEST_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, HELIUS_REQUEST_DELAY_MS - timeSinceLastRequest));
  }

  lastHeliusRequestTime = Date.now();
  return fetch(url, options);
}

// ============================================================================
// CACHING CONFIGURATION
// ============================================================================

// Cache for manager asset data (in-memory cache with TTL)
const managerAssetsCache = new Map<string, { data: ManagerAssetData; expires: number }>();
const failedRequestsCache = new Map<string, { timestamp: number }>();

// Extended cache TTL to 2 hours (assets don't change frequently)
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours
const FAILED_REQUEST_TTL = 5 * 60 * 1000; // 5 minutes - shorter TTL for failures to allow retries

// ============================================================================
// TOKEN CONFIGURATION
// ============================================================================

const XANDEUM_TOKEN_MINTS: string[] = [
  'XANDuUoVoUqniKkpcKhrxmvYJybpJvUxJLr21Gaj3Hx', // Xandeum token contract
];

const XENO_TOKEN_MINTS = [
  'G2bTxNndhA9zxxy4PZnHFcQo9wQQozrfcmN6AN9Heqoe'
];

// Keywords for identifying Xandeum-related NFTs
const XANDEUM_NFT_KEYWORDS = ['xandeum', 'xand', 'pnode', 'manager', 'xandash'];

/**
 * Check if an NFT is Xandeum-related
 * Matches NFTs that contain Xandeum-related keywords
 */
function isXandeumRelatedNFT(nft: NFTAsset): boolean {
  const name = (nft.content?.metadata?.name || '').toLowerCase();
  const symbol = (nft.content?.metadata?.symbol || '').toLowerCase();

  // Check if name or symbol contains any Xandeum keywords
  return XANDEUM_NFT_KEYWORDS.some(keyword =>
    name.includes(keyword) || symbol.includes(keyword)
  );
}

/**
 * Check if a token is XAND (by mint or symbol)
 */
function isXandToken(token: any): boolean {
  const tokenId = token.id || '';
  const symbol = (token.token_info?.symbol || '').toUpperCase();
  const name = (token.content?.metadata?.name || '').toLowerCase();

  // Check by mint first
  if (XANDEUM_TOKEN_MINTS.includes(tokenId)) {
    return true;
  }

  // Fallback to symbol/name matching
  return symbol === 'XAND' || name.includes('xandeum') && name.includes('token');
}

/**
 * Check if a token is XENO (by mint or symbol)
 */
function isXenoToken(token: any): boolean {
  const tokenId = token.id || '';
  const symbol = (token.token_info?.symbol || '').toUpperCase();
  const name = (token.content?.metadata?.name || '').toLowerCase();

  // Check by mint first
  if (XENO_TOKEN_MINTS.includes(tokenId)) {
    return true;
  }

  // Fallback to symbol/name matching
  return symbol === 'XENO' || name.includes('xeno');
}

/**
 * Check if an NFT is an SBT (Soul Bound Token)
 * SBTs typically have specific characteristics or are from known SBT collections
 */
function isSBT(nft: NFTAsset): boolean {
  const name = nft.content?.metadata?.name?.toLowerCase() || '';
  const symbol = nft.content?.metadata?.symbol?.toLowerCase() || '';

  // Check for SBT keywords or known SBT collection identifiers
  return name.includes('sbt') ||
    symbol.includes('sbt') ||
    name.includes('soul') ||
    name.includes('bound') ||
    name.includes('certificate') ||
    name.includes('badge');
}

/**
 * Fetch manager assets from Helius API with rate limit protection
 * Uses throttled requests and sequential page fetching to prevent rate limits
 */
async function fetchManagerAssets(managerAddress: string): Promise<ManagerAssetData | null> {
  let currentApiKey = getActiveApiKey('helius');
  if (!currentApiKey) {
    console.warn('Helius API key not configured for manager assets');
    return null;
  }

  const maxRetries = 3;
  let retryCount = 0;
  let backoffMs = 500; // Initial backoff for rate limit retries

  while (retryCount < maxRetries) {
    try {
      const tokenPages: any[] = [];
      const nftPages: any[] = [];

      // Fetch first page of tokens (throttled)
      const tokensPage1 = await throttledHeliusFetch(
        `https://mainnet.helius-rpc.com/?api-key=${currentApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'manager-tokens-1',
            method: 'getAssetsByOwner',
            params: {
              ownerAddress: managerAddress,
              page: 1,
              limit: 100,
              displayOptions: {
                showFungible: true,
                showNativeBalance: false,
              }
            }
          }),
          signal: AbortSignal.timeout(15000),
        }
      );

      // Check for rate limit on first request
      if (isRateLimitError(tokensPage1)) {
        console.log(`[Manager Assets] Rate limit hit on Helius tokens, attempting failover...`);
        const switched = reportRateLimitHit('helius');
        if (switched) {
          currentApiKey = getActiveApiKey('helius');
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          backoffMs *= 2; // Exponential backoff
          continue;
        }
        return null;
      }

      // Fetch first page of NFTs (throttled)
      const nftsPage1 = await throttledHeliusFetch(
        `https://mainnet.helius-rpc.com/?api-key=${currentApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'manager-nfts-1',
            method: 'getAssetsByOwner',
            params: {
              ownerAddress: managerAddress,
              page: 1,
              limit: 100,
              displayOptions: {
                showFungible: false,
                showNativeBalance: false,
              }
            }
          }),
          signal: AbortSignal.timeout(15000),
        }
      );

      // Check for rate limit on NFT request
      if (isRateLimitError(nftsPage1)) {
        console.log(`[Manager Assets] Rate limit hit on Helius NFTs, attempting failover...`);
        const switched = reportRateLimitHit('helius');
        if (switched) {
          currentApiKey = getActiveApiKey('helius');
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          backoffMs *= 2;
          continue;
        }
        return null;
      }

      reportSuccess('helius');

      const tokensData1 = await tokensPage1.json();
      const nftsData1 = await nftsPage1.json();

      tokenPages.push(tokensData1.result?.items || []);
      nftPages.push(nftsData1.result?.items || []);

      // Fetch remaining pages SEQUENTIALLY (not concurrent) to prevent rate limits
      // Only fetch additional pages if first page was full (100 items)
      const needMoreTokenPages = tokensData1.result?.items?.length === 100;
      const needMoreNftPages = nftsData1.result?.items?.length === 100;

      // Sequential token page fetching (max 3 more pages to limit API calls)
      if (needMoreTokenPages) {
        for (let page = 2; page <= 4; page++) {
          const pageResponse = await throttledHeliusFetch(
            `https://mainnet.helius-rpc.com/?api-key=${currentApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: `manager-tokens-${page}`,
                method: 'getAssetsByOwner',
                params: {
                  ownerAddress: managerAddress,
                  page: page,
                  limit: 100,
                  displayOptions: {
                    showFungible: true,
                    showNativeBalance: false,
                  }
                }
              }),
              signal: AbortSignal.timeout(15000),
            }
          );

          if (isRateLimitError(pageResponse)) {
            reportRateLimitHit('helius');
            break; // Stop paginating on rate limit, use what we have
          }

          const pageData = await pageResponse.json();
          const items = pageData.result?.items || [];
          tokenPages.push(items);

          // Stop if we got less than 100 items (no more pages)
          if (items.length < 100) break;
        }
      }

      // Sequential NFT page fetching (max 3 more pages)
      if (needMoreNftPages) {
        for (let page = 2; page <= 4; page++) {
          const pageResponse = await throttledHeliusFetch(
            `https://mainnet.helius-rpc.com/?api-key=${currentApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: `manager-nfts-${page}`,
                method: 'getAssetsByOwner',
                params: {
                  ownerAddress: managerAddress,
                  page: page,
                  limit: 100,
                  displayOptions: {
                    showFungible: false,
                    showNativeBalance: false,
                  }
                }
              }),
              signal: AbortSignal.timeout(15000),
            }
          );

          if (isRateLimitError(pageResponse)) {
            reportRateLimitHit('helius');
            break; // Stop paginating on rate limit, use what we have
          }

          const pageData = await pageResponse.json();
          const items = pageData.result?.items || [];
          nftPages.push(items);

          // Stop if we got less than 100 items (no more pages)
          if (items.length < 100) break;
        }
      }

      // Flatten all pages
      const allTokens = tokenPages.flat();
      const allNfts = nftPages.flat();

      let xandBalance = 0;
      let xenoBalance = 0;
      let nftCount = 0;
      let sbtCount = 0;
      const nftPreviews: NFTPreview[] = [];
      const sbtPreviews: NFTPreview[] = [];

      // Process tokens
      allTokens.forEach((token: any) => {
        if (isXandToken(token)) {
          const decimals = token.token_info?.decimals || 0;
          const balance = token.token_info?.balance || 0;
          xandBalance += balance / Math.pow(10, decimals);
        }

        if (isXenoToken(token)) {
          const decimals = token.token_info?.decimals || 0;
          const balance = token.token_info?.balance || 0;
          xenoBalance += balance / Math.pow(10, decimals);
        }
      });

      // Process NFTs
      allNfts.forEach((nft: any) => {
        if (isXandeumRelatedNFT(nft)) {
          const nftName = nft.content?.metadata?.name || `NFT ${nft.id.slice(0, 8)}...`;
          const imageUrl = nft.content?.links?.image ||
            nft.content?.files?.[0]?.uri ||
            null;

          const preview: NFTPreview = { name: nftName, image: imageUrl };

          if (isSBT(nft)) {
            sbtCount++;
            sbtPreviews.push(preview);
          } else {
            nftCount++;
            nftPreviews.push(preview);
          }
        }
      });

      return {
        manager_pubkey: managerAddress,
        nft_count: nftCount,
        sbt_count: sbtCount,
        xand_balance: xandBalance,
        xeno_balance: xenoBalance,
        last_updated: Date.now(),
        nft_names: nftPreviews.map(n => n.name),
        sbt_names: sbtPreviews.map(s => s.name),
        nft_previews: nftPreviews.slice(0, 10),
        sbt_previews: sbtPreviews.slice(0, 10),
      };

    } catch (error) {
      if (isRateLimitError(null, error)) {
        console.log(`[Manager Assets] Rate limit error on Helius for ${managerAddress}, attempting failover...`);
        const switched = reportRateLimitHit('helius');
        if (switched) {
          currentApiKey = getActiveApiKey('helius');
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          backoffMs *= 2;
          continue;
        }
      }
      console.error(`[Manager Assets] Error fetching assets for ${managerAddress}:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  return null;
}

/**
 * Get manager assets with caching, in-flight deduplication, and retry logic
 * 
 * In-flight deduplication ensures that if multiple requests come in for the same
 * manager address simultaneously, only one API call is made and all requests
 * share the same result.
 */
export async function getManagerAssets(managerAddress: string): Promise<ManagerAssetData | null> {
  const now = Date.now();

  // Check cache first (fastest path)
  const cached = managerAssetsCache.get(managerAddress);
  if (cached && cached.expires > now) {
    return cached.data;
  }

  // Check if we recently failed - allow retry after 5 minutes
  const failedRequest = failedRequestsCache.get(managerAddress);
  if (failedRequest && failedRequest.timestamp + FAILED_REQUEST_TTL > now) {
    // Still in cooldown period, return null
    return null;
  }

  // IN-FLIGHT DEDUPLICATION: Check if this request is already being processed
  const inFlightRequest = inFlightRequests.get(managerAddress);
  if (inFlightRequest) {
    // Wait for the existing request to complete and return its result
    return inFlightRequest;
  }

  // Create a new promise for this request and store it
  const fetchPromise = (async (): Promise<ManagerAssetData | null> => {
    try {
      const data = await fetchManagerAssets(managerAddress);

      if (data) {
        // Cache the result
        managerAssetsCache.set(managerAddress, {
          data,
          expires: Date.now() + CACHE_TTL
        });
        // Clear failed request cache on success
        failedRequestsCache.delete(managerAddress);
      } else {
        // Track failed request with shorter TTL to allow retries
        failedRequestsCache.set(managerAddress, { timestamp: Date.now() });
      }

      return data;
    } finally {
      // Always clean up in-flight request when done
      inFlightRequests.delete(managerAddress);
    }
  })();

  // Store the in-flight promise
  inFlightRequests.set(managerAddress, fetchPromise);

  return fetchPromise;
}

/**
 * Get manager assets for multiple addresses (batch processing)
 * 
 * RATE LIMIT OPTIMIZATIONS:
 * - Reduced batch size from 5 to 2 concurrent requests
 * - Increased inter-batch delay from 100ms to 500ms
 * - Combined with in-flight deduplication, this dramatically reduces API pressure
 */
export async function getBatchManagerAssets(managerAddresses: string[]): Promise<Map<string, ManagerAssetData>> {
  const results = new Map<string, ManagerAssetData>();

  // Deduplicate addresses before processing
  const uniqueAddresses = Array.from(new Set(managerAddresses));

  // REDUCED: Process only 2 addresses concurrently (down from 5)
  // This is because each address can trigger 2-8 Helius API calls
  const batchSize = 2;

  for (let i = 0; i < uniqueAddresses.length; i += batchSize) {
    const batch = uniqueAddresses.slice(i, i + batchSize);

    const batchPromises = batch.map(async (address) => {
      const data = await getManagerAssets(address);
      if (data) {
        results.set(address, data);
      }
    });

    await Promise.all(batchPromises);

    // INCREASED: Larger delay between batches (500ms instead of 100ms)
    // This gives Helius API time to recover and prevents rate limit cascades
    if (i + batchSize < uniqueAddresses.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return results;
}

/**
 * Clear cache for a specific manager or all managers
 */
export function clearManagerAssetsCache(managerAddress?: string): void {
  if (managerAddress) {
    managerAssetsCache.delete(managerAddress);
    inFlightRequests.delete(managerAddress); // Also clear in-flight
  } else {
    managerAssetsCache.clear();
    inFlightRequests.clear();
  }
}

/**
 * Get cache statistics for monitoring
 */
export function getManagerAssetsCacheStats(): {
  size: number;
  entries: string[];
  inFlightCount: number;
} {
  return {
    size: managerAssetsCache.size,
    entries: Array.from(managerAssetsCache.keys()),
    inFlightCount: inFlightRequests.size
  };
}