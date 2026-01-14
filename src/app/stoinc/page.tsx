import { DashboardLayout } from '@/components/layout';
import { StoincCalculatorClient } from './StoincCalculatorClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'STOINC Calculator - Storage Incentive Program | XanDash',
  description: 'Calculate Xandeum STOINC rewards. Estimate earnings from the storage incentive program based on your pNode storage contribution.',
  keywords: ['STOINC', 'storage incentive', 'rewards calculator', 'pNode earnings', 'Xandeum rewards'],
  openGraph: {
    title: 'STOINC Calculator - Storage Incentive Program',
    description: 'Calculate Xandeum STOINC rewards and estimate pNode earnings.',
    url: 'https://www.xandash.online/stoinc',
  },
  alternates: {
    canonical: 'https://www.xandash.online/stoinc',
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function StoincPage() {
  return (
    <DashboardLayout>
      <StoincCalculatorClient />
    </DashboardLayout>
  );
}
