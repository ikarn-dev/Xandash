'use client';

import { useXandData } from './hooks/useXandData';
import {
  XandHeader,
  XandSentiment,
  XandAbout,
  XandMarketStats,
  XandPriceChanges,
  XandSupply,
  XandLinks,
  XandSkeleton,
  ClockIcon,
} from './components';

export function XandInfoClient() {
  const {
    data,
    loading,
    refreshing,
    error,
    cooldownRemaining,
    canRefresh,
    handleRefresh,
    retry,
  } = useXandData();

  if (loading) {
    return <XandSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-red-400 text-lg">{error || 'No data available'}</div>
        <button 
          onClick={retry} 
          className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <XandHeader 
        data={data} 
        refreshing={refreshing}
        canRefresh={canRefresh}
        cooldownRemaining={cooldownRemaining}
        onRefresh={handleRefresh}
      />
      
      <XandSentiment data={data} />
      
      <XandAbout data={data} />
      
      <XandMarketStats data={data} />
      
      <XandPriceChanges data={data} />
      
      <XandSupply data={data} />
      
      <XandLinks data={data} />

      {/* Last Updated */}
      <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
        <ClockIcon className="w-3 h-3" />
        Last updated: {new Date(data.last_updated).toLocaleString()}
      </div>
    </div>
  );
}
