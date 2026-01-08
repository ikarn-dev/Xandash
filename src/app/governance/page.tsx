import { DashboardLayout } from '@/components/layout';
import { GovernanceClient } from './GovernanceClient';

export default function GovernancePage() {
  return (
    <DashboardLayout>
      <GovernanceClient />
    </DashboardLayout>
  );
}
