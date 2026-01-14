import { DashboardLayout } from '@/components/layout';
import { GovernanceClient } from './GovernanceClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Governance - Xandeum Network Proposals & Voting | XanDash',
  description: 'Track Xandeum governance proposals, treasury balance, and voting statistics. Monitor decentralized decision-making and community participation.',
  keywords: ['Xandeum governance', 'proposals', 'voting', 'treasury', 'DAO', 'decentralized governance'],
  openGraph: {
    title: 'Governance - Xandeum Network Proposals & Voting',
    description: 'Track Xandeum governance proposals, treasury balance, and voting statistics.',
    url: 'https://www.xandash.online/governance',
  },
  alternates: {
    canonical: 'https://www.xandash.online/governance',
  },
};

export default function GovernancePage() {
  return (
    <DashboardLayout>
      <GovernanceClient />
    </DashboardLayout>
  );
}
