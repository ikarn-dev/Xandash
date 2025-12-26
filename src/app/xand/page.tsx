import { DashboardLayout } from '@/components/layout';
import { XandInfoClient } from './XandInfoClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function XandPage() {
  return (
    <DashboardLayout>
      <XandInfoClient />
    </DashboardLayout>
  );
}
