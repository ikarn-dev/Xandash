'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface ViewProfileBadgeProps {
  href: string;
  label?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const ViewProfileBadge: React.FC<ViewProfileBadgeProps> = ({
  href,
  label = 'View Profile',
  className = '',
  onClick,
}) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    } else {
      router.push(href);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center gap-1 sm:gap-1.5
        px-2 py-1 sm:px-3 sm:py-1.5
        text-[10px] sm:text-xs font-medium
        bg-white/5 hover:bg-white/10
        border border-white/10 hover:border-white/30
        text-white/70 hover:text-white
        rounded-sm
        transition-all duration-300
        hover:shadow-[0_0_12px_rgba(255,255,255,0.15)]
        group/badge
        ${className}
      `}
    >
      <span>{label}</span>
      <svg 
        className="w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-300 group-hover/badge:translate-x-0.5" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
};
