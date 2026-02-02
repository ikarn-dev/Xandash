'use client';

import React from 'react';

interface ApiErrorFeedbackProps {
    error: string | null;
    isRateLimit?: boolean;
    onRetry?: () => void;
    className?: string;
    variant?: 'inline' | 'card' | 'banner';
}

// Corner accents that match the app's theme
const CornerAccents = () => (
    <>
        <div className="absolute top-0 left-0 w-3 h-3">
            <div className="absolute top-0 left-0 w-2 h-px bg-red-500/30"></div>
            <div className="absolute top-0 left-0 w-px h-2 bg-red-500/30"></div>
        </div>
        <div className="absolute top-0 right-0 w-3 h-3">
            <div className="absolute top-0 right-0 w-2 h-px bg-red-500/30"></div>
            <div className="absolute top-0 right-0 w-px h-2 bg-red-500/30"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-3 h-3">
            <div className="absolute bottom-0 left-0 w-2 h-px bg-red-500/30"></div>
            <div className="absolute bottom-0 left-0 w-px h-2 bg-red-500/30"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-3 h-3">
            <div className="absolute bottom-0 right-0 w-2 h-px bg-red-500/30"></div>
            <div className="absolute bottom-0 right-0 w-px h-2 bg-red-500/30"></div>
        </div>
    </>
);

// Warning icon
const WarningIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

// Retry icon
const RetryIcon = ({ className = "w-3 h-3" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
);

export const ApiErrorFeedback: React.FC<ApiErrorFeedbackProps> = ({
    error,
    isRateLimit = false,
    onRetry,
    className = '',
    variant = 'inline',
}) => {
    if (!error) return null;

    // Determine the message based on error type
    const getMessage = () => {
        if (isRateLimit) {
            return 'Rate limit reached. Data may be incomplete.';
        }
        if (error.toLowerCase().includes('timeout')) {
            return 'Request timed out. Please try again.';
        }
        if (error.toLowerCase().includes('network') || error.toLowerCase().includes('fetch')) {
            return 'Network error. Check your connection.';
        }
        return error;
    };

    const message = getMessage();

    if (variant === 'inline') {
        return (
            <div className={`flex items-center gap-2 text-amber-400/80 text-[10px] sm:text-xs ${className}`}>
                <WarningIcon className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{message}</span>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 transition-colors cursor-pointer"
                    >
                        <RetryIcon className="w-2.5 h-2.5" />
                        <span>Retry</span>
                    </button>
                )}
            </div>
        );
    }

    if (variant === 'banner') {
        return (
            <div className={`flex items-center justify-between gap-3 px-3 py-2 bg-red-500/10 border border-red-500/20 ${className}`}>
                <div className="flex items-center gap-2 text-red-400 text-xs sm:text-sm">
                    <WarningIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{message}</span>
                </div>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs transition-colors cursor-pointer"
                    >
                        <RetryIcon className="w-3 h-3" />
                        <span>Retry</span>
                    </button>
                )}
            </div>
        );
    }

    // Card variant
    return (
        <div className={`relative bg-black border border-red-500/20 hover:border-red-500/30 transition-colors p-4 ${className}`}>
            <CornerAccents />
            <div className="flex flex-col items-center justify-center gap-3 py-4">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <WarningIcon className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-center">
                    <p className="text-red-400 text-sm font-medium mb-1">
                        {isRateLimit ? 'Rate Limited' : 'Failed to Load'}
                    </p>
                    <p className="text-white/40 text-xs">{message}</p>
                </div>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs transition-colors cursor-pointer"
                    >
                        <RetryIcon className="w-3 h-3" />
                        <span>Try Again</span>
                    </button>
                )}
            </div>
        </div>
    );
};

// Partial data warning - shown when some data loaded but not all
export const PartialDataWarning: React.FC<{
    message?: string;
    className?: string;
}> = ({
    message = 'Some data may be incomplete',
    className = '',
}) => (
        <div className={`flex items-center gap-2 px-2 py-1 bg-amber-500/5 border border-amber-500/10 text-amber-400/70 text-[9px] sm:text-[10px] ${className}`}>
            <WarningIcon className="w-3 h-3 flex-shrink-0" />
            <span>{message}</span>
        </div>
    );

export default ApiErrorFeedback;
