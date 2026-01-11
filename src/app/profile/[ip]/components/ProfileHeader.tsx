'use client';

import { useRouter } from 'next/navigation';
import { CopyBtn as CopyButton } from '@/components/ui/CopyBtn';
import { ArrowLeftIcon } from './ProfileIcons';
import { getStatusColor, getStatusBgColor } from './utils';
import { CurrentNodeData } from './types';
import { getNodeName } from '@/libs/utils/node-names';

interface ProfileHeaderProps {
  ip: string;
  node: CurrentNodeData | null;
  lastUpdate: Date | null;
  onRefresh: () => void;
}

export const ProfileHeader = ({ ip, node, lastUpdate, onRefresh }: ProfileHeaderProps) => {
  const router = useRouter();
  const nodeName = getNodeName(node?.pubkey);

  return (
    <div className="relative bg-black border border-white/10 p-3 sm:p-4 group hover:border-white/20 transition-all">
      <div className="flex flex-col gap-3">
        {/* Top row with back button and refresh */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => router.back()} 
            className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white flex-shrink-0"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={onRefresh} 
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-white text-sm flex-shrink-0"
          >
            Refresh
          </button>
        </div>
        
        {/* Main content */}
        <div className="space-y-2">
          {/* Title and badges */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white font-mono break-all">Node {ip}</h1>
              {nodeName !== 'N/A' && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-medium flex-shrink-0">
                  {nodeName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBgColor(node?.status || 'offline')} flex-shrink-0`}>
                <span className={getStatusColor(node?.status || 'offline')}>
                  {node?.status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </span>
              {node?.is_public && (
                <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 border border-blue-500/50 text-blue-400 flex-shrink-0">
                  PUBLIC
                </span>
              )}
            </div>
          </div>
          
          {/* Details row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-white/60 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="font-mono break-all">{ip}</span>
              <CopyButton text={ip} />
            </div>
            {node?.version && (
              <div className="flex items-center gap-1">
                <span className="text-white/30 hidden sm:inline">•</span>
                <span className="font-mono break-all">v{node.version}</span>
              </div>
            )}
            {lastUpdate && (
              <div className="flex items-center gap-1">
                <span className="text-white/30 hidden sm:inline">•</span>
                <span className="text-white/40 text-xs">Updated {lastUpdate.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
