// API utilities for RPC calls
// Client-side uses proxy, server-side uses direct endpoint
const getEndpoint = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use the proxy endpoint
    return '/api/rpc';
  } else {
    // Server-side: use mainnet RPC direct endpoint from env
    return process.env.MAINNET_RPC_DIRECT_URL || '';
  }
};

const getApiKey = () => {
  return process.env.MAINNET_RPC_API_KEY || '';
};

// JSON-RPC 2.0 response structure
export interface JSONRPCResponse<T = any> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  } | null;
}

// Our wrapper response for easier handling
export interface RPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// API Response Types based on actual responses
export interface VersionInfo {
  version: string;
}

export interface PodStats {
  name: string;
  status: string;
  cpu: number;
  memory: number;
  uptime: string;
  storage?: number;
  connections?: number;
  location?: string;
  lastSeen?: string;
  id?: string;
}

export interface NodeStats {
  uptime: string;
  bandwidth: string;
  networkHealth: number;
  totalPods: number;
  activePods: number;
}

export interface NetworkStats {
  active_streams: number;
  cpu_percent: number;
  current_index: number;
  file_size: number;
  last_updated: number;
  packets_received: number;
  packets_sent: number;
  ram_total: number;
  ram_used: number;
  total_bytes: number;
  total_pages: number;
  uptime: number;
}

export interface ValidatorLocation {
  id: string;
  lat: number;
  lng: number;
  count: number;
  city?: string;
  country?: string;
  region?: string;
}

export interface ValidatorLocations {
  validators: ValidatorLocation[];
  total_count: number;
  last_updated: number;
}

// Generic RPC call function
export async function callRPC<T>(method: string): Promise<RPCResponse<T>> {
  try {
    const endpoint = getEndpoint();
    const isServerSide = typeof window === 'undefined';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add API key for server-side direct calls
    if (isServerSide) {
      const apiKey = getApiKey();
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ method }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Handle different response formats
    if (result.error) {
      return { 
        success: false, 
        error: result.error.message || result.error || 'RPC Error' 
      };
    }

    // Handle successful response - check various formats
    const data = result.result ?? result.data ?? result;
    if (data !== undefined) {
      return { success: true, data };
    }

    return { success: false, error: 'No result in response' };
  } catch (error) {
    console.error(`RPC call failed for method ${method}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Specific API methods
export const api = {
  async getVersion(): Promise<RPCResponse<VersionInfo>> {
    return callRPC<VersionInfo>('get-version');
  },

  async getStats(): Promise<RPCResponse<NetworkStats>> {
    return callRPC<NetworkStats>('get-stats');
  },

  async getValidatorLocations(): Promise<RPCResponse<ValidatorLocations>> {
    return callRPC<ValidatorLocations>('get-validator-locations');
  },

  async getPodsWithStats(): Promise<RPCResponse<PodStats[]>> {
    return callRPC<PodStats[]>('get-pods-with-stats');
  },
};
