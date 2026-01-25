'use client';

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useNodesData } from '@/libs/context/nodes-data-context';
import { AnimatedValue } from '@/components/ui/SlotNumber';

interface PNodeVersionCardProps {
  className?: string;
}

// CornerAccents component defined outside render
const CornerAccents = () => (
  <>
    <div className="absolute top-0 left-0 w-4 h-4">
      <div className="absolute top-0 left-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
      <div className="absolute top-0 left-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
    </div>
    <div className="absolute top-0 right-0 w-4 h-4">
      <div className="absolute top-0 right-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
      <div className="absolute top-0 right-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
    </div>
    <div className="absolute bottom-0 left-0 w-4 h-4">
      <div className="absolute bottom-0 left-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
      <div className="absolute bottom-0 left-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
    </div>
    <div className="absolute bottom-0 right-0 w-4 h-4">
      <div className="absolute bottom-0 right-0 w-2 h-px bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
      <div className="absolute bottom-0 right-0 w-px h-2 bg-white/20 group-hover:bg-white group-hover:shadow-[0_0_8px_rgba(255,255,255,0.6)] transition-all duration-300"></div>
    </div>
  </>
);

export const PNodeVersionCard: React.FC<PNodeVersionCardProps> = ({ className = "" }) => {
  // Use shared nodes data context - single source of truth
  const { nodes, isLoading } = useNodesData();
  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Calculate version stats from shared nodes data
  const versionStats = useMemo(() => {
    if (nodes.length === 0) {
      return {
        totalVersions: 0,
        latestVersion: 'unknown',
        versionDistribution: [],
        totalNodes: 0,
      };
    }

    const versionCounts = new Map<string, number>();
    nodes.forEach(node => {
      const version = node.version || 'unknown';
      versionCounts.set(version, (versionCounts.get(version) || 0) + 1);
    });

    const totalNodes = nodes.length;
    const versionEntries = Array.from(versionCounts.entries());
    const sortedByCount = versionEntries.sort(([, a], [, b]) => b - a);
    const latestVersion = sortedByCount[0]?.[0] || 'unknown';

    const versionDistribution = sortedByCount.map(([version, count]) => ({
      version,
      count,
      percentage: (count / totalNodes) * 100,
      isLatest: version === latestVersion && version !== 'unknown',
    }));

    return {
      totalVersions: versionCounts.size,
      latestVersion,
      versionDistribution,
      totalNodes,
    };
  }, [nodes]);

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

  const [hoveredVersionData, setHoveredVersionData] = useState<{ version: string; count: number; percentage: number } | null>(null);

  const getVersionColor = (index: number) => {
    const colors = [
      '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#06b6d4', '#f97316', '#ec4899', '#84cc16',
    ];
    return colors[index % colors.length];
  };

  const renderRadialChart = () => {
    const totalSegments = 24;
    const segments = [];
    let segmentIndex = 0;

    for (let i = 0; i < versionStats.versionDistribution.length; i++) {
      const version = versionStats.versionDistribution[i];
      const segmentsForVersion = Math.round((version.percentage / 100) * totalSegments);

      for (let j = 0; j < segmentsForVersion && segmentIndex < totalSegments; j++) {
        segments.push({
          index: segmentIndex,
          color: getVersionColor(i),
          version: version.version,
          count: version.count,
          percentage: version.percentage
        });
        segmentIndex++;
      }
    }

    while (segmentIndex < totalSegments) {
      segments.push({ index: segmentIndex, color: '#1a1a1a', version: 'empty', count: 0, percentage: 0 });
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

            const isHovered = hoveredVersionData?.version === seg.version && seg.version !== 'empty';
            const isDimmed = hoveredVersionData && hoveredVersionData.version !== seg.version;

            return (
              <path
                key={i}
                d={`M ${x1} ${y1} L ${x2} ${y2} A ${outerRadius} ${outerRadius} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${innerRadius} ${innerRadius} 0 0 0 ${x1} ${y1}`}
                fill={seg.color}
                className="transition-all duration-300 cursor-pointer"
                style={{
                  opacity: isDimmed ? 0.3 : 1,
                  filter: isHovered ? `drop-shadow(0 0 4px ${seg.color})` : 'none',
                }}
                onMouseEnter={() => {
                  if (seg.version !== 'empty') {
                    setHoveredVersionData({
                      version: seg.version,
                      count: seg.count,
                      percentage: seg.percentage
                    });
                  }
                }}
                onMouseLeave={() => setHoveredVersionData(null)}
              />
            );
          })}
          <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            {hoveredVersionData ? (
              <>
                <div className="text-white text-sm font-bold font-mono truncate max-w-[80px]" title={hoveredVersionData.version}>
                  {hoveredVersionData.version.length > 8 ? hoveredVersionData.version.substring(0, 8) + '..' : hoveredVersionData.version}
                </div>
                <div className="text-white/60 text-[9px]">{hoveredVersionData.count} nodes</div>
                <div className="text-green-400 text-[9px]">{hoveredVersionData.percentage.toFixed(0)}%</div>
              </>
            ) : (
              <>
                <div className="text-white text-xl font-bold font-mono">{versionStats.totalVersions}</div>
                <div className="text-white/60 text-[9px]">versions</div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && nodes.length === 0) {
    return (
      <div className={`relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
        <CornerAccents />
        <div className="flex flex-col h-full text-center relative z-10">
          <div className="text-white/60 text-[10px] sm:text-xs font-medium tracking-wider mb-3 sm:mb-4 uppercase">pNode Versions</div>
          <div className="h-10 w-12 bg-white/10 rounded mb-2 mx-auto"></div>
          <div className="h-3 w-28 bg-white/10 rounded mx-auto"></div>
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
        <div className="flex flex-col h-full text-center relative z-10">
          <div className="text-white/60 text-[10px] sm:text-xs font-medium tracking-wider mb-3 sm:mb-4 uppercase">pNode Versions</div>
          <div className="text-white text-2xl sm:text-3xl lg:text-5xl font-bold font-mono mb-1 sm:mb-2">
            <AnimatedValue value={versionStats.totalVersions} />
          </div>
          <div className="text-white/40 text-[10px] sm:text-xs mb-1">unique versions</div>
          <div className="text-white/50 text-[9px] sm:text-[10px] hover:text-white/70 transition-colors cursor-pointer mt-auto">click for details</div>
        </div>
      </div>

      {/* Modal */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div
          className={`fixed inset-0 flex items-center justify-center p-3 transition-all duration-200 ease-out ${isClosing ? 'opacity-0' : 'opacity-100'}`}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.92)', zIndex: 99999 }}
          onClick={(e) => e.target === e.currentTarget && handleCloseModal()}
        >
          <div
            className={`relative w-[280px] overflow-hidden rounded-lg transition-all duration-200 ease-out ${isClosing ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0'}`}
            style={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255, 255, 255, 0.12)', maxHeight: 'calc(100vh - 24px)' }}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <h2 className="text-white text-[11px] font-bold font-mono">VERSIONS</h2>
              <button onClick={handleCloseModal} className="text-white/40 hover:text-white p-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center py-3">{renderRadialChart()}</div>

            <div className="px-2 pb-2 max-h-[140px] overflow-y-auto custom-scrollbar">
              {versionStats.versionDistribution.map((version, index) => (
                <div key={version.version} className="flex items-center py-1 hover:bg-white/5 rounded px-1">
                  <div className="flex items-center flex-1 min-w-0 mr-2">
                    <div className="w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0" style={{ backgroundColor: getVersionColor(index) }} />
                    <span className="text-white font-mono text-[10px] truncate" title={version.version}>
                      {version.version.length > 18 ? `${version.version.substring(0, 18)}...` : version.version}
                    </span>
                    {version.isLatest && <span className="text-green-400 text-[8px] ml-1 flex-shrink-0">Latest</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-green-400 font-mono text-[10px] font-semibold w-6 text-right">{version.count}</span>
                    <span className="text-white/40 font-mono text-[9px] w-9 text-right">{version.percentage.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-3 py-2 border-t border-white/10 bg-black/40">
              <div className="flex justify-between">
                <div>
                  <div className="text-white/40 text-[8px] uppercase">Total Nodes</div>
                  <div className="text-green-400 text-xs font-mono font-bold">{versionStats.totalNodes}</div>
                </div>
                <div className="text-right">
                  <div className="text-white/40 text-[8px] uppercase">Latest Version</div>
                  <div className="text-green-400 text-xs font-mono font-bold">{versionStats.latestVersion}</div>
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
      `}</style>
    </>
  );
};
