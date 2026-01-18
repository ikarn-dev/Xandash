'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useRpcMonitorInit } from '@/libs/hooks/useRpcMonitorInit';

interface RPCContextType {
  refreshAll: () => void;
  registerRefresh: (id: string, refreshFn: () => void) => void;
  unregisterRefresh: (id: string) => void;
  updateRefreshTime: () => void;
  lastRefreshTime: number;
  nextRefreshTime: number;
  interval: number;
}

const RPCContext = createContext<RPCContextType | null>(null);

export const RPCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const refreshFunctionsRef = React.useRef<Map<string, () => void>>(new Map());
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const interval = 30000; // 30 seconds in milliseconds

  // Initialize lastRefreshTime with current time
  React.useEffect(() => {
    setLastRefreshTime(Date.now());
  }, []);

  // Initialize RPC monitor
  useRpcMonitorInit();

  const registerRefresh = useCallback((id: string, refreshFn: () => void) => {
    refreshFunctionsRef.current.set(id, refreshFn);
  }, []);

  const unregisterRefresh = useCallback((id: string) => {
    refreshFunctionsRef.current.delete(id);
  }, []);

  const updateRefreshTime = useCallback(() => {
    const now = Date.now();
    setLastRefreshTime(now);
  }, []);

  const refreshAll = useCallback(() => {
    updateRefreshTime();
    refreshFunctionsRef.current.forEach((refreshFn) => {
      refreshFn();
    });
  }, [updateRefreshTime]);

  const nextRefreshTime = lastRefreshTime + interval;

  return (
    <RPCContext.Provider value={{ 
      refreshAll, 
      registerRefresh, 
      unregisterRefresh, 
      updateRefreshTime,
      lastRefreshTime,
      nextRefreshTime,
      interval: interval / 1000 // Convert to seconds for display
    }}>
      {children}
    </RPCContext.Provider>
  );
};

export const useRPCContext = () => {
  const context = useContext(RPCContext);
  if (!context) {
    throw new Error('useRPCContext must be used within RPCProvider');
  }
  return context;
};
