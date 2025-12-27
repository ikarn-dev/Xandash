'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RPCResponse } from '../api';
import { useRPCContext } from '../context';

export function useRPCData<T>(
  method: () => Promise<RPCResponse<T>>,
  interval: number = 30000,
  id?: string
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastCallTimeRef = React.useRef<number>(0);
  const methodRef = React.useRef(method);
  const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const rpcContext = useRPCContext();

  // Update method ref when method changes
  React.useEffect(() => {
    methodRef.current = method;
  }, [method]);

  const fetchData = React.useCallback(async () => {
    const now = Date.now();
    // Prevent calls more frequent than every 5 seconds (debounce)
    if (now - lastCallTimeRef.current < 5000) {
      return;
    }
    
    lastCallTimeRef.current = now;
    
    // Update RPC context timing when call happens
    rpcContext.updateRefreshTime();
    
    try {
      const response = await methodRef.current();
      
      if (response.success && response.data) {
        setData(response.data);
        setError(null);
      } else {
        const errorMsg = response.error || 'Unknown error';
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
    }
  }, [rpcContext, id]);

  // Register with RPC context for global refresh
  useEffect(() => {
    if (id) {
      rpcContext.registerRefresh(id, fetchData);
      return () => rpcContext.unregisterRefresh(id);
    }
  }, [id, fetchData, rpcContext]);

  // Stable effect that only runs once
  useEffect(() => {
    // Initial call
    fetchData();
    
    // Set up interval for subsequent calls
    intervalRef.current = setInterval(() => {
      fetchData();
    }, interval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  const refetchData = useCallback(() => fetchData(), [fetchData]);

  return { data, error, refetch: refetchData };
}
