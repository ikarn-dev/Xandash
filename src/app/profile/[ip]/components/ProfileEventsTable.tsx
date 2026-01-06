import { ActivityIcon } from './ProfileIcons';
import { formatBytes, getTimeAgo } from './utils';
import { NodeEventLog, eventTypeConfig } from './types';

interface ProfileEventsTableProps {
  events: NodeEventLog[];
}

export const ProfileEventsTable = ({ events }: ProfileEventsTableProps) => {
  if (!events || events.length === 0) return null;

  return (
    <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
      <div className="p-3 border-b border-white/10 flex items-center gap-2">
        <ActivityIcon className="w-4 h-4 text-amber-400" />
        <h2 className="text-sm font-semibold text-white">Recent Events</h2>
        <span className="text-white/30 text-xs">({events.length})</span>
      </div>
      <div className="overflow-x-auto max-h-[300px] sm:max-h-[400px] overflow-y-auto scrollbar-hide">
        <table className="w-full min-w-[600px]">
          <thead className="sticky top-0 bg-black/80">
            <tr className="border-b border-white/10">
              <th className="text-left px-2 sm:px-4 py-2 text-white/60 text-xs font-medium uppercase">Timestamp</th>
              <th className="text-left px-2 sm:px-4 py-2 text-white/60 text-xs font-medium uppercase">Event Type</th>
              <th className="text-left px-2 sm:px-4 py-2 text-white/60 text-xs font-medium uppercase">Details</th>
              <th className="text-right px-2 sm:px-4 py-2 text-white/60 text-xs font-medium uppercase">Time Ago</th>
            </tr>
          </thead>
          <tbody>
            {events.slice(0, 50).map((event, idx) => {
              const config = eventTypeConfig[event.event_type] || { color: 'text-white/50', bgColor: '', label: event.event_type };
              const eventDate = new Date(event.timestamp * 1000);
              const timeAgo = getTimeAgo(event.timestamp);
              
              return (
                <tr key={event._id || idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-white/70 text-xs font-mono">
                    <div className="hidden sm:block">{eventDate.toLocaleString()}</div>
                    <div className="sm:hidden">{eventDate.toLocaleDateString()}<br/>{eventDate.toLocaleTimeString()}</div>
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        event.event_type === 'node_online' ? 'bg-emerald-400' :
                        event.event_type === 'node_offline' ? 'bg-red-400' :
                        event.event_type === 'node_new' ? 'bg-amber-400' :
                        event.event_type === 'version_change' ? 'bg-purple-400' :
                        event.event_type === 'storage_change' ? 'bg-orange-400' :
                        event.event_type === 'credits_change' ? 'bg-cyan-400' :
                        'bg-white/40'
                      }`} />
                      <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <EventDetails event={event} />
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                    <span className={`${timeAgo.class} text-xs whitespace-nowrap`}>{timeAgo.text}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const EventDetails = ({ event }: { event: NodeEventLog }) => {
  return (
    <div className="text-white/70 text-xs sm:text-sm break-words">
      {event.event_type === 'status_change' && (
        <span>
          <span className="text-white/50">{event.previous_status}</span> → 
          <span className="text-emerald-400"> {event.new_status}</span>
        </span>
      )}
      {event.event_type === 'version_change' && (
        <span>
          <span className="text-white/50">{event.previous_version || String(event.previous_value)}</span> → 
          <span className="text-emerald-400"> {event.new_version || String(event.new_value)}</span>
        </span>
      )}
      {event.event_type === 'node_new' && (
        <div className="space-y-1">
          <div>v{event.details?.version || '?'}</div>
          <div className="text-xs">{formatBytes(event.details?.storage_committed || 0)}</div>
          <div className="text-xs">{(event.details?.credits || 0).toLocaleString()} credits</div>
        </div>
      )}
      {event.event_type === 'node_online' && (
        <span>Node came online{event.previous_status ? ` from ${event.previous_status}` : ''}</span>
      )}
      {event.event_type === 'node_offline' && (
        <span>Node went offline{event.previous_status ? ` from ${event.previous_status}` : ''}</span>
      )}
      {event.event_type === 'storage_change' && (
        <span>
          <span className="text-white/50">{(Number(event.previous_value) * 100).toFixed(1)}%</span> → 
          <span className="text-orange-400"> {(Number(event.new_value) * 100).toFixed(1)}%</span>
        </span>
      )}
      {event.event_type === 'credits_change' && (
        <span>
          <span className="text-white/50">{Number(event.previous_value)?.toLocaleString()}</span> → 
          <span className="text-cyan-400"> {Number(event.new_value)?.toLocaleString()}</span>
        </span>
      )}
    </div>
  );
};
