'use client';

import { useState, useCallback } from 'react';
import { GovernanceData } from '../../hooks/useGovernance';
import { formatNumber, shortenAddress, getSolscanUrl } from '../../utils/helpers';
import { SearchIcon, ChevronDownIcon, ExternalLinkIcon } from '../Icons';

interface Member { address: string; votingPower: number; votes: number; proposals: number; }

export function MembersTab({ data }: { data: GovernanceData }) {
  const [search, setSearch] = useState('');
  const [members, setMembers] = useState<Member[]>(data.members.topMembers);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(data.members.topMembers.length < data.members.total);
  const [page, setPage] = useState(1);

  const totalVotingPower = members.reduce((sum, m) => sum + m.votingPower, 0);
  const filteredMembers = search ? members.filter(m => m.address.toLowerCase().includes(search.toLowerCase())) : members;

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/governance/members?offset=${members.length}&limit=5`);
      const result = await res.json();
      if (result.members?.length > 0) {
        setMembers(prev => [...prev, ...result.members]);
        setHasMore(result.hasMore);
        setPage(p => p + 1);
      } else setHasMore(false);
    } catch { setHasMore(false); }
    finally { setLoading(false); }
  }, [members.length, loading]);

  const remaining = data.members.total - members.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input type="text" placeholder="Search by address..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded pl-10 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50" />
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-white/5 rounded">
            <span className="text-white/50 text-xs">Total</span>
            <span className="text-white font-mono text-sm ml-2">{data.members.total}</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-white/50 text-xs font-medium">#</th>
              <th className="text-left py-2 px-3 text-white/50 text-xs font-medium">ACCOUNT</th>
              <th className="text-right py-2 px-3 text-white/50 text-xs font-medium">VOTING POWER ↓</th>
              <th className="text-right py-2 px-3 text-white/50 text-xs font-medium">VOTES</th>
              <th className="text-right py-2 px-3 text-white/50 text-xs font-medium hidden sm:table-cell">PROPOSALS</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length > 0 ? filteredMembers.map((m, i) => {
              const pct = totalVotingPower > 0 ? (m.votingPower / totalVotingPower) * 100 : 0;
              return (
                <tr key={`${m.address}-${i}`} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1">
                      {i < 3 && <span className="text-amber-400">🏆</span>}
                      <span className="text-white/40 text-sm font-mono">{i + 1}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <span className="text-white/60 text-xs font-mono">{m.address.slice(0, 2)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-mono truncate">{shortenAddress(m.address, 4)}</p>
                        <a href={getSolscanUrl(m.address)} target="_blank" rel="noopener noreferrer"
                          className="text-white/40 text-xs hover:text-emerald-400 flex items-center gap-1">
                          <span>Solscan</span>
                          <ExternalLinkIcon className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-emerald-400 font-mono text-sm">{formatNumber(m.votingPower)}</span>
                    <div className="w-20 h-1 bg-white/10 rounded-full mt-1 ml-auto">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(pct * 2, 100)}%` }}></div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="text-white/60 font-mono text-sm">{m.votes}</span>
                  </td>
                  <td className="py-3 px-3 text-right hidden sm:table-cell">
                    <span className="text-white/60 font-mono text-sm">{m.proposals}</span>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={5} className="py-8 text-center">
                  <p className="text-white/40 text-sm">{members.length === 0 ? 'Loading...' : 'No members match search'}</p>
                  {search && members.length > 0 && (
                    <button onClick={() => setSearch('')} className="mt-2 text-emerald-400 text-xs hover:underline">Clear search</button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-white/10">
        <div className="text-white/40 text-xs">Page {page} • Showing {members.length} of {data.members.total} members</div>
        {hasMore && remaining > 0 ? (
          <button onClick={loadMore} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded text-emerald-400 text-sm disabled:opacity-50">
            {loading ? 'Loading...' : <><span>Load More ({remaining} remaining)</span><ChevronDownIcon className="w-4 h-4" /></>}
          </button>
        ) : members.length > 0 && <span className="text-emerald-400/60 text-xs">All members loaded</span>}
      </div>
    </div>
  );
}
