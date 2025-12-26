// Server-side only RPC utilities
import { RPCResponse } from '../api';
import https from 'https';
import http from 'http';

// Helper function to make RPC call to a specific endpoint
async function makeRPCCall<T>(endpoint: string, method: string, params?: any): Promise<RPCResponse<T>> {
  return new Promise((resolve) => {
    try {
      console.log(`[RPC Call] Trying endpoint: ${endpoint} for method: ${method}`);
      
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
        console.log(`[RPC Call] Response status: ${res.statusCode} from ${endpoint}`);

        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            
            if (result.error) {
              console.error(`[RPC Call] RPC error for ${method} from ${endpoint}:`, result.error);
              resolve({ 
                success: false, 
                error: result.error.message || 'RPC Error' 
              });
              return;
            }

            if (result.result !== undefined) {
              console.log(`[RPC Call] Success for ${method} from ${endpoint}`);
              resolve({ success: true, data: result.result });
              return;
            }

            resolve({ success: false, error: 'No result in response' });
          } catch (parseError) {
            console.error(`[RPC Call] JSON parse error from ${endpoint}:`, parseError);
            resolve({ 
              success: false, 
              error: 'Failed to parse JSON response' 
            });
          }
        });
      });

      req.on('error', (error) => {
        console.error(`[RPC Call] HTTP request error from ${endpoint}:`, error);
        resolve({ 
          success: false, 
          error: error.message 
        });
      });

      req.on('timeout', () => {
        console.error(`[RPC Call] HTTP request timeout from ${endpoint}`);
        req.destroy();
        resolve({ 
          success: false, 
          error: 'Request timeout' 
        });
      });

      req.setTimeout(8000); // 8 second timeout for faster failover
      req.write(postData);
      req.end();

    } catch (error) {
      console.error(`[RPC Call] Setup error for ${endpoint}:`, error);
      resolve({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
}

// Direct RPC call function with failover logic
export async function callDirectRPC<T>(method: string, params?: any): Promise<RPCResponse<T>> {
  const primaryEndpoint = process.env.RPC_ENDPOINT_PRIMARY;
  const fallbackEndpoint = process.env.RPC_ENDPOINT_FALLBACK;
  
  if (!primaryEndpoint || !fallbackEndpoint) {
    console.error('[Direct RPC] RPC endpoints not configured');
    return {
      success: false,
      error: 'RPC endpoints not configured. Please set RPC_ENDPOINT_PRIMARY and RPC_ENDPOINT_FALLBACK environment variables.'
    };
  }
  
  console.log(`[Direct RPC] Starting failover RPC call for method: ${method}`);
  
  // Try primary endpoint first
  const primaryResult = await makeRPCCall<T>(primaryEndpoint, method, params);
  
  if (primaryResult.success) {
    console.log(`[Direct RPC] Primary endpoint succeeded for ${method}`);
    return primaryResult;
  }
  
  console.log(`[Direct RPC] Primary endpoint failed for ${method}, trying fallback...`);
  console.log(`[Direct RPC] Primary error:`, primaryResult.error);
  
  // Try fallback endpoint
  const fallbackResult = await makeRPCCall<T>(fallbackEndpoint, method, params);
  
  if (fallbackResult.success) {
    console.log(`[Direct RPC] Fallback endpoint succeeded for ${method}`);
    return fallbackResult;
  }
  
  console.log(`[Direct RPC] Both endpoints failed for ${method}`);
  console.log(`[Direct RPC] Fallback error:`, fallbackResult.error);
  
  // Return the fallback error (or combine both errors)
  return {
    success: false,
    error: `Primary: ${primaryResult.error}; Fallback: ${fallbackResult.error}`
  };
}
