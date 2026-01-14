'use client';

import { useState } from 'react';
import { CornerAccents } from '@/components/ui';
import { useGovernance } from './hooks/useGovernance';
import { formatNumber, formatUsd, getRealmsUrl } from './utils/helpers';
import { UsersIcon, DocumentIcon, TreasuryIcon, GovernanceIcon, RefreshIcon, ExternalLinkIcon, StatCard, TabNavigation, TabType } from './components';
import { ProposalsTab, TreasuryTab, MembersTab, DAOInfoTab } from './components/tabs';

export function GovernanceClient() {
  const { data, loading, refreshing, cooldown, refresh } = useGovernance();
  const [activeTab, setActiveTab] = useState<TabType>('proposals');

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!data) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="relative bg-black border border-white/10 p-3 sm:p-4 md:p-6 group hover:border-white/20 transition-all">
        <CornerAccents />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white/90 font-mono truncate">
                // <span className="text-white">{data.dao.name.toUpperCase()}</span>
              </h1>
              <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-full text-[8px] sm:text-[10px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-400"></div>
                <span>Live</span>
              </div>
            </div>
            <p className="text-white/50 text-[10px] sm:text-xs md:text-sm mt-1 truncate">{data.dao.description}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a 
              href={getRealmsUrl(data.dao.address)} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded text-emerald-400 text-xs sm:text-sm transition-colors"
            >
              <span>Realms</span>
              <ExternalLinkIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            </a>
            <button 
              onClick={refresh} 
              disabled={refreshing || cooldown > 0}
              className="flex items-center gap-1.5 p-1.5 sm:p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white/70 transition-colors disabled:opacity-50"
              title={cooldown > 0 ? `Wait ${cooldown}s` : 'Refresh data'}
            >
              {cooldown > 0 && (
                <span className="text-[10px] sm:text-xs font-mono text-white/50">{cooldown}s</span>
              )}
              <RefreshIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" spinning={refreshing} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard
          icon={<DocumentIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />}
          label="Proposals"
          value={data.stats.proposals}
          onClick={() => setActiveTab('proposals')}
        />
        <StatCard
          icon={<TreasuryIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />}
          label="Treasury"
          value={formatUsd(data.stats.treasuryValueUsd)}
          onClick={() => setActiveTab('treasury')}
        />
        <StatCard
          icon={<UsersIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />}
          label="Members"
          value={data.stats.members}
          onClick={() => setActiveTab('members')}
        />
        <StatCard
          icon={<GovernanceIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
          label="Governances"
          value={data.stats.governances}
          onClick={() => setActiveTab('info')}
        />
      </div>

      {/* Tab Content */}
      <div className="relative bg-black border border-white/10 overflow-hidden">
        <CornerAccents />
        <TabNavigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          proposalsCount={data.proposals.total}
          membersCount={data.members.total}
        />
        <div className="p-3 sm:p-4 md:p-6">
          {activeTab === 'proposals' && <ProposalsTab data={data} />}
          {activeTab === 'treasury' && <TreasuryTab data={data} />}
          {activeTab === 'members' && <MembersTab data={data} />}
          {activeTab === 'info' && <DAOInfoTab data={data} />}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-white/30 text-[10px] sm:text-xs py-2">
        Updated: {new Date(data.fetchedAt).toLocaleString()} • Solana blockchain via Helius
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-black border border-white/10 p-4 sm:p-6">
        <div className="h-6 sm:h-8 bg-white/10 rounded w-1/3 mb-2"></div>
        <div className="h-3 sm:h-4 bg-white/10 rounded w-2/3"></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-black border border-white/10 p-3 sm:p-4">
            <div className="h-3 sm:h-4 bg-white/10 rounded w-1/2 mb-2"></div>
            <div className="h-6 sm:h-8 bg-white/10 rounded w-3/4"></div>
          </div>
        ))}
      </div>
      <div className="bg-black border border-white/10 p-4 sm:p-6">
        <div className="h-8 bg-white/10 rounded w-full mb-4"></div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 sm:h-16 bg-white/10 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
