import { NextRequest, NextResponse } from 'next/server';

/**
 * Cron job endpoint for automated endpoint health checks
 * This should be called every 30 seconds by a cron service like Vercel Cron
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Trigger endpoint health checks for both networks
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL || 'http://localhost:3000';

    const [devnetResponse, mainnetResponse] = await Promise.allSettled([
      fetch(`${baseUrl}/api/endpoint-status?network=devnet&refresh=true`, {
        method: 'GET',
        headers: {
          'User-Agent': 'XanDash-Cron/1.0'
        }
      }),
      fetch(`${baseUrl}/api/endpoint-status?network=mainnet&refresh=true`, {
        method: 'GET',
        headers: {
          'User-Agent': 'XanDash-Cron/1.0'
        }
      })
    ]);

    const results = {
      devnet: devnetResponse.status === 'fulfilled' ? 'success' : 'failed',
      mainnet: mainnetResponse.status === 'fulfilled' ? 'success' : 'failed',
      timestamp: new Date().toISOString()
    };



    return NextResponse.json({
      success: true,
      results,
      message: 'Endpoint health checks completed'
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Cron endpoint health check error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}