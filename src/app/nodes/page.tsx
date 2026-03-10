import { DashboardLayout } from '@/components/layout';
import { getValidatorsData } from '@/libs/server';
import { NodesPageClient } from './NodesPageClient';
import { ProfileCacheService } from '@/libs/services/profile-cache';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'pNodes - Xandeum Network Validators | XanDash',
  description: 'Browse and monitor all Xandeum pNodes. Real-time status, uptime, storage, and performance metrics for devnet and mainnet validators.',
  keywords: ['Xandeum pNodes', 'validators', 'node list', 'network nodes', 'blockchain validators', 'node monitoring'],
  openGraph: {
    title: 'pNodes - Xandeum Network Validators',
    description: 'Browse and monitor all Xandeum pNodes with real-time status and performance metrics.',
    url: 'https://www.xandash.online/nodes',
  },
  alternates: {
    canonical: 'https://www.xandash.online/nodes',
  },
};

// Import the profile data function from the profile page
async function getProfileDataForCache(ip: string) {
  // This is a simplified version for caching - we'll import the full function
  try {
    const { callDirectRPC } = await import('@/libs/server');
    const { getNodeStatsHistory, getNodeEvents, getLatestNodeSnapshot } = await import('@/libs/db/node-service');
    
    // Simplified profile data fetching for cache
    const [currentNodeData, dbHistory] = await Promise.all([
      callDirectRPC('get-pods-with-stats').then(response => {
        if (!response.success || !response.data) return null;
        const nodes = (response.data as any)?.pods || [];
        return nodes.find((n: any) => n.address?.split(':')[0] === ip) || null;
      }).catch(() => null),
      getNodeStatsHistory(ip, 168).catch(() => []),
    ]);

    if (!currentNodeData && dbHistory.length === 0) return null;

    return {
      ip,
      currentNode: currentNodeData,
      dbHistory: dbHistory.length > 0 ? dbHistory : undefined,
    };
  } catch (error) {
    return null;
  }
}

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NodesPage() {
  // Fetch server-side data as an optimization — but don't block on errors.
  // The client component (NodesPageClient) fetches its own data via
  // nodes-data-context which correctly handles devnet/mainnet switching.
  let allValidators: Awaited<ReturnType<typeof getValidatorsData>>['validators'] = [];

  try {
    const result = await getValidatorsData();
    // Only use server data if we got nodes without errors
    if (!result.error && result.validators.length > 0) {
      allValidators = result.validators;
    }
  } catch {
    // Server-side fetch failed — client component will handle data loading
  }

  // Calculate initial stats on server (may be empty — client will update)
  const initialStats = {
    total: allValidators.length,
    online: allValidators.filter(v => v.status === 'online').length,
    public: allValidators.filter(v => v.is_public).length,
  };

  // Pre-load profile data for top nodes in the background (don't await)
  if (allValidators.length > 0) {
    const topNodeIps = allValidators
      .slice(0, 10)
      .map(v => v.address?.split(':')[0])
      .filter(ip => ip && ip !== '127.0.0.1');

    if (topNodeIps.length > 0) {
      ProfileCacheService.preloadProfilesServerSide(topNodeIps, getProfileDataForCache).catch(() => {
        // Silently handle pre-loading errors
      });
    }
  }

  return (
    <DashboardLayout>
      <NodesPageClient
        allValidators={allValidators}
        initialStats={initialStats}
        initialPagination={{
          currentPage: 1,
          totalPages: Math.ceil(allValidators.length / 25),
          hasNext: allValidators.length > 25,
          hasPrev: false,
          totalCount: allValidators.length,
        }}
      />
    </DashboardLayout>
  );
}
