'use client';

import { Server, Globe } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { useEndpointTests } from './hooks';
import {
  EndpointCategory,
  EndpointHeader,
  EndpointStatsCards,
  EndpointControls,
  EndpointCategorySection
} from './components';

const endpoints: EndpointCategory[] = [
  {
    category: 'RPC Methods',
    description: 'JSON-RPC endpoints for node communication',
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <EndpointHeader />

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
