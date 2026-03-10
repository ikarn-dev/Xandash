import { NextRequest, NextResponse } from 'next/server';

/**
 * RPC Proxy Route
 * Proxies data requests to the mainnet stats API
 * Used by client-side code to avoid direct external calls
 */

export async function POST(request: NextRequest) {
  try {
    const apiUrl = process.env.MAINNET_API_URL;

    if (!apiUrl) {
      throw new Error('Mainnet API endpoint not configured');
    }

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      {
        error: {
          code: -32603,
          message: `API Server Error: ${errorMessage}`
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
