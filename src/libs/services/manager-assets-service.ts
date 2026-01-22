/**
 * Manager Assets Service
 * 
 * Handles fetching and caching of manager NFT/SBT data for nodes
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

// Cache for manager asset data (in-memory cache with TTL)
const managerAssetsCache = new Map<string, { data: ManagerAssetData; expires: number }>();
const failedRequestsCache = new Map<string, { timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const FAILED_REQUEST_TTL = 5 * 60 * 1000; // 5 minutes - shorter TTL for failures to allow retries

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
 * Fetch manager assets from Helius API with optimized concurrent pagination
 */
async function fetchManagerAssets(managerAddress: string): Promise<ManagerAssetData | null> {
  let currentApiKey = getActiveApiKey('helius');
  if (!currentApiKey) {
    console.warn('Helius API key not configured for manager assets');
    return null;
  }

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      // Fetch all pages concurrently for both tokens and NFTs
      const tokenPages: any[] = [];
      const nftPages: any[] = [];
      
      // Fetch first page of both to check if more pages exist
      const [tokensPage1, nftsPage1] = await Promise.all([
        fetch(`https://mainnet.helius-rpc.com/?api-key=${currentApiKey}`, {
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
          signal: AbortSignal.timeout(10000),
        }),
        fetch(`https://mainnet.helius-rpc.com/?api-key=${currentApiKey}`, {
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
          signal: AbortSignal.timeout(10000),
        })
      ]);

      // Check for rate limit errors
      if (isRateLimitError(tokensPage1) || isRateLimitError(nftsPage1)) {
        console.log(`[Manager Assets] Rate limit hit on Helius, attempting failover...`);
        const switched = reportRateLimitHit('helius');
        if (switched) {
          currentApiKey = getActiveApiKey('helius');
          retryCount++;
          continue;
        }
        return null;
      }

      reportSuccess('helius');

      const tokensData1 = await tokensPage1.json();
      const nftsData1 = await nftsPage1.json();
      
      tokenPages.push(tokensData1.result?.items || []);
      nftPages.push(nftsData1.result?.items || []);

      // Fetch remaining pages concurrently (up to 9 more pages each)
      const remainingTokenPages = tokensData1.result?.items?.length === 100 ? 9 : 0;
      const remainingNftPages = nftsData1.result?.items?.length === 100 ? 9 : 0;

      if (remainingTokenPages > 0 || remainingNftPages > 0) {
        const additionalRequests: Promise<any>[] = [];

        // Queue token pages
        for (let page = 2; page <= remainingTokenPages + 1; page++) {
          additionalRequests.push(
            fetch(`https://mainnet.helius-rpc.com/?api-key=${currentApiKey}`, {
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
              signal: AbortSignal.timeout(10000),
            }).then(r => r.json().then(d => ({ type: 'token', data: d })))
          );
        }

        // Queue NFT pages
        for (let page = 2; page <= remainingNftPages + 1; page++) {
          additionalRequests.push(
            fetch(`https://mainnet.helius-rpc.com/?api-key=${currentApiKey}`, {
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
              signal: AbortSignal.timeout(10000),
            }).then(r => r.json().then(d => ({ type: 'nft', data: d })))
          );
        }

        // Execute all remaining requests concurrently
        if (additionalRequests.length > 0) {
          const results = await Promise.all(additionalRequests);
          results.forEach(result => {
            if (result.type === 'token') {
              tokenPages.push(result.data.result?.items || []);
            } else {
              nftPages.push(result.data.result?.items || []);
            }
          });
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
 * Get manager assets with caching and retry logic
 */
export async function getManagerAssets(managerAddress: string): Promise<ManagerAssetData | null> {
  const now = Date.now();

  // Check cache first
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

  // Fetch fresh data
  const data = await fetchManagerAssets(managerAddress);

  if (data) {
    // Cache the result
    managerAssetsCache.set(managerAddress, {
      data,
      expires: now + CACHE_TTL
    });
    // Clear failed request cache on success
    failedRequestsCache.delete(managerAddress);
  } else {
    // Track failed request with shorter TTL to allow retries
    failedRequestsCache.set(managerAddress, { timestamp: now });
  }

  return data;
}

/**
 * Get manager assets for multiple addresses (batch processing)
 */
export async function getBatchManagerAssets(managerAddresses: string[]): Promise<Map<string, ManagerAssetData>> {
  const results = new Map<string, ManagerAssetData>();

  // Process in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < managerAddresses.length; i += batchSize) {
    const batch = managerAddresses.slice(i, i + batchSize);

    const batchPromises = batch.map(async (address) => {
      const data = await getManagerAssets(address);
      if (data) {
        results.set(address, data);
      }
    });

    await Promise.all(batchPromises);

    // Small delay between batches to be respectful to the API
    if (i + batchSize < managerAddresses.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
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
  } else {
    managerAssetsCache.clear();
  }
}

/**
 * Get cache statistics
 */
export function getManagerAssetsCacheStats(): { size: number; entries: string[] } {
  return {
    size: managerAssetsCache.size,
    entries: Array.from(managerAssetsCache.keys())
  };
}