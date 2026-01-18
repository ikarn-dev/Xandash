/**
 * Shared Price Service
 * Provides cached token prices from CoinGecko to avoid duplicate API calls
 */

import { cache } from '@/libs/cache/LocalCache';

const COINGECKO_API_URL = process.env.NEXT_PUBLIC_COINGECKO_API_URL || '';
const COINGECKO_API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || '';
const COINGECKO_SOL_API = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true';

const CACHE_KEY_PRICES = 'shared:token-prices';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface TokenPrices {
  xand: number;
  xandChange24h: number;
  sol: number;
  solChange24h: number;
  xandsol: number;
  timestamp: number;
}

// Default fallback prices
const DEFAULT_PRICES: TokenPrices = {
  xand: 0.00277,
  xandChange24h: 0,
  sol: 138.00,
  solChange24h: 0,
  xandsol: 151.80, // SOL * 1.1 for staking yield
  timestamp: 0,
};

/**
 * Fetch XAND price from CoinGecko
 */
async function fetchXandPrice(): Promise<{ price: number; change24h: number } | null> {
  if (!COINGECKO_API_URL) return null;

  try {
    const response = await fetch(COINGECKO_API_URL, {
      headers: {
        'x-cg-demo-api-key': COINGECKO_API_KEY,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      price: data.market_data?.current_price?.usd || 0,
      change24h: data.market_data?.price_change_percentage_24h || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch SOL price from CoinGecko
 */
async function fetchSolPrice(): Promise<{ price: number; change24h: number } | null> {
  try {
    const response = await fetch(COINGECKO_SOL_API, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      price: data.solana?.usd || 0,
      change24h: data.solana?.usd_24h_change || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Get cached token prices or fetch fresh ones
 */
export async function getTokenPrices(forceRefresh = false): Promise<TokenPrices> {
  // Check cache first
  if (!forceRefresh) {
    const cached = await cache.get(CACHE_KEY_PRICES) as TokenPrices | null;
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached;
    }
  }

  // Fetch fresh prices in parallel
  const [xandData, solData] = await Promise.all([
    fetchXandPrice(),
    fetchSolPrice(),
  ]);

  const prices: TokenPrices = {
    xand: xandData?.price || DEFAULT_PRICES.xand,
    xandChange24h: xandData?.change24h || 0,
    sol: solData?.price || DEFAULT_PRICES.sol,
    solChange24h: solData?.change24h || 0,
    xandsol: (solData?.price || DEFAULT_PRICES.sol) * 1.1, // ~10% premium for staking yield
    timestamp: Date.now(),
  };

  // Cache the prices
  await cache.set(CACHE_KEY_PRICES, prices, CACHE_TTL);

  return prices;
}

/**
 * Get prices for governance calculations
 * Returns format compatible with governance API
 */
export async function getPricesForGovernance(forceRefresh = false): Promise<{
  XAND: number;
  xandSOL: number;
  SOL: number;
  changes: { XAND: number; SOL: number };
}> {
  const prices = await getTokenPrices(forceRefresh);
  
  return {
    XAND: prices.xand,
    xandSOL: prices.xandsol,
    SOL: prices.sol,
    changes: {
      XAND: prices.xandChange24h,
      SOL: prices.solChange24h,
    },
  };
}
