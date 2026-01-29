'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNetwork } from '@/libs/context/network-context';
import { toast } from 'sonner';
import {
    Icons,
    LoginForm,
    UserInfoCard,
    TelegramCard,
    AddNodeCard,
    NodesListCard,
    NotificationsTitleCard,
} from './components';
import type { SessionData, NodeBinding } from './components';

export default function NotificationsPageClient() {
    const { network } = useNetwork();
    const [session, setSession] = useState<SessionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [authTransitioning, setAuthTransitioning] = useState(false);
    const [nodes, setNodes] = useState<NodeBinding[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [unbindingNode, setUnbindingNode] = useState<string | null>(null);
    const [testingNode, setTestingNode] = useState<string | null>(null);
    const [csrfToken, setCsrfToken] = useState<string>('');

    // Fetch session - returns session data for immediate use
    const fetchSession = useCallback(async (silent = false): Promise<SessionData | null> => {
        try {
            const res = await fetch('/api/notifications/auth/session', {
                credentials: 'include',
                cache: 'no-store', // Prevent caching
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });
            const data = await res.json();

            setSession(data);
            if (data.authenticated && data.bindings) {
                setNodes(data.bindings);
            } else if (!data.authenticated) {
                // Clear nodes when not authenticated
                setNodes([]);
            }
            // Store CSRF token for state-changing operations
            if (data.csrfToken) {
                setCsrfToken(data.csrfToken);
            } else {
                setCsrfToken('');
            }
            return data;
        } catch (error) {
            console.error('Failed to fetch session:', error);
            if (!silent) {
                toast.error('Failed to load session');
            }
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch nodes
    const fetchNodes = useCallback(async (silent = false) => {
        if (!silent) setRefreshing(true);
        try {
            const res = await fetch('/api/notifications/nodes', {
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success) {
                setNodes(data.nodes);
                if (!silent) toast.success('Nodes refreshed');
            } else {
                if (!silent) toast.error(data.error || 'Failed to refresh nodes');
            }
        } catch {
            if (!silent) toast.error('Failed to refresh nodes');
        } finally {
            if (!silent) setRefreshing(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    // Fetch nodes when session becomes authenticated and has bindings
    useEffect(() => {
        if (session?.authenticated && session.bindings && session.bindings.length > 0) {
            fetchNodes(true);
        }
    }, [session?.authenticated, session?.bindings?.length, fetchNodes]);

    // Auto-refresh nodes every 30 seconds
    useEffect(() => {
        if (!session?.authenticated) return;
        const interval = setInterval(() => fetchNodes(true), 30000);
        return () => clearInterval(interval);
    }, [session?.authenticated, fetchNodes]);

    // Handlers
    const handleLoginSuccess = async (): Promise<boolean> => {
        setAuthTransitioning(true);
        
        // Longer delay to ensure cookie is properly set in browser
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Fetch session with retry logic
        let sessionData = await fetchSession();
        let retries = 0;
        const maxRetries = 3;
        
        // Retry if not authenticated (cookie might not be ready yet)
        while (!sessionData?.authenticated && retries < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 300));
            sessionData = await fetchSession();
            retries++;
        }
        
        setAuthTransitioning(false);
        
        const success = !!sessionData?.authenticated;
        
        // Only show toast when login is successful and dashboard will be visible
        if (success) {
            toast.success('Logged in successfully');
        } else {
            toast.error('Login session failed to initialize. Please refresh the page.');
        }
        
        return success;
    };

    const handleLogout = async () => {
        try {
            const res = await fetch('/api/notifications/auth/logout', {
                method: 'POST',
                credentials: 'include',
                cache: 'no-store',
                headers: {
                    'X-CSRF-Token': csrfToken,
                    'Cache-Control': 'no-cache',
                },
            });

            if (res.status === 403) {
                // CSRF token invalid - refetch session to get new token and retry
                const sessionData = await fetchSession(true);

                if (!sessionData?.csrfToken) {
                    throw new Error('Failed to get new CSRF token');
                }

                // Retry logout with new token from the fetched session
                const retryRes = await fetch('/api/notifications/auth/logout', {
                    method: 'POST',
                    credentials: 'include',
                    cache: 'no-store',
                    headers: {
                        'X-CSRF-Token': sessionData.csrfToken,
                        'Cache-Control': 'no-cache',
                    },
                });

                if (!retryRes.ok) {
                    throw new Error('Logout failed after retry');
                }
            } else if (!res.ok) {
                throw new Error('Logout failed');
            }

            // Clear local state immediately
            setSession({ authenticated: false });
            setNodes([]);
            setCsrfToken('');
            
            // Force a fresh session fetch to confirm logout
            await fetchSession(true);
            
            toast.success('Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Failed to logout. Try refreshing the page.');
        }
    };

    const handleTelegramUpdate = (telegramChatId?: string, verified?: boolean) => {
        setSession(prev => prev ? {
            ...prev,
            user: prev.user ? {
                ...prev.user,
                telegramChatId,
                telegramVerified: verified || false
            } : prev.user
        } : prev);
    };

    const handleUnbindNode = async (ip: string) => {
        setUnbindingNode(ip);
        try {
            const res = await fetch(`/api/notifications/nodes?nodeIp=${ip}&network=${network}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Node ${ip} removed`);
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

    const handleTestNotification = async (ip: string) => {
        setTestingNode(ip);
        try {
            const res = await fetch('/api/notifications/nodes/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ nodeIp: ip, network }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Test notification sent');
                setNodes(prev => prev.map(n => n.nodeIp === ip ? { ...n, testUsed: true } : n));
            } else {
                toast.error(data.error || 'Failed to send test notification');
            }
        } catch {
            toast.error('Failed to send test notification');
        } finally {
            setTestingNode(null);
        }
    };

    // Loading state (initial load or auth transition)
    if (loading || authTransitioning) {
        return (
            <div className="space-y-4 sm:space-y-6">
                <NotificationsTitleCard />
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="text-white/60 flex items-center gap-2">
                        {Icons.spinner}
                        <span>{authTransitioning ? 'Signing in...' : 'Loading...'}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Title Card */}
            <NotificationsTitleCard />

            {/* Content */}
            {!session?.authenticated ? (
                <LoginForm onLoginSuccess={handleLoginSuccess} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Left Column */}
                    <div className="space-y-4 sm:space-y-6">
                        <UserInfoCard user={session.user!} onLogout={handleLogout} />
                        <TelegramCard user={session.user!} onUpdate={handleTelegramUpdate} />
                        <AddNodeCard network={network} onNodeAdded={() => fetchNodes()} />
                    </div>

                    {/* Right Column - Nodes List */}
                    <NodesListCard
                        nodes={nodes}
                        onRefresh={() => fetchNodes()}
                        onUnbind={handleUnbindNode}
                        onTest={handleTestNotification}
                        refreshing={refreshing}
                        unbindingNode={unbindingNode}
                        testingNode={testingNode}
                    />
                </div>
            )}
        </div>
    );
}
