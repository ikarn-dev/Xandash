import { CornerAccents } from '@/components/ui/CornerAccents';
import { XandData } from './types';
import { formatLargeNumber } from './utils';
import { MarketCapIcon, DollarIcon, VolumeIcon, SupplyIcon } from './XandIcons';

interface XandMarketStatsProps {
  data: XandData;
}

export function XandMarketStats({ data }: XandMarketStatsProps) {
  const market = data.market_data;

  const stats = [
    { icon: MarketCapIcon, label: 'Market Cap', value: market.market_cap.usd, color: 'cyan' },
    { icon: DollarIcon, label: 'Fully Diluted', value: market.fully_diluted_valuation.usd, color: 'purple' },
    { icon: VolumeIcon, label: '24h Volume', value: market.total_volume.usd, color: 'blue' },
    { icon: SupplyIcon, label: 'Circulating', value: market.circulating_supply, color: 'orange', noPrefix: true },
  ];

  const colorClasses: Record<string, string> = {
    cyan: 'text-cyan-400/70 hover:border-cyan-500/30',
    purple: 'text-purple-400/70 hover:border-purple-500/30',
    blue: 'text-blue-400/70 hover:border-blue-500/30',
    orange: 'text-orange-400/70 hover:border-orange-500/30',
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map(({ icon: Icon, label, value, color, noPrefix }) => (
        <div key={label} className={`relative bg-black border border-white/10 p-3 sm:p-4 group ${colorClasses[color]} transition-all duration-300 overflow-hidden`}>
          <CornerAccents />
          <div className={`flex items-center gap-2 ${colorClasses[color].split(' ')[0]} text-xs mb-2`}>
            <Icon className="w-4 h-4" /><span>{label}</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-white font-mono">
            {noPrefix ? '' : '$'}{formatLargeNumber(value)}
          </div>
        </div>
      ))}
    </div>
  );
}
