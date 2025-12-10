'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Zap } from 'lucide-react';

interface LiveRefreshProps {
  onRefresh: () => void;
  interval?: number; // in seconds
}

export const LiveRefresh: React.FC<LiveRefreshProps> = ({ 
  onRefresh, 
  interval = 30 
}) => {
  const [timeLeft, setTimeLeft] = useState(interval);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleRefresh();
    }

    return () => clearInterval(intervalId);
  }, [timeLeft, interval]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeLeft(interval);
    setIsRefreshing(false);
  };

  return (
    <div className="flex items-center">
      {/* Ultra Compact Live Status with Embedded Timer */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500 text-white shadow-md text-xs">
        {/* Pulsing Dot */}
        <div className="relative">
          <div className="w-1.5 h-1.5 rounded-full bg-white">
            <div className="absolute inset-0 w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-75"></div>
          </div>
        </div>

        {/* LIVE Text */}
        <span className="font-semibold tracking-wide">LIVE</span>

        {/* Lightning Icon */}
        <Zap className="w-3 h-3" />

        {/* Embedded Timer - Ultra Compact */}
        <div className="flex items-center gap-0.5 bg-black/30 rounded-full px-1.5 py-0.5 ml-0.5">
          <span className="font-mono text-[10px] leading-none min-w-[20px] text-center">
            {timeLeft}s
          </span>
          {isRefreshing && (
            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
          )}
        </div>
      </div>
    </div>
  );
};