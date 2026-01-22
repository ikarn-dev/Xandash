import { ClockIcon, ServerIcon, ActivityIcon, ChartIcon } from './ProfileIcons';
import { formatBytes, formatUptime } from './utils';
import { CurrentNodeData } from './types';

interface ProfileStatsCardsProps {
  node: CurrentNodeData | null;
  network?: string;
}

// Corner accents for sharp-edged cards
const CornerAccents = () => (
  <>
    <div className="absolute top-0 left-0 w-2 h-2">
      <div className="absolute top-0 left-0 w-1.5 h-px bg-white/20"></div>
      <div className="absolute top-0 left-0 w-px h-1.5 bg-white/20"></div>
    </div>
    <div className="absolute top-0 right-0 w-2 h-2">
      <div className="absolute top-0 right-0 w-1.5 h-px bg-white/20"></div>
      <div className="absolute top-0 right-0 w-px h-1.5 bg-white/20"></div>
    </div>
    <div className="absolute bottom-0 left-0 w-2 h-2">
      <div className="absolute bottom-0 left-0 w-1.5 h-px bg-white/20"></div>
      <div className="absolute bottom-0 left-0 w-px h-1.5 bg-white/20"></div>
    </div>
    <div className="absolute bottom-0 right-0 w-2 h-2">
      <div className="absolute bottom-0 right-0 w-1.5 h-px bg-white/20"></div>
      <div className="absolute bottom-0 right-0 w-px h-1.5 bg-white/20"></div>
    </div>
  </>
);

export const ProfileStatsCards = ({ node }: ProfileStatsCardsProps) => {
  // Calculate individual score components
  const now = Math.floor(Date.now() / 1000);
  const timeDiff = now - (node?.last_seen_timestamp || now);
  const isOnline = timeDiff <= 3600;

  // Uptime component: Max 40 points for 30 days uptime
  const uptimeScore = Math.min((node?.uptime || 0) / (30 * 24 * 3600), 1) * 40;
  // Storage component: Max 30 points for 100GB
  const storageScore = Math.min((node?.storage_committed || 0) / (100 * 1024 ** 3), 1) * 30;
  // Online component: 30 points for being online
  const onlineScore = isOnline ? 30 : 0;
  // Total calculated score
  const totalScore = uptimeScore + storageScore + onlineScore;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
      {/* Node Score Card - Shows how score is calculated */}
      <div className="relative group bg-black border border-white/10 p-3 sm:p-4 hover:border-purple-500/30 transition-colors min-w-0">
        <CornerAccents />
        <div className="flex items-center gap-1.5 text-purple-400/70 text-[10px] sm:text-xs mb-1.5 sm:mb-2">
          <ChartIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>Node Score</span>
        </div>
        <div className="text-base sm:text-xl lg:text-2xl font-bold text-purple-400 font-mono">
          {totalScore.toFixed(1)}
          <span className="text-xs sm:text-sm text-purple-400/50 ml-1">/ 100</span>
        </div>
        <div className="w-full text-[9px] sm:text-[10px] text-white/60 mt-1.5 leading-tight flex flex-col gap-1">
          <div className="flex justify-between w-full">
            <span>Uptime</span>
            <span className="text-blue-400 font-medium">{uptimeScore.toFixed(1)}/40</span>
          </div>
          <div className="flex justify-between w-full">
            <span>Storage</span>
            <span className="text-orange-400 font-medium">{storageScore.toFixed(1)}/30</span>
          </div>
          <div className="flex justify-between w-full">
            <span>Online</span>
            <span className={isOnline ? "text-green-400 font-medium" : "text-red-400 font-medium"}>{onlineScore}/30</span>
          </div>
        </div>
      </div>

      {/* Uptime Card */}
      <div className="relative group bg-black border border-white/10 p-3 sm:p-4 hover:border-blue-500/30 transition-colors">
        <CornerAccents />
        <div className="flex items-center gap-1.5 text-blue-400/70 text-[10px] sm:text-xs mb-1.5 sm:mb-2">
          <ClockIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>Uptime</span>
        </div>
        <div className="text-base sm:text-xl lg:text-2xl font-bold text-blue-400 font-mono">
          {formatUptime(node?.uptime || 0)}
        </div>
      </div>

      {/* Storage Card */}
      <div className="relative group bg-black border border-white/10 p-3 sm:p-4 hover:border-orange-500/30 transition-colors">
        <CornerAccents />
        <div className="flex items-center gap-1.5 text-orange-400/70 text-[10px] sm:text-xs mb-1.5 sm:mb-2">
          <ServerIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>Storage</span>
        </div>
        <div className="text-sm sm:text-xl lg:text-2xl font-bold text-orange-400 font-mono">
          {formatBytes(node?.storage_committed || 0)}
        </div>
      </div>

      {/* Used Card */}
      <div className="relative group bg-black border border-white/10 p-3 sm:p-4 hover:border-yellow-500/30 transition-colors">
        <CornerAccents />
        <div className="flex items-center gap-1.5 text-yellow-400/70 text-[10px] sm:text-xs mb-1.5 sm:mb-2">
          <ServerIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>Used</span>
        </div>
        <div className="text-sm sm:text-xl lg:text-2xl font-bold text-yellow-400 font-mono">
          {formatBytes(node?.storage_used || 0)}
        </div>
      </div>

      {/* Credits Card */}
      <div className="relative group bg-black border border-white/10 p-3 sm:p-4 hover:border-emerald-500/30 transition-colors">
        <CornerAccents />
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
