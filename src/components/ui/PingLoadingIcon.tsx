'use client';

import React from 'react';

interface PingLoadingIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PingLoadingIcon: React.FC<PingLoadingIconProps> = ({ 
  size = 'sm',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Animated ping waves */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="absolute w-full h-full rounded-full bg-cyan-400/30 animate-ping" />
        <div className="absolute w-2/3 h-2/3 rounded-full bg-cyan-400/50 animate-ping animation-delay-150" />
        <div className="w-1/3 h-1/3 rounded-full bg-cyan-400" />
      </div>
    </div>
  );
};

// Inline ping cell loading state
export const PingCellLoading: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-1.5 ${className}`}>
    <PingLoadingIcon size="sm" />
    <span className="text-white/30 text-xs font-mono animate-pulse">...</span>
  </div>
);

// Ping value display with color coding
interface PingValueProps {
  ping: number | null | undefined;
  isLoading?: boolean;
  showUnit?: boolean;
  className?: string;
}

export const PingValue: React.FC<PingValueProps> = ({ 
  ping, 
  isLoading = false, 
  showUnit = true,
  className = '' 
}) => {
  if (isLoading) {
    return <PingCellLoading className={className} />;
  }

  if (ping === null || ping === undefined) {
    return <span className={`text-white/30 font-mono ${className}`}>N/A</span>;
  }

  // Color based on ping value
  let colorClass = 'text-green-400';
  if (ping >= 300) {
    colorClass = 'text-red-400';
  } else if (ping >= 150) {
    colorClass = 'text-orange-400';
  } else if (ping >= 100) {
    colorClass = 'text-yellow-400';
  }

  return (
    <span className={`font-mono ${colorClass} ${className}`}>
      {ping}{showUnit && 'ms'}
    </span>
  );
};

export default PingLoadingIcon;
