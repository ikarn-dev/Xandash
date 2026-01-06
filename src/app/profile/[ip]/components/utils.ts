// Format helpers for Node Profile
export const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatUptime = (seconds: number) => {
  if (!seconds) return '0h';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
};

export const formatCredits = (credits: number) => {
  if (credits >= 1000000) return `${(credits / 1000000).toFixed(1)}M`;
  if (credits >= 1000) return `${(credits / 1000).toFixed(1)}K`;
  return credits.toLocaleString();
};

export const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'online': return 'text-emerald-400';
    case 'syncing': return 'text-amber-400';
    default: return 'text-red-400';
  }
};

export const getStatusBgColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'online': return 'bg-emerald-500/20 border-emerald-500/50';
    case 'syncing': return 'bg-amber-500/20 border-amber-500/50';
    default: return 'bg-red-500/20 border-red-500/50';
  }
};

export const getTimeAgo = (timestamp: number) => {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return { text: `${seconds}s ago`, class: 'text-emerald-400' };
  if (seconds < 3600) return { text: `${Math.floor(seconds / 60)}m ago`, class: 'text-green-400' };
  if (seconds < 86400) return { text: `${Math.floor(seconds / 3600)}h ago`, class: 'text-amber-400' };
  if (seconds < 604800) return { text: `${Math.floor(seconds / 86400)}d ago`, class: 'text-orange-400' };
  return { text: `${Math.floor(seconds / 604800)}w ago`, class: 'text-red-400' };
};
