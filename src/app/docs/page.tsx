import { DashboardLayout } from '@/components/layout';
import { DocsClient } from './DocsClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation - XanDash User Guide & API Reference',
  description: 'Complete XanDash documentation. Learn how to use the dashboard, understand metrics, and integrate with the API for Xandeum network monitoring.',
  keywords: ['XanDash docs', 'documentation', 'user guide', 'API reference', 'Xandeum guide', 'dashboard help'],
  openGraph: {
    title: 'Documentation - XanDash User Guide & API Reference',
    description: 'Complete XanDash documentation and user guide for Xandeum network monitoring.',
    url: 'https://www.xandash.online/docs',
  },
  alternates: {
    canonical: 'https://www.xandash.online/docs',
  },
};

export default function DocsPage() {
  return (
    <DashboardLayout>
      <DocsClient />
    </DashboardLayout>
  );
}
