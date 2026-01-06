import { NodesIcon, StorageIcon, CreditsIcon, ClockIcon } from './CountryIcons';
import { formatBytes, formatUptime, formatCredits } from './utils';

interface CountryStatsCardsProps {
  totalCredits: number;
  onlinePercent: number;
  totalStorage: number;
  totalStorageUsed: number;
  avgUptime: number;
}

export const CountryStatsCards = ({
  totalCredits,
  onlinePercent,
  totalStorage,
  totalStorageUsed,
  avgUptime
}: CountryStatsCardsProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
      {/* Total Credits */}
      <div className="bg-black/40 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 hover:border-emerald-500/30 transition-colors">
        <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-400/70 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">
          <CreditsIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Total Credits</span>
        </div>
        <div className="text-base sm:text-lg md:text-xl font-bold text-emerald-400">
          {formatCredits(totalCredits)}
        </div>
      </div>

      {/* Online Percent */}
      <div className="bg-black/40 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 hover:border-green-500/30 transition-colors">
        <div className="flex items-center gap-1.5 sm:gap-2 text-green-400/70 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">
          <NodesIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Online Rate</span>
        </div>
        <div className="text-base sm:text-lg md:text-xl font-bold text-green-400">
          {onlinePercent.toFixed(1)}%
        </div>
      </div>

      {/* Total Storage */}
      <div className="bg-black/40 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 hover:border-orange-500/30 transition-colors">
        <div className="flex items-center gap-1.5 sm:gap-2 text-orange-400/70 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">
          <StorageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Total Storage</span>
        </div>
        <div className="text-base sm:text-lg md:text-xl font-bold text-orange-400">
          {formatBytes(totalStorage)}
        </div>
      </div>

      {/* Storage Used */}
      <div className="bg-black/40 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 hover:border-blue-500/30 transition-colors">
        <div className="flex items-center gap-1.5 sm:gap-2 text-blue-400/70 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">
          <StorageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Storage Used</span>
        </div>
        <div className="text-base sm:text-lg md:text-xl font-bold text-blue-400">
          {formatBytes(totalStorageUsed)}
        </div>
      </div>

      {/* Avg Uptime */}
      <div className="bg-black/40 border border-white/10 rounded-lg p-2 sm:p-3 md:p-4 hover:border-purple-500/30 transition-colors col-span-2 sm:col-span-1">
        <div className="flex items-center gap-1.5 sm:gap-2 text-purple-400/70 text-[10px] sm:text-xs md:text-sm mb-1 sm:mb-2">
          <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>Avg Uptime</span>
        </div>
        <div className="text-base sm:text-lg md:text-xl font-bold text-purple-400">
          {formatUptime(avgUptime)}
        </div>
      </div>
    </div>
  );
};
