'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const onRefreshRef = useRef(onRefresh);

  // Keep ref updated with latest onRefresh
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  // Countdown timer that loops
  useEffect(() => {
    setTimeLeft(interval);

    const tick = () => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Schedule refresh outside of setState to avoid calling during render
          setTimeout(() => {
            onRefreshRef.current();
          }, 0);
          return interval;
        }
        return prev - 1;
      });
    };

    const intervalId = setInterval(tick, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [interval]);

  const handleManualRefresh = useCallback(() => {
    setIsRefreshing(true);
    onRefreshRef.current();
    setTimeLeft(interval);
    setTimeout(() => setIsRefreshing(false), 500);
  }, [interval]);

  return (
    <div className="flex items-center">
      {/* Live Status Badge - White theme */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white shadow-md text-xs">
        {/* Pulsing Dot */}
        <div className="relative">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400">
            <div className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping opacity-75"></div>
          </div>
        </div>

        {/* LIVE Text */}
        <span className="font-semibold tracking-wide text-green-400">LIVE</span>

        {/* Lightning Icon */}
        <Zap className="w-3 h-3 text-white/60" />

        {/* Timer */}
        <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-0.5">
          <span className="font-mono text-[10px] leading-none min-w-[20px] text-center text-white/80">
            {timeLeft}s
          </span>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
            title="Manual refresh"
          >
            <RefreshCw className={`w-2.5 h-2.5 text-white/60 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
