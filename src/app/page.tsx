import React from 'react';
import { DashboardSSR, DashboardSkeleton } from '@/components/dashboard';
import { DashboardLayout } from '@/components/layout';

export default function Home() {
  return (
    <DashboardLayout>
      <React.Suspense fallback={<DashboardSkeleton />}>
        <DashboardSSR />
      </React.Suspense>
    </DashboardLayout>
  );
}
