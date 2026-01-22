'use client';

import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout';
import { ComparePageContent } from './ComparePageContent';

interface NodeData {
  pubkey: string;
  address: string;
  credits?: number;
  uptime?: number;
  storage_committed?: number;
  storage_used?: number;
  version?: string;
  last_seen_timestamp?: number;
  country_code?: string;
  manager_pubkey?: string;
  score?: number;
}

interface NodeProfile {
  ip: string;
  pubkey: string;
  color: string;
  status: string;
  uptime: number;
  credits: number;
  storage_committed: number;
  storage_used: number;
  version: string;
  location?: { country: string; city: string; provider: string };
  history?: Array<{ timestamp: number; credits: number; uptime: number; storage_committed: number; storage_used: number }>;
  manager_pubkey?: string;
  score: number;
}

interface CountryData {
  country: string;
  country_code: string;
  totalNodes: number;
  onlineNodes: number;
  syncingNodes: number;
  offlineNodes: number;
  totalStorage: number;
  totalStorageUsed: number;
  avgUptime: number;
  totalCredits: number;
}

interface CountryProfile extends CountryData {
  color: string;
  onlinePercent: number;
  storageEfficiency: number;
}

const NODE_COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b'];
const COUNTRY_COLORS = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b'];

// Icons for feature cards
const NodesIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);

const CountriesIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
    <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
    <path d="M20 12a8 8 0 0 1-4 6.9 8 8 0 0 1-8 0" opacity="0.5" />
  </svg>
);

function ComparePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-black border border-white/10 p-6 rounded animate-pulse" />
        <div className="bg-black border border-white/10 p-6 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<ComparePageSkeleton />}>
        <ComparePageContent />
      </Suspense>
    </DashboardLayout>
  );
}
