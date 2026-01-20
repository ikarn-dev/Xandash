'use client';

import { useState, useMemo } from 'react';
import { getNodeName } from '@/libs/utils/node-names';
import { getNodeStatus, getStatusColorClasses } from '@/libs/utils/node-status';

interface Node {
  pubkey: string;
  address: string;
  credits?: number;
  last_seen_timestamp?: number;
  score?: number;
}

interface NodeSelectorProps {
  nodes: Node[];
  selectedNodes: string[];
  onToggle: (pubkey: string) => void;
  maxNodes?: number;
  isLoading?: boolean;
  serverTimestamp?: number;
}

export function NodeSelector({
  nodes,
  selectedNodes,
  onToggle,
  maxNodes = 4,
  isLoading = false,
  serverTimestamp = 0
}: NodeSelectorProps) {
  const [search, setSearch] = useState('');

  const filteredNodes = useMemo(() => {
    // Deduplicate nodes by pubkey
    const seen = new Set<string>();
    const unique = nodes.filter(n => {
      if (seen.has(n.pubkey)) return false;
      seen.add(n.pubkey);
      return true;
    });

    if (!search.trim()) return unique.slice(0, 100);
    const query = search.toLowerCase();
    return unique
      .filter(n =>
        n.pubkey.toLowerCase().includes(query) ||
        n.address?.toLowerCase().includes(query)
      )
      .slice(0, 100);
  }, [nodes, search]);

  const extractIP = (address?: string) => {
    if (!address) return 'N/A';
    return address.split(':')[0] || 'N/A';
  };

  const colors = ['#10b981', '#3b82f6', '#a855f7', '#f59e0b'];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by IP or Pod ID..."
          className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/30">
          {selectedNodes.length}/{maxNodes}
        </div>
      </div>

      {/* Selected Chips */}
      {selectedNodes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedNodes.map((pubkey, index) => {
            const node = nodes.find(n => n.pubkey === pubkey);
            const nodeName = getNodeName(pubkey);
            return (
              <div
                key={pubkey}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor: `${colors[index % colors.length]}20`,
                  borderColor: `${colors[index % colors.length]}50`,
                  color: colors[index % colors.length],
                  border: '1px solid'
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                <span className="font-mono">{nodeName !== 'N/A' ? nodeName : (node ? extractIP(node.address) : pubkey.slice(0, 8))}</span>
                <button
                  onClick={() => onToggle(pubkey)}
                  className="ml-1 hover:opacity-70 transition-opacity"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Node List */}
      <div className="max-h-[280px] overflow-y-auto rounded-lg border border-white/10 bg-black/30" style={{ scrollbarWidth: 'none' }}>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
            <span className="text-white/40 text-xs">Loading nodes...</span>
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="p-8 text-center text-white/40 text-sm">No nodes found</div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredNodes.map((node, idx) => {
              const isSelected = selectedNodes.includes(node.pubkey);
              const selectedIndex = selectedNodes.indexOf(node.pubkey);
              const canSelect = selectedNodes.length < maxNodes || isSelected;
              const ip = extractIP(node.address);
              const status = getNodeStatus(node.last_seen_timestamp || 0, serverTimestamp);
              const statusColors = getStatusColorClasses(status);

              return (
                <button
                  key={node.pubkey}
                  onClick={() => canSelect && onToggle(node.pubkey)}
                  disabled={!canSelect}
                  className={`w-full flex items-center justify-between p-3 transition-all ${isSelected
                    ? 'bg-white/5'
                    : canSelect
                      ? 'hover:bg-white/5'
                      : 'opacity-40 cursor-not-allowed'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-white/20'
                        }`}
                      style={isSelected ? {
                        backgroundColor: colors[selectedIndex % colors.length],
                        borderColor: colors[selectedIndex % colors.length]
                      } : {}}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>

                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        {/* Status indicator dot */}
                        <div className={`w-2 h-2 rounded-full ${statusColors.dot}`} title={status.charAt(0).toUpperCase() + status.slice(1)} />
                        <span className="font-mono text-sm text-white">{ip}</span>
                        {getNodeName(node.pubkey) !== 'N/A' && (
                          <span className="text-[10px] text-cyan-400 font-medium">{getNodeName(node.pubkey)}</span>
                        )}
                      </div>
                      <div className="font-mono text-[10px] text-white/30 truncate max-w-[180px] sm:max-w-[280px]">
                        {node.pubkey}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-0.5">
                    {node.credits !== undefined && node.credits > 0 && (
                      <span className="text-xs text-emerald-400 font-mono font-medium">
                        +{node.credits.toLocaleString()}
                      </span>
                    )}
                    {(node.score !== undefined) && (
                      <span className="text-[10px] text-purple-400 font-mono font-medium">
                        {node.score.toFixed(1)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="text-[10px] text-white/30 text-center">
        {filteredNodes.length} nodes available • Select up to {maxNodes} to compare
      </div>
    </div>
  );
}
