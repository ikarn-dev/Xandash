'use client';

import React from 'react';
import { CornerAccents } from '@/components/ui';

interface NotificationsTitleCardProps {
    className?: string;
}

export function NotificationsTitleCard({ className = '' }: NotificationsTitleCardProps) {
    return (
        <div className={`relative bg-black border border-white/10 p-4 sm:p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden ${className}`}>
            <CornerAccents />

            <div className="space-y-3 sm:space-y-4 relative z-10">
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    {/* Bell Icon */}
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/30">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                    </div>

                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white/90 font-mono">
                        // <span className="text-white">NOTIFICATIONS</span>
                    </h1>
                </div>

                <div className="flex items-center space-x-2 text-white/60">
                    <span className="text-xs sm:text-sm">›</span>
                    <span className="text-xs sm:text-sm">Receive alerts when your nodes change status</span>
                </div>
            </div>
        </div>
    );
}
