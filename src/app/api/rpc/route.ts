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
      console.log(`RPC Proxy: Response status: ${res.statusCode} from ${endpoint}`);

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

export async function POST(request: NextRequest) {
  let body: any;
  
  try {
    body = await request.json();
    const primaryEndpoint = process.env.RPC_ENDPOINT_PRIMARY || 'https://rpc1.pchednode.com/rpc';
    const fallbackEndpoint = process.env.RPC_ENDPOINT_FALLBACK || 'http://161.97.97.41:6000/rpc';
    
    console.log('RPC Proxy: Received request:', JSON.stringify(body, null, 2));
    console.log('RPC Proxy: Using failover strategy');
    
    let result: any;
    let usedEndpoint = '';
    
    try {
      // Try primary endpoint first
      console.log('RPC Proxy: Trying primary endpoint:', primaryEndpoint);
      result = await makeRPCProxyCall(primaryEndpoint, body);
      usedEndpoint = primaryEndpoint;
      console.log('RPC Proxy: Primary endpoint succeeded');
    } catch (primaryError) {
      console.log('RPC Proxy: Primary endpoint failed, trying fallback...');
      console.log('RPC Proxy: Primary error:', primaryError);
      
      try {
        // Try fallback endpoint
        console.log('RPC Proxy: Trying fallback endpoint:', fallbackEndpoint);
        result = await makeRPCProxyCall(fallbackEndpoint, body);
        usedEndpoint = fallbackEndpoint;
        console.log('RPC Proxy: Fallback endpoint succeeded');
      } catch (fallbackError) {
        console.error('RPC Proxy: Both endpoints failed');
        console.error('RPC Proxy: Fallback error:', fallbackError);
        throw new Error(`Primary: ${primaryError}; Fallback: ${fallbackError}`);
      }
    }
    
    console.log('RPC Proxy: Success response from:', usedEndpoint);
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