'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { LiveRefresh, NetworkSelector } from '@/components/ui';

interface NavbarProps {
  onRefresh: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onRefresh }) => {
  return (
    <div className="p-4">
      <header className="bg-gradient-to-r from-black/80 via-red-900/20 to-black/80 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl overflow-visible">
        <div className="container mx-auto px-6 py-4 overflow-visible">
          <div className="flex items-center justify-between overflow-visible">
            {/* Left Side - Brand */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600/30 to-black/60 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-lg border border-white/10">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">XanDash</h1>
                <p className="text-white/60 text-sm">Real-time Analytics Dashboard</p>
              </div>
            </div>
            
            {/* Right Side - Controls */}
            <div className="flex items-center space-x-4 overflow-visible">
              {/* Network Selector */}
              <NetworkSelector />
              
              {/* Live Refresh - Moved to end */}
              <LiveRefresh onRefresh={onRefresh} interval={30} />
            </div>
          </div>
        </div>
      </header>
    </div>
  );
};