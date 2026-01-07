import React from 'react';
import { DashboardSSR, DashboardSkeleton } from '@/components/dashboard';
import { DashboardLayout } from '@/components/layout';
import { Marquee } from '@/components/ui/Marquee';

export default function Home() {
  return (
    <DashboardLayout>
      <Marquee className="mb-4 sm:mb-6" />
      <React.Suspense fallback={<DashboardSkeleton />}>
        <DashboardSSR />
      </React.Suspense>
    </DashboardLayout>
  );
}
