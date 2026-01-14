import React from 'react';
import { VersionCardSSR } from './VersionCardSSR';
import { NetworkStatsCardSSR } from './NetworkStatsCardSSR';
import { GeoLocationCard, CombinedTokenCard, DashboardNodesCard } from './';
import { VersionCardSkeleton } from './VersionCardSkeleton';
import { NetworkStatsCardSkeleton } from './NetworkStatsCardSkeleton';

import { DashboardInteractive } from './DashboardInteractive';

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

      {/* Combined Token Details */}
      <div className="w-full">
        <CombinedTokenCard />
      </div>

      {/* Main Row - Full width map */}
      <div className="w-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px]">
        <GeoLocationCard />
      </div>

      {/* pNodes Card - Below map */}
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

      {/* Combined Token Details Skeleton */}
      <div className="w-full h-48 bg-white/5 rounded-xl border border-white/10"></div>

      {/* Map Skeleton */}
      <div className="w-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] bg-white/5 rounded-xl border border-white/10"></div>

      {/* pNodes Card Skeleton */}
      <div className="w-full h-96 bg-white/5 rounded-xl border border-white/10"></div>
    </div>
  );
};