'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import dynamic from 'next/dynamic';

// Lazy load recharts components
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });

// Custom Refresh Icon with animation support
const RefreshIcon = ({ className = "w-4 h-4", spinning = false }: { className?: string; spinning?: boolean }) => (
  <svg 
    className={`${className} ${spinning ? 'animate-spin' : ''}`} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 4v6h-6"/>
    <path d="M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

interface TokenInfo {
  market_data: {
    current_price: {
      usd: number;
    };
    market_cap: {
      usd: number;
    };
    total_volume: {
      usd: number;
    };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    circulating_supply: number;
    total_supply: number;
    max_supply: number;
    sparkline_7d?: {
      price: number[];
    };
  };
}

interface PriceHistoryPoint {
  timestamp: number;
  price: number;
}

export const CombinedTokenCard: React.FC = () => {
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [shouldAnimateChart, setShouldAnimateChart] = useState(false);



  // Fetch token info from CoinGecko
  const fetchTokenInfo = async () => {
    try {
      const coingeckoUrl = process.env.NEXT_PUBLIC_COINGECKO_API_URL || '';
      const coingeckoKey = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || '';
      
      if (!coingeckoUrl) {
        throw new Error('CoinGecko API URL not configured');
      }
      
      const response = await fetch(
        `${coingeckoUrl}?localization=false&tickers=true&market_data=true&community_data=true&developer_data=true&sparkline=true&include_categories_details=true&dex_pair_format=contract_address`,
        {
          headers: {
            'x-cg-demo-api-key': coingeckoKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const data = await response.json();
      setTokenInfo(data);
      
      // Extract sparkline data for chart (last 24 hours)
      if (data.market_data?.sparkline_7d?.price) {
        const sparklineData = data.market_data.sparkline_7d.price;
        
        const now = Date.now();
        // Use last 24 data points for 24-hour hourly data
        const twentyFourHourData = sparklineData.slice(-24);
        
        const historyPoints: PriceHistoryPoint[] = twentyFourHourData.map((price: number, index: number) => ({
          timestamp: now - (twentyFourHourData.length - index) * 60 * 60 * 1000, // Hourly intervals
          price: price
        }));
        
        setPriceHistory(historyPoints);
      }
    } catch (err) {
      console.error('Error fetching token info:', err);
    }
  };

  // Fetch price data - REMOVED: No longer using XDORB API

  const handleManualRefresh = async () => {
    setRefreshing(true);
    setShouldAnimateChart(true); // Allow animation on manual refresh
    try {
      // Only fetch CoinGecko token info
      await fetchTokenInfo();
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const initializeFetch = async () => {
      setLoading(true);
      setShouldAnimateChart(true); // Allow animation on initial load
      try {
        // Only fetch CoinGecko token info
        await fetchTokenInfo();
      } catch (error) {
        console.error('Initial data fetch failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeFetch();

    // Auto-refresh token info every 5 minutes
    const tokenInterval = setInterval(fetchTokenInfo, 5 * 60 * 1000); // 5 minutes

    return () => {
      clearInterval(tokenInterval);
    };
  }, []);

  // Get current price from CoinGecko only
  const getCurrentPrice = () => {
    return tokenInfo?.market_data?.current_price?.usd || 0;
  };

  // Get 24h change from CoinGecko only
  const get24hChange = () => {
    return tokenInfo?.market_data?.price_change_percentage_24h || 0;
  };

  // Get 24h volume from CoinGecko only
  const get24hVolume = () => {
    return tokenInfo?.market_data?.total_volume?.usd || 0;
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    return `${num.toFixed(decimals)}`;
  };

  const formatSupply = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  // Interactive animated bar chart component
  const PriceChart: React.FC<{ data: PriceHistoryPoint[] }> = ({ data }) => {
    const [animationKey, setAnimationKey] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);

    // Only trigger animation on initial load or manual refresh
    useEffect(() => {
      if (shouldAnimateChart && !hasAnimated && data.length > 0) {
        setAnimationKey(prev => prev + 1);
        setHasAnimated(true);
        setShouldAnimateChart(false); // Reset flag after animation
      }
    }, [data, hasAnimated, shouldAnimateChart]);

    // Wait for container to have dimensions before rendering chart
    const [isReady, setIsReady] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
      const checkDimensions = () => {
        if (containerRef.current) {
          const { clientWidth, clientHeight } = containerRef.current;
          if (clientWidth > 0 && clientHeight > 0) {
            setIsReady(true);
          }
        }
      };
      checkDimensions();
      const timer = setTimeout(checkDimensions, 50);
      window.addEventListener('resize', checkDimensions);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkDimensions);
      };
    }, []);

    if (data.length === 0) {
      return (
        <div className="w-full h-64 lg:h-96 flex items-center justify-center bg-black/20 rounded border border-white/10">
          <div className="text-white/40 text-xs text-center">
            <div>No chart data available</div>
            <div className="text-white/30 text-xs mt-1">Click refresh to load chart</div>
          </div>
        </div>
      );
    }

    // Format data for bar chart - use full 24 hours timeline
    const chartData = data.map((point, index) => ({
      timestamp: point.timestamp,
      price: point.price,
      time: new Date(point.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      index: index
    }));

    // Calculate price range for better Y-axis formatting
    const prices = chartData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const padding = priceRange * 0.1; // 10% padding

    const CustomTooltip = ({ active, payload }: any) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-black/90 border border-white/20 rounded px-2 py-1 text-xs shadow-lg">
            <div className="text-white font-mono font-bold">${data.price.toFixed(6)}</div>
          </div>
        );
      }
      return null;
    };

    return (
      <div 
        ref={containerRef}
        className="w-full h-64 lg:h-96 bg-black/10 rounded border border-white/5"
        style={{ minHeight: '256px' }}
      >
        {isReady ? (
          <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            key={animationKey}
            data={chartData} 
            margin={{ top: 20, right: 15, left: 15, bottom: 20 }}
            barCategoryGap="10%"
            maxBarSize={50}
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.95} />
                <stop offset="30%" stopColor="#f1f5f9" stopOpacity={0.85} />
                <stop offset="70%" stopColor="#e2e8f0" stopOpacity={0.75} />
                <stop offset="100%" stopColor="#cbd5e1" stopOpacity={0.65} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 8, fill: '#9ca3af' }}
              interval={Math.floor(chartData.length / 6)}
              height={35}
            />
            <YAxis 
              domain={[minPrice - padding, maxPrice + padding]}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 8, fill: '#9ca3af' }}
              tickFormatter={(value) => `$${value.toFixed(6)}`}
              width={80}
              type="number"
              scale="linear"
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            />
            <Bar 
              dataKey="price" 
              radius={[8, 8, 8, 8]}
              animationDuration={800}
              animationBegin={0}
              fill="url(#barGradient)"
              style={{
                filter: 'drop-shadow(0px 0px 8px rgba(255, 255, 255, 0.2))',
                opacity: 0.95
              }}
            />
          </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-white/30 text-xs">Loading chart...</div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="relative bg-black/80 border border-white/10 p-3 group hover:border-white/20 transition-all duration-300">
        {/* All four corner edges with white glow on hover */}
        <div className="absolute top-0 left-0 w-6 h-6">
          <div className="absolute top-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute top-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>
        <div className="absolute top-0 right-0 w-6 h-6">
          <div className="absolute top-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute top-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-6 h-6">
          <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute bottom-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-6 h-6">
          <div className="absolute bottom-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute bottom-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>

        <div>
          <div className="h-4 bg-white/10 rounded mb-3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-2">
                <div className="h-8 bg-white/10 rounded"></div>
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-white/10 rounded"></div>
                <div className="w-full h-1 bg-white/10 rounded-full"></div>
              </div>
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center py-2">
                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                    <div className="h-4 bg-white/10 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="w-full h-64 lg:h-96 bg-white/10 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentPrice = getCurrentPrice();
  const change24h = get24hChange();
  const volume24h = get24hVolume();

  const marketCap = tokenInfo?.market_data?.market_cap?.usd || 0;
  const isPositive = change24h >= 0;

  // Supply data
  const circulatingSupply = tokenInfo?.market_data?.circulating_supply || 0;
  const totalSupply = tokenInfo?.market_data?.total_supply || 0;
  const maxSupply = tokenInfo?.market_data?.max_supply || totalSupply;

  return (
    <div className="relative bg-black/80 border border-white/10 p-3 group hover:border-white/20 transition-all duration-300">
      {/* All four corner edges with white glow on hover */}
      <div className="absolute top-0 left-0 w-6 h-6">
        <div className="absolute top-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute top-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>
      <div className="absolute top-0 right-0 w-6 h-6">
        <div className="absolute top-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute top-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>
      <div className="absolute bottom-0 left-0 w-6 h-6">
        <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute bottom-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>
      <div className="absolute bottom-0 right-0 w-6 h-6">
        <div className="absolute bottom-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute bottom-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>

      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-white/60 text-sm">Token Overview</div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="group p-2 hover:bg-white/10 rounded-lg transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh price data and chart"
          >
            <RefreshIcon 
              className={`w-4 h-4 transition-all duration-300 ${
                refreshing 
                  ? 'text-white/60' 
                  : 'text-white/80 group-hover:text-white group-hover:scale-110'
              }`}
              spinning={refreshing}
            />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
        {/* Left Side - Detailed Token Information */}
        <div className="lg:col-span-2 space-y-3">
          {/* Current Price Display */}
          <div className="mb-3">
            <div className="text-white text-xl font-bold font-mono mb-1">
              ${currentPrice.toFixed(6)}
            </div>
            <div className={`inline-flex items-center space-x-1 text-xs font-bold ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{isPositive ? '+' : ''}{change24h.toFixed(2)}% (7d)</span>
            </div>
            <div className="text-white/60 text-xs mt-1">
              {(currentPrice * 0.00002947).toFixed(8)} BTC
            </div>
          </div>

          {/* 24h Range */}
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-white/60 text-xs">24h Range</span>
            </div>
            <div className="relative">
              <div className="w-full h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"></div>
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>${(currentPrice * 0.98).toFixed(6)}</span>
                <span>${(currentPrice * 1.02).toFixed(6)}</span>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1.5 border-b border-white/10">
              <span className="text-white/60 text-xs">Market Cap</span>
              <span className="text-white text-xs font-mono">${formatNumber(marketCap)}</span>
            </div>
            
            <div className="flex justify-between items-center py-1.5 border-b border-white/10">
              <span className="text-white/60 text-xs">Fully Diluted Valuation</span>
              <span className="text-white text-xs font-mono">${formatNumber(maxSupply * currentPrice)}</span>
            </div>
            
            <div className="flex justify-between items-center py-1.5 border-b border-white/10">
              <span className="text-white/60 text-xs">24 Hour Trading Vol</span>
              <span className="text-white text-xs font-mono">${formatNumber(volume24h)}</span>
            </div>
            
            <div className="flex justify-between items-center py-1.5 border-b border-white/10">
              <span className="text-white/60 text-xs">Circulating Supply</span>
              <span className="text-white text-xs font-mono">{formatSupply(circulatingSupply)}</span>
            </div>
            
            <div className="flex justify-between items-center py-1.5 border-b border-white/10">
              <span className="text-white/60 text-xs">Total Supply</span>
              <span className="text-white text-xs font-mono">{formatSupply(totalSupply)}</span>
            </div>
            
            <div className="flex justify-between items-center py-1.5">
              <span className="text-white/60 text-xs">Max Supply</span>
              <span className="text-white text-xs font-mono">{formatSupply(maxSupply)}</span>
            </div>
          </div>
        </div>

        {/* Right Side - Price Chart */}
        <div className="lg:col-span-3 flex items-end">
          <PriceChart data={priceHistory} />
        </div>
      </div>
    </div>
  );
};