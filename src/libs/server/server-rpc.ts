// Server-side only RPC utilities
import { RPCResponse } from '../api';

/**
 * Make RPC call to Gossip Direct API
 */
async function makeRPCCall<T>(method: string): Promise<RPCResponse<T>> {
  const rpcUrl = process.env.MAINNET_RPC_DIRECT_URL;
  const apiKey = process.env.MAINNET_RPC_API_KEY;
  
  if (!rpcUrl || !apiKey) {
    return {
      success: false,
      error: 'RPC endpoint not configured'
    };
  }

  try {
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ method }),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return { 
        success: false, 
        error: `RPC error: ${response.status}` 
      };
    }

    const result = await response.json();
    
    if (result.error) {
      return { 
        success: false, 
        error: result.error.message || result.error || 'RPC Error' 
      };
    }

    // Handle different response formats
    const data = result.result ?? result.data ?? result;
    if (data !== undefined) {
      return { success: true, data };
    }

    return { success: false, error: 'No result in response' };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Direct RPC call function
export async function callDirectRPC<T>(method: string): Promise<RPCResponse<T>> {
  return makeRPCCall<T>(method);
}
