'use client';

import { useMemo } from 'react';
import { Star } from 'lucide-react';
import { CopyBtn } from '@/components/ui/CopyBtn';
import { toast } from 'sonner';
import { LeaderboardType } from './LeaderboardTabs';
import { getNodeName } from '@/libs/utils/node-names';

export interface NodeData {
  pod_id: string;
  credits: number;
  uptime: number;
  storage_used: number;
  storage_committed: number;
  address?: string;
}

interface RankingTableProps {
  data: NodeData[];
  type: LeaderboardType;
  bookmarkedPods: Set<string>;
  onToggleBookmark: (podId: string) => void;
  isLoading?: boolean;
}

export function RankingTable({ 
  data, 
  type, 
  bookmarkedPods, 
  onToggleBookmark,
  isLoading = false 
}: RankingTableProps) {
  // Sort and rank data based on type
  const rankedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      switch (type) {
        case 'credits':
          return b.credits - a.credits;
        case 'uptime':
          return b.uptime - a.uptime;
        case 'storage':
          return b.storage_committed - a.storage_committed;
        default:
          return 0;
      }
    });
    return sorted.map((node, index) => ({ ...node, rank: index + 1 }));
  }, [data, type]);

  const getTier = (credits: number) => {
    if (credits >= 50000) return { name: 'Diamond', color: '#60a5fa', bgColor: 'rgba(96, 165, 250, 0.15)' };
    if (credits >= 25000) return { name: 'Platinum', color: '#a78bfa', bgColor: 'rgba(167, 139, 250, 0.15)' };
    if (credits >= 10000) return { name: 'Gold', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.15)' };
    if (credits >= 5000) return { name: 'Silver', color: '#9ca3af', bgColor: 'rgba(156, 163, 175, 0.15)' };
    return { name: 'Bronze', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.15)' };
  };

  const formatUptime = (seconds: number) => {
    if (!seconds || seconds <= 0) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return '<1h';
  };

  const formatStorage = (bytes: number) => {
    if (!bytes || bytes <= 0) return 'N/A';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1000) return `${(gb / 1000).toFixed(2)} TB`;
    return `${gb.toFixed(2)} GB`;
  };

  const extractIP = (address?: string) => {
    if (!address) return 'N/A';
    const ip = address.split(':')[0];
    return ip || 'N/A';
  };

  const getValue = (node: NodeData) => {
    switch (type) {
      case 'credits':
        return <span className="text-green-400 font-bold">+{node.credits.toLocaleString()}</span>;
      case 'uptime':
        return <span className={node.uptime > 0 ? 'text-blue-400' : 'text-gray-500'}>{formatUptime(node.uptime)}</span>;
      case 'storage':
        return <span className={node.storage_committed > 0 ? 'text-cyan-400' : 'text-gray-500'}>{formatStorage(node.storage_committed)}</span>;
    }
  };

  const getColumnHeader = () => {
    switch (type) {
      case 'credits': return 'Credits';
      case 'uptime': return 'Uptime';
      case 'storage': return 'Storage';
    }
  };

  return (
    <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <table className="w-full min-w-[500px]">
        <thead>
          <tr className="border-b border-gray-800 bg-black/50">
            <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider w-[10%]">Rank</th>
            <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider w-[10%]">Name</th>
            <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider w-[28%]">Pod ID</th>
            <th className="text-left py-2 sm:py-3 px-2 sm:px-3 text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider w-[20%]">IP Address</th>
            {type === 'credits' && (
              <th className="text-center py-2 sm:py-3 px-2 sm:px-3 text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider w-[12%]">Tier</th>
            )}
            <th className={`text-right py-2 sm:py-3 px-2 sm:px-3 text-gray-400 text-[10px] sm:text-xs font-medium uppercase tracking-wider ${type === 'credits' ? 'w-[15%]' : 'w-[28%]'}`}>{getColumnHeader()}</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-800/50">
                <td className="py-2 sm:py-3 px-2 sm:px-3"><div className="h-3 sm:h-4 bg-gray-700/50 rounded animate-pulse"></div></td>
                <td className="py-2 sm:py-3 px-2 sm:px-3"><div className="h-3 sm:h-4 bg-gray-700/50 rounded animate-pulse"></div></td>
                <td className="py-2 sm:py-3 px-2 sm:px-3"><div className="h-3 sm:h-4 bg-gray-700/50 rounded animate-pulse"></div></td>
                <td className="py-2 sm:py-3 px-2 sm:px-3"><div className="h-3 sm:h-4 bg-gray-700/50 rounded animate-pulse"></div></td>
                {type === 'credits' && <td className="py-2 sm:py-3 px-2 sm:px-3"><div className="h-3 sm:h-4 bg-gray-700/50 rounded animate-pulse"></div></td>}
                <td className="py-2 sm:py-3 px-2 sm:px-3"><div className="h-3 sm:h-4 bg-gray-700/50 rounded animate-pulse"></div></td>
              </tr>
            ))
          ) : rankedData.length === 0 ? (
            <tr>
              <td colSpan={type === 'credits' ? 6 : 5} className="py-8 text-center text-white/40">
                No data available
              </td>
            </tr>
          ) : (
            rankedData.map((node) => {
              const isBookmarked = bookmarkedPods.has(node.pod_id);
              const tier = getTier(node.credits);
              const ipAddress = extractIP(node.address);
              const nodeName = getNodeName(node.pod_id);
              
              return (
                <tr key={node.pod_id} className="group hover:bg-gray-900/50 transition-all duration-200 border-b border-gray-800/50">
                  <td className="py-2 sm:py-3 px-2 sm:px-3">
                    <div className="flex items-center space-x-1">
                      <span className="text-white text-xs sm:text-sm font-medium">#{node.rank}</span>
                      <button 
                        onClick={() => onToggleBookmark(node.pod_id)} 
                        className="text-gray-500 hover:text-yellow-400 transition-colors duration-200 cursor-pointer" 
                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark pod'}
                      >
                        <Star className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isBookmarked ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'}`} />
                      </button>
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-3">
                    <span className={`text-[10px] sm:text-sm ${nodeName !== 'N/A' ? 'text-cyan-400 font-medium' : 'text-white/30'}`}>
                      {nodeName}
                    </span>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-3">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <div className="font-mono text-white text-[10px] sm:text-sm group-hover:text-blue-300 transition-colors duration-300 truncate max-w-[100px] sm:max-w-[180px]">
                        {node.pod_id}
                      </div>
                      <CopyBtn 
                        text={node.pod_id} 
                        onCopy={() => toast.success('Pod ID copied!')} 
                        type="Pod ID" 
                      />
                    </div>
                  </td>
                  <td className="py-2 sm:py-3 px-2 sm:px-3">
                    <div className="flex items-center space-x-1">
                      <span className="font-mono text-white/70 text-[10px] sm:text-xs">
                        {ipAddress}
                      </span>
                      {ipAddress !== 'N/A' && (
                        <CopyBtn 
                          text={ipAddress} 
                          onCopy={() => toast.success('IP copied!')} 
                          type="IP" 
                        />
                      )}
                    </div>
                  </td>
                  {type === 'credits' && (
                    <td className="py-2 sm:py-3 px-2 sm:px-3 text-center">
                      <span 
                        className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-medium" 
                        style={{ 
                          color: tier.color, 
                          backgroundColor: tier.bgColor, 
                          border: `1px solid ${tier.color}30` 
                        }}
                      >
                        <span 
                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 sm:mr-1.5" 
                          style={{ backgroundColor: tier.color }} 
                        />
                        <span>{tier.name}</span>
                      </span>
                    </td>
                  )}
                  <td className="py-2 sm:py-3 px-2 sm:px-3 text-right">
                    <div className="font-mono text-[10px] sm:text-sm">
                      {getValue(node)}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
