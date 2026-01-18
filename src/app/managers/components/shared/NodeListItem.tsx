'use client';

import React from 'react';
import { CopyButton } from './CopyButton';

const ExternalLinkIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

interface NodeListItemProps {
  pubkey: string;
  registeredTime: string;
  ip?: string;
  isActive: boolean;
  onNavigate?: () => void;
  onCopyPubkey?: (pubkey: string, e: React.MouseEvent) => void;
}

function truncateAddress(address: string, start = 6, end = 4): string {
  if (address.length <= start + end) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function NodeListItem({
  pubkey,
  registeredTime,
  ip,
  isActive,
  onNavigate,
  onCopyPubkey
}: NodeListItemProps) {
  return (
    <div className="p-3 flex items-center justify-between gap-3 hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* IP Address */}
        {ip && (
          <div className="text-white/50 text-xs font-mono flex-shrink-0 hidden sm:block w-32">
            {ip}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-xs font-mono truncate">
              {truncateAddress(pubkey, 8, 6)}
            </span>
            <CopyButton
              text={pubkey}
              label="Pubkey"
              className="p-0.5"
              iconClassName="w-3 h-3"
              onClick={onCopyPubkey ? (e) => onCopyPubkey(pubkey, e) : undefined}
            />
          </div>
          <div className="text-white/40 text-[10px] mt-0.5">
            Registered: {registeredTime}
          </div>
        </div>
      </div>

      {/* Action Button */}
      {isActive && onNavigate ? (
        <button
          onClick={onNavigate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-black hover:bg-white/10 text-white border border-white/20 hover:border-white/40 transition-all duration-300 text-xs font-medium flex-shrink-0"
        >
          <span className="hidden sm:inline">View Profile</span>
          <span className="sm:hidden">Profile</span>
          <ExternalLinkIcon className="w-3 h-3" />
        </button>
      ) : (
        <div className="px-3 py-1.5 bg-white/5 text-white/30 border border-white/10 text-xs flex-shrink-0">
          Offline
        </div>
      )}
    </div>
  );
}
