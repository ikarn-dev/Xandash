'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { useNetwork } from '@/libs/context/network-context';
import { AnimatedValue } from '@/components/ui/SlotNumber';

interface OnlineStats {
  onlineNodes: number;
  offlineNodes: number;
  totalNodes: number;
  onlinePercentage: number;
  publicNodes: number;
  privateNodes: number;
}

interface PNodeOnlineCardProps {
  className?: string;
}

export const PNodeOnlineCard: React.FC<PNodeOnlineCardProps> = ({ className = "" }) => {
  const { network } = useNetwork();
  const [stats, setStats] = useState<OnlineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Use ref to track if data has been loaded
  const hasLoadedRef = useRef(false);
  const prevNetworkRef = useRef(network);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if network changed - if so, show loading skeleton
        const networkChanged = prevNetworkRef.current !== network;
        if (networkChanged) {
          prevNetworkRef.current = network;
          hasLoadedRef.current = false;
        }
        
        // Show loading spinner only on initial load or network change
        if (!hasLoadedRef.current) {
          setLoading(true);
        } else {
          // For auto-refresh, just show subtle updating state
          setIsUpdating(true);
        }
        
        const response = await fetch(`/api/nodes?includeAll=true&network=${network}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch nodes: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        const nodes = data.nodes || [];
        const now = Math.floor(Date.now() / 1000);
        
        const onlineNodes = nodes.filter((node: any) => {
          const timeDiff = now - (node.last_seen_timestamp || now);
          // Simplified status logic - only last seen matters
          return timeDiff < 1800; // Less than 30 minutes = online
        }).length;
        
        const totalNodes = nodes.length;
        const offlineNodes = totalNodes - onlineNodes;
        const onlinePercentage = totalNodes > 0 ? (onlineNodes / totalNodes) * 100 : 0;
        
        const publicNodes = nodes.filter((node: any) => node.is_public).length;
        const privateNodes = totalNodes - publicNodes;
        
        setStats({
          onlineNodes,
          offlineNodes,
          totalNodes,
          onlinePercentage,
          publicNodes,
          privateNodes
        });
        
      } catch (err) {
        console.error('Failed to fetch online stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
        hasLoadedRef.current = true;
        setTimeout(() => setIsUpdating(false), 300);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [network]);

  const CornerAccents = () => (
    <>
      <div className="absolute top-0 left-0 w-6 h-6">
        <div className="absolute top-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute top-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>
      <div className="absolute top-0 right-0 w-6 h-6">
        <div className="absolute top-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute top-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>
      <div className="absolute bottom-0 left-0 w-6 h-6">
        <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute bottom-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>
      <div className="absolute bottom-0 right-0 w-6 h-6">
        <div className="absolute bottom-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute bottom-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>
    </>
  );

  if (loading) {
    return (
      <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
        <CornerAccents />
        <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
          <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin mb-3"></div>
          <div className="text-white/40 text-xs">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
        <CornerAccents />
        <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
          <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-red-400 text-xs">Error</div>
        </div>
      </div>
    );
  }

  // Calculate how many bars should be green based on online percentage
  const totalBars = 45;
  const greenBars = Math.round((stats?.onlinePercentage || 0) / 100 * totalBars);

  return (
    <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
      <CornerAccents />

      {/* Content */}
      <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
        <div className="text-white/50 text-[10px] sm:text-xs font-medium tracking-wider mb-2 sm:mb-3">// ONLINE RATE</div>
        <div className="text-green-400 text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-1">
          <AnimatedValue value={`${stats?.onlinePercentage.toFixed(1) || '0.0'}%`} />
        </div>
        <div className="text-white/40 text-[9px] sm:text-[10px] mb-2 sm:mb-3">
          <AnimatedValue value={stats?.onlineNodes || 0} /> of <AnimatedValue value={stats?.totalNodes || 0} /> nodes
        </div>
        
        {/* Online Status Bar Graph */}
        <div className="w-full px-1 sm:px-2 mt-1">
          <svg 
            className="w-full" 
            height="20" 
            viewBox="0 0 200 24" 
            preserveAspectRatio="none"
          >
            {Array.from({ length: totalBars }).map((_, index) => (
              <rect
                key={index}
                x={index * 4.5}
                y={0}
                width={3}
                height={24}
                rx={1}
                fill={index < greenBars ? '#10b981' : '#374151'}
              />
            ))}
          </svg>
          <div className="flex justify-between items-center mt-1 sm:mt-1.5">
            <span className="text-white/40 text-[8px] sm:text-[9px]">{stats?.offlineNodes} offline</span>
            <span className="text-green-400 text-[8px] sm:text-[9px] font-medium">{stats?.onlineNodes} online</span>
            <span className="text-white/40 text-[8px] sm:text-[9px]">{stats?.publicNodes} public</span>
          </div>
        </div>
      </div>
    </div>
  );
};
