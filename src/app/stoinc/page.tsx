import { DashboardLayout } from '@/components/layout';
import { StoincCalculatorClient } from './StoincCalculatorClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function StoincPage() {
  return (
    <DashboardLayout>
      <StoincCalculatorClient />
    </DashboardLayout>
  );
}
