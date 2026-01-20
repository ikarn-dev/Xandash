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
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const XANDEUM_TOKEN_MINTS: string[] = [
  'XANDuUoVoUqniKkpcKhrxmvYJybpJvUxJLr21Gaj3Hx', // Xandeum related token contract
  // Add other Xandeum-related token mints here
];

const XENO_TOKEN_MINTS = [
  'G2bTxNndhA9zxxy4PZnHFcQo9wQQozrfcmN6AN9Heqoe'
];

// Keywords to identify Xandeum-related NFTs/SBTs
const XANDEUM_KEYWORDS = ['xandeum', 'xand', 'pnode', 'manager', 'xandash', 'sbt', 'deepsouth', 'dragon', 'rabbit', 'deep south', 'g2btxn'];

/**
 * Check if an NFT is Xandeum-related
 */
function isXandeumRelatedNFT(nft: NFTAsset): boolean {
  const name = nft.content?.metadata?.name?.toLowerCase() || '';
  const symbol = nft.content?.metadata?.symbol?.toLowerCase() || '';
  const description = nft.content?.metadata?.description?.toLowerCase() || '';

  return XANDEUM_KEYWORDS.some(keyword =>
    name.includes(keyword) || symbol.includes(keyword) || description.includes(keyword)
  );
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
 * Fetch manager assets from Helius API
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
      // Fetch tokens and NFTs in parallel
      const [tokensResponse, nftsResponse] = await Promise.all([
        // Fetch fungible tokens
        fetch(`https://mainnet.helius-rpc.com/?api-key=${currentApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'manager-tokens',
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
        // Fetch NFTs
        fetch(`https://mainnet.helius-rpc.com/?api-key=${currentApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'manager-nfts',
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
      if (isRateLimitError(tokensResponse) || isRateLimitError(nftsResponse)) {
        console.log(`[Manager Assets] Rate limit hit on Helius, attempting failover...`);
        const switched = reportRateLimitHit('helius');
        if (switched) {
          currentApiKey = getActiveApiKey('helius');
          retryCount++;
          continue;
        }
        return null; // No more backup keys
      }

      // Report success
      reportSuccess('helius');

      let xandBalance = 0;
      let xenoBalance = 0;
      let nftCount = 0;
      let sbtCount = 0;
      const nftPreviews: NFTPreview[] = [];
      const sbtPreviews: NFTPreview[] = [];

      // Process tokens
      if (tokensResponse.ok) {
        const tokensData = await tokensResponse.json();
        const tokens = tokensData.result?.items || [];

        tokens.forEach((token: any) => {
          const tokenInfo = token.token_info || {};
          const metadata = token.content?.metadata || {};

          // Check if it's a Xandeum token (Strict match only)
          const isXandeumToken = XANDEUM_TOKEN_MINTS.includes(token.id);

          if (isXandeumToken) {
            const decimals = tokenInfo.decimals || 0;
            const balance = tokenInfo.balance || 0;
            xandBalance += balance / Math.pow(10, decimals);
          }

          // Check for XENO token
          const isXenoToken = XENO_TOKEN_MINTS.includes(token.id) ||
            (tokenInfo.symbol?.toLowerCase() === 'xeno') ||
            (metadata.name?.toLowerCase().includes('xeno'));

          if (isXenoToken) {
            const decimals = tokenInfo.decimals || 0;
            const balance = tokenInfo.balance || 0;
            xenoBalance += balance / Math.pow(10, decimals);
          }
        });
      }

      // Process NFTs
      if (nftsResponse.ok) {
        const nftsData = await nftsResponse.json();
        const nfts = nftsData.result?.items || [];

        nfts.forEach((nft: any) => {
          if (isXandeumRelatedNFT(nft)) {
            const nftName = nft.content?.metadata?.name || `NFT ${nft.id.slice(0, 8)}...`;

            // Helper to extract image
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
      }

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
      // Check if error indicates rate limit
      if (isRateLimitError(null, error)) {
        console.log(`[Manager Assets] Rate limit error on Helius, attempting failover...`);
        const switched = reportRateLimitHit('helius');
        if (switched) {
          currentApiKey = getActiveApiKey('helius');
          retryCount++;
          continue;
        }
      }
      console.error(`Error fetching manager assets for ${managerAddress}:`, error);
      return null;
    }
  }

  // Exhausted all retries
  return null;
}

/**
 * Get manager assets with caching
 */
export async function getManagerAssets(managerAddress: string): Promise<ManagerAssetData | null> {
  const now = Date.now();

  // Check cache first
  const cached = managerAssetsCache.get(managerAddress);
  if (cached && cached.expires > now) {
    return cached.data;
  }

  // Fetch fresh data
  const data = await fetchManagerAssets(managerAddress);

  if (data) {
    // Cache the result
    managerAssetsCache.set(managerAddress, {
      data,
      expires: now + CACHE_TTL
    });
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