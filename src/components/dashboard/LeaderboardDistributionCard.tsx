'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';
import { usePodCredits } from '@/libs/hooks/usePodCredits';

interface LeaderboardDistributionCardProps {
  className?: string;
}

interface TierStats {
  name: string;
  count: number;
  percentage: number;
  color: string;
  minCredits: number;
}

export const LeaderboardDistributionCard: React.FC<LeaderboardDistributionCardProps> = ({ className = "" }) => {
  const { data: creditsData, isLoading, error } = usePodCredits();
  const [showModal, setShowModal] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
    }, 200);
  };

  const stats = React.useMemo(() => {
    if (!creditsData?.data) return null;
    
    const credits = creditsData.data.map(pod => pod.credits);
    const total = credits.length;
    
    const tiers: TierStats[] = [
      { name: 'Diamond', count: credits.filter(c => c >= 50000).length, percentage: 0, color: '#60a5fa', minCredits: 50000 },
      { name: 'Platinum', count: credits.filter(c => c >= 25000 && c < 50000).length, percentage: 0, color: '#a78bfa', minCredits: 25000 },
      { name: 'Gold', count: credits.filter(c => c >= 10000 && c < 25000).length, percentage: 0, color: '#fbbf24', minCredits: 10000 },
      { name: 'Silver', count: credits.filter(c => c >= 5000 && c < 10000).length, percentage: 0, color: '#9ca3af', minCredits: 5000 },
      { name: 'Bronze', count: credits.filter(c => c < 5000).length, percentage: 0, color: '#f97316', minCredits: 0 },
    ];
    
    tiers.forEach(tier => {
      tier.percentage = total > 0 ? (tier.count / total) * 100 : 0;
    });
    
    return { tiers, total };
  }, [creditsData]);

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
          <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mb-3"></div>
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

  const topTier = stats?.tiers.find(t => t.count > 0);

  return (
    <>
      <div 
        className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden cursor-pointer ${className}`}
        onClick={() => setShowModal(true)}
      >
        <CornerAccents />
        
        <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
          <div className="text-white/50 text-xs font-medium tracking-wider mb-3">// DISTRIBUTION</div>
          <div className="text-purple-400 text-4xl lg:text-5xl font-bold font-mono mb-1">
            {stats?.tiers.filter(t => t.count > 0).length || 0}
          </div>
          <div className="text-white/40 text-[10px] mb-3">
            active tiers
          </div>
          
          {/* Tier Distribution Bar */}
          <div className="w-full px-2 mt-1">
            <svg className="w-full" height="24" viewBox="0 0 200 24" preserveAspectRatio="none">
              {(() => {
                let xOffset = 0;
                return stats?.tiers.map((tier, index) => {
                  const barCount = Math.max(1, Math.round((tier.percentage / 100) * 45));
                  const bars = Array.from({ length: barCount }).map((_, i) => (
                    <rect
                      key={`${tier.name}-${i}`}
                      x={xOffset + i * 4.5}
                      y={0}
                      width={3}
                      height={24}
                      rx={1}
                      fill={tier.count > 0 ? tier.color : '#374151'}
                    />
                  ));
                  xOffset += barCount * 4.5;
                  return bars;
                });
              })()}
            </svg>
            <div className="flex justify-center items-center mt-1.5">
              <span className="text-purple-400 text-[9px] font-medium">click for details</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div 
          className={`fixed inset-0 flex items-center justify-center transition-all duration-200 ease-out ${isClosing ? 'opacity-0' : 'opacity-100'}`}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)', zIndex: 99999 }}
          onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
        >
          <div 
            className={`relative w-[280px] overflow-hidden rounded-lg transition-all duration-200 ease-out ${
              isClosing ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0'
            }`}
            style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255, 255, 255, 0.12)' }}
          >
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10">
              <h2 className="text-white text-xs font-bold font-mono">TIER DISTRIBUTION</h2>
              <button onClick={handleCloseModal} className="text-white/40 hover:text-white p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-3 py-3">
              {stats?.tiers.map((tier) => (
                <div key={tier.name} className="flex items-center py-2 hover:bg-white/5 rounded px-1">
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: tier.color }} />
                    <span className="text-white font-mono text-[11px]">{tier.name}</span>
                    <span className="text-white/40 text-[9px] ml-1.5">({tier.minCredits.toLocaleString()}+)</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono text-[11px] font-semibold w-8 text-right" style={{ color: tier.color }}>
                      {tier.count}
                    </span>
                    <span className="text-white/40 font-mono text-[10px] w-12 text-right">
                      {tier.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-3 py-2.5 border-t border-white/10 bg-black/40">
              <div className="flex justify-between">
                <div>
                  <div className="text-white/40 text-[9px] uppercase">Total Pods</div>
                  <div className="text-purple-400 text-sm font-mono font-bold">{stats?.total}</div>
                </div>
                <div className="text-right">
                  <div className="text-white/40 text-[9px] uppercase">Top Tier</div>
                  <div className="text-purple-400 text-sm font-mono font-bold">{topTier?.name || 'N/A'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
