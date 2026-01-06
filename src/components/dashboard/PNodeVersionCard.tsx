'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, X } from 'lucide-react';
import { useNetwork } from '@/libs/context/network-context';
import { AnimatedValue } from '@/components/ui/SlotNumber';

interface VersionStats {
  totalVersions: number;
  latestVersion: string;
  versionDistribution: Array<{
    version: string;
    count: number;
    percentage: number;
    isLatest: boolean;
  }>;
  totalNodes: number;
}

interface PNodeVersionCardProps {
  className?: string;
}

export const PNodeVersionCard: React.FC<PNodeVersionCardProps> = ({ className = "" }) => {
  const { network } = useNetwork();
  const [stats, setStats] = useState<VersionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Use ref to track if data has been loaded (survives re-renders and interval callbacks)
  const hasLoadedRef = useRef(false);
  const prevNetworkRef = useRef(network);

  const handleCloseModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
    }, 200);
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

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
        
        // Count versions
        const versionCounts = new Map<string, number>();
        nodes.forEach((node: any) => {
          const version = node.version || 'unknown';
          versionCounts.set(version, (versionCounts.get(version) || 0) + 1);
        });
        
        const totalNodes = nodes.length;
        const versionEntries = Array.from(versionCounts.entries());
        
        // Sort by count (highest first) - Latest = most nodes
        const sortedByCount = versionEntries.sort(([, a], [, b]) => b - a);
        const latestVersion = sortedByCount[0]?.[0] || 'unknown';
        
        const versionDistribution = sortedByCount.map(([version, count]) => ({
          version,
          count,
          percentage: (count / totalNodes) * 100,
          isLatest: version === latestVersion && version !== 'unknown',
        }));
        
        setStats({
          totalVersions: versionCounts.size,
          latestVersion,
          versionDistribution,
          totalNodes
        });
        
      } catch (err) {
        console.error('Failed to fetch version stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
        hasLoadedRef.current = true;
        // Add small delay before removing updating state for smooth transition
        setTimeout(() => setIsUpdating(false), 300);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [network]);

  const getVersionColor = (index: number) => {
    const colors = [
      '#10b981', // green (latest/most)
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#f97316', // orange
      '#ec4899', // pink
      '#84cc16', // lime
    ];
    return colors[index % colors.length];
  };

  // Render radial segments chart
  const renderRadialChart = () => {
    if (!stats) return null;
    
    const totalSegments = 24;
    const segments = [];
    let segmentIndex = 0;
    
    for (let i = 0; i < stats.versionDistribution.length; i++) {
      const version = stats.versionDistribution[i];
      const segmentsForVersion = Math.round((version.percentage / 100) * totalSegments);
      
      for (let j = 0; j < segmentsForVersion && segmentIndex < totalSegments; j++) {
        segments.push({
          index: segmentIndex,
          color: getVersionColor(i),
          version: version.version
        });
        segmentIndex++;
      }
    }
    
    // Fill remaining segments with last color if any
    while (segmentIndex < totalSegments) {
      segments.push({
        index: segmentIndex,
        color: '#1a1a1a',
        version: 'empty'
      });
      segmentIndex++;
    }
    
    return (
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {segments.map((seg, i) => {
            const angle = (i / totalSegments) * 360 - 90;
            const nextAngle = ((i + 1) / totalSegments) * 360 - 90;
            const gap = 3;
            
            const innerRadius = 32;
            const outerRadius = 46;
            
            const startAngle = (angle + gap / 2) * (Math.PI / 180);
            const endAngle = (nextAngle - gap / 2) * (Math.PI / 180);
            
            const x1 = 50 + innerRadius * Math.cos(startAngle);
            const y1 = 50 + innerRadius * Math.sin(startAngle);
            const x2 = 50 + outerRadius * Math.cos(startAngle);
            const y2 = 50 + outerRadius * Math.sin(startAngle);
            const x3 = 50 + outerRadius * Math.cos(endAngle);
            const y3 = 50 + outerRadius * Math.sin(endAngle);
            const x4 = 50 + innerRadius * Math.cos(endAngle);
            const y4 = 50 + innerRadius * Math.sin(endAngle);
            
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 0 0 ${x1} ${y1}`}
                fill={seg.color}
                className="transition-all duration-300"
              />
            );
          })}
          {/* Inner circle border */}
          <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-xl font-bold font-mono">{stats?.totalVersions}</div>
            <div className="text-white/40 text-[9px]">versions</div>
          </div>
        </div>
      </div>
    );
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
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-3"></div>
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
    <>
      <div 
        className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden cursor-pointer ${className}`}
        onClick={handleOpenModal}
      >
        <CornerAccents />
        <div className="flex flex-col justify-center items-center h-full text-center relative z-10">
          <div className="text-white/50 text-[10px] sm:text-xs font-medium tracking-wider mb-2 sm:mb-4">// VERSIONS</div>
          <div className="text-white text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-1 sm:mb-2">
            <AnimatedValue value={stats?.totalVersions || '0'} />
          </div>
          <div className="text-white/40 text-[10px] sm:text-xs mb-1">versions</div>
          <div className="text-white/30 text-[9px] sm:text-[10px] hover:text-white/50 transition-colors cursor-pointer">click for details</div>
        </div>
      </div>

      {/* Modal */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div 
          className={`fixed inset-0 flex items-center justify-center p-3 transition-all duration-200 ease-out ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)', zIndex: 99999 }}
          onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
        >
          <div 
            className={`relative w-[280px] overflow-hidden rounded-lg transition-all duration-200 ease-out ${
              isClosing 
                ? 'opacity-0 scale-95 translate-y-2' 
                : 'opacity-100 scale-100 translate-y-0'
            }`}
            style={{ 
              backgroundColor: '#0a0a0a', 
              border: '1px solid rgba(255, 255, 255, 0.12)',
              animation: isClosing ? 'none' : 'modalSlideIn 0.25s ease-out',
              maxHeight: 'calc(100vh - 24px)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <h2 className="text-white text-[11px] font-bold font-mono">VERSIONS</h2>
              <button onClick={handleCloseModal} className="text-white/40 hover:text-white p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Radial Chart */}
            <div className="flex justify-center py-3">
              {renderRadialChart()}
            </div>

            {/* Version List */}
            <div className="px-2 pb-2 max-h-[140px] overflow-y-auto custom-scrollbar">
              {stats?.versionDistribution.map((version, index) => (
                <div key={version.version} className="flex items-center py-1 hover:bg-white/5 rounded px-1">
                  <div className="flex items-center flex-1 min-w-0 mr-2">
                    <div 
                      className="w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0"
                      style={{ backgroundColor: getVersionColor(index) }}
                    />
                    <span className="text-white font-mono text-[10px] truncate" title={version.version}>
                      {version.version.length > 18 ? `${version.version.substring(0, 18)}...` : version.version}
                    </span>
                    {version.isLatest && (
                      <span className="text-green-400 text-[8px] ml-1 flex-shrink-0">Latest</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-green-400 font-mono text-[10px] font-semibold w-6 text-right">
                      {version.count}
                    </span>
                    <span className="text-white/40 font-mono text-[9px] w-9 text-right">
                      {version.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 border-t border-white/10 bg-black/40">
              <div className="flex justify-between">
                <div>
                  <div className="text-white/40 text-[8px] uppercase">Total Nodes</div>
                  <div className="text-green-400 text-xs font-mono font-bold">{stats?.totalNodes}</div>
                </div>
                <div className="text-right">
                  <div className="text-white/40 text-[8px] uppercase">Latest Version</div>
                  <div className="text-green-400 text-xs font-mono font-bold">{stats?.latestVersion}</div>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
        
        @keyframes modalSlideIn {
          0% {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes backdropFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>
    </>
  );
};
