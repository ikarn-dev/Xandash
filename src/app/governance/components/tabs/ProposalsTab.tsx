'use client';

import { useState, useCallback } from 'react';
import { GovernanceData } from '../../hooks/useGovernance';
import { shortenAddress, getStateColor, getRealmsUrl, copyToClipboard } from '../../utils/helpers';
import { SearchIcon, ChevronDownIcon, ExternalLinkIcon, CopyIcon } from '../Icons';

interface Proposal {
  pubkey: string;
  name: string;
  state: string;
  voteType?: string;
  createdAt?: number;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function ProposalsTab({ data }: { data: GovernanceData }) {
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>(data.proposals.recent);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(data.proposals.recent.length < data.proposals.total);
  const [page, setPage] = useState(1);

  const filteredProposals = proposals.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.pubkey.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (!selectedState || p.state === selectedState);
  });

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/governance/proposals?offset=${proposals.length}&limit=5`);
      const result = await res.json();
      if (result.proposals?.length > 0) {
        setProposals(prev => [...prev, ...result.proposals]);
        setHasMore(result.hasMore);
        setPage(p => p + 1);
      } else setHasMore(false);
    } catch { setHasMore(false); }
    finally { setLoading(false); }
  }, [proposals.length, loading]);

  const remaining = data.proposals.total - proposals.length;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input type="text" placeholder="Search proposals..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded pl-9 sm:pl-10 pr-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white placeholder-white/30 placeholder:text-[10px] sm:placeholder:text-sm focus:outline-none focus:border-emerald-500/50" />
      </div>

      {/* State Filters */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setSelectedState(null)}
          className={`px-3 py-1.5 rounded border text-xs ${!selectedState ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>
          All: {data.proposals.total}
        </button>
        {Object.entries(data.proposals.byState).map(([state, count]) => (
          <button key={state} onClick={() => setSelectedState(selectedState === state ? null : state)}
            className={`px-3 py-1.5 rounded border text-xs ${selectedState === state ? getStateColor(state) : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}>
            {state}: {count}
          </button>
        ))}
      </div>

      {/* Proposals List */}
      <div className="space-y-3">
        {filteredProposals.length > 0 ? filteredProposals.map((p, i) => (
          <div key={`${p.pubkey}-${i}`} className="p-4 bg-white/5 rounded hover:bg-white/[0.07] transition-colors border border-white/5 hover:border-white/10">
            {/* Header Row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${getStateColor(p.state)}`}>{p.state}</span>
              <span className="text-white/40 text-[10px]">☰ {p.voteType || 'Single-choice'}</span>
              <span className="text-white/40 text-[10px]">⏱ {p.createdAt ? timeAgo(p.createdAt) : '—'}</span>
            </div>

            {/* Title */}
            <h4 className="text-white font-medium text-sm sm:text-base mb-2">{p.name}</h4>

            {/* Address Row */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white/50 text-xs font-mono">{shortenAddress(p.pubkey, 6)}</span>
              <button onClick={() => copyToClipboard(p.pubkey, 'Address')} className="text-white/30 hover:text-white/60">
                <CopyIcon className="w-3 h-3" />
              </button>
            </div>

            {/* Progress Bar (for executable/voting) */}
            {(p.state === 'Executable' || p.state === 'Voting' || p.state === 'Succeeded') && (
              <div className="mb-3">
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-white/40 text-[10px]">📄 2</span>
                <span className="text-white/40 text-[10px]">🔐 Multi-sig</span>
              </div>
              <a href={getRealmsUrl(data.dao.address)} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded text-emerald-400 text-xs transition-colors">
                <span>View on Realms</span>
                <ExternalLinkIcon className="w-3 h-3" />
              </a>
            </div>
          </div>
        )) : (
          <div className="text-center py-8">
            <p className="text-white/40 text-sm">{proposals.length === 0 ? 'Loading...' : 'No proposals match filters'}</p>
            {(search || selectedState) && proposals.length > 0 && (
              <button onClick={() => { setSearch(''); setSelectedState(null); }} className="mt-2 text-emerald-400 text-xs hover:underline">Clear filters</button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
        <div className="text-white/40 text-xs">Page {page} • Showing {proposals.length} of {data.proposals.total} proposals</div>
        {hasMore && remaining > 0 ? (
          <button onClick={loadMore} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded text-emerald-400 text-sm disabled:opacity-50">
            {loading ? 'Loading...' : <><span>Load More ({remaining} remaining)</span><ChevronDownIcon className="w-4 h-4" /></>}
          </button>
        ) : proposals.length > 0 && <span className="text-emerald-400/60 text-xs">All proposals loaded</span>}
      </div>
    </div>
  );
}
