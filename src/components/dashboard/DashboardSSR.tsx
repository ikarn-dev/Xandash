'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { VersionCardSSR } from './VersionCardSSR';
import { NetworkStatsCardSSR } from './NetworkStatsCardSSR';
import { VersionDistributionCard, RegionDistributionCard, GovernanceStatsCardSkeleton } from './';
import { VersionCardSkeleton } from './VersionCardSkeleton';
import { NetworkStatsCardSkeleton } from './NetworkStatsCardSkeleton';

import { DashboardInteractive } from './DashboardInteractive';

// Lazy load heavy below-fold components to reduce initial bundle size
// These components are loaded on-demand, improving First Paint and LCP
// LCP Optimization: Use higher priority for above-the-fold components

const GeoLocationCard = dynamic(
  () => import('./GeoLocationCard').then(mod => ({ default: mod.GeoLocationCard })),
  {
    loading: () => (
      <div className="bg-gray-900/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg h-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] flex flex-col relative overflow-hidden">
        {/* Stats Overlay Skeleton - Top Left */}
        <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-50 space-y-2 sm:space-y-3 bg-black/40 backdrop-blur-sm rounded-lg p-2 sm:p-3">
          <div className="text-left">
            <div className="h-8 w-16 bg-white/10 rounded mb-1"></div>
            <div className="h-3 w-12 bg-white/10 rounded"></div>
          </div>
          <div className="text-left">
            <div className="h-6 w-12 bg-white/10 rounded mb-1"></div>
            <div className="h-3 w-16 bg-white/10 rounded"></div>
          </div>
        </div>

        {/* Live indicator Skeleton - Top Right */}
        <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-50 flex items-center space-x-1 sm:space-x-2 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1 sm:px-3 sm:py-2">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/30 rounded-full"></div>
          <div className="h-3 w-8 bg-white/10 rounded"></div>
        </div>

        {/* Country Stats Skeleton - Bottom Left */}
        <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 z-50 bg-black/40 backdrop-blur-sm rounded-lg p-2 sm:p-3">
          <div className="h-3 w-24 bg-white/10 rounded mb-2"></div>
          <div className="space-y-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-3 bg-white/10 rounded"></div>
                  <div className="h-3 w-16 bg-white/10 rounded"></div>
                </div>
                <div className="h-4 w-8 bg-white/10 rounded-full ml-2"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Map Skeleton Background */}
        <div className="absolute inset-0 z-0 bg-gray-800/50"></div>
      </div>
    ),
    ssr: false
  }
);

const CombinedTokenCard = dynamic(
  () => import('./CombinedTokenCard').then(mod => ({ default: mod.CombinedTokenCard })),
  {
    loading: () => (
      <div className="relative bg-black/80 border border-white/10 p-3 group hover:border-white/20 transition-all duration-300">
        {/* All four corner edges */}
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

        <div>
          <div className="h-4 bg-white/10 rounded mb-3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-2">
                <div className="h-8 bg-white/10 rounded"></div>
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-white/10 rounded"></div>
                <div className="w-full h-1 bg-white/10 rounded-full"></div>
              </div>
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center py-2">
                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                    <div className="h-4 bg-white/10 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="w-full h-64 lg:h-96 bg-white/10 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    ),
    ssr: false
  }
);

const GovernanceStatsCard = dynamic(
  () => import('./GovernanceStatsCard').then(mod => ({ default: mod.GovernanceStatsCard })),
  {
    loading: () => <GovernanceStatsCardSkeleton />,
    ssr: false
  }
);

const DashboardNodesCard = dynamic(
  () => import('./DashboardNodesCard').then(mod => ({ default: mod.DashboardNodesCard })),
  {
    loading: () => (
      <div className="relative bg-black border border-white/10 p-4 sm:p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden">
        {/* Corner edges */}
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

        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-5 w-28 bg-white/10 rounded"></div>
            <div className="h-5 w-16 bg-white/10 rounded-full"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-white/10 rounded-lg"></div>
            <div className="h-8 w-20 bg-white/10 rounded-lg"></div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-black border border-white/10 rounded-lg overflow-hidden">
          <div className="bg-white/5 border-b border-white/10 px-3 py-3">
            <div className="flex space-x-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-3 w-16 bg-white/10 rounded"></div>
              ))}
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="px-3 py-3 flex space-x-4">
                <div className="h-4 w-4 bg-white/10 rounded"></div>
                <div className="h-4 w-24 bg-white/10 rounded"></div>
                <div className="h-4 w-20 bg-white/10 rounded"></div>
                <div className="h-4 w-28 bg-white/10 rounded"></div>
                <div className="h-4 w-12 bg-white/10 rounded"></div>
                <div className="h-4 w-16 bg-white/10 rounded"></div>
                <div className="h-4 w-14 bg-white/10 rounded"></div>
                <div className="h-4 w-12 bg-white/10 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    ssr: false
  }
);

