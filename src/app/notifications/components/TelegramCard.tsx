'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { CornerAccents } from '@/components/ui';
import { Icons, LoadingButton, CardHeader } from './ui';
import type { User } from './types';

interface TelegramCardProps {
    user: User;
    onUpdate: (telegramChatId?: string, verified?: boolean) => void;
}

export function TelegramCard({ user, onUpdate }: TelegramCardProps) {
    const [telegramId, setTelegramId] = useState('');
    const [telegramOtp, setTelegramOtp] = useState('');
    const [showTelegramOtp, setShowTelegramOtp] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLink = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!telegramId || !/^\d+$/.test(telegramId)) {
            toast.error('Please enter a valid Telegram Chat ID (numbers only)');
            return;
        }

        setLoading(true);
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
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!telegramOtp || telegramOtp.length !== 6) {
            toast.error('Please enter a 6-digit code');
            return;
        }

        setLoading(true);
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
                onUpdate(data.telegramChatId, true);
                toast.success('Telegram linked successfully');
            } else {
                toast.error(data.error || 'Invalid verification code');
            }
        } catch {
            toast.error('Failed to verify code');
        } finally {
            setLoading(false);
        }
    };

    const handleUnlink = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications/telegram/bind', { method: 'DELETE' });
            const data = await res.json();

            if (data.success) {
                onUpdate(undefined, false);
                toast.success('Telegram unlinked');
            } else {
                toast.error(data.error || 'Failed to unlink Telegram');
            }
        } catch {
            toast.error('Failed to unlink Telegram');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
            <CornerAccents />
            <div className="relative z-10">
                <CardHeader icon={Icons.telegram} title="Telegram Notifications" />

                {user.telegramVerified ? (
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-1 text-emerald-400 text-xs">
                                {Icons.check}
                                <span>Telegram linked</span>
                            </div>
                            <p className="text-white/50 text-xs mt-1">
                                Chat ID: <code className="text-white/70">{user.telegramChatId}</code>
                            </p>
                        </div>
                        <LoadingButton onClick={handleUnlink} loading={loading} variant="danger">
                            {Icons.unlink}
                            <span>Unlink</span>
                        </LoadingButton>
                    </div>
                ) : !showTelegramOtp ? (
                    <form onSubmit={handleLink}>
                        <p className="text-white/60 text-xs mb-3">
                            Message <a href="https://t.me/XandashNotifications_bot" className="text-blue-400 hover:underline" target="_blank" rel="noopener">@XandashNotifications_bot</a> on Telegram and send /start to get your Chat ID.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                value={telegramId}
                                onChange={(e) => setTelegramId(e.target.value.replace(/\D/g, ''))}
                                placeholder="Your Telegram Chat ID"
                                className="flex-1 min-w-0 p-2.5 bg-black/60 border border-white/20 text-white text-sm focus:border-purple-500/50 focus:outline-none placeholder:text-white/30 transition-colors"
                                required
                            />
                            <LoadingButton
                                type="submit"
                                loading={loading}
                                variant="primary"
                                className="shrink-0"
                            >
                                Link
                            </LoadingButton>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleVerify}>
                        <p className="text-white/60 text-xs mb-3">
                            Check Telegram for verification code from @XandashNotifications_bot
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                value={telegramOtp}
                                onChange={(e) => setTelegramOtp(e.target.value.replace(/\D/g, ''))}
                                placeholder="6-digit code"
                                className="flex-1 min-w-0 p-2.5 bg-black/60 border border-white/20 text-white text-sm focus:border-purple-500/50 focus:outline-none text-center tracking-widest placeholder:text-white/30 transition-colors"
                                maxLength={6}
                                required
                            />
                            <div className="flex gap-2 shrink-0">
                                <LoadingButton onClick={() => { setShowTelegramOtp(false); setTelegramOtp(''); }} variant="default">
                                    Back
                                </LoadingButton>
                                <LoadingButton type="submit" loading={loading} variant="primary">
                                    Verify
                                </LoadingButton>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
