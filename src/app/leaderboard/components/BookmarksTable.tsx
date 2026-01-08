'use client';

import { X } from 'lucide-react';
import { CopyBtn } from '@/components/ui/CopyBtn';
import { toast } from 'sonner';

interface BookmarkNode {
  rank: number;
  pod_id: string;
  credits: number;
  uptime: number;
  storage_used: number;
  storage_committed: number;
  address?: string;
}

interface BookmarksTableProps {
  data: BookmarkNode[];
  onRemoveBookmark: (podId: string) => void;
}

export function BookmarksTable({ data, onRemoveBookmark }: BookmarksTableProps) {
  const getTier = (credits: number) => {
    if (credits >= 50000) return { name: 'Diamond', color: '#60a5fa', bgColor: 'rgba(96, 165, 250, 0.15)' };
    if (credits >= 25000) return { name: 'Platinum', color: '#a78bfa', bgColor: 'rgba(167, 139, 250, 0.15)' };
    if (credits >= 10000) return { name: 'Gold', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.15)' };
    if (credits >= 5000) return { name: 'Silver', color: '#9ca3af', bgColor: 'rgba(156, 163, 175, 0.15)' };
    return { name: 'Bronze', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)' };
  };

  const extractIP = (address?: string) => {
    if (!address) return 'N/A';
    return address.split(':')[0] || 'N/A';
  };

  return (
    <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <table className="w-full min-w-[650px]">
        <thead>
          <tr className="border-b border-yellow-500/20 bg-black/50">
            <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-yellow-400/70 text-[10px] sm:text-xs font-medium uppercase w-[10%]">Rank</th>
            <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-yellow-400/70 text-[10px] sm:text-xs font-medium uppercase w-[30%]">Pod ID</th>
            <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-yellow-400/70 text-[10px] sm:text-xs font-medium uppercase w-[20%]">IP Address</th>
            <th className="text-center py-2 sm:py-3 px-2 sm:px-3 text-yellow-400/70 text-[10px] sm:text-xs font-medium uppercase w-[15%]">Tier</th>
            <th className="text-right py-2 sm:py-3 px-2 sm:px-3 text-yellow-400/70 text-[10px] sm:text-xs font-medium uppercase w-[25%]">Credits</th>
          </tr>
        </thead>
        <tbody>
          {data.map((node) => {
            const tier = getTier(node.credits);
            const ipAddress = extractIP(node.address);
            return (
              <tr key={node.pod_id} className="group hover:bg-yellow-500/5 transition-all border-b border-yellow-500/10">
                <td className="py-2 sm:py-3 px-2 sm:px-3">
                  <div className="flex items-center space-x-1">
                    <span className="text-white text-xs sm:text-sm font-medium">#{node.rank}</span>
                    <button onClick={() => onRemoveBookmark(node.pod_id)} className="text-yellow-400 hover:text-red-400 transition-colors" title="Remove">
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    </button>
                  </div>
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-3">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <span className="font-mono text-yellow-100 text-[10px] sm:text-sm truncate max-w-[100px] sm:max-w-[180px]">{node.pod_id}</span>
                    <CopyBtn text={node.pod_id} onCopy={() => toast.success('Pod ID copied!')} type="Pod ID" />
                  </div>
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-3">
                  <div className="flex items-center space-x-1">
                    <span className="font-mono text-yellow-100/70 text-[10px] sm:text-xs">{ipAddress}</span>
                    {ipAddress !== 'N/A' && <CopyBtn text={ipAddress} onCopy={() => toast.success('IP copied!')} type="IP" />}
                  </div>
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-3 text-center">
                  <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium" style={{ color: tier.color, backgroundColor: tier.bgColor, border: `1px solid ${tier.color}30` }}>
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 sm:mr-1.5" style={{ backgroundColor: tier.color }} />
                    {tier.name}
                  </span>
                </td>
                <td className="py-2 sm:py-3 px-2 sm:px-3 text-right">
                  <span className="text-green-400 font-mono text-[10px] sm:text-sm font-bold">+{node.credits.toLocaleString()}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
