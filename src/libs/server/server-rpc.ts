// Server-side only RPC utilities
import { RPCResponse } from '../api';
import https from 'https';
import http from 'http';

// Helper function to make RPC call to a specific endpoint
async function makeRPCCall<T>(endpoint: string, method: string, params?: any): Promise<RPCResponse<T>> {
  return new Promise((resolve) => {
    try {
      const url = new URL(endpoint);
      const postData = JSON.stringify({
        jsonrpc: '2.0',
        method,
        params: params || {},
        id: Date.now(),
      });

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'XanDash/1.0',
        },
      };

      const requestModule = url.protocol === 'https:' ? https : http;
      
      const req = requestModule.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            
            if (result.error) {
              resolve({ 
                success: false, 
                error: result.error.message || 'RPC Error' 
              });
              return;
            }

            if (result.result !== undefined) {
              resolve({ success: true, data: result.result });
              return;
            }

            resolve({ success: false, error: 'No result in response' });
          } catch (parseError) {
            resolve({ 
              success: false, 
              error: 'Failed to parse JSON response' 
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ 
          success: false, 
          error: error.message 
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ 
          success: false, 
          error: 'Request timeout' 
        });
      });

      req.setTimeout(15000);
      req.write(postData);
      req.end();

    } catch (error) {
      resolve({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
}

// Direct RPC call function with failover logic
export async function callDirectRPC<T>(method: string, params?: any): Promise<RPCResponse<T>> {
  const primaryEndpoint = process.env.RPC_ENDPOINT_PRIMARY || 'http://161.97.97.41:6000/rpc';
  
  // Active public nodes from the network (is_public: true, status: ACTIVE)
  const fallbackEndpoints = [
    'http://173.212.203.145:6000/rpc',
    'http://173.212.220.65:6000/rpc',
    'http://62.171.138.27:6000/rpc',
    'http://84.21.171.111:6000/rpc',
    'http://173.212.207.32:6000/rpc',
    'http://62.171.135.107:6000/rpc',
    'http://173.249.3.118:6000/rpc',
    'http://144.126.137.111:6000/rpc',
  ];
  
  // Try primary endpoint first
  const primaryResult = await makeRPCCall<T>(primaryEndpoint, method, params);
  
  if (primaryResult.success) {
    return primaryResult;
  }
  
  // Try fallback endpoints
  for (const fallbackEndpoint of fallbackEndpoints) {
    const fallbackResult = await makeRPCCall<T>(fallbackEndpoint, method, params);
    if (fallbackResult.success) {
      return fallbackResult;
    }
  }
  
  return {
    success: false,
    error: `RPC call failed`
  };
}
