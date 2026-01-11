import { NextRequest, NextResponse } from 'next/server';
import { ProfileCacheService } from '@/libs/services/profile-cache';
import { getMainnetData } from '@/libs/services/mainnet-data-service';
import { getDevnetData } from '@/libs/services/devnet-data-service';

// Server-side function to get profile data for caching
async function getProfileDataForCache(ip: string) {
  try {
    const { getProfileData } = await import('@/app/profile/[ip]/page');
    return await getProfileData(ip);
  } catch (error) {
    throw new Error(`Failed to get profile data for ${ip}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get authentication
    const cronSecret = process.env.CRON_SECRET;
    const authFromHeader = request.headers.get('authorization');
    const authFromQuery = request.nextUrl.searchParams.get('auth');
    const network = request.nextUrl.searchParams.get('network') || 'devnet';
    
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

    // Fetch all nodes from appropriate API
    let nodes: any[] = [];
    if (network === 'mainnet') {
      const mainnetData = await getMainnetData();
      nodes = mainnetData.nodes;
    } else {
      const devnetData = await getDevnetData();
      nodes = devnetData.nodes;
    }
    
    if (nodes.length === 0) {
      throw new Error(`No nodes available from ${network} API`);
    }

    const ips = nodes
      .map((node: any) => node.address?.split(':')[0])
      .filter((ip: string) => ip && ip !== '127.0.0.1')
      .slice(0, 50); // Limit to first 50 nodes to avoid timeout

    // Pre-load profiles in the background
    await ProfileCacheService.preloadProfilesServerSide(ips, getProfileDataForCache);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Profile pre-loading completed',
      network,
      nodesProcessed: ips.length,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Profile pre-loading failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get IPs from query parameter
    const ipsParam = request.nextUrl.searchParams.get('ips');
    if (!ipsParam) {
      return NextResponse.json({ error: 'Missing ips parameter' }, { status: 400 });
    }

    // Parse IPs (can be comma-separated for multiple IPs)
    const ips = ipsParam.split(',').map(ip => ip.trim()).filter(ip => ip);
    if (ips.length === 0) {
      return NextResponse.json({ error: 'No valid IPs provided' }, { status: 400 });
    }

    // Limit to prevent abuse
    const limitedIps = ips.slice(0, 10);

    // Pre-load profiles for the specified IPs
    await ProfileCacheService.preloadProfilesServerSide(limitedIps, getProfileDataForCache);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: 'Profile pre-loading completed',
      ipsProcessed: limitedIps,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Profile pre-loading failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}