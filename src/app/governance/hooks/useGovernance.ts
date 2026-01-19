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

export function useGovernance() {
  const [data, setData] = useState<GovernanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(0);
  const [cooldown, setCooldown] = useState(0);

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

    try {
      const response = await fetch('/api/governance', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch');
      setData(await response.json());
      if (isRefresh) toast.success('Governance data refreshed');
    } catch {
      toast.error('Failed to load governance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lastRefresh]);

  useEffect(() => { fetchData(); }, []);

  return { data, loading, refreshing, cooldown, refresh: () => fetchData(true) };
}
