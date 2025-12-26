'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { CopyBtn as CopyButton } from '@/components/ui/CopyBtn';

// Custom SVG Icons
const RefreshIcon = ({ className = "w-5 h-5", spinning = false }: { className?: string; spinning?: boolean }) => (
  <svg className={`${className} ${spinning ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

const TrendUpIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);

const TrendDownIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
  </svg>
);

const DollarIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v12M15 9.5c-.5-1-1.5-1.5-3-1.5-2 0-3 1-3 2.5s1 2 3 2.5c2 .5 3 1.5 3 2.5s-1 2.5-3 2.5c-1.5 0-2.5-.5-3-1.5"/>
  </svg>
);

const ChartIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>
  </svg>
);

const GlobeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const LinkIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const TwitterIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const DiscordIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

const TelegramIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const StorageIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>
);

const InfoIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const ClockIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const MarketCapIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3"/>
    <circle cx="12" cy="14" r="3"/><path d="M12 11v6"/>
  </svg>
);

const VolumeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 4v16"/>
  </svg>
);

const SupplyIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/>
    <line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/>
  </svg>
);

const HighLowIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 3l4 4-4 4"/><path d="M3 11h18"/><path d="M7 21l-4-4 4-4"/><path d="M21 13H3"/>
  </svg>
);

// Corner Accent Component for consistent styling
const CornerAccents = ({ color = "white" }: { color?: string }) => {
  const colorClass = color === "emerald" ? "group-hover:bg-emerald-400 group-hover:shadow-[0_0_12px_rgba(16,185,129,0.8)]" : "group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)]";
  return (
    <>
      <div className="absolute top-0 left-0 w-6 h-6">
        <div className={`absolute top-0 left-0 w-3 h-0.5 bg-white/30 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute top-0 left-0 w-0.5 h-3 bg-white/30 ${colorClass} transition-all duration-300`}></div>
      </div>
      <div className="absolute top-0 right-0 w-6 h-6">
        <div className={`absolute top-0 right-0 w-3 h-0.5 bg-white/30 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute top-0 right-0 w-0.5 h-3 bg-white/30 ${colorClass} transition-all duration-300`}></div>
      </div>
      <div className="absolute bottom-0 left-0 w-6 h-6">
        <div className={`absolute bottom-0 left-0 w-3 h-0.5 bg-white/30 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute bottom-0 left-0 w-0.5 h-3 bg-white/30 ${colorClass} transition-all duration-300`}></div>
      </div>
      <div className="absolute bottom-0 right-0 w-6 h-6">
        <div className={`absolute bottom-0 right-0 w-3 h-0.5 bg-white/30 ${colorClass} transition-all duration-300`}></div>
        <div className={`absolute bottom-0 right-0 w-0.5 h-3 bg-white/30 ${colorClass} transition-all duration-300`}></div>
      </div>
    </>
  );
};


interface XandData {
  id: string;
  symbol: string;
  name: string;
  image: { large: string; small: string; thumb: string };
  description: { en: string };
  links: {
    homepage: string[];
    whitepaper: string;
    twitter_screen_name: string;
    telegram_channel_identifier: string;
    chat_url: string[];
  };
  contract_address: string;
  categories: string[];
  market_data: {
    current_price: { usd: number; btc: number; eth: number };
    market_cap: { usd: number };
    market_cap_rank: number;
    fully_diluted_valuation: { usd: number };
    total_volume: { usd: number };
    high_24h: { usd: number };
    low_24h: { usd: number };
    price_change_24h: number;
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    ath: { usd: number };
    ath_change_percentage: { usd: number };
    ath_date: { usd: string };
    atl: { usd: number };
    atl_change_percentage: { usd: number };
    atl_date: { usd: string };
    circulating_supply: number;
    total_supply: number;
    max_supply: number;
  };
  sentiment_votes_up_percentage: number;
  sentiment_votes_down_percentage: number;
  watchlist_portfolio_users: number;
  community_data: {
    telegram_channel_user_count: number;
  };
  last_updated: string;
}

const REFRESH_COOLDOWN = 5 * 60 * 1000;

const formatPrice = (price: number) => {
  if (price < 0.0001) return price.toExponential(4);
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  return price.toFixed(2);
};

const formatLargeNumber = (num: number) => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
};

const formatPercent = (percent: number) => {
  const sign = percent >= 0 ? '+' : '';
  return sign + percent.toFixed(2) + '%';
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatCooldown = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const MiniChart = ({ isPositive }: { isPositive: boolean }) => {
  const color = isPositive ? '#10b981' : '#ef4444';
  const points = isPositive 
    ? "0,30 10,25 20,28 30,20 40,22 50,15 60,18 70,10 80,12 90,5 100,8"
    : "0,5 10,10 20,8 30,15 40,12 50,20 60,18 70,25 80,22 90,28 100,30";
  return (
    <svg viewBox="0 0 100 35" className="w-20 h-6">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

export function XandInfoClient() {
  const [data, setData] = useState<XandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const hasFetched = useRef(false);

  const fetchData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      
      const response = await fetch('/api/xand-info');
      if (!response.ok) throw new Error('Failed to fetch XAND data');
      
      const xandData = await response.json();
      setData(xandData);
      setLastFetchTime(Date.now());
      setError(null);
      toast.success(isManualRefresh ? 'XAND data refreshed' : 'XAND data loaded');
    } catch (err) {
      console.error('Error fetching XAND data:', err);
      setError('Failed to load XAND data');
      toast.error('Failed to load XAND data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchData(false);
    }
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastFetchTime > 0) {
        const remaining = Math.max(0, REFRESH_COOLDOWN - (Date.now() - lastFetchTime));
        setCooldownRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastFetchTime]);

  const handleRefresh = useCallback(() => {
    if (cooldownRemaining > 0) {
      toast.error(`Please wait ${formatCooldown(cooldownRemaining)} before refreshing`);
      return;
    }
    fetchData(true);
  }, [cooldownRemaining, fetchData]);

  const canRefresh = cooldownRemaining === 0 && !refreshing;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-white/5 rounded-lg"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-lg"></div>)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-red-400 text-lg">{error || 'No data available'}</div>
        <button onClick={() => fetchData(false)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">Retry</button>
      </div>
    );
  }

  const market = data.market_data;
  const isPositive24h = market.price_change_percentage_24h >= 0;


  return (
    <div className="space-y-6">
      {/* Header Card with Price */}
      <div className="relative bg-black border border-white/10 p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
        <CornerAccents color="emerald" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={data.image.large} alt={data.name} className="w-14 h-14 rounded-full"/>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{data.name}</h1>
                <span className="px-2 py-0.5 bg-white/10 rounded text-white/60 text-sm font-mono uppercase">{data.symbol}</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-400 text-xs">#{market.market_cap_rank}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {data.categories.slice(0, 3).map((cat, i) => (
                  <span key={i} className="px-2 py-0.5 bg-white/5 rounded text-white/40 text-xs">{cat}</span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-white font-mono">${formatPrice(market.current_price.usd)}</span>
              <MiniChart isPositive={isPositive24h} />
            </div>
            <div className={`flex items-center gap-1 text-sm ${isPositive24h ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive24h ? <TrendUpIcon className="w-3 h-3" /> : <TrendDownIcon className="w-3 h-3" />}
              <span className="font-mono">{formatPercent(market.price_change_percentage_24h)}</span>
              <span className="text-white/40">(24h)</span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={!canRefresh}
              className={`mt-1 flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all ${canRefresh ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/5 text-white/40 cursor-not-allowed'}`}
            >
              <RefreshIcon className="w-3 h-3" spinning={refreshing} />
              {refreshing ? 'Refreshing...' : cooldownRemaining > 0 ? formatCooldown(cooldownRemaining) : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Compact Sentiment Bar */}
      <div className="relative bg-black border border-white/10 p-4 group hover:border-white/20 transition-all duration-300 overflow-hidden">
        <CornerAccents />
        <div className="flex items-center justify-between gap-4">
          <span className="text-white/60 text-sm">Community Sentiment</span>
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <span className="text-emerald-400 text-sm font-mono flex items-center gap-1">
              <TrendUpIcon className="w-3 h-3" />{data.sentiment_votes_up_percentage}%
            </span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{ width: `${data.sentiment_votes_up_percentage}%` }}/>
              <div className="h-full bg-red-500" style={{ width: `${data.sentiment_votes_down_percentage}%` }}/>
            </div>
            <span className="text-red-400 text-sm font-mono flex items-center gap-1">
              {data.sentiment_votes_down_percentage}%<TrendDownIcon className="w-3 h-3" />
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span>Watchlist: <span className="text-white font-mono">{data.watchlist_portfolio_users}</span></span>
            <span>Telegram: <span className="text-white font-mono">{data.community_data.telegram_channel_user_count}</span></span>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="relative bg-black border border-white/10 p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
        <CornerAccents />
        <div className="flex items-center gap-2 mb-3">
          <InfoIcon className="w-4 h-4 text-emerald-400" />
          <span className="text-white/60 text-sm font-mono">// ABOUT {data.symbol.toUpperCase()}</span>
        </div>
        <p className="text-white/70 text-sm leading-relaxed">{data.description.en}</p>
      </div>

      {/* Market Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative bg-black border border-white/10 p-4 group hover:border-cyan-500/30 transition-all duration-300 overflow-hidden">
          <CornerAccents />
          <div className="flex items-center gap-2 text-cyan-400/70 text-xs mb-2">
            <MarketCapIcon className="w-4 h-4" /><span>Market Cap</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">${formatLargeNumber(market.market_cap.usd)}</div>
        </div>

        <div className="relative bg-black border border-white/10 p-4 group hover:border-purple-500/30 transition-all duration-300 overflow-hidden">
          <CornerAccents />
          <div className="flex items-center gap-2 text-purple-400/70 text-xs mb-2">
            <DollarIcon className="w-4 h-4" /><span>Fully Diluted</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">${formatLargeNumber(market.fully_diluted_valuation.usd)}</div>
        </div>

        <div className="relative bg-black border border-white/10 p-4 group hover:border-blue-500/30 transition-all duration-300 overflow-hidden">
          <CornerAccents />
          <div className="flex items-center gap-2 text-blue-400/70 text-xs mb-2">
            <VolumeIcon className="w-4 h-4" /><span>24h Volume</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">${formatLargeNumber(market.total_volume.usd)}</div>
        </div>

        <div className="relative bg-black border border-white/10 p-4 group hover:border-orange-500/30 transition-all duration-300 overflow-hidden">
          <CornerAccents />
          <div className="flex items-center gap-2 text-orange-400/70 text-xs mb-2">
            <SupplyIcon className="w-4 h-4" /><span>Circulating</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">{formatLargeNumber(market.circulating_supply)}</div>
        </div>
      </div>


      {/* Price Changes & ATH/ATL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative bg-black border border-white/10 p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
          <CornerAccents />
          <div className="flex items-center gap-2 mb-4">
            <ChartIcon className="w-4 h-4 text-cyan-400" />
            <span className="text-white/60 text-sm font-mono">// PRICE CHANGES</span>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: '24h', value: market.price_change_percentage_24h },
              { label: '7d', value: market.price_change_percentage_7d },
              { label: '30d', value: market.price_change_percentage_30d },
              { label: 'ATH', value: market.ath_change_percentage.usd },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <span className="text-white/40 text-xs block mb-1">{label}</span>
                <span className={`flex items-center justify-center gap-1 text-sm font-mono ${value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {value >= 0 ? <TrendUpIcon className="w-3 h-3" /> : <TrendDownIcon className="w-3 h-3" />}
                  {formatPercent(value)}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <div className="flex items-center gap-1 text-white/40 text-xs mb-1">
                <HighLowIcon className="w-3 h-3" />24h High
              </div>
              <div className="text-emerald-400 font-mono">${formatPrice(market.high_24h.usd)}</div>
            </div>
            <div>
              <div className="flex items-center gap-1 text-white/40 text-xs mb-1">
                <HighLowIcon className="w-3 h-3" />24h Low
              </div>
              <div className="text-red-400 font-mono">${formatPrice(market.low_24h.usd)}</div>
            </div>
          </div>
        </div>

        <div className="relative bg-black border border-white/10 p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
          <CornerAccents />
          <div className="flex items-center gap-2 mb-4">
            <TrendUpIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-white/60 text-sm font-mono">// ALL-TIME RECORDS</span>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-white/40 text-xs block">All-Time High</span>
                <span className="text-emerald-400 font-mono text-lg">${formatPrice(market.ath.usd)}</span>
              </div>
              <div className="text-right">
                <span className="text-white/40 text-xs block">{formatDate(market.ath_date.usd)}</span>
                <span className="text-red-400 font-mono text-sm">{formatPercent(market.ath_change_percentage.usd)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="text-white/40 text-xs block">All-Time Low</span>
                <span className="text-red-400 font-mono text-lg">${formatPrice(market.atl.usd)}</span>
              </div>
              <div className="text-right">
                <span className="text-white/40 text-xs block">{formatDate(market.atl_date.usd)}</span>
                <span className="text-emerald-400 font-mono text-sm">{formatPercent(market.atl_change_percentage.usd)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Supply Info with Pie Chart */}
      <div className="relative bg-black border border-white/10 p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
        <CornerAccents />
        <div className="flex items-center gap-2 mb-4">
          <StorageIcon className="w-4 h-4 text-orange-400" />
          <span className="text-white/60 text-sm font-mono">// SUPPLY INFORMATION</span>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Donut Chart */}
          <div className="relative">
            <svg viewBox="0 0 120 120" className="w-40 h-40">
              {/* Background circle */}
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="16"/>
              {/* Circulating supply arc */}
              <circle 
                cx="60" 
                cy="60" 
                r="50" 
                fill="none" 
                stroke="url(#supplyGradient)" 
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray={`${(market.circulating_supply / market.max_supply) * 314.159} 314.159`}
                transform="rotate(-90 60 60)"
                className="transition-all duration-1000"
              />
              {/* Gradient definition */}
              <defs>
                <linearGradient id="supplyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981"/>
                  <stop offset="100%" stopColor="#34d399"/>
                </linearGradient>
              </defs>
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-white font-mono">
                {((market.circulating_supply / market.max_supply) * 100).toFixed(1)}%
              </span>
              <span className="text-white/40 text-xs">Circulating</span>
            </div>
          </div>
          
          {/* Supply Details */}
          <div className="flex-1 grid grid-cols-1 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"/>
              <div className="flex-1">
                <span className="text-white/40 text-xs block">Circulating Supply</span>
                <span className="text-white font-mono text-lg">{formatLargeNumber(market.circulating_supply)}</span>
              </div>
              <span className="text-emerald-400 font-mono text-sm">
                {((market.circulating_supply / market.max_supply) * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-white/20"/>
              <div className="flex-1">
                <span className="text-white/40 text-xs block">Remaining Supply</span>
                <span className="text-white font-mono text-lg">{formatLargeNumber(market.max_supply - market.circulating_supply)}</span>
              </div>
              <span className="text-white/40 font-mono text-sm">
                {((1 - market.circulating_supply / market.max_supply) * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/5 rounded-lg">
                <span className="text-white/40 text-xs block mb-1">Total Supply</span>
                <span className="text-white font-mono">{formatLargeNumber(market.total_supply)}</span>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <span className="text-white/40 text-xs block mb-1">Max Supply</span>
                <span className="text-white font-mono">{formatLargeNumber(market.max_supply)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Contract & Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative bg-black border border-white/10 p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
          <CornerAccents />
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon className="w-4 h-4 text-purple-400" />
            <span className="text-white/60 text-sm font-mono">// CONTRACT</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 rounded p-3 mb-3">
            <span className="text-white/40 text-xs">SOL:</span>
            <span className="text-white font-mono text-xs truncate flex-1">{data.contract_address}</span>
            <CopyButton text={data.contract_address} />
          </div>
          <div className="flex gap-2 flex-wrap">
            <a href={`https://solscan.io/token/${data.contract_address}`} target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white text-xs transition-colors">
              Solscan
            </a>
            <a href={`https://www.geckoterminal.com/solana/tokens/${data.contract_address}`} target="_blank" rel="noopener noreferrer"
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white text-xs transition-colors">
              GeckoTerminal
            </a>
          </div>
        </div>

        <div className="relative bg-black border border-white/10 p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
          <CornerAccents />
          <div className="flex items-center gap-2 mb-4">
            <GlobeIcon className="w-4 h-4 text-blue-400" />
            <span className="text-white/60 text-sm font-mono">// LINKS</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {data.links.homepage[0] && (
              <a href={data.links.homepage[0]} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white text-xs transition-colors">
                <GlobeIcon className="w-3 h-3" />Website
              </a>
            )}
            {data.links.whitepaper && (
              <a href={data.links.whitepaper} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white text-xs transition-colors">
                <InfoIcon className="w-3 h-3" />Docs
              </a>
            )}
            <a href="https://x.com/Xandeum" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white text-xs transition-colors">
              <TwitterIcon className="w-3 h-3" />Twitter/X
            </a>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
        <ClockIcon className="w-3 h-3" />
        Last updated: {new Date(data.last_updated).toLocaleString()}
      </div>
    </div>
  );
}
