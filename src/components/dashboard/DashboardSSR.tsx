import React from 'react';
import { VersionCardSSR } from './VersionCardSSR';
import { NetworkStatsCardSSR } from './NetworkStatsCardSSR';
import { GeoLocationCard, CombinedTokenCard, DashboardNodesCard } from './';
import { VersionCardSkeleton } from './VersionCardSkeleton';
import { NetworkStatsCardSkeleton } from './NetworkStatsCardSkeleton';

import { DashboardInteractive } from './DashboardInteractive';

// Server Component
export const DashboardSSR: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Search Box - Top of dashboard */}
      <div className="animate-blur-reveal">
        <DashboardInteractive />
      </div>

      {/* Top Row - Version Card and Network Stats with SSR */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0 animate-blur-reveal-1">
          <VersionCardSSR />
        </div>
        <div className="flex-1 animate-blur-reveal-2">
          <NetworkStatsCardSSR />
        </div>
      </div>

      {/* Combined Token Details */}
      <div className="w-full animate-blur-reveal-3">
        <CombinedTokenCard />
      </div>

      {/* Main Row - Full width map */}
      <div className="w-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] animate-blur-reveal-4">
        <GeoLocationCard />
      </div>

      {/* pNodes Card - Below map */}
      <div className="w-full animate-blur-reveal-card animate-blur-reveal-card-1">
        <DashboardNodesCard />
      </div>
    </div>
  );
};

// Skeleton for the entire dashboard
export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Search Box Skeleton */}
      <div className="w-full h-12 bg-gray-700/50 rounded-lg animate-pulse"></div>

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
      <div className="w-full h-48 bg-gray-700/50 rounded-xl animate-pulse"></div>

      {/* Map Skeleton */}
      <div className="w-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] bg-gray-700/50 rounded-xl animate-pulse"></div>

      {/* pNodes Card Skeleton */}
      <div className="w-full h-96 bg-gray-700/50 rounded-xl animate-pulse"></div>
    </div>
  );
};