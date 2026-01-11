'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { CaptchaGate } from '@/components/ui/CaptchaGate';
import { AISummary } from '@/components/ui/AISummary';
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

  // Generate AI summary prompt - includes node details + feedback with proper units
  const aiSummaryPrompt = useMemo(() => {
    if (!node) return '';
    
    const formatStorageAI = (bytes: number) => {
      if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
      if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
      if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)}KB`;
      return `${bytes}B`;
    };
    
    const uptimeDays = (node.uptime / 86400).toFixed(1);
    const uptimeHours = (node.uptime / 3600).toFixed(0);
    const storageCommitted = formatStorageAI(node.storage_committed);
    const storageUsed = formatStorageAI(node.storage_used);
    const efficiency = node.storage_committed > 0 
      ? ((node.storage_used / node.storage_committed) * 100).toFixed(1) 
      : '0';
    
    return `Summarize this node in format: "Node [IP] is [status] with [uptime]d uptime, [credits] credits earned, [storage] committed ([used] used, [efficiency]% utilized). [One sentence assessment and recommendation]." Data: IP=${ip}, Status=${node.status}, Uptime=${uptimeDays}d (${uptimeHours}h), Credits=${node.credits?.toLocaleString() || 0}, Storage Committed=${storageCommitted}, Storage Used=${storageUsed} (${efficiency}% efficiency), Version=${node.version || 'N/A'}${location ? `, Location=${location.city}, ${location.country}` : ''}.`;
  }, [node, ip, location]);

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
            ip={ip}
          />
        )}

        {/* AI Summary - Above Events */}
        {node && aiSummaryPrompt && (
          <AISummary 
            prompt={aiSummaryPrompt}
            title="AI Analysis"
            autoLoad={true}
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
