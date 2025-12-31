'use client';

import { useState, useEffect, useCallback, memo, Suspense, lazy } from 'react';
import { useRouter } from 'next/navigation';
import { CopyBtn as CopyButton } from '@/components/ui/CopyBtn';
import { getCountryFlagUrl } from '@/libs/services/geolocation';

// Lazy load heavy components
const NodeLocationMap = lazy(() => import('./NodeLocationMap'));

// Icons as simple components
const ArrowLeftIcon = () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;
const GlobeIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const ServerIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/></svg>;
const ClockIcon = () => <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const ActivityIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const MapPinIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const ChartIcon = () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;

// Interfaces
interface NodeProfileData {
  ip: string;
  location: { country: string; country_code: string; city: string; region: string; provider: string; lat?: number; lon?: number } | null;
  currentNode: { pubkey?: string; address?: string; status: string; uptime: number; storage_committed: number; storage_used: number; storage_usage_percent: number; version?: string; rpc_port?: number; is_public?: boolean; credits?: number; active_streams?: number } | null;
  dbHistory?: { ip: string; status: string; uptime: number; storage_committed: number; credits: number; timestamp: number }[];
  dbEvents?: { _id?: string; event_type: string; previous_value?: any; new_value?: any; previous_status?: string; new_status?: string; previous_version?: string; new_version?: string; details?: any; timestamp: number }[];
}

// Helpers
const formatBytes = (b: number) => { if (!b) return '0 B'; const k = 1024, s = ['B','KB','MB','GB','TB'], i = Math.floor(Math.log(b)/Math.log(k)); return (b/Math.pow(k,i)).toFixed(1)+' '+s[i]; };
const formatUptime = (s: number) => { if (!s) return '0h'; const d = Math.floor(s/86400), h = Math.floor((s%86400)/3600); return d > 0 ? `${d}d ${h}h` : `${h}h`; };
const getStatusColor = (s: string) => s === 'online' ? 'text-emerald-400' : s === 'syncing' ? 'text-amber-400' : 'text-red-400';
const getStatusBg = (s: string) => s === 'online' ? 'bg-emerald-500/20 border-emerald-500/50' : s === 'syncing' ? 'bg-amber-500/20 border-amber-500/50' : 'bg-red-500/20 border-red-500/50';
const timeAgo = (t: number) => { const s = Math.floor(Date.now()/1000-t); return s < 60 ? 'now' : s < 3600 ? `${Math.floor(s/60)}m` : s < 86400 ? `${Math.floor(s/3600)}h` : `${Math.floor(s/86400)}d`; };

