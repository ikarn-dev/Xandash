import { NextResponse } from 'next/server';
import https from 'https';

export async function GET() {
  try {
    // Get URL from environment variable
    const externalUrl = process.env.NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL || 'https://podcredits.xandeum.network/api/pods-credits';
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
    console.error('Pod Credits API Error:', error);
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