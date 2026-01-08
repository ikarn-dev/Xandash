'use client';

import { useState, useCallback } from 'react';
import { GovernanceData } from '../../hooks/useGovernance';
import { formatNumber, shortenAddress, getSolscanUrl } from '../../utils/helpers';
import { AddressDisplay } from '../AddressDisplay';
import { SearchIcon, ChevronDownIcon } from '../Icons';

export function DAOInfoTab({ data }: { data: GovernanceData }) {
  return (
    <div className="space-y-6">
      {/* DAO Info */}
      <Section title="DAO INFORMATION">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <InfoCard>
            <InfoRow label="DAO Name" value={data.dao.name} />
            <InfoRow label="DAO Address"><AddressDisplay address={data.dao.address} label="DAO" /></InfoRow>
            <InfoRow label="Program ID"><AddressDisplay address={data.dao.programId} label="Program" /></InfoRow>
          </InfoCard>
          <InfoCard>
            <InfoRow label="Community Mint"><AddressDisplay address={data.token.mint} label="XAND" /></InfoRow>
            <InfoRow label="Council Mint"><AddressDisplay address={data.councilToken.mint} label="Council" /></InfoRow>
            <InfoRow label="Council Tokens" value={<span className="text-purple-400 font-mono">{data.councilToken.totalSupply}</span>} />
          </InfoCard>
        </div>
      </Section>

      {/* Governance Parameters */}
      <Section title="GOVERNANCE PARAMETERS">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {Object.entries(data.governance.parameters).map(([key, value]) => (
            <div key={key} className="p-2 sm:p-3 bg-white/5 rounded hover:bg-white/10 transition-colors">
              <p className="text-white/50 text-[9px] sm:text-xs capitalize mb-0.5 sm:mb-1 line-clamp-1">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <p className="text-white font-mono text-xs sm:text-sm truncate">
                {typeof value === 'number' ? formatNumber(value, 0) : value}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Token Info */}
      <Section title="XAND TOKEN">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <StatBox label="Total Supply" value={formatNumber(data.token.totalSupply)} color="emerald" />
          <StatBox label="Price" value={`$${data.token.price.toFixed(5)}`} color="emerald" />
          <StatBox label="Decimals" value={data.token.decimals.toString()} />
          <StatBox label="Symbol" value={data.token.symbol} />
        </div>
      </Section>

      {/* Top Holders with Search */}
      <TopHoldersSection data={data} />

      {/* Recent Activity with Load More */}
      <RecentActivitySection data={data} />
    </div>
  );
}

function TopHoldersSection({ data }: { data: GovernanceData }) {
  const [search, setSearch] = useState('');
  const [displayCount, setDisplayCount] = useState(5);
  
  const filteredHolders = data.largestHolders.filter(holder => 
    holder.address.toLowerCase().includes(search.toLowerCase())
  );
  
  const displayedHolders = filteredHolders.slice(0, displayCount);
  const hasMore = displayCount < filteredHolders.length;

  const loadMore = useCallback(() => {
    setDisplayCount(prev => Math.min(prev + 5, filteredHolders.length));
  }, [filteredHolders.length]);

  return (
    <Section title="TOP XAND HOLDERS">
      {/* Search */}
      <div className="mb-3 sm:mb-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by address..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setDisplayCount(5); }}
            className="w-full bg-white/5 border border-white/10 rounded pl-9 sm:pl-10 pr-3 py-2 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full min-w-[350px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-2 text-white/50 text-[10px] sm:text-xs font-medium">#</th>
              <th className="text-left py-2 px-2 text-white/50 text-[10px] sm:text-xs font-medium">ADDRESS</th>
              <th className="text-right py-2 px-2 text-white/50 text-[10px] sm:text-xs font-medium">BALANCE</th>
              <th className="text-right py-2 px-2 text-white/50 text-[10px] sm:text-xs font-medium">%</th>
            </tr>
          </thead>
          <tbody>
            {displayedHolders.map((holder, i) => (
              <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="py-2 px-2 text-white/40 text-xs font-mono">{i + 1}</td>
                <td className="py-2 px-2"><AddressDisplay address={holder.address} label={`Holder ${i + 1}`} chars={3} /></td>
                <td className="py-2 px-2 text-right text-emerald-400 font-mono text-xs">{formatNumber(holder.amount)}</td>
                <td className="py-2 px-2 text-right text-white/60 font-mono text-xs">
                  {((holder.amount / data.token.totalSupply) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={loadMore}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white/70 text-xs sm:text-sm transition-colors"
        >
          <span>Load More ({filteredHolders.length - displayCount} remaining)</span>
          <ChevronDownIcon className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Count */}
      <div className="mt-2 text-center text-white/30 text-[10px] sm:text-xs">
        Showing {displayedHolders.length} of {filteredHolders.length} holders
      </div>
    </Section>
  );
}

function RecentActivitySection({ data }: { data: GovernanceData }) {
  const [displayCount, setDisplayCount] = useState(5);
  const displayedActivity = data.recentActivity.slice(0, displayCount);
  const hasMore = displayCount < data.recentActivity.length;

  const loadMore = useCallback(() => {
    setDisplayCount(prev => Math.min(prev + 5, data.recentActivity.length));
  }, [data.recentActivity.length]);

  return (
    <Section title="RECENT ACTIVITY">
      <div className="space-y-1.5 sm:space-y-2">
        {displayedActivity.map((tx, i) => (
          <div key={i} className="flex items-center justify-between p-2 sm:p-3 bg-white/5 rounded hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${tx.error ? 'bg-red-400' : 'bg-emerald-400'}`}></div>
              <a href={getSolscanUrl(tx.signature, 'tx')} target="_blank" rel="noopener noreferrer" 
                className="text-white/70 hover:text-white font-mono text-[10px] sm:text-xs">
                {shortenAddress(tx.signature, 6)}
              </a>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-white/40 text-[9px] sm:text-xs hidden sm:inline">
                {tx.blockTime ? new Date(tx.blockTime * 1000).toLocaleDateString() : '-'}
              </span>
              <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[10px] ${
                tx.error ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {tx.error ? 'failed' : 'success'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={loadMore}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-white/70 text-xs sm:text-sm transition-colors"
        >
          <span>Load More ({data.recentActivity.length - displayCount} remaining)</span>
          <ChevronDownIcon className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Count */}
      <div className="mt-2 text-center text-white/30 text-[10px] sm:text-xs">
        Showing {displayedActivity.length} of {data.recentActivity.length} transactions
      </div>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] sm:text-xs font-semibold text-white font-mono mb-2 sm:mb-4">// {title}</h3>
      {children}
    </div>
  );
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return <div className="p-3 sm:p-4 bg-white/5 rounded space-y-2 sm:space-y-3">{children}</div>;
}

function InfoRow({ label, value, children }: { label: string; value?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-2">
      <span className="text-white/50 text-[10px] sm:text-xs">{label}</span>
      {value ? <span className="text-white text-xs sm:text-sm">{value}</span> : children}
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: 'emerald' | 'blue' }) {
  const textClass = color === 'emerald' ? 'text-emerald-400' : color === 'blue' ? 'text-blue-400' : 'text-white';
  return (
    <div className="p-2 sm:p-4 bg-white/5 rounded hover:bg-white/10 transition-colors">
      <p className="text-white/50 text-[9px] sm:text-xs mb-0.5 sm:mb-1">{label}</p>
      <p className={`${textClass} font-mono text-sm sm:text-lg`}>{value}</p>
    </div>
  );
}
