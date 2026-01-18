'use client';

import React from 'react';
import { Server, Globe } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { useEndpointTests } from './hooks';
import { useEndpointMonitoring } from './hooks/useEndpointMonitoring';
import { useRpcStatusUpdates } from './hooks/useRpcStatusUpdates';
import {
  EndpointCategory,
  EndpointHeader,
  EndpointStatsCards,
  EndpointControls,
  EndpointCategorySection,
  UptimeGraph
} from './components';
import { CornerAccents } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';

const endpoints: EndpointCategory[] = [
  {
    category: 'RPC Methods',
    description: 'Mainnet private RPC methods for node communication',
    icon: <Server className="w-4 h-4 sm:w-5 sm:h-5" />,
    methods: [
      { name: 'get-version', description: 'Get system version information', endpoint: '/api/rpc' },
      { name: 'get-stats', description: 'Get node statistics and metrics', endpoint: '/api/rpc' },
      { name: 'get-pods', description: 'Get list of active pods', endpoint: '/api/rpc' },
      { name: 'get-pods-with-stats', description: 'Get pods with detailed statistics', endpoint: '/api/rpc' }
    ]
  },
  {
    category: 'Pod Credits API',
    description: 'Pod credits and leaderboard data',
    icon: <Globe className="w-4 h-4 sm:w-5 sm:h-5" />,
    methods: [
      {
        name: 'pod-credits',
        description: 'Get pod credits data for leaderboard',
        endpoint: '/api/pod-credits'
      }
    ]
  },
];

