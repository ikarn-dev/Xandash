'use client';

import { useEffect, useState } from 'react';
import RpcStatusMonitor from '@/libs/services/rpc-status-monitor';

/**
 * Hook to subscribe to real-time RPC status updates
 * This ensures the UI updates immediately when RPC calls are made
 */
export const useRpcStatusUpdates = () => {
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    const monitor = RpcStatusMonitor.getInstance();
    
    // Subscribe to status updates
    const unsubscribe = monitor.subscribe((status) => {
      // Trigger re-render when any endpoint status changes
      setLastUpdate(Date.now());
    });

    return unsubscribe;
  }, []);

  return lastUpdate;
};