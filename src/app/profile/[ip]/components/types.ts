export interface LocationData {
  country: string;
  country_code: string;
  city: string;
  region: string;
  provider: string;
  ip: string;
  lat?: number;
  lon?: number;
}

export interface NodeEventLog {
  _id?: string;
  ip: string;
  pubkey: string;
  event_type: 'node_online' | 'node_offline' | 'node_new' | 'status_change' | 'version_change' | 'storage_change' | 'credits_change';
  previous_value?: string | number;
  new_value?: string | number;
  previous_status?: string;
  new_status?: string;
  previous_version?: string;
  new_version?: string;
  details?: Record<string, any>;
  timestamp: number;
  created_at: string;
}

export interface DbNodeSnapshot {
  ip: string;
  pubkey: string;
  status: string;
  uptime: number;
  storage_committed: number;
  storage_used: number;
  storage_usage_percent: number;
  credits: number;
  version?: string;
  timestamp: number;
  created_at: string;
}

export interface CurrentNodeData {
  pubkey?: string;
  address?: string;
  status: string;
  uptime: number;
  storage_committed: number;
  storage_used: number;
  storage_usage_percent: number;
  version?: string;
  rpc_port?: number;
  is_public?: boolean;
  last_seen_timestamp?: number;
  credits?: number;
}

export interface NodeProfileData {
  ip: string;
  network?: string;
  location: LocationData | null;
  liveCredits?: any[];
  currentNode: CurrentNodeData | null;
  dbHistory?: DbNodeSnapshot[];
  dbEvents?: NodeEventLog[];
}

export type TimeRange = '7h' | '24h' | '7d' | 'all';

export const timeRangeOptions: { value: TimeRange; label: string; hours: number }[] = [
  { value: '7h', label: '7hr', hours: 7 },
  { value: '24h', label: '24hr', hours: 24 },
  { value: '7d', label: '7days', hours: 168 },
  { value: 'all', label: 'All time', hours: 0 },
];

export const eventTypeConfig: Record<string, { color: string; bgColor: string; label: string }> = {
  node_online: { color: 'text-green-400', bgColor: 'bg-green-500/20', label: 'Online' },
  node_offline: { color: 'text-red-400', bgColor: 'bg-red-500/20', label: 'Offline' },
  node_new: { color: 'text-blue-400', bgColor: 'bg-blue-500/20', label: 'New Node' },
  status_change: { color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', label: 'Status Change' },
  version_change: { color: 'text-purple-400', bgColor: 'bg-purple-500/20', label: 'Version Update' },
  storage_change: { color: 'text-orange-400', bgColor: 'bg-orange-500/20', label: 'Storage Change' },
  credits_change: { color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', label: 'Credits Change' },
};
