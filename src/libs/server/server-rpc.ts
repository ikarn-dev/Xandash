// Server-side only RPC utilities
import { RPCResponse } from '../api';

/**
 * Make API call to mainnet stats endpoint (simple GET, no API key)
 */
async function makeRPCCall<T>(method: string): Promise<RPCResponse<T>> {
  const apiUrl = process.env.MAINNET_API_URL;

  if (!apiUrl) {
    return {
      success: false,
      error: 'Mainnet API endpoint not configured'
    };
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `API error: ${response.status}`
      };
    }

    const result = await response.json();

    // Handle different response formats
    const data = result.pods ?? result.result?.pods ?? result.data?.pods ??
      result.result ?? result.data ?? result;
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

// Direct API call function
export async function callDirectRPC<T>(method: string): Promise<RPCResponse<T>> {
  return makeRPCCall<T>(method);
}
