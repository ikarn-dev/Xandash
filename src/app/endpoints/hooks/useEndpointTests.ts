'use client';

import { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import { toast } from 'sonner';
import { useEndpointTester } from '@/libs/hooks/useEndpointTester';
import { EndpointCategory, TestResult, EndpointStats } from '../components/types';

const COOLDOWN_DURATION = 60000; // 1 minute

export function useEndpointTests(endpoints: EndpointCategory[]) {
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState(false);
  const [individualTesting, setIndividualTesting] = useState<Record<string, boolean>>({});
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [, forceUpdate] = useState(0);
  const [copyingStates, setCopyingStates] = useState<Record<string, boolean>>({});
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();
  const { testSingle, isSupported: workerSupported } = useEndpointTester();

  // Update cooldown display every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let hasActiveCooldowns = false;
      
      Object.values(cooldowns).forEach(endTime => {
        if (endTime > now) hasActiveCooldowns = true;
      });
      
      if (hasActiveCooldowns) forceUpdate(n => n + 1);
      
      setCooldowns(prev => {
        const updated: Record<string, number> = {};
        Object.entries(prev).forEach(([method, endTime]) => {
          if (endTime > now) updated[method] = endTime;
        });
        return Object.keys(updated).length !== Object.keys(prev).length ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldowns]);

  const getCooldownRemaining = useCallback((method: string): number => {
    const endTime = cooldowns[method];
    if (!endTime) return 0;
    return Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
  }, [cooldowns]);

  const testRpcMethod = async (method: string): Promise<TestResult> => {
    const startTime = Date.now();
    try {
      const response = await fetch('/api/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method, params: {}, id: Date.now() }),
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const rawResult = await response.json();
        return {
          success: !rawResult.error,
          rawResponse: rawResult,
          data: rawResult.result,
          error: rawResult.error?.message,
          timestamp: new Date().toISOString(),
          responseTime
        };
      }
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString(),
        responseTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
    }
  };

  const testApiEndpoint = async (method: string, endpoint: string): Promise<TestResult> => {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        return { success: true, rawResponse: data, data, timestamp: new Date().toISOString(), responseTime };
      }
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        timestamp: new Date().toISOString(),
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error 
        ? (error.name === 'AbortError' ? 'Request timeout (10s)' : error.message)
        : 'Unknown error';
      return { success: false, error: errorMessage, timestamp: new Date().toISOString(), responseTime };
    }
  };

  const testSingleMethod = useCallback(async (method: string, endpoint: string) => {
    const endTime = cooldowns[method];
    if (endTime && endTime > Date.now()) {
      const remaining = Math.ceil((endTime - Date.now()) / 1000);
      toast.error(`${method} is on cooldown. Wait ${remaining}s`);
      return;
    }
    
    if (individualTesting[method] || testing) return;
    
    setIndividualTesting(prev => ({ ...prev, [method]: true }));
    
    try {
      let result: TestResult;
      
      if (workerSupported) {
        const testType: 'rpc' | 'api' = method === 'pod-credits' ? 'api' : 'rpc';
        result = await testSingle({
          name: method,
          type: testType,
          method: testType === 'rpc' ? method : undefined,
          endpoint: testType !== 'rpc' ? endpoint : undefined,
        });
      } else {
        result = method === 'pod-credits' 
          ? await testApiEndpoint(method, endpoint)
          : await testRpcMethod(method);
      }

      startTransition(() => {
        setTestResults(prev => ({ ...prev, [method]: result }));
        setExpandedResults(prev => ({ ...prev, [method]: true }));
      });

      setCooldowns(prev => ({ ...prev, [method]: Date.now() + COOLDOWN_DURATION }));

      if (result.success) {
        toast.success(`${method} completed (${result.responseTime}ms)`);
      } else {
        toast.error(`${method} failed: ${result.error}`);
      }
    } catch (error) {
      toast.error(`${method} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIndividualTesting(prev => ({ ...prev, [method]: false }));
    }
  }, [individualTesting, testing, workerSupported, testSingle, cooldowns]);

  const testAllMethods = useCallback(async () => {
    if (testing) return;
    
    const now = Date.now();
    const availableMethods = endpoints.flatMap(cat => cat.methods).filter(m => {
      const endTime = cooldowns[m.name];
      return !endTime || endTime <= now;
    });
    
    if (availableMethods.length === 0) {
      toast.error('All endpoints are on cooldown');
      return;
    }
    
    setTesting(true);
    toast.info(`Testing ${availableMethods.length} available endpoints...`);
    
    try {
      const results: Record<string, TestResult> = {};
      
      for (const method of availableMethods) {
        const result = method.name === 'pod-credits'
          ? await testApiEndpoint(method.name, method.endpoint)
          : await testRpcMethod(method.name);
        results[method.name] = result;
        setCooldowns(prev => ({ ...prev, [method.name]: Date.now() + COOLDOWN_DURATION }));
      }
      
      startTransition(() => {
        setTestResults(prev => ({ ...prev, ...results }));
      });

      const successful = Object.values(results).filter(r => r.success).length;
      const failed = Object.values(results).filter(r => !r.success).length;
      
      if (failed === 0) {
        toast.success(`All ${successful} tests passed!`);
      } else {
        toast.warning(`${successful} passed, ${failed} failed`);
      }
    } catch (error) {
      toast.error(`Batch test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTesting(false);
    }
  }, [testing, endpoints, cooldowns]);

  const clearResults = useCallback(() => {
    startTransition(() => {
      setTestResults({});
      setExpandedResults({});
    });
    toast.success('Results cleared');
  }, []);

  const copyResult = useCallback(async (method: string, result: TestResult) => {
    setCopyingStates(prev => ({ ...prev, [method]: true }));
    try {
      await navigator.clipboard.writeText(JSON.stringify(result.rawResponse || result, null, 2));
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    } finally {
      setTimeout(() => setCopyingStates(prev => ({ ...prev, [method]: false })), 1000);
    }
  }, []);

  const clearIndividualResult = useCallback((method: string) => {
    startTransition(() => {
      setTestResults(prev => {
        const newResults = { ...prev };
        delete newResults[method];
        return newResults;
      });
      setExpandedResults(prev => {
        const newExpanded = { ...prev };
        delete newExpanded[method];
        return newExpanded;
      });
    });
  }, []);

  const toggleExpanded = useCallback((method: string) => {
    setExpandedResults(prev => ({ ...prev, [method]: !prev[method] }));
  }, []);

  const stats: EndpointStats = useMemo(() => {
    const results = Object.values(testResults);
    return {
      totalMethods: endpoints.flatMap(cat => cat.methods).length,
      successfulTests: results.filter(r => r.success).length,
      failedTests: results.filter(r => !r.success).length,
      avgResponseTime: results.length > 0 
        ? Math.round(results.reduce((sum, r) => sum + (r.responseTime || 0), 0) / results.length)
        : 0
    };
  }, [testResults, endpoints]);

  return {
    testResults,
    testing,
    individualTesting,
    cooldowns,
    copyingStates,
    expandedResults,
    isPending,
    stats,
    getCooldownRemaining,
    testSingleMethod,
    testAllMethods,
    clearResults,
    copyResult,
    clearIndividualResult,
    toggleExpanded
  };
}
