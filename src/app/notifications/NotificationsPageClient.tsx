'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNetwork } from '@/libs/context/network-context';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { toast } from 'sonner';

interface User {
    email: string;
    telegramChatId?: string;
    telegramVerified: boolean;
}

interface NodeBinding {
    nodeIp: string;
    network: string;
    pubkey?: string;
    testUsed: boolean;
    status?: string;
    uptime?: number;
    version?: string;
    credits?: number;
}

interface SessionData {
    authenticated: boolean;
    user?: User;
    bindings?: NodeBinding[];
}

// SVG Icons
const Icons = {
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
function formatUptime(seconds: number): string {
    if (!seconds || seconds < 0) return '0h';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

// Status badge component
function StatusBadge({ status }: { status?: string }) {
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
function LoadingButton({
    onClick,
    loading,
    disabled,
    children,
    variant = 'default',
    className = '',
    type = 'button'
}: {
    onClick?: () => void;
    loading?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    variant?: 'default' | 'danger' | 'test' | 'primary';
    className?: string;
    type?: 'button' | 'submit';
}) {
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

export default function NotificationsPageClient() {
    const { network } = useNetwork();
    const [session, setSession] = useState<SessionData | null>(null);
    const [loading, setLoading] = useState(true);

    // Auth states
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);

    // Node binding states
    const [nodeIp, setNodeIp] = useState('');
    const [bindLoading, setBindLoading] = useState(false);
    const [nodes, setNodes] = useState<NodeBinding[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Telegram linking states
    const [telegramId, setTelegramId] = useState('');
    const [telegramOtp, setTelegramOtp] = useState('');
    const [showTelegramOtp, setShowTelegramOtp] = useState(false);
    const [telegramLoading, setTelegramLoading] = useState(false);

    // Button loading states
    const [unbindingNode, setUnbindingNode] = useState<string | null>(null);
    const [testingNode, setTestingNode] = useState<string | null>(null);

    // Fetch session
    const fetchSession = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications/auth/session');
            const data = await res.json();
            setSession(data);
            if (data.authenticated && data.bindings) {
                setNodes(data.bindings);
            }
        } catch (error) {
            console.error('Failed to fetch session:', error);
            toast.error('Failed to load session');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch nodes with current status (with optional silent mode for auto-refresh)
    const fetchNodes = useCallback(async (silent = false) => {
        if (!silent) setRefreshing(true);
        try {
            const res = await fetch('/api/notifications/nodes');
            const data = await res.json();
            if (data.success) {
                setNodes(data.nodes);
                if (!silent) toast.success('Nodes refreshed');
            } else {
                if (!silent) toast.error(data.error || 'Failed to refresh nodes');
            }
        } catch (error) {
            console.error('Failed to fetch nodes:', error);
            if (!silent) toast.error('Failed to refresh nodes');
        } finally {
            if (!silent) setRefreshing(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    // Fetch nodes with status after session loads (fixes initial 'unknown' status)
    useEffect(() => {
        if (session?.authenticated && session.bindings && session.bindings.length > 0) {
            // Fetch real-time node status silently
            fetchNodes(true);
        }
    }, [session?.authenticated, session?.bindings?.length, fetchNodes]);

    // Real-time updates - poll every 30 seconds when authenticated
    useEffect(() => {
        if (!session?.authenticated) return;

        const interval = setInterval(() => {
            fetch('/api/notifications/nodes')
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setNodes(data.nodes);
                    }
                })
                .catch(console.error);
        }, 30000);

        return () => clearInterval(interval);
    }, [session?.authenticated]);

    // Request login OTP
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        setAuthLoading(true);

        try {
            const res = await fetch('/api/notifications/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (data.success) {
                setShowOtpInput(true);
                toast.success('Verification code sent to your email');
            } else {
                toast.error(data.error || 'Failed to send verification code');
            }
        } catch {
            toast.error('Failed to connect to server');
        } finally {
            setAuthLoading(false);
        }
    };

    // Verify OTP and login
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            toast.error('Please enter a 6-digit code');
            return;
        }

        setAuthLoading(true);

        try {
            const res = await fetch('/api/notifications/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });

            const data = await res.json();

            if (data.success) {
                setShowOtpInput(false);
                setOtp('');
                // Use user data from verify API response directly for immediate UI update
                setSession({
                    authenticated: true,
                    user: {
                        email: data.user?.email || email,
                        telegramChatId: data.user?.telegramChatId,
                        telegramVerified: data.user?.telegramVerified || false,
                    },
                    bindings: []
                });
                toast.success('Logged in successfully');
                // Fetch full session data (including bindings) in background
                fetchSession();
            } else {
                toast.error(data.error || 'Invalid verification code');
            }
        } catch {
            toast.error('Failed to verify code');
        } finally {
            setAuthLoading(false);
        }
    };

    // Logout
    const handleLogout = async () => {
        try {
            await fetch('/api/notifications/auth/logout', { method: 'POST' });
            setSession({ authenticated: false });
            setNodes([]);
            setEmail('');
            toast.success('Logged out successfully');
        } catch (error) {
            console.error('Logout failed:', error);
            toast.error('Failed to logout');
        }
    };

    // Bind a node
    const handleBindNode = async (e: React.FormEvent) => {
        e.preventDefault();

        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!nodeIp || !ipRegex.test(nodeIp)) {
            toast.error('Please enter a valid IP address');
            return;
        }

        setBindLoading(true);

        try {
            const res = await fetch('/api/notifications/nodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nodeIp, network }),
            });

            const data = await res.json();

            if (data.success) {
                setNodeIp('');
                toast.success(`Node ${nodeIp} added successfully`);
                await fetchNodes();
            } else {
                toast.error(data.error || 'Failed to add node');
            }
        } catch {
            toast.error('Failed to add node');
        } finally {
            setBindLoading(false);
        }
    };

    // Unbind a node
    const handleUnbindNode = async (ip: string) => {
        setUnbindingNode(ip);

        try {
            const res = await fetch(`/api/notifications/nodes?nodeIp=${ip}&network=${network}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (data.success) {
                toast.success(`Node ${ip} removed`);
                // Immediately update state
                setNodes(prev => prev.filter(n => n.nodeIp !== ip));
            } else {
                toast.error(data.error || 'Failed to remove node');
            }
        } catch {
            toast.error('Failed to remove node');
        } finally {
            setUnbindingNode(null);
        }
    };

    // Send test notification
    const handleTestNotification = async (ip: string) => {
        setTestingNode(ip);

        try {
            const res = await fetch('/api/notifications/nodes/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nodeIp: ip, network }),
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Test notification sent');
                // Update the node's testUsed status
                setNodes(prev => prev.map(n =>
                    n.nodeIp === ip ? { ...n, testUsed: true } : n
                ));
            } else {
                toast.error(data.error || 'Failed to send test notification');
            }
        } catch {
            toast.error('Failed to send test notification');
        } finally {
            setTestingNode(null);
        }
    };

    // Link telegram - send OTP
    const handleLinkTelegram = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!telegramId || !/^\d+$/.test(telegramId)) {
            toast.error('Please enter a valid Telegram Chat ID (numbers only)');
            return;
        }

        setTelegramLoading(true);

        try {
            const res = await fetch('/api/notifications/telegram/bind', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegramChatId: telegramId }),
            });

            const data = await res.json();

            if (data.success) {
                setShowTelegramOtp(true);
                toast.success('Verification code sent to Telegram');
            } else {
                toast.error(data.error || 'Failed to send verification code');
            }
        } catch {
            toast.error('Failed to send verification code');
        } finally {
            setTelegramLoading(false);
        }
    };

    // Verify telegram OTP
    const handleVerifyTelegram = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!telegramOtp || telegramOtp.length !== 6) {
            toast.error('Please enter a 6-digit code');
            return;
        }

        setTelegramLoading(true);

        try {
            const res = await fetch('/api/notifications/telegram/bind', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp: telegramOtp }),
            });

            const data = await res.json();

            if (data.success) {
                setShowTelegramOtp(false);
                setTelegramOtp('');
                setTelegramId('');
                toast.success('Telegram linked successfully');
                // Immediately update session state
                setSession(prev => prev ? {
                    ...prev,
                    user: prev.user ? {
                        ...prev.user,
                        telegramChatId: data.telegramChatId,
                        telegramVerified: true
                    } : prev.user
                } : prev);
            } else {
                toast.error(data.error || 'Invalid verification code');
            }
        } catch {
            toast.error('Failed to verify code');
        } finally {
            setTelegramLoading(false);
        }
    };

    // Unlink telegram
    const handleUnlinkTelegram = async () => {
        setTelegramLoading(true);

        try {
            const res = await fetch('/api/notifications/telegram/bind', {
                method: 'DELETE',
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Telegram unlinked');
                // Immediately update session state
                setSession(prev => prev ? {
                    ...prev,
                    user: prev.user ? {
                        ...prev.user,
                        telegramChatId: undefined,
                        telegramVerified: false
                    } : prev.user
                } : prev);
            } else {
                toast.error(data.error || 'Failed to unlink Telegram');
            }
        } catch {
            toast.error('Failed to unlink Telegram');
        } finally {
            setTelegramLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen gradient-bg">
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="text-white/60 flex items-center gap-2">
                            {Icons.spinner}
                            <span>Loading...</span>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen gradient-bg flex flex-col">
            <Navbar />

            <main className="flex-1 container mx-auto px-4 sm:px-6 py-8 flex flex-col items-center">
                <div className="w-full max-w-3xl">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Node Notifications</h1>
                        <p className="text-white/60 text-sm">Receive alerts when your nodes change status</p>
                    </div>

                    {!session?.authenticated ? (
                        /* Login Form */
                        <div className="bg-black/40 border border-white/10 p-6 max-w-md mx-auto">
                            <div className="flex items-center gap-2 mb-4">
                                {Icons.mail}
                                <h2 className="text-lg font-semibold text-white">Login with Email</h2>
                            </div>
                            <p className="text-white/60 text-sm mb-6">
                                Enter your email to receive a verification code
                            </p>

                            {!showOtpInput ? (
                                <form onSubmit={handleLogin}>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full p-3 bg-black/60 border border-white/20 text-white text-sm mb-4 focus:border-purple-500/50 focus:outline-none placeholder:text-white/30 transition-colors"
                                        required
                                    />
                                    <LoadingButton
                                        type="submit"
                                        loading={authLoading}
                                        variant="primary"
                                        className="w-full py-3"
                                    >
                                        Send Verification Code
                                    </LoadingButton>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyOtp}>
                                    <p className="text-sm text-white/60 mb-4">
                                        Code sent to <span className="text-white">{email}</span>
                                    </p>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        placeholder="Enter 6-digit code"
                                        className="w-full p-3 bg-black/60 border border-white/20 text-white text-sm mb-4 focus:border-purple-500/50 focus:outline-none text-center text-xl tracking-widest placeholder:text-white/30 transition-colors"
                                        maxLength={6}
                                        required
                                    />
                                    <div className="flex gap-3">
                                        <LoadingButton
                                            onClick={() => { setShowOtpInput(false); setOtp(''); }}
                                            variant="default"
                                            className="flex-1 py-3"
                                        >
                                            Back
                                        </LoadingButton>
                                        <LoadingButton
                                            type="submit"
                                            loading={authLoading}
                                            variant="primary"
                                            className="flex-1 py-3"
                                        >
                                            Verify & Login
                                        </LoadingButton>
                                    </div>
                                </form>
                            )}
                        </div>
                    ) : (
                        /* Authenticated Dashboard */
                        <div className="space-y-4">
                            {/* User Info Card */}
                            <div className="bg-black/40 border border-white/10 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white/50 text-xs">Logged in as</p>
                                        <p className="text-white text-sm font-medium">{session.user?.email}</p>
                                        {session.user?.telegramVerified && (
                                            <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1">
                                                {Icons.check}
                                                <span>Telegram linked</span>
                                            </div>
                                        )}
                                    </div>
                                    <LoadingButton onClick={handleLogout} variant="default">
                                        {Icons.logout}
                                        <span>Logout</span>
                                    </LoadingButton>
                                </div>
                            </div>

                            {/* Telegram Linking Card */}
                            <div className="bg-black/40 border border-white/10 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    {Icons.telegram}
                                    <h2 className="text-sm font-semibold text-white">Telegram Notifications</h2>
                                </div>

                                {session.user?.telegramVerified ? (
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-1 text-emerald-400 text-xs">
                                                {Icons.check}
                                                <span>Telegram linked</span>
                                            </div>
                                            <p className="text-white/50 text-xs mt-1">
                                                Chat ID: <code className="text-white/70">{session.user.telegramChatId}</code>
                                            </p>
                                        </div>
                                        <LoadingButton
                                            onClick={handleUnlinkTelegram}
                                            loading={telegramLoading}
                                            variant="danger"
                                        >
                                            {Icons.unlink}
                                            <span>Unlink</span>
                                        </LoadingButton>
                                    </div>
                                ) : !showTelegramOtp ? (
                                    <form onSubmit={handleLinkTelegram}>
                                        <p className="text-white/60 text-xs mb-3">
                                            Message <a href="https://t.me/XandashNotifications_bot" className="text-blue-400 hover:underline" target="_blank" rel="noopener">@XandashNotifications_bot</a> on Telegram and send /start to get your Chat ID.
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={telegramId}
                                                onChange={(e) => setTelegramId(e.target.value.replace(/\D/g, ''))}
                                                placeholder="Your Telegram Chat ID"
                                                className="flex-1 p-2.5 bg-black/60 border border-white/20 text-white text-sm focus:border-purple-500/50 focus:outline-none placeholder:text-white/30 transition-colors"
                                                required
                                            />
                                            <LoadingButton
                                                type="submit"
                                                loading={telegramLoading}
                                                variant="primary"
                                                className="px-4"
                                            >
                                                Link
                                            </LoadingButton>
                                        </div>
                                    </form>
                                ) : (
                                    <form onSubmit={handleVerifyTelegram}>
                                        <p className="text-white/60 text-xs mb-3">
                                            Check Telegram for verification code from @XandashNotifications_bot
                                        </p>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={telegramOtp}
                                                onChange={(e) => setTelegramOtp(e.target.value.replace(/\D/g, ''))}
                                                placeholder="6-digit code"
                                                className="flex-1 p-2.5 bg-black/60 border border-white/20 text-white text-sm focus:border-purple-500/50 focus:outline-none text-center tracking-widest placeholder:text-white/30 transition-colors"
                                                maxLength={6}
                                                required
                                            />
                                            <LoadingButton
                                                onClick={() => { setShowTelegramOtp(false); setTelegramOtp(''); }}
                                                variant="default"
                                            >
                                                Back
                                            </LoadingButton>
                                            <LoadingButton
                                                type="submit"
                                                loading={telegramLoading}
                                                variant="primary"
                                            >
                                                Verify
                                            </LoadingButton>
                                        </div>
                                    </form>
                                )}
                            </div>

                            {/* Add Node Card */}
                            <div className="bg-black/40 border border-white/10 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    {Icons.node}
                                    <h2 className="text-sm font-semibold text-white">Add Node</h2>
                                </div>
                                <form onSubmit={handleBindNode} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={nodeIp}
                                        onChange={(e) => setNodeIp(e.target.value)}
                                        placeholder="Node IP (e.g., 192.168.1.1)"
                                        className="flex-1 p-2.5 bg-black/60 border border-white/20 text-white text-sm font-mono focus:border-purple-500/50 focus:outline-none placeholder:text-white/30 transition-colors"
                                        required
                                    />
                                    <LoadingButton
                                        type="submit"
                                        loading={bindLoading}
                                        variant="primary"
                                        className="px-4"
                                    >
                                        {Icons.plus}
                                        <span>Add</span>
                                    </LoadingButton>
                                </form>
                                <p className="text-white/40 text-xs mt-2">
                                    Network: <span className="text-white/60">{network}</span>
                                </p>
                            </div>

                            {/* Bound Nodes List */}
                            <div className="bg-black/40 border border-white/10 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-sm font-semibold text-white">Your Nodes</h2>
                                    <LoadingButton
                                        onClick={fetchNodes}
                                        loading={refreshing}
                                        variant="default"
                                    >
                                        {Icons.refresh}
                                        <span>Refresh</span>
                                    </LoadingButton>
                                </div>

                                {nodes.length === 0 ? (
                                    <p className="text-white/50 text-sm">No nodes added yet. Add a node above to receive notifications.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {nodes.map((node) => (
                                            <div
                                                key={`${node.nodeIp}-${node.network}`}
                                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-black/40 border border-white/10 p-3 gap-3"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-mono text-white text-sm">{node.nodeIp}</span>
                                                        <StatusBadge status={node.status} />
                                                        <span className="text-[10px] text-white/40">{node.network}</span>
                                                    </div>
                                                    <div className="text-xs text-white/50 mt-1 flex flex-wrap gap-3">
                                                        {node.uptime !== undefined && (
                                                            <span className="flex items-center gap-1">
                                                                {Icons.clock}
                                                                {formatUptime(node.uptime)}
                                                            </span>
                                                        )}
                                                        {node.version && (
                                                            <span>v{node.version}</span>
                                                        )}
                                                        {node.credits !== undefined && (
                                                            <span className="flex items-center gap-1">
                                                                {Icons.credits}
                                                                {node.credits.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1.5 sm:ml-2 flex-shrink-0">
                                                    {!node.testUsed && (
                                                        <LoadingButton
                                                            onClick={() => handleTestNotification(node.nodeIp)}
                                                            loading={testingNode === node.nodeIp}
                                                            variant="test"
                                                            className="flex-1 sm:flex-initial"
                                                        >
                                                            {Icons.test}
                                                            <span>Test</span>
                                                        </LoadingButton>
                                                    )}
                                                    <LoadingButton
                                                        onClick={() => handleUnbindNode(node.nodeIp)}
                                                        loading={unbindingNode === node.nodeIp}
                                                        variant="danger"
                                                        className="flex-1 sm:flex-initial"
                                                    >
                                                        {Icons.unlink}
                                                        <span>Unbind</span>
                                                    </LoadingButton>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
