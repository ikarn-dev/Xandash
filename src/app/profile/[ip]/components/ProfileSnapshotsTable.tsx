import { ServerIcon } from './ProfileIcons';
import { formatBytes, formatUptime, getStatusColor, getStatusBgColor } from './utils';
import { DbNodeSnapshot } from './types';

interface ProfileSnapshotsTableProps {
  displayHistory: DbNodeSnapshot[];
  isShowingFallbackData: boolean;
}

export const ProfileSnapshotsTable = ({ displayHistory, isShowingFallbackData }: ProfileSnapshotsTableProps) => {
  if (!displayHistory || displayHistory.length === 0) return null;

  return (
    <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
      <div className="p-3 border-b border-white/10 flex items-center gap-2">
        <ServerIcon className="w-4 h-4 text-cyan-400" />
        <h2 className="text-sm font-semibold text-white">Stored Snapshots</h2>
        <span className="text-white/40 text-xs">({displayHistory.length} snapshots)</span>
        {isShowingFallbackData && (
          <span className="text-amber-400/70 text-xs">(showing extended data)</span>
        )}
      </div>
      <div className="overflow-x-auto max-h-[250px] sm:max-h-[300px] overflow-y-auto scrollbar-hide">
        <table className="w-full min-w-[600px]">
          <thead className="sticky top-0 bg-black/80">
            <tr className="border-b border-white/10">
              <th className="text-left px-2 sm:px-4 py-2 text-white/60 text-xs font-medium uppercase">Timestamp</th>
              <th className="text-center px-2 sm:px-4 py-2 text-white/60 text-xs font-medium uppercase">Status</th>
              <th className="text-right px-2 sm:px-4 py-2 text-white/60 text-xs font-medium uppercase">Uptime</th>
              <th className="text-right px-2 sm:px-4 py-2 text-white/60 text-xs font-medium uppercase">Storage</th>
              <th className="text-right px-2 sm:px-4 py-2 text-white/60 text-xs font-medium uppercase">Credits</th>
            </tr>
          </thead>
          <tbody>
            {[...displayHistory].reverse().slice(0, 50).map((snapshot, idx) => (
              <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                <td className="px-2 sm:px-4 py-2 text-white/70 text-xs font-mono">
                  <div className="hidden sm:block">{new Date(snapshot.timestamp * 1000).toLocaleString()}</div>
                  <div className="sm:hidden">
                    <div>{new Date(snapshot.timestamp * 1000).toLocaleDateString()}</div>
                    <div className="text-[10px] text-white/50">{new Date(snapshot.timestamp * 1000).toLocaleTimeString()}</div>
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-2 text-center">
                  <span className={`px-1 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium ${getStatusBgColor(snapshot.status)} ${getStatusColor(snapshot.status)}`}>
                    {snapshot.status?.toUpperCase()}
                  </span>
                </td>
                <td className="px-2 sm:px-4 py-2 text-right text-white/70 text-xs font-mono">
                  {formatUptime(snapshot.uptime)}
                </td>
                <td className="px-2 sm:px-4 py-2 text-right text-white/70 text-xs font-mono">
                  {formatBytes(snapshot.storage_committed)}
                </td>
                <td className="px-2 sm:px-4 py-2 text-right text-cyan-400 text-xs font-mono font-bold">
                  {(snapshot.credits || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
