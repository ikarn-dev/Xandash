'use client';

import React from 'react';
import { CornerAccents } from '@/components/ui';

interface ResultCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'emerald' | 'blue' | 'purple' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
  highlight?: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'emerald',
  size = 'md',
  highlight = false,
}) => {
  const colorClasses = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    yellow: 'text-yellow-400',
  };

  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl',
  };

  return (
    <div className={`relative bg-black border ${highlight ? 'border-emerald-500/30' : 'border-white/10'} p-4 sm:p-6 group hover:border-white/20 transition-all duration-300`}>
      <CornerAccents color={highlight ? 'emerald' : 'white'} />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          {icon && <span className={colorClasses[color]}>{icon}</span>}
          <span className="text-white/50 text-xs font-medium tracking-wider uppercase">
            {title}
          </span>
        </div>
        
        <div className={`${colorClasses[color]} ${sizeClasses[size]} font-bold font-mono`}>
          {value}
        </div>
        
        {subtitle && (
          <div className="text-white/40 text-xs mt-1">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};
