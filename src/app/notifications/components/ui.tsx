'use client';

import React from 'react';

// SVG Icons for the notification page
export const Icons = {
    refresh: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
        </svg>
    ),
    clock: (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
        </svg>
    ),
    credits: (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v12M8 10h8M8 14h8" />
        </svg>
    ),
    check: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
        </svg>
    ),
    telegram: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
    ),
    mail: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 6l-10 7L2 6" />
        </svg>
    ),
    node: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
        </svg>
    ),
    logout: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <polyline points="16,17 21,12 16,7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
    unlink: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18.84 12.25l1.72-1.71h-.02a5.004 5.004 0 00-.12-7.07 5.006 5.006 0 00-6.95 0l-1.72 1.71" />
            <path d="M5.17 11.75l-1.71 1.71a5.004 5.004 0 00.12 7.07 5.006 5.006 0 006.95 0l1.71-1.71" />
            <line x1="8" y1="2" x2="8" y2="5" />
            <line x1="2" y1="8" x2="5" y2="8" />
            <line x1="16" y1="19" x2="16" y2="22" />
            <line x1="19" y1="16" x2="22" y2="16" />
        </svg>
    ),
    test: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
        </svg>
    ),
    spinner: (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 019.8 8" strokeLinecap="round" />
        </svg>
    ),
    plus: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
};

// Format uptime from seconds to human readable
export function formatUptime(seconds: number): string {
    if (!seconds || seconds < 0) return '0h';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

// Status badge component
export function StatusBadge({ status }: { status?: string }) {
    const styles = {
        online: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        offline: 'bg-red-500/20 text-red-400 border-red-500/30',
        syncing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        unknown: 'bg-white/10 text-white/60 border-white/20',
    };
    const style = styles[status as keyof typeof styles] || styles.unknown;

    return (
        <span className={`text-[10px] px-2 py-0.5 border font-medium ${style}`}>
            {status || 'unknown'}
        </span>
    );
}

// Loading button component
interface LoadingButtonProps {
    onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
    loading?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    variant?: 'default' | 'danger' | 'test' | 'primary';
    className?: string;
    type?: 'button' | 'submit';
}

export function LoadingButton({
    onClick,
    loading,
    disabled,
    children,
    variant = 'default',
    className = '',
    type = 'button'
}: LoadingButtonProps) {
    const variants = {
        default: 'bg-neutral-700 hover:bg-neutral-600 border-neutral-600 text-white',
        danger: 'bg-red-600 text-white hover:bg-red-700 border-red-700',
        test: 'bg-blue-600 text-white hover:bg-blue-700 border-blue-700',
        primary: 'bg-purple-600 text-white hover:bg-purple-700 border-purple-700',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={loading || disabled}
            className={`px-3 py-1.5 border text-xs font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 ${variants[variant]} ${className}`}
        >
            {loading ? Icons.spinner : null}
            {children}
        </button>
    );
}

// Input with button component - properly handles flex layout
interface InputWithButtonProps {
    inputValue: string;
    onInputChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    inputPlaceholder: string;
    buttonText: React.ReactNode;
    loading?: boolean;
    inputType?: string;
    inputClassName?: string;
    disabled?: boolean;
}

export function InputWithButton({
    inputValue,
    onInputChange,
    onSubmit,
    inputPlaceholder,
    buttonText,
    loading,
    inputType = 'text',
    inputClassName = '',
    disabled,
}: InputWithButtonProps) {
    return (
        <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
            <input
                type={inputType}
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={inputPlaceholder}
                className={`flex-1 min-w-0 p-2.5 bg-black/60 border border-white/20 text-white text-sm focus:border-purple-500/50 focus:outline-none placeholder:text-white/30 transition-colors ${inputClassName}`}
                required
                disabled={disabled}
            />
            <LoadingButton
                type="submit"
                loading={loading}
                disabled={disabled}
                variant="primary"
                className="w-full sm:w-auto shrink-0"
            >
                {buttonText}
            </LoadingButton>
        </form>
    );
}

// Card wrapper component
interface CardProps {
    children: React.ReactNode;
    className?: string;
}

export function Card({ children, className = '' }: CardProps) {
    return (
        <div className={`bg-black/40 border border-white/10 p-4 ${className}`}>
            {children}
        </div>
    );
}

// Card header with icon
interface CardHeaderProps {
    icon: React.ReactNode;
    title: string;
    action?: React.ReactNode;
}

export function CardHeader({ icon, title, action }: CardHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
                {icon}
                <h2 className="text-sm font-semibold text-white">{title}</h2>
            </div>
            {action}
        </div>
    );
}
