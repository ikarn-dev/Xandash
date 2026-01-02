import { NextRequest, NextResponse } from 'next/server';
import { callDirectRPC } from '@/libs/server';
import { ProfileCacheService } from '@/libs/services/profile-cache';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get authentication
    const cronSecret = process.env.CRON_SECRET;
    const authFromHeader = request.headers.get('authorization');
    const authFromQuery = request.nextUrl.searchParams.get('auth');
    
    let authFromBody = null;
    try {
      const body = await request.json();
      authFromBody = body.auth || body.secret;
    } catch {
      // Body is not JSON or empty, that's fine
    }
    
    // Check authentication if CRON_SECRET is set
    if (cronSecret) {
      const isValidAuth = 
        authFromQuery === cronSecret || 
        authFromHeader === `Bearer ${cronSecret}` ||
        authFromHeader === cronSecret ||
        authFromBody === cronSecret;
        
      if (!isValidAuth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Fetch all nodes from RPC
    const rpcResponse = await callDirectRPC('get-pods-with-stats');
    if (!rpcResponse.success || !rpcResponse.data) {
      throw new Error('Failed to fetch nodes from RPC');
    }

    const nodes = (rpcResponse.data as any)?.pods || [];
    const ips = nodes
      .map((node: any) => node.address?.split(':')[0])
      .filter((ip: string) => ip && ip !== '127.0.0.1')
      .slice(0, 50); // Limit to first 50 nodes to avoid timeout

    // Pre-load profiles in the background
    await ProfileCacheService.preloadProfiles(ips);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Profile pre-loading completed',
      nodesProcessed: ips.length,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[PRELOAD] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Profile pre-loading failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Allow GET requests for easier testing
  return POST(request);
}