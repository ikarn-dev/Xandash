'use client';

import React from 'react';
import { toast } from 'sonner';

const CopyIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  iconClassName?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function CopyButton({ 
  text, 
  label = 'Copy', 
  className = '', 
  iconClassName = 'w-3 h-3',
  onClick 
}: CopyButtonProps) {
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (onClick) {
      onClick(e);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied!`);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-1 hover:bg-white/10 transition-colors flex-shrink-0 ${className}`}
      title={`Copy ${label.toLowerCase()}`}
    >
      <CopyIcon className={`text-white/40 hover:text-white/70 ${iconClassName}`} />
    </button>
  );
}