// Memoized stat card
const StatCard = memo(({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) => (
  <div className={`bg-black/40 border border-white/10 rounded-lg p-3 hover:border-${color}-500/30`}>
    <div className={`flex items-center gap-1.5 text-${color}-400/70 text-xs mb-1`}>{icon}<span>{label}</span></div>
    <div className={`text-lg font-bold text-${color}-400`}>{value}</div>
  </div>
));
StatCard.displayName = 'StatCard';

// Simple chart
const MiniChart = memo(({ data, color }: { data: number[]; color: string }) => {
  if (!data.length) return <div className="h-16 flex items-center justify-center text-white/30 text-xs">No data</div>;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const points = data.map((v, i) => `${(i/(data.length-1||1))*100},${100-((v-min)/range)*80}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-16" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
});
MiniChart.displayName = 'MiniChart';

// Event item
const EventItem = memo(({ event }: { event: NodeProfileData['dbEvents'][0] }) => {
  const colors: Record<string, string> = { node_online: 'bg-emerald-400', node_offline: 'bg-red-400', node_new: 'bg-amber-400', version_change: 'bg-purple-400', storage_change: 'bg-orange-400', credits_change: 'bg-cyan-400' };
  const labels: Record<string, string> = { node_online: 'Online', node_offline: 'Offline', node_new: 'New Node', version_change: 'Version', storage_change: 'Storage', credits_change: 'Credits' };
  return (
    <div className="px-4 py-2 flex items-center gap-3 hover:bg-white/[0.02]">
      <div className={`w-1.5 h-1.5 rounded-full ${colors[event.event_type] || 'bg-white/40'}`} />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-white/70">{labels[event.event_type] || event.event_type}</span>
        <span className="text-white/30 text-xs ml-2">{timeAgo(event.timestamp)} ago</span>
      </div>
    </div>
  );
});
EventItem.displayName = 'EventItem';

// Loading skeleton
const Skeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-20 bg-white/5 rounded-lg" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 h-48 bg-white/5 rounded-lg" />
      <div className="h-48 bg-white/5 rounded-lg" />
    </div>
    <div className="grid grid-cols-5 gap-3">{[...Array(5)].map((_,i) => <div key={i} className="h-20 bg-white/5 rounded-lg" />)}</div>
  </div>
);

// Map placeholder
const MapPlaceholder = () => <div className="h-[180px] bg-black/60 rounded-lg flex items-center justify-center text-white/40 text-sm">Loading map...</div>;

export function NodeProfileClient({ ip }: { ip: string }) {
  const router = useRouter();
  const [data, setData] = useState<NodeProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/node-profile?ip=${encodeURIComponent(ip)}&quick=true`);
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
      setError(null);
    } catch { setError('Failed to load'); }
    finally { setLoading(false); }
  }, [ip]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const i = setInterval(fetchData, 30000); return () => clearInterval(i); }, [fetchData]);

  if (loading) return <Skeleton />;
  if (error) return <div className="text-center py-20"><p className="text-red-400 mb-4">{error}</p><button onClick={() => router.back()} className="px-4 py-2 bg-white/10 rounded-lg text-white">Go Back</button></div>;

  const node = data?.currentNode;
  const loc = data?.location;
  const history = data?.dbHistory || [];
  const events = data?.dbEvents || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-black border border-white/10 p-4 rounded-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg text-white/60"><ArrowLeftIcon /></button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white font-mono">{ip}</h1>
                <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusBg(node?.status || 'offline')}`}>
                  <span className={getStatusColor(node?.status || 'offline')}>{(node?.status || 'UNKNOWN').toUpperCase()}</span>
                </span>
                {node?.is_public && <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 border-blue-500/50 text-blue-400">PUBLIC</span>}
              </div>
              <div className="flex items-center gap-2 mt-1 text-white/50 text-sm">
                <CopyButton text={ip} />
                {node?.version && <span>v{node.version}</span>}
              </div>
            </div>
          </div>
          <button onClick={fetchData} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-white text-sm">Refresh</button>
        </div>
      </div>

      {/* Location */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-black/40 border border-white/10 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-white/10 flex items-center gap-2">
            <MapPinIcon /><span className="text-sm font-semibold text-white">Location</span>
          </div>
          <Suspense fallback={<MapPlaceholder />}>
            {loc?.lat && loc?.lon ? <NodeLocationMap lat={loc.lat} lon={loc.lon} /> : <div className="h-[180px] flex items-center justify-center text-white/40">Location unavailable</div>}
          </Suspense>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-3"><GlobeIcon /><span className="text-sm font-semibold text-white">Details</span></div>
          <div className="space-y-2 text-sm">
            {loc?.country_code && <img src={getCountryFlagUrl(loc.country_code)} alt="" className="w-6 h-4 rounded" />}
            <div className="flex justify-between"><span className="text-white/50">Country</span><span className="text-white">{loc?.country || '-'}</span></div>
            <div className="flex justify-between"><span className="text-white/50">City</span><span className="text-white">{loc?.city || '-'}</span></div>
            <div className="flex justify-between"><span className="text-white/50">Provider</span><span className="text-white text-xs truncate max-w-[120px]">{loc?.provider || '-'}</span></div>
            <div className="flex justify-between"><span className="text-white/50">Port</span><span className="text-white font-mono">{node?.rpc_port || '-'}</span></div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div className="bg-black/40 border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-blue-400/70 text-xs mb-1"><ClockIcon /><span>Uptime</span></div>
          <div className="text-lg font-bold text-blue-400">{formatUptime(node?.uptime || 0)}</div>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-orange-400/70 text-xs mb-1"><ServerIcon /><span>Storage</span></div>
          <div className="text-lg font-bold text-orange-400">{formatBytes(node?.storage_committed || 0)}</div>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-yellow-400/70 text-xs mb-1"><ServerIcon /><span>Used</span></div>
          <div className="text-lg font-bold text-yellow-400">{formatBytes(node?.storage_used || 0)}</div>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-emerald-400/70 text-xs mb-1"><ActivityIcon /><span>Credits</span></div>
          <div className="text-lg font-bold text-emerald-400">{(node?.credits || 0).toLocaleString()}</div>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-purple-400/70 text-xs mb-1"><ActivityIcon /><span>Streams</span></div>
          <div className="text-lg font-bold text-purple-400">{node?.active_streams || 0}</div>
        </div>
      </div>

      {/* Charts */}
      {history.length > 0 && (
        <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-white/10 flex items-center gap-2">
            <ChartIcon /><span className="text-sm font-semibold text-white">History</span>
            <span className="text-white/30 text-xs">({history.length})</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3">
            <div className="bg-black/20 rounded-lg p-2">
              <div className="text-[10px] text-white/50 mb-1">Uptime</div>
              <MiniChart data={history.map(h => h.uptime/3600).reverse()} color="#3b82f6" />
            </div>
            <div className="bg-black/20 rounded-lg p-2">
              <div className="text-[10px] text-white/50 mb-1">Storage</div>
              <MiniChart data={history.map(h => h.storage_committed/(1024**3)).reverse()} color="#f59e0b" />
            </div>
            <div className="bg-black/20 rounded-lg p-2">
              <div className="text-[10px] text-white/50 mb-1">Credits</div>
              <MiniChart data={history.map(h => h.credits).reverse()} color="#10b981" />
            </div>
            <div className="bg-black/20 rounded-lg p-2">
              <div className="text-[10px] text-white/50 mb-1">Status</div>
              <div className="h-16 flex items-end gap-px">
                {history.slice(-30).reverse().map((h, i) => (
                  <div key={i} className={`flex-1 ${h.status === 'online' ? 'bg-emerald-500' : h.status === 'syncing' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ height: '100%' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Events */}
      {events.length > 0 && (
        <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
          <div className="p-3 border-b border-white/10 flex items-center gap-2">
            <ActivityIcon /><span className="text-sm font-semibold text-white">Events</span>
            <span className="text-white/30 text-xs">({events.length})</span>
          </div>
          <div className="divide-y divide-white/5 max-h-[200px] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {events.slice(0, 15).map((e, i) => <EventItem key={e._id || i} event={e} />)}
          </div>
        </div>
      )}
    </div>
  );
}
