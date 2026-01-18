import { CornerAccents } from '@/components/ui/CornerAccents';
import { XandData } from './types';
import { formatPrice, formatPercent, formatCooldown } from './utils';
import { RefreshIcon, TrendUpIcon, TrendDownIcon, MiniChart } from './XandIcons';

interface XandHeaderProps {
  data: XandData;
  refreshing: boolean;
  canRefresh: boolean;
  cooldownRemaining: number;
  onRefresh: () => void;
}

export function XandHeader({ data, refreshing, canRefresh, cooldownRemaining, onRefresh }: XandHeaderProps) {
  const market = data.market_data;
  const isPositive24h = market.price_change_percentage_24h >= 0;

  return (
    <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
      <CornerAccents color="emerald" />
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <img src={data.image.large} alt={data.name} className="w-10 h-10 sm:w-14 sm:h-14 rounded-full" loading="lazy" decoding="async" width="56" height="56"/>
          <div>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-white">{data.name}</h1>
              <span className="px-2 py-0.5 bg-white/10 rounded text-white/60 text-xs sm:text-sm font-mono uppercase">{data.symbol}</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-emerald-400 text-xs">#{market.market_cap_rank}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {data.categories.slice(0, 3).map((cat, i) => (
                <span key={i} className="px-2 py-0.5 bg-white/5 rounded text-white/40 text-xs">{cat}</span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-start lg:items-end gap-1">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono">${formatPrice(market.current_price.usd)}</span>
            <MiniChart isPositive={isPositive24h} />
          </div>
          <div className={`flex items-center gap-1 text-sm ${isPositive24h ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive24h ? <TrendUpIcon className="w-3 h-3" /> : <TrendDownIcon className="w-3 h-3" />}
            <span className="font-mono">{formatPercent(market.price_change_percentage_24h)}</span>
            <span className="text-white/40">(24h)</span>
          </div>
          <button
            onClick={onRefresh}
            disabled={!canRefresh}
            className={`mt-1 flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all ${canRefresh ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/5 text-white/40 cursor-not-allowed'}`}
          >
            <RefreshIcon className="w-3 h-3" spinning={refreshing} />
            {refreshing ? 'Refreshing...' : cooldownRemaining > 0 ? formatCooldown(cooldownRemaining) : 'Refresh'}
          </button>
        </div>
      </div>
    </div>
  );
}
