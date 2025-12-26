import React from 'react';
import { AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { NetworkStatsCardSkeleton } from './NetworkStatsCardSkeleton';
import { getNetworkStatsData, type NetworkStatsData } from '@/libs/server';

// Helper functions for formatting
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const formatNumber = (num: number) => {
  return num.toLocaleString();
};

const formatPercentage = (used: number, total: number) => {
  return ((used / total) * 100).toFixed(1);
};

const formatSlotTime = (index: number) => {
  // Assuming each slot is ~0.4 seconds based on the image
  return (index * 0.4).toFixed(2);
};

// Server Component
async function NetworkStatsCardContent() {
  const { stats, error } = await getNetworkStatsData();

  if (error) {
    return (
      <div className="relative bg-black border border-white/10 p-6 h-full flex items-center justify-center group hover:border-white/20 transition-all duration-300">
        {/* All four corner edges with white glow on hover */}
        {/* Top-left corner */}
        <div className="absolute top-0 left-0 w-6 h-6">
          <div className="absolute top-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute top-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>
        
        {/* Top-right corner */}
        <div className="absolute top-0 right-0 w-6 h-6">
          <div className="absolute top-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute top-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>
        
        {/* Bottom-left corner */}
        <div className="absolute bottom-0 left-0 w-6 h-6">
          <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute bottom-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>
        
        {/* Bottom-right corner */}
        <div className="absolute bottom-0 right-0 w-6 h-6">
          <div className="absolute bottom-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute bottom-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>



        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Failed to load network stats</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return <NetworkStatsCardSkeleton />;
  }

  const ramUsagePercent = formatPercentage(stats.ram_used, stats.ram_total);
  const cpuPercent = stats.cpu_percent.toFixed(1);

  return (
    <div className="relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden">
      {/* All four corner edges with white glow on hover */}
      {/* Top-left corner */}
      <div className="absolute top-0 left-0 w-6 h-6">
        <div className="absolute top-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute top-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>
      
      {/* Top-right corner */}
      <div className="absolute top-0 right-0 w-6 h-6">
        <div className="absolute top-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute top-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>
      
      {/* Bottom-left corner */}
      <div className="absolute bottom-0 left-0 w-6 h-6">
        <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute bottom-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>
      
      {/* Bottom-right corner */}
      <div className="absolute bottom-0 right-0 w-6 h-6">
        <div className="absolute bottom-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        <div className="absolute bottom-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
      </div>



      {/* Titles Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
        <div className="text-white/80 text-sm font-medium animate-blur-reveal-item-1 text-center">
          Block Index
        </div>
        <div className="text-white/80 text-sm font-medium animate-blur-reveal-item-2 text-center">
          Network Traffic
        </div>
        <div className="flex items-center justify-center space-x-1 text-white/80 text-sm font-medium animate-blur-reveal-item-3">
          <span>Memory Usage</span>
        </div>
        <div className="text-white/80 text-sm font-medium animate-blur-reveal-item-4 text-center">
          System Status
        </div>
      </div>

      {/* Animated Separator Lines */}
      <div className="relative mb-6 overflow-hidden">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-beam shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
        </div>
      </div>

      {/* Stats Content */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 relative">
        
        {/* Vertical Separators - Only Animated Beams */}
        <div className="absolute inset-0 grid grid-cols-2 lg:grid-cols-4 gap-6 pointer-events-none">
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

        {/* Block Index */}
        <div className="flex flex-col justify-center items-center animate-blur-reveal-item-1 relative z-10 text-center">
          <div className="text-white text-2xl lg:text-3xl font-bold font-mono mb-1">
            {formatNumber(stats.current_index)}
          </div>
          <div className="text-white/60 text-xs">
            {stats.total_pages} pages • {formatBytes(stats.file_size)} total
          </div>
        </div>

        {/* Network Traffic */}
        <div className="flex flex-col justify-center items-center animate-blur-reveal-item-2 relative z-10">
          <div className="space-y-2 w-full">
            <div className="flex items-center justify-center">
              <ArrowUp className="w-4 h-4 text-white mr-2 flex-shrink-0" />
              <span className="text-white text-lg font-bold font-mono">
                {formatNumber(stats.packets_sent)}
              </span>
              <span className="text-white/70 text-sm font-normal ml-2">sent</span>
            </div>
            <div className="flex items-center justify-center">
              <ArrowDown className="w-4 h-4 text-white mr-2 flex-shrink-0" />
              <span className="text-white text-lg font-bold font-mono">
                {formatNumber(stats.packets_received)}
              </span>
              <span className="text-white/70 text-sm font-normal ml-2">received</span>
            </div>
          </div>
          <div className="text-white/60 text-xs mt-3 text-center">
            packets • {formatBytes(stats.total_bytes)} data
          </div>
        </div>

        {/* Memory Usage */}
        <div className="flex flex-col justify-center items-center animate-blur-reveal-item-3 relative z-10">
          <div className="flex items-center justify-center space-x-2 mb-2 w-full">
            <div className="text-white text-2xl lg:text-3xl font-bold font-mono">
              {ramUsagePercent}%
            </div>
            <div className="w-16 bg-black/30 border border-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300" 
                style={{ width: `${ramUsagePercent}%` }}
              ></div>
            </div>
          </div>
          <div className="text-white/60 text-xs text-center">
            {formatBytes(stats.ram_used)} / {formatBytes(stats.ram_total)}
          </div>
        </div>

        {/* System Status */}
        <div className="flex flex-col justify-center items-center animate-blur-reveal-item-4 relative z-10 text-center">
          <div className="space-y-1">
            <div className="text-white text-lg font-bold font-mono">
              CPU: {cpuPercent}%
            </div>
            <div className="text-white/80 text-sm">
              Uptime: {formatUptime(stats.uptime)}
            </div>
            <div className="text-white/70 text-xs">
              {stats.active_streams} active streams
            </div>
            <div className="text-white/60 text-xs">
              Last updated: {new Date(stats.last_updated * 1000).toLocaleTimeString()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export const NetworkStatsCardSSR: React.FC = () => {
  return (
    <React.Suspense fallback={<NetworkStatsCardSkeleton />}>
      <NetworkStatsCardContent />
    </React.Suspense>
  );
};