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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
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

export async function POST(request: NextRequest) {
  let body: any;
  
  try {
    body = await request.json();
    
    // Use mainnet RPC endpoint from env
    const mainnetRpcUrl = process.env.MAINNET_EXTERNAL_RPC_URL;
    
    if (!mainnetRpcUrl) {
      throw new Error('RPC endpoint not configured');
    }
    
    const result = await makeRPCProxyCall(mainnetRpcUrl, body);
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