'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface StorageStats {
  totalStorage: number; // in bytes
  usedStorage: number; // in bytes
  usagePercentage: number;
}

interface PNodeStorageCardProps {
  className?: string;
}

export const PNodeStorageCard: React.FC<PNodeStorageCardProps> = ({ className = "" }) => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only show loading on initial load, not on refresh
        if (isInitialLoad) {
          setLoading(true);
        }
        const response = await fetch('/api/nodes?includeAll=true');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch nodes: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        const nodes = data.nodes || [];
        
        const totalStorage = nodes.reduce((sum: number, node: any) => 
          sum + (node.storage_committed || 0), 0
        );
        
        const usedStorage = nodes.reduce((sum: number, node: any) => 
          sum + (node.storage_used || 0), 0
        );
        
        const usagePercentage = totalStorage > 0 ? (usedStorage / totalStorage) * 100 : 0;
        
        setStats({
          totalStorage,
          usedStorage,
          usagePercentage
        });
        
      } catch (err) {
        console.error('Failed to fetch storage stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    };

    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [isInitialLoad]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
  };

  if (loading) {
    return (
      <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
        {/* Corner accents */}
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

        <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
          <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mb-3"></div>
          <div className="text-white/40 text-xs">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
        {/* Corner accents */}
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

        <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
          <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-red-400 text-xs">Error</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
      {/* All four corner edges with white glow on hover */}
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

      {/* Content */}
      <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
        <div className="text-white/50 text-[10px] sm:text-xs font-medium tracking-wider mb-2 sm:mb-4">// STORAGE USED</div>
        <div className="text-orange-400 text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-1 sm:mb-2">
          {stats ? formatBytes(stats.usedStorage) : '0 B'}
        </div>
        <div className="text-white/40 text-[10px] sm:text-xs">
          of {stats ? formatBytes(stats.totalStorage) : '0 B'}
        </div>
      </div>
    </div>
  );
};