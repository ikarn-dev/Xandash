import { NextRequest, NextResponse } from 'next/server';

/**
 * RPC Proxy Route
 * Proxies RPC calls to the Gossip Direct API
 * Used by client-side code to avoid exposing API keys
 */

export async function POST(request: NextRequest) {
  let body: any;
  
  try {
    body = await request.json();
    
    const rpcUrl = process.env.MAINNET_RPC_DIRECT_URL;
    const apiKey = process.env.MAINNET_RPC_API_KEY;
    
    if (!rpcUrl || !apiKey) {
      throw new Error('RPC endpoint not configured');
    }
    
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    
    if (!response.ok) {
      throw new Error(`RPC error: ${response.status}`);
    }
    
    const result = await response.json();
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('RPC Proxy Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { 
        error: { 
          code: -32603, 
          message: `RPC Server Error: ${errorMessage}`
        }
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
