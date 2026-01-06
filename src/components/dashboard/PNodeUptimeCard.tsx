'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { useNetwork } from '@/libs/context/network-context';
import { AnimatedValue } from '@/components/ui/SlotNumber';

interface UptimeStats {
  averageUptime: number;
  uniqueVersions: number;
  maxUptime: number;
  totalNodes: number;
  onlineNodes: number;
  uptimePercentage: number;
  uptimeBars: number[]; // Array of percentages for each bar
}

interface PNodeUptimeCardProps {
  className?: string;
}

export const PNodeUptimeCard: React.FC<PNodeUptimeCardProps> = ({ className = "" }) => {
  const { network } = useNetwork();
  const [stats, setStats] = useState<UptimeStats | null>(null);
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
        
        const uptimes = nodes.map((node: any) => node.uptime || 0);
        const totalUptime = uptimes.reduce((sum: number, uptime: number) => sum + uptime, 0);
        const averageUptime = nodes.length > 0 ? totalUptime / nodes.length : 0;
        
        const uniqueVersions = new Set(
          nodes.map((node: any) => node.version).filter(Boolean)
        ).size;
        
        const maxUptime = Math.max(...uptimes, 0);
        
        // Calculate online nodes
        const onlineNodes = nodes.filter((node: any) => {
          const timeDiff = now - (node.last_seen_timestamp || now);
          // Simplified status logic - only last seen matters
          return timeDiff < 1800; // Less than 30 minutes = online
        }).length;
        
        const uptimePercentage = nodes.length > 0 ? (onlineNodes / nodes.length) * 100 : 0;
        
        // Generate uptime bars (simulating historical data based on current uptime distribution)
        // Group nodes by uptime ranges and create visual representation
        const barCount = 30;
        const uptimeBars: number[] = [];
        
        // Sort nodes by uptime and create bars showing uptime health
        const sortedUptimes = [...uptimes].sort((a, b) => a - b);
        const chunkSize = Math.ceil(sortedUptimes.length / barCount);
        
        for (let i = 0; i < barCount; i++) {
          const startIdx = i * chunkSize;
          const endIdx = Math.min(startIdx + chunkSize, sortedUptimes.length);
          const chunk = sortedUptimes.slice(startIdx, endIdx);
          
          if (chunk.length > 0) {
            // Calculate average uptime for this chunk as percentage of max
            const chunkAvg = chunk.reduce((a, b) => a + b, 0) / chunk.length;
            const barHeight = maxUptime > 0 ? (chunkAvg / maxUptime) * 100 : 0;
            // Ensure minimum visibility and cap at 100
            uptimeBars.push(Math.min(100, Math.max(20, barHeight)));
          } else {
            uptimeBars.push(20);
          }
        }
        
        setStats({
          averageUptime,
          uniqueVersions,
          maxUptime,
          totalNodes: nodes.length,
          onlineNodes,
          uptimePercentage,
          uptimeBars
        });
        
      } catch (err) {
        console.error('Failed to fetch uptime stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
        hasLoadedRef.current = true;
        // Delay removing updating state for smooth animation
        setTimeout(() => setIsUpdating(false), 300);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [network]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d`;
    return `${hours}h`;
  };

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
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-3"></div>
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

  return (
    <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
      <CornerAccents />
      
      {/* Content */}
      <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
        <div className="text-white/50 text-[10px] sm:text-xs font-medium tracking-wider mb-2 sm:mb-3">// AVG UPTIME</div>
        <div className="text-blue-400 text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-1">
          <AnimatedValue value={stats ? formatUptime(stats.averageUptime) : '0h'} />
        </div>
        <div className="text-white/40 text-[9px] sm:text-[10px] mb-2 sm:mb-3">
          <AnimatedValue value={`${stats?.uptimePercentage.toFixed(1) || '0.0'}%`} /> online
        </div>
        
        {/* Uptime Bar Graph - SVG based like statuspage */}
        <div className="w-full px-1 sm:px-2 mt-1 sm:mt-2">
          <svg 
            className="w-full" 
            height="20" 
            viewBox="0 0 200 24" 
            preserveAspectRatio="none"
          >
            {Array.from({ length: 45 }).map((_, index) => {
              // Calculate color based on uptime data
              const uptimeValue = stats?.uptimeBars?.[index % (stats?.uptimeBars?.length || 1)] || 80;
              const isGood = uptimeValue > 50;
              
              return (
                <rect
                  key={index}
                  x={index * 4.5}
                  y={0}
                  width={3}
                  height={24}
                  rx={1}
                  fill={isGood ? '#10b981' : '#374151'}
                />
              );
            })}
          </svg>
          <div className="flex justify-center items-center mt-1 sm:mt-1.5">
            <span className="text-green-400 text-[8px] sm:text-[9px] font-medium">{stats?.uptimePercentage.toFixed(1)}% uptime</span>
          </div>
        </div>
      </div>
    </div>
  );
};
