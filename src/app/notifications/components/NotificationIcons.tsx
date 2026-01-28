'use client';

import React from 'react';

interface IconProps {
    className?: string;
}

// Flaticons CDN - using colored PNG icons
const FLATICON_CDN = 'https://cdn-icons-png.flaticon.com';

// Bell Icon - Notification header (colored)
export const BellIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
    <img
        src={`${FLATICON_CDN}/512/3602/3602145.png`}
        alt="Bell"
        className={className}
        loading="lazy"
        onError={(e) => {
            e.currentTarget.style.display = 'none';
        }}
    />
);

// Mail Icon - Email notifications (colored)
export const MailIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
    <img
        src={`${FLATICON_CDN}/512/732/732200.png`}
        alt="Mail"
        className={className}
        loading="lazy"
        onError={(e) => {
            e.currentTarget.style.display = 'none';
        }}
    />
);

// Telegram Icon - Telegram notifications (colored - original blue)
export const TelegramIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
    <img
        src={`${FLATICON_CDN}/512/2111/2111646.png`}
        alt="Telegram"
        className={className}
        loading="lazy"
        onError={(e) => {
            e.currentTarget.style.display = 'none';
        }}
    />
);

// Shield Icon - Verified/found status (colored green)
export const ShieldIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
    <img
        src={`${FLATICON_CDN}/512/2910/2910768.png`}
        alt="Shield"
        className={className}
        loading="lazy"
        onError={(e) => {
            e.currentTarget.style.display = 'none';
        }}
    />
);

// Send Icon - Test notification button (colored)
export const SendIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
    <img
        src={`${FLATICON_CDN}/512/3024/3024593.png`}
        alt="Send"
        className={className}
        loading="lazy"
        onError={(e) => {
            e.currentTarget.style.display = 'none';
        }}
    />
);

// Unlink Icon - Unbind button (colored red)
export const UnlinkIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
    <img
        src={`${FLATICON_CDN}/512/5765/5765097.png`}
        alt="Unlink"
        className={className}
        loading="lazy"
        onError={(e) => {
            e.currentTarget.style.display = 'none';
        }}
    />
);

// Loader Icon - Loading states (SVG - no CDN equivalent for animation)
export const LoaderIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
    <svg className={`${className} animate-spin`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
);

// Clock Icon - Cooldown indicator (colored orange)
export const ClockIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
    <img
        src={`${FLATICON_CDN}/512/2784/2784459.png`}
        alt="Clock"
        className={className}
        loading="lazy"
        onError={(e) => {
            e.currentTarget.style.display = 'none';
        }}
    />
);

// Check Icon - Success/verified indicator (SVG for crisp small rendering)
export const CheckIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

// Warning Icon - Error/warning states (SVG for crisp small rendering)
export const WarningIcon: React.FC<IconProps> = ({ className = 'w-4 h-4' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
);

// Server Icon - Node IP indicator (colored)
export const ServerIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
    <img
        src={`${FLATICON_CDN}/512/1383/1383395.png`}
        alt="Server"
        className={className}
        loading="lazy"
        onError={(e) => {
            e.currentTarget.style.display = 'none';
        }}
    />
);

// Notification Bell for title card (larger colored version)
export const NotificationBellLarge: React.FC<IconProps> = ({ className = 'w-10 h-10' }) => (
    <img
        src={`${FLATICON_CDN}/512/3602/3602145.png`}
        alt="Notifications"
        className={className}
        loading="lazy"
        onError={(e) => {
            e.currentTarget.style.display = 'none';
        }}
    />
);
