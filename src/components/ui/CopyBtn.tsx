'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';

interface CopyBtnProps {
  text: string;
  onCopy?: (text: string, type: string) => void;
  type?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const CopyBtn: React.FC<CopyBtnProps> = ({
  text,
  onCopy,
  type = 'text',
  className = '',
  size = 'md'
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click when copying
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      onCopy?.(text, type);

      // Show toast notification
      const shortText = text.length > 20 ? `${text.slice(0, 10)}...${text.slice(-6)}` : text;
      toast.success(`Copied: ${shortText}`);

      // Reset animation after 1 second
      setTimeout(() => setCopied(false), 1000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const sizeClasses = size === 'sm' ? 'w-4 h-4 sm:w-3 sm:h-3' : 'w-5 h-5 sm:w-4 sm:h-4';
  const iconSizeClasses = size === 'sm' ? 'w-3 h-3 sm:w-2.5 sm:h-2.5' : 'w-3.5 h-3.5 sm:w-3 sm:h-3';

  return (
    <button
      onClick={handleCopy}
      className={`${sizeClasses} cursor-pointer hover:bg-white/10 active:bg-white/20 rounded transition-all duration-200 flex-shrink-0 relative flex items-center justify-center ${className}`}
      title={`Copy ${type}`}
      style={{ cursor: 'pointer' }}
    >
      {/* Copy icon */}
      <svg
        className={`${iconSizeClasses} text-white/70 hover:text-white/90 transition-colors duration-200`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>

      {/* Success Animation Ring */}
      {copied && (
        <div className="absolute inset-0 -m-1 border-2 border-green-400 rounded-full animate-ping opacity-75"></div>
      )}
    </button>
  );
};