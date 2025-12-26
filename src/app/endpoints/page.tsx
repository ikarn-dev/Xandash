'use client';

import { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
import { Play, CheckCircle, XCircle, Loader, Copy, Trash2, Clock, Server, Globe } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { useEndpointTester } from '@/libs/hooks/useEndpointTester';
import { toast } from 'sonner';

interface EndpointMethod {
  name: string;
  description: string;
  endpoint: string;
}

interface EndpointCategory {
  category: string;
  description: string;
  icon: React.ReactNode;
  methods: EndpointMethod[];
}

// Cooldown duration in milliseconds (1 minute)
const COOLDOWN_DURATION = 60000;

function EndpointsPageContent() {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState(false);
  const [individualTesting, setIndividualTesting] = useState<Record<string, boolean>>({});
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});
  const [, forceUpdate] = useState(0); // Force re-render for cooldown display
  const [copyingStates, setCopyingStates] = useState<Record<string, boolean>>({});
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();
  const { testSingle, testBatch, isSupported: workerSupported, progress } = useEndpointTester();

  const endpoints: EndpointCategory[] = [
    {
      category: 'RPC Methods',
      description: 'JSON-RPC endpoints for node communication',
      icon: <Server className="w-5 h-5" />,
      methods: [
        { name: 'get-version', description: 'Get system version information', endpoint: '/api/rpc' },
        { name: 'get-stats', description: 'Get node statistics and metrics', endpoint: '/api/rpc' },
        { name: 'get-pods', description: 'Get list of active pods', endpoint: '/api/rpc' },
        { name: 'get-pods-with-stats', description: 'Get pods with detailed statistics', endpoint: '/api/rpc' }
      ]
    },
    {
      category: 'Pod Credits API',
      description: 'Pod credits and leaderboard data',
      icon: <Globe className="w-5 h-5" />,
      methods: [
        { 
          name: 'pod-credits', 
          description: 'Get pod credits data for leaderboard', 
          endpoint: '/api/pod-credits'
        }
      ]
    },
  ];

  // Update cooldown display every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      let hasActiveCooldowns = false;
      
      // Check if any cooldowns are still active
      Object.values(cooldowns).forEach(endTime => {
        if (endTime > now) {
          hasActiveCooldowns = true;
        }
      });
      
      if (hasActiveCooldowns) {
        // Force re-render to update countdown display
        forceUpdate(n => n + 1);
      }
      
      // Clean up expired cooldowns
      setCooldowns(prev => {
        const updated: Record<string, number> = {};
        Object.entries(prev).forEach(([method, endTime]) => {
          if (endTime > now) {
            updated[method] = endTime;
          }
        });
        return Object.keys(updated).length !== Object.keys(prev).length ? updated : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldowns]);

  // Get remaining cooldown time for a method (calculated fresh each render)
  const getCooldownRemaining = (method: string): number => {
    const endTime = cooldowns[method];
    if (!endTime) return 0;
    const remaining = Math.max(0, endTime - Date.now());
    return Math.ceil(remaining / 1000);
  };

  // Check if method is on cooldown
  const isOnCooldown = (method: string): boolean => {
    return getCooldownRemaining(method) > 0;
  };

  const testRpcMethod = async (method: string) => {
    const startTime = Date.now();
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
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString(),
          responseTime
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime
      };
    }
  };

  const testApiEndpoint = async (method: string, endpoint: string) => {
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
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          timestamp: new Date().toISOString(),
          responseTime
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      let errorMessage = error instanceof Error 
        ? (error.name === 'AbortError' ? 'Request timeout (10s)' : error.message)
        : 'Unknown error';
      return { success: false, error: errorMessage, timestamp: new Date().toISOString(), responseTime };
    }
  };

  const testSingleMethod = useCallback(async (method: string, endpoint: string) => {
    // Check cooldown using current cooldowns state
    const endTime = cooldowns[method];
    if (endTime && endTime > Date.now()) {
      const remaining = Math.ceil((endTime - Date.now()) / 1000);
      toast.error(`${method} is on cooldown. Wait ${remaining}s`);
      return;
    }
    
    if (individualTesting[method] || testing) return;
    
    setIndividualTesting(prev => ({ ...prev, [method]: true }));
    
    try {
      let result;
      
      if (workerSupported) {
        const testType: 'rpc' | 'api' = method === 'pod-credits' ? 'api' : 'rpc';
        
        result = await testSingle({
          name: method,
          type: testType,
          method: testType === 'rpc' ? method : undefined,
          endpoint: testType !== 'rpc' ? endpoint : undefined,
        });
      } else {
        if (method === 'pod-credits') {
          result = await testApiEndpoint(method, endpoint);
        } else {
          result = await testRpcMethod(method);
        }
      }

      startTransition(() => {
        setTestResults(prev => ({ ...prev, [method]: result }));
        setExpandedResults(prev => ({ ...prev, [method]: true }));
      });

      // Set cooldown
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
    // Check if any methods are not on cooldown
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
      const results: Record<string, any> = {};
      
      for (const method of availableMethods) {
        let result;
        if (method.name === 'pod-credits') {
          result = await testApiEndpoint(method.name, method.endpoint);
        } else {
          result = await testRpcMethod(method.name);
        }
        results[method.name] = result;
        
        // Set cooldown for each tested method
        setCooldowns(prev => ({ ...prev, [method.name]: Date.now() + COOLDOWN_DURATION }));
      }
      
      startTransition(() => {
        setTestResults(prev => ({ ...prev, ...results }));
      });

      const successful = Object.values(results).filter((r: any) => r.success).length;
      const failed = Object.values(results).filter((r: any) => !r.success).length;
      
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

  const copyResult = useCallback(async (method: string, result: any) => {
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

  const stats = useMemo(() => {
    const results = Object.values(testResults);
    return {
      totalMethods: endpoints.flatMap(cat => cat.methods).length,
      successfulTests: results.filter((r: any) => r.success).length,
      failedTests: results.filter((r: any) => !r.success).length,
      avgResponseTime: results.length > 0 
        ? Math.round(results.reduce((sum: number, r: any) => sum + (r.responseTime || 0), 0) / results.length)
        : 0
    };
  }, [testResults, endpoints]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative bg-black border border-white/10 p-6 group hover:border-white/20 transition-all duration-300 overflow-hidden">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-6 h-6">
          <div className="absolute top-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute top-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>
        <div className="absolute top-0 right-0 w-6 h-6">
          <div className="absolute top-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute top-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-6 h-6">
          <div className="absolute bottom-0 left-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute bottom-0 left-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>
        <div className="absolute bottom-0 right-0 w-6 h-6">
          <div className="absolute bottom-0 right-0 w-3 h-0.5 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
          <div className="absolute bottom-0 right-0 w-0.5 h-3 bg-white/30 group-hover:bg-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-300"></div>
        </div>

        <div className="space-y-4 relative z-10">
          <h1 className="text-3xl font-bold text-white/90 font-mono">
            // <span className="text-white">ENDPOINTS</span>
          </h1>
          <div className="flex items-center space-x-2 text-white/60">
            <span className="text-sm">›</span>
            <span className="text-sm">API endpoint testing with 1-minute cooldown</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Available', value: stats.totalMethods, color: 'white' },
          { label: 'Successful', value: stats.successfulTests, color: 'green' },
          { label: 'Failed', value: stats.failedTests, color: 'red' },
          { label: 'Avg Response', value: `${stats.avgResponseTime}ms`, color: 'white' },
        ].map((stat, i) => (
          <div key={i} className="relative bg-black border border-white/10 p-4 group hover:border-white/20 transition-all duration-300">
            <div className="absolute top-0 left-0 w-4 h-4">
              <div className="absolute top-0 left-0 w-2 h-0.5 bg-white/20 group-hover:bg-white/50 transition-all"></div>
              <div className="absolute top-0 left-0 w-0.5 h-2 bg-white/20 group-hover:bg-white/50 transition-all"></div>
            </div>
            <div className="text-white/50 text-xs uppercase tracking-wider mb-1">{stat.label}</div>
            <div className={`text-2xl font-bold font-mono ${
              stat.color === 'green' ? 'text-green-400' : 
              stat.color === 'red' ? 'text-red-400' : 'text-white'
            }`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-end space-x-3">
        <button
          onClick={clearResults}
          disabled={isPending || Object.keys(testResults).length === 0}
          className="px-4 py-2 bg-black border border-white/20 rounded-lg text-white/70 text-sm hover:border-white/40 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Clear All
        </button>
        <button
          onClick={testAllMethods}
          disabled={testing || isPending}
          className="flex items-center space-x-2 px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm hover:bg-white/20 hover:border-white/50 transition-all disabled:opacity-50"
        >
          {testing ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>{testing ? 'Testing...' : 'Test All'}</span>
        </button>
      </div>

      {/* Endpoint Categories */}
      {endpoints.map((category) => (
        <div key={category.category} className="relative bg-black border border-white/10 p-6 group hover:border-white/15 transition-all duration-300">
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-5 h-5">
            <div className="absolute top-0 left-0 w-2.5 h-0.5 bg-white/20"></div>
            <div className="absolute top-0 left-0 w-0.5 h-2.5 bg-white/20"></div>
          </div>
          <div className="absolute top-0 right-0 w-5 h-5">
            <div className="absolute top-0 right-0 w-2.5 h-0.5 bg-white/20"></div>
            <div className="absolute top-0 right-0 w-0.5 h-2.5 bg-white/20"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-5 h-5">
            <div className="absolute bottom-0 left-0 w-2.5 h-0.5 bg-white/20"></div>
            <div className="absolute bottom-0 left-0 w-0.5 h-2.5 bg-white/20"></div>
          </div>
          <div className="absolute bottom-0 right-0 w-5 h-5">
            <div className="absolute bottom-0 right-0 w-2.5 h-0.5 bg-white/20"></div>
            <div className="absolute bottom-0 right-0 w-0.5 h-2.5 bg-white/20"></div>
          </div>

          {/* Category Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-white/60">{category.icon}</div>
            <div>
              <h3 className="text-white font-semibold">{category.category}</h3>
              <p className="text-white/40 text-sm">{category.description}</p>
            </div>
          </div>

          {/* Methods Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {category.methods.map((method) => {
              const result = testResults[method.name];
              const isTesting = individualTesting[method.name];
              const cooldownTime = getCooldownRemaining(method.name);
              const onCooldown = cooldownTime > 0;
              const isExpanded = expandedResults[method.name];

              return (
                <div 
                  key={method.name} 
                  className={`relative bg-white/5 border rounded-lg overflow-hidden transition-all duration-300 ${
                    result?.success ? 'border-green-500/30' : 
                    result && !result.success ? 'border-red-500/30' : 
                    'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="p-4">
                    {/* Method Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium text-sm">{method.name}</span>
                      
                      {/* Test Button or Cooldown */}
                      {onCooldown ? (
                        <div className="flex items-center space-x-1.5 px-2 py-1 bg-white/5 rounded text-white/40 text-xs">
                          <Clock className="w-3 h-3" />
                          <span>{cooldownTime}s</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => testSingleMethod(method.name, method.endpoint)}
                          disabled={isTesting || testing}
                          className="flex items-center space-x-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs hover:bg-white/20 hover:border-white/30 transition-all disabled:opacity-50"
                        >
                          {isTesting ? <Loader className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                          <span>Test</span>
                        </button>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-white/50 text-xs mb-1">{method.description}</p>

                    {/* Result Status */}
                    {result && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center space-x-2">
                          {result.success ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                          <span className={`text-xs ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                            {result.success ? 'Success' : 'Failed'}
                          </span>
                          <span className="text-white/40 text-xs">
                            {result.responseTime}ms
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => copyResult(method.name, result)}
                            className="p-1.5 hover:bg-white/10 rounded transition-colors"
                            title="Copy result"
                          >
                            <Copy className={`w-3 h-3 ${copyingStates[method.name] ? 'text-green-400' : 'text-white/40 hover:text-white'}`} />
                          </button>
                          <button
                            onClick={() => toggleExpanded(method.name)}
                            className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-white"
                            title={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => clearIndividualResult(method.name)}
                            className="p-1.5 hover:bg-white/10 rounded transition-colors text-white/40 hover:text-red-400"
                            title="Clear result"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expanded Result */}
                  {result && isExpanded && (
                    <div className="border-t border-white/10 bg-black/30 p-3 max-h-64 overflow-auto">
                      {result.error && (
                        <div className="mb-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs">
                          {result.error}
                        </div>
                      )}
                      <pre className="text-white/60 text-[10px] font-mono whitespace-pre-wrap break-all">
                        {JSON.stringify(result.rawResponse || result, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Cooldown Progress Bar */}
                  {onCooldown && (
                    <div className="h-0.5 bg-white/5">
                      <div 
                        className="h-full bg-white/20 transition-all duration-1000"
                        style={{ width: `${(cooldownTime / 60) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EndpointsPage() {
  return (
    <DashboardLayout>
      <EndpointsPageContent />
    </DashboardLayout>
  );
}
