import { CornerAccents } from '@/components/ui/CornerAccents';
import { XandData } from './types';
import { formatLargeNumber } from './utils';
import { StorageIcon } from './XandIcons';

interface XandSupplyProps {
  data: XandData;
}

export function XandSupply({ data }: XandSupplyProps) {
  const market = data.market_data;
  const circulatingPercent = (market.circulating_supply / market.max_supply) * 100;
  const remainingPercent = 100 - circulatingPercent;

  return (
    <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
      <CornerAccents />
      <div className="flex items-center gap-2 mb-4">
        <StorageIcon className="w-4 h-4 text-orange-400" />
        <span className="text-white/60 text-sm font-mono">// SUPPLY INFORMATION</span>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-6 sm:gap-8">
        {/* Donut Chart */}
        <div className="relative flex-shrink-0">
          <svg viewBox="0 0 120 120" className="w-32 h-32 sm:w-40 sm:h-40">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="16"/>
            <circle 
              cx="60" 
              cy="60" 
              r="50" 
              fill="none" 
              stroke="url(#supplyGradient)" 
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={`${circulatingPercent * 3.14159} 314.159`}
              transform="rotate(-90 60 60)"
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="supplyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981"/>
                <stop offset="100%" stopColor="#34d399"/>
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl sm:text-2xl font-bold text-white font-mono">
              {circulatingPercent.toFixed(1)}%
            </span>
            <span className="text-white/40 text-xs">Circulating</span>
          </div>
        </div>
        
        {/* Supply Details */}
        <div className="flex-1 w-full grid grid-cols-1 gap-3 sm:gap-4">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"/>
            <div className="flex-1 min-w-0">
              <span className="text-white/40 text-xs block">Circulating Supply</span>
              <span className="text-white font-mono text-base sm:text-lg">{formatLargeNumber(market.circulating_supply)}</span>
            </div>
            <span className="text-emerald-400 font-mono text-sm">
              {circulatingPercent.toFixed(1)}%
            </span>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-white/20"/>
            <div className="flex-1 min-w-0">
              <span className="text-white/40 text-xs block">Remaining Supply</span>
              <span className="text-white font-mono text-base sm:text-lg">{formatLargeNumber(market.max_supply - market.circulating_supply)}</span>
            </div>
            <span className="text-white/40 font-mono text-sm">
              {remainingPercent.toFixed(1)}%
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white/5 rounded-lg">
              <span className="text-white/40 text-xs block mb-1">Total Supply</span>
              <span className="text-white font-mono text-sm sm:text-base">{formatLargeNumber(market.total_supply)}</span>
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <span className="text-white/40 text-xs block mb-1">Max Supply</span>
              <span className="text-white font-mono text-sm sm:text-base">{formatLargeNumber(market.max_supply)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
