import { ClockIcon, ServerIcon, ActivityIcon, WifiIcon } from './ProfileIcons';
import { formatBytes, formatUptime } from './utils';
import { CurrentNodeData } from './types';
import { PingValue, PingLoadingIcon } from '@/components/ui/PingLoadingIcon';

interface ProfileStatsCardsProps {
  node: CurrentNodeData | null;
  ping?: number | null;
  isPingLoading?: boolean;
  network?: string;
}

export const ProfileStatsCards = ({ node, ping, isPingLoading = false, network }: ProfileStatsCardsProps) => {
  const isMainnet = network === 'mainnet';
  
  return (
    <div className={`grid grid-cols-2 ${isMainnet ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-2 sm:gap-3`}>
      <div className="bg-black/40 border border-white/10 rounded-lg p-3 sm:p-4 hover:border-blue-500/30 transition-colors">
        <div className="flex items-center gap-1.5 text-blue-400/70 text-[10px] sm:text-xs mb-1.5 sm:mb-2">
          <ClockIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>Uptime</span>
        </div>
        <div className="text-base sm:text-xl lg:text-2xl font-bold text-blue-400 font-mono">
          {formatUptime(node?.uptime || 0)}
        </div>
      </div>
      
      <div className="bg-black/40 border border-white/10 rounded-lg p-3 sm:p-4 hover:border-orange-500/30 transition-colors">
        <div className="flex items-center gap-1.5 text-orange-400/70 text-[10px] sm:text-xs mb-1.5 sm:mb-2">
          <ServerIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>Storage</span>
        </div>
        <div className="text-base sm:text-xl lg:text-2xl font-bold text-orange-400 font-mono">
          {formatBytes(node?.storage_committed || 0)}
        </div>
      </div>
      
      <div className="bg-black/40 border border-white/10 rounded-lg p-3 sm:p-4 hover:border-yellow-500/30 transition-colors">
        <div className="flex items-center gap-1.5 text-yellow-400/70 text-[10px] sm:text-xs mb-1.5 sm:mb-2">
          <ServerIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>Used</span>
        </div>
        <div className="text-base sm:text-xl lg:text-2xl font-bold text-yellow-400 font-mono">
          {formatBytes(node?.storage_used || 0)}
        </div>
      </div>
      
      <div className="bg-black/40 border border-white/10 rounded-lg p-3 sm:p-4 hover:border-emerald-500/30 transition-colors">
        <div className="flex items-center gap-1.5 text-emerald-400/70 text-[10px] sm:text-xs mb-1.5 sm:mb-2">
          <ActivityIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>Credits</span>
        </div>
        <div className="text-base sm:text-xl lg:text-2xl font-bold text-emerald-400 font-mono">
          {(node?.totalCredits || node?.credits || 0).toLocaleString()}
        </div>
        {(node?.previousCredits && node.previousCredits > 0) && (
          <div className="flex items-center gap-2 mt-1 text-[9px] sm:text-[10px] text-white/40">
            <span>Current: <span className="text-emerald-400/80">{(node?.credits || 0).toLocaleString()}</span></span>
            <span>•</span>
            <span>Prev: <span className="text-amber-400/80">{node.previousCredits.toLocaleString()}</span></span>
          </div>
        )}
      </div>
      
      {/* Ping card - Mainnet only */}
      {isMainnet && (
        <div className="bg-black/40 border border-white/10 rounded-lg p-3 sm:p-4 hover:border-cyan-500/30 transition-colors">
          <div className="flex items-center gap-1.5 text-cyan-400/70 text-[10px] sm:text-xs mb-1.5 sm:mb-2">
            <WifiIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Ping</span>
          </div>
          {isPingLoading ? (
            <div className="flex items-center gap-2">
              <PingLoadingIcon size="lg" />
              <span className="text-white/30 text-base sm:text-xl lg:text-2xl font-mono animate-pulse">...</span>
            </div>
          ) : (
            <div className={`text-base sm:text-xl lg:text-2xl font-bold font-mono ${
              ping !== null && ping !== undefined
                ? ping < 100 ? 'text-green-400' : ping < 300 ? 'text-yellow-400' : 'text-orange-400'
                : 'text-white/30'
            }`}>
              {ping !== null && ping !== undefined ? `${ping}ms` : '—'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
