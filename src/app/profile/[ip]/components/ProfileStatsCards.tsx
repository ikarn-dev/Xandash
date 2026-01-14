import { ClockIcon, ServerIcon, ActivityIcon } from './ProfileIcons';
import { formatBytes, formatUptime } from './utils';
import { CurrentNodeData } from './types';

interface ProfileStatsCardsProps {
  node: CurrentNodeData | null;
  network?: string;
}

export const ProfileStatsCards = ({ node, network }: ProfileStatsCardsProps) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
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
          {(node?.credits || 0).toLocaleString()}
        </div>
        <div className="text-[9px] sm:text-[10px] text-white/30 mt-1">
          Current
        </div>
      </div>
    </div>
  );
};