function EndpointsPageContent() {
  const {
    testResults,
    testing,
    individualTesting,
    cooldowns,
    copyingStates,
    expandedResults,
    isPending,
    stats,
    getCooldownRemaining,
    testSingleMethod,
    testAllMethods,
    clearResults,
    copyResult,
    clearIndividualResult,
    toggleExpanded
  } = useEndpointTests(endpoints);

  // API Status Monitoring
  const {
    devnetEndpoints,
    mainnetEndpoints,
    loading: statusLoading,
    error: statusError,
    lastUpdate,
    refreshEndpoints
  } = useEndpointMonitoring();

  // Subscribe to real-time RPC status updates
  useRpcStatusUpdates();

  // State to track calculated uptimes
  const [calculatedUptimes, setCalculatedUptimes] = React.useState<Record<string, number>>({});

  // State to track last refresh time for session-based timing (persisted)
  const [lastRefreshTime, setLastRefreshTime] = React.useState<Date | null>(null);
  const [sessionTimer, setSessionTimer] = React.useState<string>('');

  // Load last refresh time from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('endpoints-last-refresh');
      if (stored) {
        const storedTime = new Date(stored);
        // Only use stored time if it's within the last 24 hours
        const now = new Date();
        const diffHours = (now.getTime() - storedTime.getTime()) / (1000 * 60 * 60);
        if (diffHours < 24) {
          setLastRefreshTime(storedTime);
        }
      }
    }
  }, []);

  const handleUptimeCalculated = React.useCallback((endpointName: string, uptime: number) => {
    setCalculatedUptimes(prev => {
      // Only update if the value has actually changed to prevent unnecessary re-renders
      if (prev[endpointName] === uptime) {
        return prev;
      }
      return {
        ...prev,
        [endpointName]: uptime
      };
    });
  }, []);

  // Get specific endpoints for uptime graphs
  const pNodeDevnet = devnetEndpoints.find(e =>
    e.name.includes('pNode Devnet') ||
    e.name.includes('Devnet Storage') ||
    e.name.includes('Pod Credits Devnet')
  );
  const pNodeMainnet = mainnetEndpoints.find(e =>
    e.name.includes('pNode Mainnet') ||
    e.name.includes('Mainnet RPC') ||
    e.name.includes('Pod Credits Mainnet')
  );

  // Create stable callback functions for each endpoint
  const handleDevnetUptimeCalculated = React.useCallback((uptime: number) => {
    if (pNodeDevnet) {
      handleUptimeCalculated(pNodeDevnet.name, uptime);
    }
  }, [pNodeDevnet?.name, handleUptimeCalculated]);

  const handleMainnetUptimeCalculated = React.useCallback((uptime: number) => {
    if (pNodeMainnet) {
      handleUptimeCalculated(pNodeMainnet.name, uptime);
    }
  }, [pNodeMainnet?.name, handleUptimeCalculated]);

  // Handle refresh button click
  const handleRefreshClick = React.useCallback(() => {
    const now = new Date();
    setLastRefreshTime(now);
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('endpoints-last-refresh', now.toISOString());
    }
    refreshEndpoints();
  }, [refreshEndpoints]);

  // Update session timer every second
  React.useEffect(() => {
    if (!lastRefreshTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diffMs = now.getTime() - lastRefreshTime.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);

      if (diffSeconds < 60) {
        setSessionTimer(diffSeconds === 0 ? 'just now' : `${diffSeconds}s ago`);
      } else if (diffMinutes < 60) {
        setSessionTimer(`${diffMinutes}m ago`);
      } else {
        setSessionTimer(`${diffHours}h ago`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastRefreshTime]);

  const formatLastUpdate = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  };


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
        <CornerAccents />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-2 sm:space-y-4 relative z-10">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white/90 font-mono">
              // <span className="text-white">ENDPOINTS</span>
            </h1>
            <div className="flex items-center space-x-2 text-white/60">
              <span className="text-xs sm:text-sm">›</span>
              <span className="text-xs sm:text-sm">API endpoint testing and monitoring with real-time status</span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            {lastRefreshTime && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <div className="text-right">
                  <div className="text-white text-[10px] sm:text-xs">{sessionTimer}</div>
                </div>
              </div>
            )}
            <button
              onClick={handleRefreshClick}
              disabled={statusLoading}
              className="relative group flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-black border border-white/20 hover:border-emerald-400/50 text-white/80 hover:text-emerald-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-xs sm:text-sm overflow-hidden"
            >
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-2 h-2">
                <div className="absolute top-0 left-0 w-1 h-px bg-white/20 group-hover:bg-emerald-400 group-hover:shadow-[0_0_4px_rgba(16,185,129,0.6)] transition-all duration-300" />
                <div className="absolute top-0 left-0 w-px h-1 bg-white/20 group-hover:bg-emerald-400 group-hover:shadow-[0_0_4px_rgba(16,185,129,0.6)] transition-all duration-300" />
              </div>
              <div className="absolute top-0 right-0 w-2 h-2">
                <div className="absolute top-0 right-0 w-1 h-px bg-white/20 group-hover:bg-emerald-400 group-hover:shadow-[0_0_4px_rgba(16,185,129,0.6)] transition-all duration-300" />
                <div className="absolute top-0 right-0 w-px h-1 bg-white/20 group-hover:bg-emerald-400 group-hover:shadow-[0_0_4px_rgba(16,185,129,0.6)] transition-all duration-300" />
              </div>
              <div className="absolute bottom-0 left-0 w-2 h-2">
                <div className="absolute bottom-0 left-0 w-1 h-px bg-white/20 group-hover:bg-emerald-400 group-hover:shadow-[0_0_4px_rgba(16,185,129,0.6)] transition-all duration-300" />
                <div className="absolute bottom-0 left-0 w-px h-1 bg-white/20 group-hover:bg-emerald-400 group-hover:shadow-[0_0_4px_rgba(16,185,129,0.6)] transition-all duration-300" />
              </div>
              <div className="absolute bottom-0 right-0 w-2 h-2">
                <div className="absolute bottom-0 right-0 w-1 h-px bg-white/20 group-hover:bg-emerald-400 group-hover:shadow-[0_0_4px_rgba(16,185,129,0.6)] transition-all duration-300" />
                <div className="absolute bottom-0 right-0 w-px h-1 bg-white/20 group-hover:bg-emerald-400 group-hover:shadow-[0_0_4px_rgba(16,185,129,0.6)] transition-all duration-300" />
              </div>

              {/* Custom refresh icon */}
              <div className="relative z-10">
                <svg
                  className={`w-3 h-3 sm:w-4 sm:h-4 transition-all duration-300 ${statusLoading ? 'animate-spin' : 'group-hover:rotate-180'}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                  {/* Add some tech-style details */}
                  <circle cx="12" cy="12" r="1" fill="currentColor" />
                  <circle cx="12" cy="8" r="0.5" fill="currentColor" opacity="0.6" />
                  <circle cx="12" cy="16" r="0.5" fill="currentColor" opacity="0.6" />
                  <circle cx="8" cy="12" r="0.5" fill="currentColor" opacity="0.6" />
                  <circle cx="16" cy="12" r="0.5" fill="currentColor" opacity="0.6" />
                </svg>
              </div>
              <span className="hidden xs:inline relative z-10 font-mono">SYNC</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {statusError && (
        <div className="relative bg-red-500/10 border border-red-500/20 p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            <div>
              <div className="text-red-400 font-medium text-xs sm:text-sm">Error loading API status</div>
              <div className="text-red-400/70 text-[10px] sm:text-xs mt-1">{statusError}</div>
            </div>
          </div>
        </div>
      )}

      {/* Uptime Graphs Section */}
      <div className="space-y-3 sm:space-y-4">
        <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
          <CornerAccents />
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Service Uptime Monitoring</h2>

          {/* 2x1 Grid of Uptime Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* pNode Devnet */}
            <div className="relative bg-black border border-white/10 p-3 sm:p-4 group hover:border-white/20 transition-all duration-300 overflow-hidden">
              <CornerAccents />
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-white font-medium text-sm sm:text-base">pNode Devnet</h3>
                  <p className="text-white/60 text-xs">pRPC & Credits API</p>
                </div>
                <div className="text-right">
                  {pNodeDevnet ? (
                    <>
                      <div className={`text-sm font-bold ${pNodeDevnet.status === 'operational' ? 'text-emerald-400' :
                        pNodeDevnet.status === 'degraded' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                        {(calculatedUptimes[pNodeDevnet.name] ?? pNodeDevnet.uptime).toFixed(1)}%
                      </div>
                      <div className="text-white/40 text-xs">
                        {pNodeDevnet.responseTime > 0 ? `${pNodeDevnet.responseTime}ms` : 'Checking...'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-bold text-white/40">---%</div>
                      <div className="text-white/40 text-xs">Initializing...</div>
                    </>
                  )}
                </div>
              </div>
              {pNodeDevnet && (
                (pNodeDevnet.uptimeHistory && pNodeDevnet.uptimeHistory.length > 0) ||
                (pNodeDevnet.recentCalls && pNodeDevnet.recentCalls.length > 0)
              ) ? (
                <UptimeGraph
                  endpoint={pNodeDevnet}
                  onUptimeCalculated={handleDevnetUptimeCalculated}
                />
              ) : (
                <div className="h-16 flex items-center justify-center text-white/40 text-xs">
                  Waiting for health check data...
                </div>
              )}
            </div>

            {/* pNode Mainnet */}
            <div className="relative bg-black border border-white/10 p-3 sm:p-4 group hover:border-white/20 transition-all duration-300 overflow-hidden">
              <CornerAccents />
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-white font-medium text-sm sm:text-base">pNode Mainnet</h3>
                  <p className="text-white/60 text-xs">pRPC & Credits API (172.105.42.135)</p>
                </div>
                <div className="text-right">
                  {pNodeMainnet ? (
                    <>
                      <div className={`text-sm font-bold ${pNodeMainnet.status === 'operational' ? 'text-emerald-400' :
                        pNodeMainnet.status === 'degraded' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                        {(calculatedUptimes[pNodeMainnet.name] ?? pNodeMainnet.uptime).toFixed(1)}%
                      </div>
                      <div className="text-white/40 text-xs">
                        {pNodeMainnet.responseTime > 0 ? `${pNodeMainnet.responseTime}ms` : 'Checking...'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-sm font-bold text-white/40">---%</div>
                      <div className="text-white/40 text-xs">Initializing...</div>
                    </>
                  )}
                </div>
              </div>
              {pNodeMainnet && (
                (pNodeMainnet.uptimeHistory && pNodeMainnet.uptimeHistory.length > 0) ||
                (pNodeMainnet.recentCalls && pNodeMainnet.recentCalls.length > 0)
              ) ? (
                <UptimeGraph
                  endpoint={pNodeMainnet}
                  onUptimeCalculated={handleMainnetUptimeCalculated}
                />
              ) : (
                <div className="h-16 flex items-center justify-center text-white/40 text-xs">
                  Waiting for health check data...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Endpoint Testing Stats */}
      <EndpointStatsCards stats={stats} />

      <EndpointControls
        testing={testing}
        isPending={isPending}
        hasResults={Object.keys(testResults).length > 0}
        onClearResults={clearResults}
        onTestAll={testAllMethods}
      />

      {endpoints.map((category) => (
        <EndpointCategorySection
          key={category.category}
          category={category}
          testResults={testResults}
          individualTesting={individualTesting}
          globalTesting={testing}
          cooldowns={cooldowns}
          expandedResults={expandedResults}
          copyingStates={copyingStates}
          getCooldownRemaining={getCooldownRemaining}
          onTestMethod={testSingleMethod}
          onCopyResult={copyResult}
          onToggleExpand={toggleExpanded}
          onClearResult={clearIndividualResult}
        />
      ))}
    </div>
  );
}

export default function EndpointsPage() {
  return (
    <DashboardLayout>
      <EndpointsPageContent />
    </DashboardLayout>
  );
}
