'use client';

import React from 'react';
import { CornerAccents } from '@/components/ui';
import { Icons, LoadingButton } from './ui';
import type { User } from './types';

interface UserInfoCardProps {
    user: User;
    onLogout: () => void;
}

export function UserInfoCard({ user, onLogout }: UserInfoCardProps) {
    return (
        <div className="relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
            <CornerAccents />
            <div className="relative z-10 flex items-center justify-between">
                <div>
                    <p className="text-white/50 text-xs">Logged in as</p>
                    <p className="text-white text-sm font-medium">{user.email}</p>
                    {user.telegramVerified && (
                        <div className="flex items-center gap-1 text-xs text-emerald-400 mt-1">
                            {Icons.check}
                            <span>Telegram linked</span>
                        </div>
                    )}
                </div>
                <LoadingButton onClick={onLogout} variant="default">
                    {Icons.logout}
                    <span>Logout</span>
                </LoadingButton>
            </div>
        </div>
    );
}
