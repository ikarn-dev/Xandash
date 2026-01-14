'use client';

import React from 'react';
import { AlertCircle, Crown } from 'lucide-react';
import { usePodCredits } from '@/libs/hooks/usePodCredits';
import { useNetwork } from '@/libs/context/network-context';

interface LeaderboardTopPodCardProps {
  className?: string;
  network?: 'devnet' | 'mainnet';
}

export const LeaderboardTopPodCard: React.FC<LeaderboardTopPodCardProps> = ({ 
  className = "", 
  network: networkProp
}) => {
  const { network: globalNetwork } = useNetwork();
  const network = networkProp || globalNetwork;
  const { data: creditsData, isLoading, error } = usePodCredits(network);

  const stats = React.useMemo(() => {
    if (!creditsData?.data || creditsData.data.length === 0) return null;
    
    const sorted = [...creditsData.data].sort((a, b) => b.credits - a.credits);
    const topPod = sorted[0];
    const totalCredits = creditsData.data.reduce((sum, pod) => sum + pod.credits, 0);
    const topPercentage = totalCredits > 0 ? (topPod.credits / totalCredits) * 100 : 0;
    
    return { 
      topPod, 
      topPercentage,
      totalPods: creditsData.data.length 
    };
  }, [creditsData]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
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

  if (isLoading) {
    return (
      <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
        <CornerAccents />
        <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
          <div className="h-3 w-28 bg-white/10 rounded mb-3"></div>
          <div className="h-8 w-20 bg-white/10 rounded mb-2"></div>
          <div className="h-3 w-24 bg-white/10 rounded"></div>
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
      
      <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
        <div className="text-white/50 text-xs font-medium tracking-wider mb-3">// TOP POD ({network.toUpperCase()})</div>
        <div className="flex items-center gap-2 mb-1">
          <Crown className="w-5 h-5 text-amber-400" />
          <div className="text-amber-400 text-3xl lg:text-4xl font-bold font-mono">
            {stats ? formatNumber(stats.topPod.credits) : '0'}
          </div>
        </div>
        <div className="text-white/40 text-[10px] mb-3">
          {stats?.topPercentage.toFixed(1)}% of total credits
        </div>
        
        {/* Top Pod Bar */}
        <div className="w-full px-2 mt-1">
          <svg className="w-full" height="24" viewBox="0 0 200 24" preserveAspectRatio="none">
            {Array.from({ length: 45 }).map((_, index) => {
              const fillPercent = stats ? Math.round((stats.topPercentage / 100) * 45) : 0;
              return (
                <rect
                  key={index}
                  x={index * 4.5}
                  y={0}
                  width={3}
                  height={24}
                  rx={1}
                  fill={index < fillPercent ? '#f59e0b' : '#374151'}
                />
              );
            })}
          </svg>
          <div className="flex justify-center items-center mt-1.5">
            <span className="text-amber-400 text-[9px] font-medium font-mono truncate max-w-full">
              {stats?.topPod.pod_id.slice(0, 8)}...{stats?.topPod.pod_id.slice(-4)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
