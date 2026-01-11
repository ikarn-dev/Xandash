'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { NetworkStatsCardSkeleton } from './NetworkStatsCardSkeleton';
import { useNetwork } from '@/libs/context/network-context';

interface NetworkStatsData {
  packets_received: number;
  packets_sent: number;
  total_bytes: number;
  storage_committed: number;
  storage_used: number;
  avg_storage_per_pod: number;
  total_pods: number;
}

const formatStorage = (bytes: number) => {
  if (bytes === 0) return { value: '0', unit: 'B' };
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return {
    value: (bytes / Math.pow(k, i)).toFixed(2),
    unit: sizes[i]
  };
};

const formatNumber = (num: number) => num.toLocaleString();

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


const CornerEdges: React.FC = () => (
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


export const NetworkStatsCardSSR: React.FC = () => {
  const { network, isMainnet } = useNetwork();
  const [stats, setStats] = useState<NetworkStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use dedicated stats endpoints for accurate data directly from source APIs
        const statsEndpoint = isMainnet ? '/api/mainnet-stats' : '/api/devnet-stats';
        const statsRes = await fetch(statsEndpoint);
        
        if (!statsRes.ok) {
          throw new Error(`Failed to fetch ${network} stats`);
        }
        
        const statsData = await statsRes.json();
        
        setStats({
          packets_received: statsData.packets_received || 0,
          packets_sent: statsData.packets_sent || 0,
          total_bytes: statsData.total_bytes || 0,
          storage_committed: statsData.storage_committed || 0,
          storage_used: statsData.storage_used || 0,
          avg_storage_per_pod: statsData.avg_storage_per_pod || 0,
          total_pods: statsData.total_pods || 0,
        });
      } catch (err) {
        console.error('Failed to fetch network stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [network, isMainnet]);

  if (loading) {
    return <NetworkStatsCardSkeleton />;
  }

  if (error || !stats) {
    return (
      <div className="relative bg-black border border-white/10 p-6 h-full flex items-center justify-center group hover:border-white/20 transition-all duration-300">
        <CornerEdges />
        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load network stats</span>
        </div>
      </div>
    );
  }

  const storageCommitted = formatStorage(stats.storage_committed);
  const storageUsed = formatStorage(stats.storage_used);
  const avgPerPod = formatStorage(stats.avg_storage_per_pod);


  return (
    <div className="relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden">
      <CornerEdges />

      <div className="hidden lg:grid lg:grid-cols-4 gap-6 mb-4">
        <div className="text-white/80 text-sm font-medium animate-blur-reveal-item-1 text-center">Storage Committed</div>
        <div className="text-white/80 text-sm font-medium animate-blur-reveal-item-2 text-center">Storage Used</div>
        <div className="text-white/80 text-sm font-medium animate-blur-reveal-item-3 text-center">Avg Committed per Pod</div>
        <div className="text-white/80 text-sm font-medium animate-blur-reveal-item-4 text-center">Network Traffic</div>
      </div>

      <div className="relative mb-6 overflow-hidden hidden lg:block">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-beam shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 relative">
        <div className="absolute inset-0 hidden lg:grid lg:grid-cols-4 gap-6 pointer-events-none">
          <div></div>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-white/60 to-transparent animate-beam-vertical shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
          </div>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-white/60 to-transparent animate-beam-vertical shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{animationDelay: '0.7s'}}></div>
          </div>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-white/60 to-transparent animate-beam-vertical shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{animationDelay: '1.4s'}}></div>
          </div>
        </div>

        <div className="flex flex-col justify-center items-center animate-blur-reveal-item-1 relative z-10 text-center">
          <div className="text-white/80 text-xs sm:text-sm font-medium mb-2 lg:hidden">Storage Committed</div>
          <div className="text-white text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-1">{storageCommitted.value}</div>
          <div className="text-white/60 text-sm">{storageCommitted.unit}</div>
        </div>

        <div className="flex flex-col justify-center items-center animate-blur-reveal-item-2 relative z-10 text-center">
          <div className="text-white/80 text-xs sm:text-sm font-medium mb-2 lg:hidden">Storage Used</div>
          <div className="text-white text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-1">{storageUsed.value}</div>
          <div className="text-white/60 text-sm">{storageUsed.unit}</div>
        </div>

        <div className="flex flex-col justify-center items-center animate-blur-reveal-item-3 relative z-10 text-center">
          <div className="text-white/80 text-xs sm:text-sm font-medium mb-2 lg:hidden">Avg Committed per Pod</div>
          <div className="text-white text-xl sm:text-2xl lg:text-3xl font-bold font-mono mb-1">{avgPerPod.value}</div>
          <div className="text-white/60 text-sm">{avgPerPod.unit}</div>
        </div>

        <div className="flex flex-col justify-center items-center animate-blur-reveal-item-4 relative z-10">
          <div className="text-white/80 text-xs sm:text-sm font-medium mb-2 lg:hidden">Network Traffic</div>
          <div className="space-y-1 sm:space-y-2 w-full">
            <div className="flex items-center justify-center">
              <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4 text-white mr-1 sm:mr-2 flex-shrink-0" />
              <span className="text-white text-sm sm:text-lg font-bold font-mono">{formatNumber(stats.packets_sent)}</span>
              <span className="text-white/70 text-xs sm:text-sm font-normal ml-1 sm:ml-2">sent</span>
            </div>
            <div className="flex items-center justify-center">
              <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4 text-white mr-1 sm:mr-2 flex-shrink-0" />
              <span className="text-white text-sm sm:text-lg font-bold font-mono">{formatNumber(stats.packets_received)}</span>
              <span className="text-white/70 text-xs sm:text-sm font-normal ml-1 sm:ml-2">recv</span>
            </div>
          </div>
          <div className="text-white/60 text-xs mt-2 sm:mt-3 text-center">{formatBytes(stats.total_bytes)} total</div>
        </div>
      </div>
    </div>
  );
};
