'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseMainnetPingOptions {
  enabled?: boolean;
  refreshInterval?: number;
}

interface UseMainnetPingResult {
  pings: Record<string, number | null>;
  isLoading: boolean;
  isPinging: boolean;
  error: string | null;
  lastUpdated: number | null;
  pingNodes: (nodes: Array<{ ip?: string; address?: string; rpc_port?: number }>) => void;
  refresh: () => void;
}

/**
 * Ping a single IP by measuring how long it takes for a connection attempt
 * Uses Image loading which triggers a network request
 */
async function pingIP(ip: string, port: number = 8899, timeout: number = 5000): Promise<number | null> {
  return new Promise((resolve) => {
    const start = performance.now();
    const img = new Image();
    let resolved = false;

    const done = (success: boolean) => {
      if (resolved) return;
      resolved = true;
      img.onload = null;
      img.onerror = null;
      img.src = '';
      
      const elapsed = Math.round(performance.now() - start);
      // If we got a response (even error) quickly, the host is reachable
      resolve(success || elapsed < timeout - 500 ? elapsed : null);
    };

    const timer = setTimeout(() => done(false), timeout);

    img.onload = () => {
      clearTimeout(timer);
      done(true);
    };

    img.onerror = () => {
      clearTimeout(timer);
      done(true); // Error response still means host responded
    };

    // Try to load a resource - the timing tells us latency
    img.src = `http://${ip}:${port}/favicon.ico?_=${Date.now()}`;
  });
}

export function useMainnetPing(options: UseMainnetPingOptions = {}): UseMainnetPingResult {
  const { enabled = true, refreshInterval = 60000 } = options;

  const [pings, setPings] = useState<Record<string, number | null>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const nodesRef = useRef<Array<{ ip?: string; address?: string; rpc_port?: number }>>([]);
  const mountedRef = useRef(true);

  const pingNodes = useCallback(async (nodes: Array<{ ip?: string; address?: string; rpc_port?: number }>) => {
    if (!enabled || nodes.length === 0 || isPinging) return;

    const targets = nodes
      .map(n => ({
        ip: n.ip || (n.address ? n.address.split(':')[0] : ''),
        port: n.rpc_port || 8899,
      }))
      .filter(t => t.ip);

    if (targets.length === 0) return;

    nodesRef.current = nodes;
    setIsPinging(true);
    setIsLoading(true);
    setError(null);

    const results: Record<string, number | null> = {};
    
    // Ping in batches of 10
    const batchSize = 10;
    for (let i = 0; i < targets.length; i += batchSize) {
      const batch = targets.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async ({ ip, port }) => {
          const latency = await pingIP(ip, port);
          return { ip, latency };
        })
      );

      for (const { ip, latency } of batchResults) {
        results[ip] = latency;
      }

      // Update state progressively
      if (mountedRef.current) {
        setPings(prev => ({ ...prev, ...Object.fromEntries(batchResults.map(r => [r.ip, r.latency])) }));
      }
    }

    if (mountedRef.current) {
      setPings(results);
      setLastUpdated(Date.now());
      setIsPinging(false);
      setIsLoading(false);
      
      const alive = Object.values(results).filter(v => v !== null).length;
    }
  }, [enabled, isPinging]);

  const refresh = useCallback(() => {
    if (nodesRef.current.length > 0) {
      pingNodes(nodesRef.current);
    }
  }, [pingNodes]);

  // Auto-refresh
  useEffect(() => {
    if (!enabled || refreshInterval <= 0) return;
    const interval = setInterval(() => {
      if (!isPinging && nodesRef.current.length > 0) {
        pingNodes(nodesRef.current);
      }
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [enabled, refreshInterval, isPinging, pingNodes]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  return {
    pings,
    isLoading,
    isPinging,
    error,
    lastUpdated,
    pingNodes,
    refresh,
  };
}
