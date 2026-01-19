'use client';

import { useEffect } from 'react';
import RpcStatusMonitor from '@/libs/services/rpc-status-monitor';
import BackgroundRpcMonitor from '@/libs/services/background-rpc-monitor';

/**
 * Hook to initialize the RPC status monitor and background polling
 * Should be called once at the app level
 */
export const useRpcMonitorInit = () => {
  useEffect(() => {
    // Initialize the RPC status monitor
    RpcStatusMonitor.getInstance();

    // Initialize and start background monitoring
    const backgroundMonitor = BackgroundRpcMonitor.getInstance();
    backgroundMonitor.start();



    return () => {
      // Stop background monitoring on cleanup
      backgroundMonitor.stop();
    };
  }, []);
};