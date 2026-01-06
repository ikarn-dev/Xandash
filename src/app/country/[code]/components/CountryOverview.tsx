import { GlobeIcon } from './CountryIcons';
import { formatBytes, formatUptime } from './utils';

interface CountryOverviewProps {
  totalNodes: number;
  onlineNodes: number;
  syncingNodes: number;
  offlineNodes: number;
  totalStorage: number;
  totalStorageUsed: number;
  avgUptime: number;
}

export const CountryOverview = ({
  totalNodes,
  onlineNodes,
  syncingNodes,
  offlineNodes,
  totalStorage,
  totalStorageUsed,
  avgUptime
}: CountryOverviewProps) => {
  return (
    <div className="bg-black/40 border border-white/10 rounded-lg p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <GlobeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
        <h2 className="text-sm sm:text-base md:text-lg font-semibold text-white">Overview</h2>
      </div>
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-xs sm:text-sm">Total Nodes</span>
          <span className="text-white font-mono text-lg sm:text-xl font-bold">{totalNodes}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-xs sm:text-sm">Online</span>
          <span className="text-emerald-400 font-mono text-base sm:text-lg">{onlineNodes}</span>
        </div>
        {syncingNodes > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs sm:text-sm">Syncing</span>
            <span className="text-amber-400 font-mono text-base sm:text-lg">{syncingNodes}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-xs sm:text-sm">Offline</span>
          <span className="text-red-400 font-mono text-base sm:text-lg">{offlineNodes}</span>
        </div>
        <div className="border-t border-white/10 pt-3 sm:pt-4">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-white/60 text-xs sm:text-sm">Total Storage</span>
            <span className="text-white font-mono text-xs sm:text-sm">{formatBytes(totalStorage)}</span>
          </div>
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-white/60 text-xs sm:text-sm">Storage Used</span>
            <span className="text-white font-mono text-xs sm:text-sm">{formatBytes(totalStorageUsed)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/60 text-xs sm:text-sm">Avg Uptime</span>
            <span className="text-white font-mono text-xs sm:text-sm">{formatUptime(avgUptime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
