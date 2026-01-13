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
    
    // Include live credits information
    let creditsInfo = '';
    const liveCredits = data?.liveCredits;
    const nodeCredits = node.credits || 0;
    
    if (liveCredits && node.pubkey) {
      const liveEntry = liveCredits.find((c: any) => c.pod_id === node.pubkey);
      const liveCreditsValue = liveEntry?.credits || 0;
      
      if (liveCreditsValue > 0 && liveCreditsValue !== nodeCredits) {
        creditsInfo = ` (Live: ${liveCreditsValue.toLocaleString()}, Historical: ${nodeCredits.toLocaleString()})`;
      }
    }
    
    const networkName = isMainnet ? 'Mainnet' : 'Devnet';
    
    return `Summarize this ${networkName} node in format: "Node [IP] on ${networkName} is [status] with [uptime]d uptime, [credits] credits earned${creditsInfo ? ' [live/historical info]' : ''}, [storage] committed ([used] used, [efficiency]% utilized). [One sentence assessment and recommendation]." Data: Network=${networkName}, IP=${ip}, Status=${node.status}, Uptime=${uptimeDays}d (${uptimeHours}h), Credits=${nodeCredits.toLocaleString()}${creditsInfo}, Storage Committed=${storageCommitted}, Storage Used=${storageUsed} (${efficiency}% efficiency), Version=${node.version || 'N/A'}${location ? `, Location=${location.city}, ${location.country}` : ''}.`;
  }, [node, ip, location, data?.liveCredits, isMainnet]);

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
