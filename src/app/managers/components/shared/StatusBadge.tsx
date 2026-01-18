'use client';

import React from 'react';

interface StatusBadgeProps {
  active: number;
  total: number;
  className?: string;
}

export function StatusBadge({ active, total, className = '' }: StatusBadgeProps) {
  const isFullyActive = active === total;
  const isPartiallyActive = active > 0 && active < total;
  const isInactive = active === 0;

  return (
    <div 
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        isFullyActive
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          : isPartiallyActive
            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            : 'bg-white/10 text-white/40 border border-white/10'
      } ${className}`}
    >
      {active}/{total}
    </div>
  );
}
