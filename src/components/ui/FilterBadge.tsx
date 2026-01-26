'use client';

import * as React from 'react';
import { cn } from '@/libs/cn';

type FilterColor = 'default' | 'green' | 'amber' | 'red' | 'blue' | 'purple';

interface FilterBadgeProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  color?: FilterColor;
  className?: string;
}

const colorStyles: Record<FilterColor, { active: string; inactive: string }> = {
  default: {
    active: 'bg-white/20 text-white border-white/40',
    inactive: 'bg-black/30 text-white/80 border-white/20 hover:bg-white/10',
  },
  green: {
    active: 'bg-green-600/30 text-green-400 border-green-500/50',
    inactive: 'bg-black/30 text-white/80 border-white/20 hover:bg-green-600/20',
  },
  amber: {
    active: 'bg-amber-600/30 text-amber-400 border-amber-500/50',
    inactive: 'bg-black/30 text-white/80 border-white/20 hover:bg-amber-600/20',
  },
  red: {
    active: 'bg-red-600/30 text-red-400 border-red-500/50',
    inactive: 'bg-black/30 text-white/80 border-white/20 hover:bg-red-600/20',
  },
  blue: {
    active: 'bg-blue-600/30 text-blue-400 border-blue-500/50',
    inactive: 'bg-black/30 text-white/80 border-white/20 hover:bg-blue-600/20',
  },
  purple: {
    active: 'bg-purple-600/30 text-purple-400 border-purple-500/50',
    inactive: 'bg-black/30 text-white/80 border-white/20 hover:bg-purple-600/20',
  },
};

export function FilterBadge({
  label,
  active = false,
  onClick,
  color = 'default',
  className,
}: FilterBadgeProps) {
  const styles = colorStyles[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-lg border px-2 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap',
        active ? styles.active : styles.inactive,
        className
      )}
    >
      {label}
    </button>
  );
}
