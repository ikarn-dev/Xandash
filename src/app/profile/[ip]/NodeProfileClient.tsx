'use client';

import { useRouter } from 'next/navigation';
import { CaptchaGate } from '@/components/ui/CaptchaGate';
import { useNodeProfile } from './hooks';
import {
  NodeProfileData,
  ProfileHeader,
  ProfileStatsCards,
  ProfileLocationSection,
  ProfileChartsSection,
  ProfileEventsTable,
  ProfileSnapshotsTable,
  ProfileSkeleton
} from './components';

interface NodeProfileClientProps {
  ip: string;
  initialData?: NodeProfileData | null;
}

export function NodeProfileClient({ ip, initialData }: NodeProfileClientProps) {
  const router = useRouter();
  const {
    loading,
    error,
    data,
    node,
    location,
    timeRange,
    setTimeRange,
    lastUpdate,
    displayHistory,
    filteredDbHistoryLength,
    isShowingFallbackData,
    hasAnyData,
    fetchData
  } = useNodeProfile({ ip, initialData });

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-red-400 text-lg">{error}</div>
        <button 
          onClick={() => router.back()} 
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <CaptchaGate
      cacheKey="node-profile"
      title="// NODE_PROFILE_ACCESS"
      description="Verify to view node details and historical data."
    >
      <div className="space-y-3 sm:space-y-4 px-2 sm:px-0">
        {/* Header */}
        <ProfileHeader 
          ip={ip} 
          node={node || null} 
          lastUpdate={lastUpdate} 
          onRefresh={fetchData} 
        />

        {/* Map and Location */}
        <ProfileLocationSection location={location || null} node={node || null} />

        {/* Stats Cards */}
        <ProfileStatsCards node={node || null} />

        {/* Charts */}
        {(hasAnyData || node) && (
          <ProfileChartsSection
            displayHistory={displayHistory}
            node={node || null}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            filteredDbHistoryLength={filteredDbHistoryLength}
            isShowingFallbackData={isShowingFallbackData}
          />
        )}

        {/* Events Table */}
        <ProfileEventsTable events={data?.dbEvents || []} />

        {/* Snapshots Table */}
        {hasAnyData && (
          <ProfileSnapshotsTable 
            displayHistory={displayHistory} 
            isShowingFallbackData={isShowingFallbackData} 
          />
        )}
      </div>
    </CaptchaGate>
  );
}
