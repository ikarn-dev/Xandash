import { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout';
import { DocsClient } from './DocsClient';

export const metadata: Metadata = {
  title: 'Documentation - XanDash',
  description: 'XanDash documentation and user guide for the Xandeum network dashboard',
};

export default function DocsPage() {
  return (
    <DashboardLayout>
      <DocsClient />
    </DashboardLayout>
  );
}
