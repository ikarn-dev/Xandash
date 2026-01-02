import { DashboardLayout } from '@/components/layout';
import { getValidatorsData } from '@/libs/server';
import { NodesPageClient } from './NodesPageClient';
import { ProfileCacheService } from '@/libs/services/profile-cache';

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
    console.error(`[CACHE] Error fetching profile data for ${ip}:`, error);
    return null;
  }
}

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NodesPage() {
  const { validators: allValidators, error } = await getValidatorsData();

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-400">Error loading pNodes: {error}</div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate initial stats on server
  const initialStats = {
    total: allValidators.length,
    online: allValidators.filter(v => v.status === 'online').length,
    public: allValidators.filter(v => v.is_public).length,
  };

  // Pre-load profile data for top nodes in the background (don't await)
  const topNodeIps = allValidators
    .slice(0, 10) // Top 10 nodes to avoid timeout
    .map(v => v.address?.split(':')[0])
    .filter(ip => ip && ip !== '127.0.0.1');
  
  // Fire and forget - pre-load profiles in background using server-side function
  if (topNodeIps.length > 0) {
    ProfileCacheService.preloadProfilesServerSide(topNodeIps, getProfileDataForCache).catch(() => {
      // Silently handle pre-loading errors
    });
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
