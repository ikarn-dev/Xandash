'use client';

import { useState, useEffect, useCallback } from 'react';
import { CornerAccents } from '@/components/ui';
import Link from 'next/link';

interface GovernanceStats {
  proposals: number;
  members: number;
  treasuryValueUsd: number;
}

interface TreasuryToken {
  symbol: string;
  balance: number;
  value: number;
  color: string;
}

interface XandHolder {
  address: string;
  amount: number;
}

const formatUsd = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
};

const formatXand = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
};

const formatTokenBalance = (value: number, symbol: string) => {
  if (symbol === 'SOL' || symbol === 'xandSOL') {
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return Math.floor(value).toLocaleString('en-US');
};

const formatHolderAmount = (value: number) => {
  return Math.floor(value).toLocaleString('en-US');
};

const truncateAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;

// Icons
const DocumentIcon = () => (
  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const TreasuryIcon = () => (
  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const RefreshIcon = ({ spinning }: { spinning?: boolean }) => (
  <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${spinning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

function StatItem({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className={`mb-1 sm:mb-1.5 ${color}`}>{icon}</div>
      <p className="text-base sm:text-lg lg:text-xl font-bold text-white font-mono">{value}</p>
      <span className="text-white/40 text-[8px] sm:text-[9px] uppercase tracking-wider">{label}</span>
    </div>
  );
}

export function GovernanceStatsCard() {
  const [stats, setStats] = useState<GovernanceStats | null>(null);
  const [tokens, setTokens] = useState<TreasuryToken[]>([]);
  const [holders, setHolders] = useState<XandHolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(0);

  const REFRESH_COOLDOWN = 30; // 30 seconds cooldown
  const STORAGE_KEY = 'governance-stats-last-refresh';

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

  const fetchStats = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      const now = Date.now();
      const timeSinceLastRefresh = (now - lastRefresh) / 1000;

      if (timeSinceLastRefresh < REFRESH_COOLDOWN) {
        return; // Silently ignore if still in cooldown
      }

      setRefreshing(true);
      setLastRefresh(now);
      setCooldown(REFRESH_COOLDOWN);

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, now.toString());
      }
    }

    try {
      const response = await fetch('/api/governance', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setStats({
        proposals: data.stats.proposals,
        members: data.stats.members,
        treasuryValueUsd: data.stats.treasuryValueUsd,
      });
      setTokens(data.dao?.treasury?.tokens || []);
      setHolders(data.largestHolders || []);
    } catch {
      // Silent error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lastRefresh]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return <GovernanceStatsCardSkeleton />;
  }

  if (!stats) return null;

  const topFive = holders.slice(0, 5);
  const maxAmount = topFive[0]?.amount || 1;

  return (
    <div className="relative bg-black border border-white/10 p-3 sm:p-4 md:p-6 group hover:border-white/20 transition-all">
      <CornerAccents />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-white/90 text-sm sm:text-base font-medium font-mono">// GOVERNANCE</h3>
          <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[8px] sm:text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-400"></div>
            <span>Live</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing || cooldown > 0}
            className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white/50 hover:text-white/80 transition-all disabled:opacity-50 flex items-center gap-1"
            title={cooldown > 0 ? `Wait ${cooldown}s` : "Refresh governance data"}
          >
            {cooldown > 0 && (
              <span className="text-[9px] font-mono text-white/40">{cooldown}s</span>
            )}
            <RefreshIcon spinning={refreshing} />
          </button>
          <Link
            href="/governance"
            className="text-[10px] sm:text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            View All →
          </Link>
        </div>
      </div>

      {/* Main Content - Two columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Left Section - Stats & Treasury */}
        <div className="space-y-3 sm:space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <StatItem icon={<DocumentIcon />} label="Proposals" value={stats.proposals} color="text-purple-400" />
            <StatItem icon={<TreasuryIcon />} label="Treasury" value={formatUsd(stats.treasuryValueUsd)} color="text-amber-400" />
            <StatItem icon={<UsersIcon />} label="Members" value={stats.members} color="text-blue-400" />
          </div>

          {/* Treasury Holdings */}
          <div className="border-t border-white/5 pt-3 sm:pt-4">
            <div className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-wider mb-2 sm:mb-3">Treasury Holdings</div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {tokens.map((token) => (
                <div key={token.symbol} className="text-center">
                  <div className="text-white font-mono text-sm sm:text-base font-medium">
                    {formatTokenBalance(token.balance, token.symbol)}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: token.color }} />
                    <span className="text-white/50 text-[9px] sm:text-[10px] font-medium">{token.symbol}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section - Top Holders */}
        <div className="border-t lg:border-t-0 lg:border-l border-white/5 pt-3 lg:pt-0 lg:pl-6">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-wider">Top XAND Holders</span>
            <span className="text-[9px] sm:text-[10px] text-white/30">Top 5</span>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            {topFive.map((holder, index) => {
              const percentage = (holder.amount / maxAmount) * 100;
              return (
                <div key={holder.address}>
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-white/30 text-[9px] sm:text-[10px] font-mono w-3 sm:w-4">#{index + 1}</span>
                      <a
                        href={`https://solscan.io/account/${holder.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/60 hover:text-white text-[10px] sm:text-xs font-mono transition-colors"
                      >
                        {truncateAddress(holder.address)}
                      </a>
                    </div>
                    <span className="text-emerald-400 text-[10px] sm:text-xs font-mono font-medium">
                      {formatHolderAmount(holder.amount)}
                    </span>
                  </div>
                  <div className="h-0.5 sm:h-1 bg-white/5 rounded-full overflow-hidden ml-4 sm:ml-6">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500/60 to-emerald-400/40 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GovernanceStatsCardSkeleton() {
  return (
    <div className="relative bg-black border border-white/10 p-3 sm:p-4 md:p-6">
      <CornerAccents />

      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <div className="h-4 sm:h-5 bg-white/10 rounded w-28 sm:w-32"></div>
          <div className="h-4 bg-white/10 rounded w-10"></div>
        </div>
        <div className="h-4 bg-white/10 rounded w-16"></div>
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Left section */}
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white/10 rounded mb-1 sm:mb-1.5"></div>
                <div className="h-5 sm:h-6 bg-white/10 rounded w-10 sm:w-12 mb-1"></div>
                <div className="h-2 bg-white/10 rounded w-12 sm:w-14"></div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-3 sm:pt-4">
            <div className="h-2.5 bg-white/10 rounded w-24 mb-2 sm:mb-3"></div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-4 sm:h-5 bg-white/10 rounded w-14 mx-auto mb-1"></div>
                  <div className="h-2.5 bg-white/10 rounded w-10 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="border-t lg:border-t-0 lg:border-l border-white/5 pt-3 lg:pt-0 lg:pl-6">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="h-2.5 bg-white/10 rounded w-28"></div>
            <div className="h-2 bg-white/10 rounded w-8"></div>
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-3 sm:w-4 h-2.5 bg-white/10 rounded"></div>
                    <div className="w-16 sm:w-20 h-3 bg-white/10 rounded"></div>
                  </div>
                  <div className="w-12 sm:w-14 h-3 bg-white/10 rounded"></div>
                </div>
                <div className="h-0.5 sm:h-1 bg-white/5 rounded-full ml-4 sm:ml-6">
                  <div className="h-full bg-white/10 rounded-full" style={{ width: `${100 - i * 15}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
