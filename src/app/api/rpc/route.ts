import { NextRequest, NextResponse } from 'next/server';
import http from 'http';
import https from 'https';

// Helper function to make RPC call to a specific endpoint
async function makeRPCProxyCall(endpoint: string, body: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const postData = JSON.stringify(body);

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

    const req = requestModule.request(options, (res: any) => {
      let data = '';
      res.on('data', (chunk: any) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (parseError) {
          console.error(`RPC Proxy: JSON parse error from ${endpoint}:`, parseError);
          reject(new Error('Failed to parse JSON response'));
        }
      });
    });

    req.on('error', (error: any) => {
      console.error(`RPC Proxy: HTTP request error from ${endpoint}:`, error);
      reject(error);
    });

    req.on('timeout', () => {
      console.error(`RPC Proxy: HTTP request timeout from ${endpoint}`);
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(8000); // 8 second timeout for faster failover
    req.write(postData);
    req.end();
  });
}

// Public node RPC endpoints as backups
const PUBLIC_RPC_ENDPOINTS = [
  'http://161.97.97.41:6000/rpc',
  'http://173.212.207.32:6000/rpc',
  'http://62.171.135.107:6000/rpc',
  'http://173.249.3.118:6000/rpc',
  'http://84.21.171.111:6000/rpc',
];

export async function POST(request: NextRequest) {
  let body: any;
  
  try {
    body = await request.json();
    const primaryEndpoint = process.env.RPC_ENDPOINT_PRIMARY || 'http://161.97.97.41:6000/rpc';
    
    // Build list of endpoints to try
    const endpoints = [
      primaryEndpoint,
      ...PUBLIC_RPC_ENDPOINTS.filter(e => e !== primaryEndpoint).slice(0, 2)
    ];
    
    let result: any;
    let lastError: any;
    
    for (const endpoint of endpoints) {
      try {
        result = await makeRPCProxyCall(endpoint, body);
        break; // Success, exit loop
      } catch (error) {
        lastError = error;
        // Continue to next endpoint
      }
    }
    
    if (!result) {
      console.error('RPC Proxy: All endpoints failed');
      throw lastError || new Error('All RPC endpoints failed');
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('RPC Proxy Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { 
        jsonrpc: '2.0', 
        error: { 
          code: -32603, 
          message: `RPC Server Error: ${errorMessage}`
        }, 
        id: body?.id || null 
      },
      { status: 200 }
    );
  }
}

// Handle CORS for development
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}