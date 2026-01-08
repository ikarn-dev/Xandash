'use client';

import { useState } from 'react';

export type LeaderboardType = 'credits' | 'uptime' | 'storage';

interface LeaderboardTabsProps {
  activeTab: LeaderboardType;
  onTabChange: (tab: LeaderboardType) => void;
}

const tabs: { id: LeaderboardType; label: string; color: string }[] = [
  { id: 'credits', label: 'Credits', color: 'text-green-400' },
  { id: 'uptime', label: 'Uptime', color: 'text-blue-400' },
  { id: 'storage', label: 'Storage', color: 'text-cyan-400' },
];

export function LeaderboardTabs({ activeTab, onTabChange }: LeaderboardTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 p-3 sm:p-4 border-b border-gray-800 bg-black/30">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded text-xs sm:text-sm font-medium transition-all duration-200 ${
            activeTab === tab.id
              ? `bg-white/10 ${tab.color} border border-white/20`
              : 'text-white/50 hover:text-white/80 hover:bg-white/5'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
