'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { CornerAccents } from '@/components/ui';
import { Icons, LoadingButton } from './ui';

interface LoginFormProps {
    onLoginSuccess: () => Promise<boolean>;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [otpCooldown, setOtpCooldown] = useState(0);
    const [showForceLoginPrompt, setShowForceLoginPrompt] = useState(false);

    // Cooldown countdown
    useEffect(() => {
        if (otpCooldown <= 0) return;
        const timer = setInterval(() => {
            setOtpCooldown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [otpCooldown]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }
        if (otpCooldown > 0) {
            toast.error(`Please wait ${otpCooldown} seconds before requesting again`);
            return;
        }

        setAuthLoading(true);
        try {
            const res = await fetch('/api/notifications/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email }),
            });
            const data = await res.json();

            if (res.status === 429 && data.rateLimited) {
                setOtpCooldown(data.remainingSeconds || 120);
                toast.error(data.error || 'Too many requests. Please wait.');
            } else if (data.success) {
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

    const handleVerifyOtp = async (e: React.FormEvent, forceLogin = false) => {
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
                credentials: 'include',
                body: JSON.stringify({ email, otp, forceLogin }),
            });
            const data = await res.json();

            if (res.status === 409 && data.requiresForceLogin) {
                setShowForceLoginPrompt(true);
                toast.error('You are already logged in on another device', { duration: 5000 });
                setAuthLoading(false);
            } else if (data.success) {
                console.log('[LoginForm] Login successful, calling onLoginSuccess...');
                setShowOtpInput(false);
                setShowForceLoginPrompt(false);
                setOtp('');
                // IMPORTANT: Await the callback to ensure session is refetched
                // The parent component will show the toast when dashboard is visible
                await onLoginSuccess();
                console.log('[LoginForm] onLoginSuccess completed');
            } else {
                toast.error(data.error || 'Invalid verification code');
                setAuthLoading(false);
            }
        } catch {
            toast.error('Failed to verify code');
            setAuthLoading(false);
        }
        // Note: authLoading is NOT reset here on success - parent handles the transition
    };

    return (
        <div className="flex justify-center">
            <div className="w-full max-w-sm sm:max-w-md">
                <div className="relative bg-black border border-white/10 p-4 sm:p-5 group hover:border-white/20 transition-all duration-300 overflow-hidden">
                    <CornerAccents />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            {Icons.mail}
                            <h2 className="text-sm font-bold text-white font-mono">// LOGIN</h2>
                        </div>
                        <p className="text-white/60 text-xs mb-4">
                            Enter your email to receive a verification code
                        </p>

                        {!showOtpInput ? (
                            <form onSubmit={handleLogin} className="space-y-3">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    className="w-full p-2.5 bg-black/60 border border-white/20 text-white text-sm focus:border-purple-500/50 focus:outline-none placeholder:text-white/30 transition-colors"
                                    required
                                />
                                {otpCooldown > 0 && (
                                    <p className="text-xs text-orange-400 flex items-center gap-1.5">
                                        {Icons.clock}
                                        <span>Please wait {otpCooldown}s before requesting again</span>
                                    </p>
                                )}
                                <div className="flex justify-center">
                                    <LoadingButton
                                        type="submit"
                                        loading={authLoading}
                                        disabled={otpCooldown > 0}
                                        variant="primary"
                                        className="px-6 py-2.5"
                                    >
                                        Send Verification Code
                                    </LoadingButton>
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={(e) => handleVerifyOtp(e, false)} className="space-y-3">
                                <p className="text-xs text-white/60">
                                    Code sent to <span className="text-white">{email}</span>
                                </p>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    placeholder="Enter 6-digit code"
                                    className="w-full p-2.5 bg-black/60 border border-white/20 text-white focus:border-purple-500/50 focus:outline-none text-center text-lg tracking-widest placeholder:text-white/30 transition-colors"
                                    maxLength={6}
                                    required
                                />

                                {showForceLoginPrompt && (
                                    <div className="bg-orange-500/10 border border-orange-500/30 p-3">
                                        <p className="text-xs text-orange-300 mb-2">
                                            You&apos;re already logged in on another device. Logging in here will log out the other session.
                                        </p>
                                        <div className="flex justify-center">
                                            <LoadingButton
                                                onClick={(e) => {
                                                    e?.preventDefault();
                                                    handleVerifyOtp(e as unknown as React.FormEvent, true);
                                                }}
                                                loading={authLoading}
                                                variant="danger"
                                                className="px-4 py-2"
                                            >
                                                Login Anyway
                                            </LoadingButton>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-center gap-2">
                                    <LoadingButton
                                        onClick={() => {
                                            setShowOtpInput(false);
                                            setOtp('');
                                            setShowForceLoginPrompt(false);
                                        }}
                                        variant="default"
                                        className="px-5 py-2.5"
                                        disabled={authLoading}
                                    >
                                        Back
                                    </LoadingButton>
                                    <LoadingButton
                                        type="submit"
                                        loading={authLoading}
                                        variant="primary"
                                        className="px-5 py-2.5"
                                    >
                                        Verify & Login
                                    </LoadingButton>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
