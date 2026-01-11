import { NextRequest, NextResponse } from 'next/server';
import { savePingRecordsBatch } from '@/libs/db/node-service';
import { getMainnetData } from '@/libs/services/mainnet-data-service';

/**
 * SYNC PINGS API
 * 
 * Collects ping data for MAINNET nodes from geo data and saves to MongoDB.
 * Devnet ping is disabled - not needed.
 * Should be called by cron job every 5-10 minutes.
 */

type NetworkType = 'devnet' | 'mainnet';

/**
 * Sync pings for mainnet using geo data from Source B
 */
async function syncMainnetPings(): Promise<{
  total: number;
  online: number;
  offline: number;
  avgPing: number | null;
}> {
  console.log(`[SYNC-PINGS] Syncing pings for mainnet from geo data...`);
  
  try {
    // Get mainnet data which includes geo data with ping
    const data = await getMainnetData(true);
    
    if (data.nodes.length === 0) {
      console.warn(`[SYNC-PINGS] No mainnet nodes found`);
      return { total: 0, online: 0, offline: 0, avgPing: null };
    }
    
    // Extract ping data from geo data
    const pingRecords: Array<{ ip: string; ping: number | null; status: 'online' | 'timeout' | 'offline'; port: number; pubkey?: string }> = [];
    
    for (const node of data.nodes) {
      const ip = node.address?.split(':')[0];
      if (!ip) continue;
      
      // Get ping from node data (enriched from geo) or directly from geo
      const geo = data.geo[ip];
      const ping = node.ping ?? geo?.ping ?? null;
      
      // Consider online if ping is a valid number (including 0 which means very fast)
      // Only mark offline if ping is null/undefined
      const status: 'online' | 'timeout' | 'offline' = 
        ping !== null && ping !== undefined ? 'online' : 'offline';
      
      pingRecords.push({
        ip,
        ping,
        status,
        port: 6000,
        pubkey: node.pubkey,
      });
    }
    
    console.log(`[SYNC-PINGS] Found ${pingRecords.length} mainnet nodes with ping data`);
    
    // Save to MongoDB
    const savedCount = await savePingRecordsBatch(pingRecords, 'mainnet');
    
    // Calculate stats
    const onlineCount = pingRecords.filter(r => r.status === 'online').length;
    const offlineCount = pingRecords.filter(r => r.status !== 'online').length;
    const onlinePings = pingRecords.filter(r => r.ping !== null).map(r => r.ping as number);
    const avgPing = onlinePings.length > 0 
      ? Math.round(onlinePings.reduce((a, b) => a + b, 0) / onlinePings.length)
      : null;
    
    console.log(`[SYNC-PINGS] Saved ${savedCount} ping records for mainnet (${onlineCount} online, ${offlineCount} offline, avg: ${avgPing}ms)`);
    
    return {
      total: pingRecords.length,
      online: onlineCount,
      offline: offlineCount,
      avgPing,
    };
  } catch (error) {
    console.error(`[SYNC-PINGS] Error syncing mainnet pings:`, error);
    throw error;
  }
}

function verifyAuth(request: NextRequest): boolean {
  const upstashSignature = request.headers.get('upstash-signature');
  if (upstashSignature) return true;
  
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  
  const auth = request.headers.get('authorization');
  const queryAuth = request.nextUrl.searchParams.get('auth');
  
  return auth === `Bearer ${secret}` || auth === secret || queryAuth === secret;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const network = (searchParams.get('network') as NetworkType) || 'mainnet';
  
  // Only mainnet ping sync is supported
  if (network === 'devnet') {
    return NextResponse.json({ 
      success: true,
      message: 'Devnet ping sync is disabled - not needed',
      network: 'devnet',
      total: 0,
      online: 0,
      offline: 0,
      avgPing: null,
    });
  }

  try {
    const result = await syncMainnetPings();
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      network: 'mainnet',
      ...result,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`[SYNC-PINGS] Error:`, error);
    return NextResponse.json({ error: error.message || 'Sync failed', network: 'mainnet' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const network = (searchParams.get('network') as NetworkType) || 'mainnet';

  try {
    if (action === 'sync') {
      // Only mainnet ping sync is supported
      if (network === 'devnet') {
        return NextResponse.json({ 
          success: true,
          message: 'Devnet ping sync is disabled - not needed',
          network: 'devnet',
        });
      }
      
      const startTime = Date.now();
      const result = await syncMainnetPings();
      return NextResponse.json({
        success: true,
        network: 'mainnet',
        ...result,
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      message: 'XanDash Ping Sync API',
      note: 'Only mainnet ping sync is supported. Devnet ping is disabled.',
      endpoints: {
        sync_mainnet: 'GET /api/sync-pings?action=sync&network=mainnet',
        cron_mainnet: 'POST /api/sync-pings?network=mainnet',
      },
      collections: {
        mainnet: 'mainnet_node_pings',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
