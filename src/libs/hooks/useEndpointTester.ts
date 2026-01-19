'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface TestResult {
  success: boolean;
  rawResponse?: any;
  data?: any;
  error?: string;
  timestamp: string;
  responseTime: number;
}

interface TestRequest {
  name: string;
  type: 'rpc' | 'api' | 'external';
  method?: string;
  endpoint?: string;
  headers?: Record<string, string>;
}

interface UseEndpointTesterReturn {
  testSingle: (request: TestRequest) => Promise<TestResult>;
  testBatch: (requests: TestRequest[]) => Promise<Record<string, TestResult>>;
  isSupported: boolean;
  progress: { completed: number; total: number } | null;
}

export const useEndpointTester = (): UseEndpointTesterReturn => {
  const workerRef = useRef<Worker | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const requestIdRef = useRef(0);
  const pendingRequestsRef = useRef<Map<number, { resolve: (value: any) => void; reject: (error: any) => void }>>(new Map());

  // Initialize worker
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      try {
        const worker = new Worker('/workers/endpoint-tester.js');

        worker.onmessage = (event) => {
          const { id, type, success, result, error, completed, total } = event.data;

          if (type === 'PROGRESS') {
            setProgress({ completed, total });
            return;
          }

          const pendingRequest = pendingRequestsRef.current.get(id);
          if (pendingRequest) {
            pendingRequestsRef.current.delete(id);

            if (success) {
              pendingRequest.resolve(result);
            } else {
              pendingRequest.reject(new Error(error));
            }
          }
        };

        worker.onerror = (error) => {
          console.error('Worker error:', error);
          setIsSupported(false);
        };

        workerRef.current = worker;
        // Use setTimeout to avoid setState in effect
        const timer = setTimeout(() => setIsSupported(true), 0);
        return () => clearTimeout(timer);
      } catch (error) {
        console.warn('Web Worker not supported:', error);
        const timer = setTimeout(() => setIsSupported(false), 0);
        return () => clearTimeout(timer);
      }
    } else {
      const timer = setTimeout(() => setIsSupported(false), 0);
      return () => clearTimeout(timer);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Fallback implementations for when Web Workers aren't supported
  const fallbackTestRpc = async (method: string): Promise<TestResult> => {
    const startTime = performance.now();

    try {
      const response = await fetch('/api/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params: {},
          id: Date.now(),
        }),
      });

      const responseTime = Math.round(performance.now() - startTime);

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
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString(),
          responseTime
        };
      }
    } catch (error) {
      const responseTime = Math.round(performance.now() - startTime);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        responseTime
      };
    }
  };

  const fallbackTestApi = async (endpoint: string, _method?: string): Promise<TestResult> => {
    const startTime = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      // Determine HTTP method and body based on endpoint
      const httpMethod = 'GET';
      let body: string | undefined;



      const response = await fetch(endpoint, {
        method: httpMethod,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: controller.signal,
        ...(body && { body })
      });

      clearTimeout(timeoutId);
      const responseTime = Math.round(performance.now() - startTime);

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          rawResponse: data,
          data: data,
          timestamp: new Date().toISOString(),
          responseTime
        };
      } else {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`,
          timestamp: new Date().toISOString(),
          responseTime
        };
      }
    } catch (error) {
      const responseTime = Math.round(performance.now() - startTime);
      let errorMessage = 'Unknown error';

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout (10s)';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        responseTime
      };
    }
  };

  const fallbackTestExternal = async (endpoint: string, headers?: Record<string, string>): Promise<TestResult> => {
    const startTime = performance.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      // Determine HTTP method and body based on endpoint
      const httpMethod = 'GET';
      let body: string | undefined;



      const fetchOptions: RequestInit = {
        method: httpMethod,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          ...headers
        },
        signal: controller.signal
      };

      if (body) {
        fetchOptions.body = body;
        (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
      }

      const response = await fetch(endpoint, fetchOptions);

      clearTimeout(timeoutId);
      const responseTime = Math.round(performance.now() - startTime);

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          rawResponse: data,
          data: data,
          timestamp: new Date().toISOString(),
          responseTime
        };
      } else {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`,
          timestamp: new Date().toISOString(),
          responseTime
        };
      }
    } catch (error) {
      const responseTime = Math.round(performance.now() - startTime);
      let errorMessage = 'Unknown error';

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout (15s)';
        } else if (error.message.includes('CORS')) {
          errorMessage = 'CORS error - External API blocked by browser';
        } else {
          errorMessage = error.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        responseTime
      };
    }
  };

  const testSingle = useCallback(async (request: TestRequest): Promise<TestResult> => {
    if (!isSupported || !workerRef.current) {
      // Fallback to main thread
      switch (request.type) {
        case 'rpc':
          return fallbackTestRpc(request.method!);
        case 'api':
          return fallbackTestApi(request.endpoint!);
        case 'external':
          return fallbackTestExternal(request.endpoint!, request.headers);
        default:
          throw new Error('Unknown test type');
      }
    }

    return new Promise((resolve, reject) => {
      const id = ++requestIdRef.current;
      pendingRequestsRef.current.set(id, { resolve, reject });

      let payload: any;
      let type: string;

      switch (request.type) {
        case 'rpc':
          type = 'TEST_RPC';
          payload = { method: request.method };
          break;
        case 'api':
          type = 'TEST_API';
          payload = { endpoint: request.endpoint };
          break;
        case 'external':
          type = 'TEST_EXTERNAL';
          payload = { endpoint: request.endpoint, headers: request.headers };
          break;
        default:
          reject(new Error('Unknown test type'));
          return;
      }

      workerRef.current!.postMessage({ id, type, payload });

      // Timeout after 30 seconds
      setTimeout(() => {
        if (pendingRequestsRef.current.has(id)) {
          pendingRequestsRef.current.delete(id);
          reject(new Error('Test timeout'));
        }
      }, 30000);
    });
  }, [isSupported]);

  const testBatch = useCallback(async (requests: TestRequest[]): Promise<Record<string, TestResult>> => {
    if (!isSupported || !workerRef.current) {
      // Fallback: process sequentially on main thread
      const results: Record<string, TestResult> = {};

      for (const request of requests) {
        try {
          results[request.name] = await testSingle(request);
        } catch (error) {
          results[request.name] = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
            responseTime: 0
          };
        }
      }

      return results;
    }

    setProgress({ completed: 0, total: requests.length });

    return new Promise<Record<string, TestResult>>((resolve, reject) => {
      const id = ++requestIdRef.current;
      pendingRequestsRef.current.set(id, { resolve, reject });

      const tests = requests.map(request => ({
        name: request.name,
        type: request.type,
        method: request.method,
        endpoint: request.endpoint,
        headers: request.headers
      }));

      workerRef.current!.postMessage({
        id,
        type: 'TEST_BATCH',
        payload: { tests }
      });

      // Timeout after 2 minutes for batch operations
      setTimeout(() => {
        if (pendingRequestsRef.current.has(id)) {
          pendingRequestsRef.current.delete(id);
          setProgress(null);
          reject(new Error('Batch test timeout'));
        }
      }, 120000);
    }).finally(() => {
      setProgress(null);
    });
  }, [isSupported, testSingle]);

  return {
    testSingle,
    testBatch,
    isSupported,
    progress
  };
};