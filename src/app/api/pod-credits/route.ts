import { NextResponse, NextRequest } from 'next/server';
import https from 'https';
import { getCreditsApiUrl, type NetworkType } from '@/libs/services/network-service';

export async function GET(request: NextRequest) {
  try {
    // Get network parameter from query string
    const { searchParams } = new URL(request.url);
    const network = (searchParams.get('network') || 'devnet') as NetworkType;
    
    // Get URL from network service
    const externalUrl = getCreditsApiUrl(network);
    if (!externalUrl) {
      throw new Error(`${network} pod credits URL not configured`);
    }
    
    const url = new URL(externalUrl);
    
    // Use HTTPS module for external API call
    const result = await new Promise<any>((resolve, reject) => {
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'GET',
        headers: {
          'User-Agent': 'XanDash/1.0',
          'Accept': 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (parseError) {
            reject(new Error('Failed to parse JSON response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.setTimeout(15000); // 15 second timeout
      req.end();
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Handle CORS for development
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}