// Server Component - No loading animations, just static render
export const DashboardSSR: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Search Box - Top of dashboard */}
      <div>
        <DashboardInteractive />
      </div>

      {/* Top Row - Version Card and Network Stats with SSR */}
      <div className="flex flex-col lg:flex-row lg:items-stretch gap-6">
        <div className="lg:w-64 flex-shrink-0 h-full">
          <VersionCardSSR />
        </div>
        <div className="flex-1 h-full">
          <NetworkStatsCardSSR />
        </div>
      </div>

      {/* Distribution Cards Row - Version and Region */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VersionDistributionCard />
        <RegionDistributionCard />
      </div>

      {/* Combined Token Details */}
      <div className="w-full">
        <CombinedTokenCard />
      </div>

      {/* Main Row - Full width map */}
      <div className="w-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
        <GeoLocationCard />
      </div>

      {/* Governance Stats - Below map */}
      <div className="w-full">
        <GovernanceStatsCard />
      </div>

      {/* pNodes Card - Below governance */}
      <div className="w-full">
        <DashboardNodesCard />
      </div>
    </div>
  );
};

// Skeleton for the entire dashboard - static, no animations for faster mobile performance
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Search Box Skeleton */}
      <div className="w-full h-12 bg-white/5 rounded-lg border border-white/10"></div>

      {/* Top Row Skeletons */}
      <div className="flex flex-col lg:flex-row lg:items-stretch gap-6">
        <div className="lg:w-64 flex-shrink-0 h-full">
          <VersionCardSkeleton />
        </div>
        <div className="flex-1 h-full">
          <NetworkStatsCardSkeleton />
        </div>
      </div>

      {/* Distribution Cards Skeleton - Match actual flexible height */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="relative bg-black/80 border border-white/10 p-3 group flex flex-col min-h-[320px] sm:min-h-[340px]">
          {/* Version Distribution Card Skeleton */}
          <div className="h-3 w-28 bg-white/10 rounded mb-2"></div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-white/5"></div>
          </div>
          <div className="grid grid-cols-4 gap-1 mt-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-3 bg-white/5 rounded"></div>
            ))}
          </div>
        </div>
        <div className="relative bg-black/80 border border-white/10 p-4 group hover:border-white/20 transition-all duration-300 min-h-[320px] sm:min-h-[340px]">
          {/* Region Distribution Card Skeleton */}
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 w-32 bg-white/10 rounded"></div>
            <div className="h-3 w-16 bg-white/10 rounded"></div>
          </div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-5 bg-white/5 rounded" style={{ width: `${100 - i * 12}%` }}></div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-white/10 flex justify-between items-center">
            <div className="h-2 w-20 bg-white/10 rounded"></div>
            <div className="h-2 w-16 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>

      {/* Combined Token Details Skeleton - Match actual complex layout */}
      <div className="relative bg-black/80 border border-white/10 p-3 group hover:border-white/20 transition-all duration-300">
        <div>
          <div className="h-4 bg-white/10 rounded mb-3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-2">
                <div className="h-8 bg-white/10 rounded"></div>
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-white/10 rounded"></div>
                <div className="w-full h-1 bg-white/10 rounded-full"></div>
              </div>
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center py-2">
                    <div className="h-4 bg-white/10 rounded w-1/2"></div>
                    <div className="h-4 bg-white/10 rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-3">
              <div className="w-full h-64 lg:h-96 bg-white/10 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Skeleton - Match exact responsive dimensions */}
      <div className="w-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] bg-white/5 rounded-xl border border-white/10"></div>

      {/* Governance Stats Skeleton - Use actual skeleton component */}
      <div className="w-full">
        <GovernanceStatsCardSkeleton />
      </div>

      {/* pNodes Card Skeleton - Match actual complex table layout */}
      <div className="relative bg-black border border-white/10 p-4 sm:p-6 h-full group hover:border-white/20 transition-all duration-300 overflow-hidden">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="h-5 w-28 bg-white/10 rounded"></div>
            <div className="h-5 w-16 bg-white/10 rounded-full"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-white/10 rounded-lg"></div>
            <div className="h-8 w-20 bg-white/10 rounded-lg"></div>
          </div>
        </div>
        {/* Table Skeleton */}
        <div className="bg-black border border-white/10 rounded-lg overflow-hidden">
          <div className="bg-white/5 border-b border-white/10 px-3 py-3">
            <div className="flex space-x-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-3 w-16 bg-white/10 rounded"></div>
              ))}
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="px-3 py-3 flex space-x-4">
                <div className="h-4 w-4 bg-white/10 rounded"></div>
                <div className="h-4 w-24 bg-white/10 rounded"></div>
                <div className="h-4 w-20 bg-white/10 rounded"></div>
                <div className="h-4 w-28 bg-white/10 rounded"></div>
                <div className="h-4 w-12 bg-white/10 rounded"></div>
                <div className="h-4 w-16 bg-white/10 rounded"></div>
                <div className="h-4 w-14 bg-white/10 rounded"></div>
                <div className="h-4 w-12 bg-white/10 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};