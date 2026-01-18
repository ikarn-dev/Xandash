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

const GeoLocationCard = dynamic(
  () => import('./GeoLocationCard').then(mod => ({ default: mod.GeoLocationCard })),
  {
    loading: () => (
      <div className="w-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] bg-white/5 rounded-xl border border-white/10 animate-pulse flex items-center justify-center">
        <span className="text-white/30 text-sm">Loading map...</span>
      </div>
    ),
    ssr: false
  }
);

const CombinedTokenCard = dynamic(
  () => import('./CombinedTokenCard').then(mod => ({ default: mod.CombinedTokenCard })),
  {
    loading: () => (
      <div className="w-full h-48 bg-white/5 rounded-xl border border-white/10 animate-pulse" />
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
      <div className="w-full h-96 bg-white/5 rounded-xl border border-white/10 animate-pulse" />
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
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <VersionCardSSR />
        </div>
        <div className="flex-1">
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

// Skeleton for the entire dashboard - static, no animations
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Search Box Skeleton */}
      <div className="w-full h-12 bg-white/5 rounded-lg border border-white/10"></div>

      {/* Top Row Skeletons */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <VersionCardSkeleton />
        </div>
        <div className="flex-1">
          <NetworkStatsCardSkeleton />
        </div>
      </div>

      {/* Distribution Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-white/5 rounded-xl border border-white/10"></div>
        <div className="h-64 bg-white/5 rounded-xl border border-white/10"></div>
      </div>

      {/* Combined Token Details Skeleton */}
      <div className="w-full h-48 bg-white/5 rounded-xl border border-white/10"></div>

      {/* Map Skeleton */}
      <div className="w-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] bg-white/5 rounded-xl border border-white/10"></div>

      {/* Governance Stats Skeleton */}
      <div className="w-full">
        <GovernanceStatsCardSkeleton />
      </div>

      {/* pNodes Card Skeleton */}
      <div className="w-full h-96 bg-white/5 rounded-xl border border-white/10"></div>
    </div>
  );
};