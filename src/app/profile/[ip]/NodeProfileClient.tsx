'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { CaptchaGate } from '@/components/ui/CaptchaGate';
import { AISummary } from '@/components/ui/AISummary';
import { NodeNotFound } from '@/components/ui/NodeNotFound';
import { useNodeProfile } from './hooks';
import { useNetwork } from '@/libs/context/network-context';
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
  const { network, isMainnet } = useNetwork();
  
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

  // Generate AI summary prompt - includes node details in simple terms
  const aiSummaryPrompt = useMemo(() => {
    if (!node) return '';
    
    const formatStorageAI = (bytes: number) => {
      if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
      if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
      if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)}KB`;
      return `${bytes}B`;
    };
    
    const uptimeDays = (node.uptime / 86400).toFixed(1);
    const storageCommitted = formatStorageAI(node.storage_committed);
    const storageUsed = formatStorageAI(node.storage_used);
    const efficiency = node.storage_committed > 0 
      ? ((node.storage_used / node.storage_committed) * 100).toFixed(1) 
      : '0';
    
    // Credits breakdown
    const totalCredits = node.totalCredits || node.credits || 0;
    const thisMonthCredits = node.thisMonthCredits || node.credits || 0;
    const previousMonthCredits = node.previousMonthCredits || 0;
    
    let creditsInfo = `Total: ${totalCredits.toLocaleString()}`;
    if (previousMonthCredits > 0) {
      creditsInfo += `, This Month: ${thisMonthCredits.toLocaleString()}, Previous Month: ${previousMonthCredits.toLocaleString()}`;
    }
    
    const networkName = isMainnet ? 'Mainnet' : 'Devnet';
    
    return `Summarize this ${networkName} pNode data in 1-2 simple sentences. Just state the facts, do NOT provide any recommendations or suggestions. Data: IP=${ip}, Status=${node.status}, Uptime=${uptimeDays} days, Credits: ${creditsInfo}, Storage=${storageCommitted} committed (${storageUsed} used, ${efficiency}% utilization), Version=${node.version || 'N/A'}${location ? `, Location=${location.city}, ${location.country}` : ''}.`;
  }, [node, ip, location, isMainnet]);

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return <NodeNotFound ip={ip} onRetry={fetchData} />;
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
        <ProfileStatsCards 
          node={node || null} 
          network={network}
        />

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
            liveCredits={data?.liveCredits}
          />
        )}

        {/* AI Summary - Above Events */}
        {node && aiSummaryPrompt && (
          <AISummary 
            prompt={aiSummaryPrompt}
            title="AI Analysis"
            autoLoad={true}
            network={isMainnet ? 'mainnet' : 'devnet'}
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
