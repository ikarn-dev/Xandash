import { DashboardLayout } from '@/components/layout';
import { getValidatorsData } from '@/libs/server';
import { NodesPageClient } from './NodesPageClient';

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
