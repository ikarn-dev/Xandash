import { CornerAccents } from '@/components/ui/CornerAccents';
import { XandData } from './types';
import { formatPrice, formatPercent, formatDate } from './utils';
import { ChartIcon, TrendUpIcon, TrendDownIcon, HighLowIcon } from './XandIcons';

interface XandPriceChangesProps {
  data: XandData;
}

export function XandPriceChanges({ data }: XandPriceChangesProps) {
  const market = data.market_data;

  const priceChanges = [
    { label: '24h', value: market.price_change_percentage_24h },
    { label: '7d', value: market.price_change_percentage_7d },
    { label: '30d', value: market.price_change_percentage_30d },
    { label: 'ATH', value: market.ath_change_percentage.usd },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Price Changes */}
      <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
        <CornerAccents />
        <div className="flex items-center gap-2 mb-4">
          <ChartIcon className="w-4 h-4 text-cyan-400" />
          <span className="text-white/60 text-sm font-mono">// PRICE CHANGES</span>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4">
          {priceChanges.map(({ label, value }) => (
            <div key={label} className="text-center">
              <span className="text-white/40 text-xs block mb-1">{label}</span>
              <span className={`flex items-center justify-center gap-1 text-xs sm:text-sm font-mono ${value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
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
            <div className="text-emerald-400 font-mono text-sm sm:text-base">${formatPrice(market.high_24h.usd)}</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-white/40 text-xs mb-1">
              <HighLowIcon className="w-3 h-3" />24h Low
            </div>
            <div className="text-red-400 font-mono text-sm sm:text-base">${formatPrice(market.low_24h.usd)}</div>
          </div>
        </div>
      </div>

      {/* ATH/ATL Records */}
      <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
        <CornerAccents />
        <div className="flex items-center gap-2 mb-4">
          <TrendUpIcon className="w-4 h-4 text-emerald-400" />
          <span className="text-white/60 text-sm font-mono">// ALL-TIME RECORDS</span>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-white/40 text-xs block">All-Time High</span>
              <span className="text-emerald-400 font-mono text-base sm:text-lg">${formatPrice(market.ath.usd)}</span>
            </div>
            <div className="text-right">
              <span className="text-white/40 text-xs block">{formatDate(market.ath_date.usd)}</span>
              <span className="text-red-400 font-mono text-sm">{formatPercent(market.ath_change_percentage.usd)}</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-white/40 text-xs block">All-Time Low</span>
              <span className="text-red-400 font-mono text-base sm:text-lg">${formatPrice(market.atl.usd)}</span>
            </div>
            <div className="text-right">
              <span className="text-white/40 text-xs block">{formatDate(market.atl_date.usd)}</span>
              <span className="text-emerald-400 font-mono text-sm">{formatPercent(market.atl_change_percentage.usd)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
