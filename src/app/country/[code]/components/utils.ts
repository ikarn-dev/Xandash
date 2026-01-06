// Format helpers for Country Profile
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
  if (credits >= 1000000) return (credits / 1000000).toFixed(2) + 'M';
  if (credits >= 1000) return (credits / 1000).toFixed(1) + 'K';
  return credits.toFixed(0);
};

// Time range options
export type TimeRange = '30m' | '1h' | '24h' | '1w';

export const timeRangeOptions: { value: TimeRange; label: string }[] = [
  { value: '30m', label: '30m' },
  { value: '1h', label: '1h' },
  { value: '24h', label: '24h' },
  { value: '1w', label: '1w' },
];
