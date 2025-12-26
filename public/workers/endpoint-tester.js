// Web Worker for endpoint testing to prevent main thread blocking
class EndpointTesterWorker {
  constructor() {
    this.setupMessageHandler();
  }

  setupMessageHandler() {
    self.onmessage = async (event) => {
      const { id, type, payload } = event.data;
      
      try {
        let result;
        
        switch (type) {
          case 'TEST_RPC':
            result = await this.testRpcMethod(payload.method);
            break;
          case 'TEST_API':
            result = await this.testApiEndpoint(payload.endpoint);
            break;
          case 'TEST_EXTERNAL':
            result = await this.testExternalApi(payload.endpoint, payload.headers);
            break;
          case 'TEST_BATCH':
            result = await this.testBatch(payload.tests);
            break;
          default:
            throw new Error(`Unknown test type: ${type}`);
        }
        
        self.postMessage({
          id,
          success: true,
          result
        });
      } catch (error) {
        self.postMessage({
          id,
          success: false,
          error: error.message
        });
      }
    };
  }

  async createFetchWithTimeout(url, options, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async testRpcMethod(method) {
    const startTime = performance.now();
    
    try {
      const response = await this.createFetchWithTimeout('/api/rpc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method,
          params: {},
          id: Date.now(),
        }),
      }, 8000);

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
        error: error.message,
        timestamp: new Date().toISOString(),
        responseTime
      };
    }
  }

  async testApiEndpoint(endpoint) {
    const startTime = performance.now();
    
    try {
      // Determine HTTP method and body based on endpoint
      let httpMethod = 'GET';
      let body = undefined;
      

      
      const fetchOptions = {
        method: httpMethod,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'XanDash/1.0'
        }
      };
      
      if (body) {
        fetchOptions.body = body;
      }
      
      const response = await this.createFetchWithTimeout(endpoint, fetchOptions, 10000);

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
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout (10s)';
      } else {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        responseTime
      };
    }
  }

  async testExternalApi(endpoint, headers = {}) {
    const startTime = performance.now();
    
    try {
      // Determine HTTP method and body based on endpoint
      let httpMethod = 'GET';
      let body = undefined;
      

      
      const fetchOptions = {
        method: httpMethod,
        headers: {
          'User-Agent': 'XanDash/1.0',
          'Accept': 'application/json',
          ...headers
        }
      };
      
      if (body) {
        fetchOptions.body = body;
        fetchOptions.headers['Content-Type'] = 'application/json';
      }
      
      const response = await this.createFetchWithTimeout(endpoint, fetchOptions, 15000);

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
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout (15s)';
      } else if (error.message.includes('CORS')) {
        errorMessage = 'CORS error - External API blocked by browser';
      } else {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        responseTime
      };
    }
  }

  async testBatch(tests) {
    const results = {};
    
    // Process tests in small batches to prevent overwhelming
    const batchSize = 3;
    for (let i = 0; i < tests.length; i += batchSize) {
      const batch = tests.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (test) => {
        let result;
        
        switch (test.type) {
          case 'rpc':
            result = await this.testRpcMethod(test.method);
            break;
          case 'api':
            result = await this.testApiEndpoint(test.endpoint);
            break;
          case 'external':
            result = await this.testExternalApi(test.endpoint, test.headers);
            break;
          default:
            result = {
              success: false,
              error: 'Unknown test type',
              timestamp: new Date().toISOString(),
              responseTime: 0
            };
        }
        
        return { name: test.name, result };
      });
      
      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ name, result }) => {
        results[name] = result;
      });
      
      // Send progress update
      self.postMessage({
        type: 'PROGRESS',
        completed: i + batch.length,
        total: tests.length,
        results: { ...results }
      });
      
      // Small delay between batches to prevent blocking
      if (i + batchSize < tests.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }
}

// Initialize the worker
new EndpointTesterWorker();