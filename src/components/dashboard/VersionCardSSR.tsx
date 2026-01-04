import React from 'react';
import { AlertCircle } from 'lucide-react';
import { VersionCardSkeleton } from './VersionCardSkeleton';
import { callDirectRPC } from '@/libs/server';

// Custom Code Icon
const CodeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

interface VersionStats {
  latestVersion: string;
  nodeCount: number;
  percentage: number;
  totalNodes: number;
  totalVersions: number;
}

// Server Component - fetches node data to find most popular version
async function VersionCardContent() {
  let stats: VersionStats | null = null;
  let error: string | null = null;

  try {
    const rpcResponse = await callDirectRPC('get-pods-with-stats');
    
    if (!rpcResponse.success || !rpcResponse.data) {
      throw new Error('Failed to fetch nodes');
    }

    const nodes = (rpcResponse.data as any)?.pods || [];
    
    if (nodes.length === 0) {
      throw new Error('No nodes found');
    }

    // Count versions
    const versionCounts = new Map<string, number>();
    nodes.forEach((node: any) => {
      const version = node.version || 'unknown';
      versionCounts.set(version, (versionCounts.get(version) || 0) + 1);
    });

    // Find most popular version (highest count)
    let maxCount = 0;
    let latestVersion = 'unknown';
    versionCounts.forEach((count, version) => {
      if (count > maxCount && version !== 'unknown') {
        maxCount = count;
        latestVersion = version;
      }
    });

    const totalNodes = nodes.length;
    const percentage = (maxCount / totalNodes) * 100;

    stats = {
      latestVersion,
      nodeCount: maxCount,
      percentage,
      totalNodes,
      totalVersions: versionCounts.size,
    };
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load version data';
  }

  if (error || !stats) {
    return (
      <div className="relative bg-black border border-white/10 p-4 sm:p-6 h-full group hover:border-white/20 transition-all duration-300">
        {/* Corner accents */}
        <CornerAccents />

        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-white/50 text-[10px] sm:text-xs font-medium tracking-wider">// VERSION</h3>
            <div className="text-red-400">
              <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold font-mono">N/A</div>
            <div className="text-white/40 text-[10px] sm:text-xs mt-1 sm:mt-2">Error Loading</div>
            <div className="text-red-400/60 text-[9px] sm:text-[10px] mt-2 sm:mt-3 px-2">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-black border border-white/10 p-4 sm:p-6 h-full group hover:border-white/20 transition-all duration-300">
      {/* Corner accents */}
      <CornerAccents />

      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
          <h3 className="text-white/50 text-[10px] sm:text-xs font-medium tracking-wider">// POPULAR VERSION</h3>
          <div className="text-green-400">
            <CodeIcon className="w-3 h-3 sm:w-4 sm:h-4" />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Version number - large and prominent */}
          <div className="text-center sm:text-left">
            <div className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-mono leading-none">
              v{stats.latestVersion}
            </div>
            
            {/* Stats row */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-2 sm:mt-3">
              <div className="flex items-center justify-center sm:justify-start gap-1.5">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-green-400 text-xs sm:text-sm font-mono font-semibold">
                  {stats.nodeCount} nodes
                </span>
              </div>
              <span className="text-white/30 text-[10px] sm:text-xs font-mono">
                ({stats.percentage.toFixed(1)}% of network)
              </span>
            </div>
          </div>

          {/* Footer info */}
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/5">
            <div className="flex justify-between items-center text-[9px] sm:text-[10px] text-white/30">
              <span>{stats.totalVersions} versions total</span>
              <span>{stats.totalNodes} nodes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Corner accents component
const CornerAccents = () => (
  <>
    <div className="absolute top-0 left-0 w-4 sm:w-6 h-4 sm:h-6">
      <div className="absolute top-0 left-0 w-2 sm:w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      <div className="absolute top-0 left-0 w-0.5 h-2 sm:h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
    </div>
    <div className="absolute top-0 right-0 w-4 sm:w-6 h-4 sm:h-6">
      <div className="absolute top-0 right-0 w-2 sm:w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      <div className="absolute top-0 right-0 w-0.5 h-2 sm:h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
    </div>
    <div className="absolute bottom-0 left-0 w-4 sm:w-6 h-4 sm:h-6">
      <div className="absolute bottom-0 left-0 w-2 sm:w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      <div className="absolute bottom-0 left-0 w-0.5 h-2 sm:h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
    </div>
    <div className="absolute bottom-0 right-0 w-4 sm:w-6 h-4 sm:h-6">
      <div className="absolute bottom-0 right-0 w-2 sm:w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      <div className="absolute bottom-0 right-0 w-0.5 h-2 sm:h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
    </div>
  </>
);

export const VersionCardSSR: React.FC = () => {
  return (
    <React.Suspense fallback={<VersionCardSkeleton />}>
      <VersionCardContent />
    </React.Suspense>
  );
};