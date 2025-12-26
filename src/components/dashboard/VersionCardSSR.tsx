import React from 'react';
import { Code, AlertCircle } from 'lucide-react';
import { VersionCardSkeleton } from './VersionCardSkeleton';
import { getVersionData, type VersionData } from '@/libs/server';

interface VersionCardSSRProps {
  initialData?: VersionData | null;
  initialError?: string;
}

// Server Component
async function VersionCardContent() {
  const { version, error } = await getVersionData();

  if (error) {
    return (
      <div className="relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300">
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



        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-6 animate-blur-reveal-item-1">
            <h3 className="text-white/60 text-sm font-medium">System Version</h3>
            <div className="text-red-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-2">
              <div className="text-white text-3xl font-bold">N/A</div>
              <div className="text-white/60 text-sm mt-1">Error Loading</div>
            </div>

            <div className="text-red-400 text-xs mt-4 p-2 bg-red-900/20 rounded">
              {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-black border border-white/10 p-6 h-full group hover:border-white/20 transition-all duration-300">
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



      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-6 animate-blur-reveal-item-1">
          <h3 className="text-white/60 text-sm font-medium">System Version</h3>
          <div className="text-green-400">
            <Code className="w-4 h-4" />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <div className="mb-2 animate-blur-reveal-item-2">
            <div className="text-white text-3xl font-bold">
              {version?.version || 'N/A'}
            </div>
            <div className="text-white/60 text-sm mt-1">Latest Release</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const VersionCardSSR: React.FC = () => {
  return (
    <React.Suspense fallback={<VersionCardSkeleton />}>
      <VersionCardContent />
    </React.Suspense>
  );
};