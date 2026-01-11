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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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

// Direct RPC call function - uses mainnet RPC endpoint from env
export async function callDirectRPC<T>(method: string, params?: any, customEndpoint?: string): Promise<RPCResponse<T>> {
  // If custom endpoint provided, use it directly
  if (customEndpoint) {
    return makeRPCCall<T>(customEndpoint, method, params);
  }
  
  // Use mainnet RPC endpoint from environment
  const rpcEndpoint = process.env.MAINNET_EXTERNAL_RPC_URL;
  
  if (!rpcEndpoint) {
    return {
      success: false,
      error: 'RPC endpoint not configured'
    };
  }
  
  return makeRPCCall<T>(rpcEndpoint, method, params);
}
