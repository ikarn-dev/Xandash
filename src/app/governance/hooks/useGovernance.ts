'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface TreasuryWallet {
  address: string;
  solBalance: number;
  xandBalance: number;
  xandsolBalance: number;
  totalValue: number;
}

export interface TreasuryToken {
  symbol: string;
  name: string;
  mint: string;
  balance: number;
  value: number;
  price: number;
  change24h: number;
  color: string;
}

export interface GovernanceData {
  dao: {
    address: string;
    name: string;
    description: string;
    programId: string;
    treasury: {
      address: string;
      wallets: TreasuryWallet[];
      solBalance: number;
      xandBalance: number;
      xandsolBalance: number;
      xandTokenAccount: string;
      valueUsd: number;
      tokens: TreasuryToken[];
    };
  };
  stats: {
    members: number;
    proposals: number;
    governances: number;
    treasuryValueUsd: number;
  };
  token: {
    mint: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: number;
    price: number;
  };
  councilToken: {
    mint: string;
    name: string;
    totalSupply: number;
  };
  governance: {
    parameters: Record<string, string | number>;
  };
  proposals: {
    total: number;
    byState: Record<string, number>;
    recent: Array<{ pubkey: string; state: string; name: string }>;
  };
  members: {
    total: number;
    topMembers: Array<{ address: string; votingPower: number; votes: number; proposals: number }>;
  };
  largestHolders: Array<{ address: string; amount: number }>;
  recentActivity: Array<{ signature: string; blockTime: number; status: string; error: boolean }>;
  fetchedAt: number;
}

export interface GovernanceError {
  message: string;
  isRateLimit: boolean;
  isPartialData: boolean;
}

export function useGovernance() {
  const [data, setData] = useState<GovernanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<GovernanceError | null>(null);

  const REFRESH_COOLDOWN = 30; // 30 seconds cooldown
  const STORAGE_KEY = 'governance-last-refresh';

  // Load last refresh time from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const storedTime = parseInt(stored);
        const now = Date.now();
        const timeSinceRefresh = (now - storedTime) / 1000;

        if (timeSinceRefresh < REFRESH_COOLDOWN) {
          setLastRefresh(storedTime);
          setCooldown(Math.ceil(REFRESH_COOLDOWN - timeSinceRefresh));
        }
      }
    }
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      const now = Date.now();
      const timeSinceLastRefresh = (now - lastRefresh) / 1000;

      if (timeSinceLastRefresh < REFRESH_COOLDOWN) {
        const remaining = Math.ceil(REFRESH_COOLDOWN - timeSinceLastRefresh);
        toast.error(`Please wait ${remaining}s before refreshing again`);
        return;
      }

      setRefreshing(true);
      setLastRefresh(now);
      setCooldown(REFRESH_COOLDOWN);

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, now.toString());
      }
    } else {
      setLoading(true);
    }

    // Clear previous error
    setError(null);

    try {
      const response = await fetch('/api/governance', { cache: 'no-store' });

      if (!response.ok) {
        // Check for rate limit response
        if (response.status === 429) {
          throw new Error('RATE_LIMIT');
        }
        throw new Error('Failed to fetch');
      }

      const responseData = await response.json();

      // Check for error in response body
      if (responseData.error) {
        const isRateLimit = responseData.error.includes('rate') || responseData.error.includes('limit');
        setError({
          message: responseData.error,
          isRateLimit,
          isPartialData: false,
        });
        toast.error(isRateLimit ? 'Rate limit reached' : 'Failed to load governance data');
        return;
      }

      // Check for partial data - only flag when truly critical data is missing
      // largestHolders being empty is the most reliable indicator of rate limit issues
      const hasHolders = responseData.largestHolders && responseData.largestHolders.length > 0;

      if (!hasHolders) {
        setError({
          message: 'Some data may be incomplete due to API limits',
          isRateLimit: false,
          isPartialData: true,
        });
      }

      setData(responseData);
      if (isRefresh) toast.success('Governance data refreshed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      const isRateLimit = errorMessage === 'RATE_LIMIT' || errorMessage.toLowerCase().includes('rate');

      setError({
        message: isRateLimit ? 'Rate limit reached. Please try again later.' : 'Failed to load governance data',
        isRateLimit,
        isPartialData: false,
      });

      toast.error(isRateLimit ? 'Rate limit reached' : 'Failed to load governance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lastRefresh]);

  useEffect(() => { fetchData(); }, []);

  return {
    data,
    loading,
    refreshing,
    cooldown,
    error,
    refresh: () => fetchData(true),
    retry: () => fetchData(false),
  };
}
