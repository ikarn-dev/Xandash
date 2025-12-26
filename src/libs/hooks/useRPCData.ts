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
      console.log(`[${new Date().toISOString()}] Skipping RPC call - too frequent (last call: ${now - lastCallTimeRef.current}ms ago)`);
      return;
    }
    
    console.log(`[${new Date().toISOString()}] Making RPC call for ${id || 'unknown'}`);
    lastCallTimeRef.current = now;
    
    // Update RPC context timing when call happens
    rpcContext.updateRefreshTime();
    
    try {
      const response = await methodRef.current();
      console.log(`[${new Date().toISOString()}] RPC response for ${id || 'unknown'}:`, response);
      
      if (response.success && response.data) {
        setData(response.data);
        setError(null);
      } else {
        const errorMsg = response.error || 'Unknown error';
        console.error(`[${new Date().toISOString()}] RPC error for ${id || 'unknown'}:`, errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[${new Date().toISOString()}] RPC exception for ${id || 'unknown'}:`, err);
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
    console.log(`[${new Date().toISOString()}] Setting up interval: ${interval}ms`);
    intervalRef.current = setInterval(() => {
      fetchData();
    }, interval);
    
    return () => {
      console.log(`[${new Date().toISOString()}] Cleaning up interval`);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Empty dependency array - only run once

  const refetchData = useCallback(() => fetchData(), [fetchData]);

  return { data, error, refetch: refetchData };
}
