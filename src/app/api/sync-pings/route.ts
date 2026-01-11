import { NextRequest, NextResponse } from 'next/server';
import net from 'net';
import { savePingRecordsBatch } from '@/libs/db/node-service';
import { getMainnetData } from '@/libs/services/mainnet-data-service';
import { getDevnetData } from '@/libs/services/devnet-data-service';

/**
 * SYNC PINGS API
 * 
 * Collects ping data for all nodes and saves to MongoDB.
 * Should be called by cron job every 5-10 minutes.
 */

type NetworkType = 'devnet' | 'mainnet';

/**
 * TCP ping - measures time to establish TCP connection
 */
async function tcpPing(ip: string, port: number, timeout: number = 3000): Promise<{ ping: number | null; status: 'online' | 'timeout' | 'offline' }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = new net.Socket();
    
    socket.setTimeout(timeout);
    
    socket.on('connect', () => {
      const ping = Date.now() - startTime;
      socket.destroy();
      resolve({ ping, status: 'online' });
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ ping: null, status: 'timeout' });
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve({ ping: null, status: 'offline' });
    });
    
    socket.connect(port, ip);
  });
}

/**
 * Ping a node - tries port 6000 first, then 9001
 */
async function pingNode(ip: string): Promise<{ ping: number | null; status: 'online' | 'timeout' | 'offline' }> {
  const result = await tcpPing(ip, 6000);
  if (result.status === 'online') return result;
  
  // Try alternate port
  const result9001 = await tcpPing(ip, 9001);
  if (result9001.status === 'online') return result9001;
  
  return { ping: null, status: 'offline' };
}

/**
 * Sync pings for a network
 */
async function syncPings(network: NetworkType): Promise<{
  total: number;
  online: number;
  offline: number;
  avgPing: number | null;
}> {
  console.log(`[SYNC-PINGS] Syncing pings for ${network}...`);
  
  try {
    // Get all nodes for the network
    const data = network === 'mainnet' 
      ? await getMainnetData(true)
      : await getDevnetData(true);
    
    if (data.nodes.length === 0) {
      console.warn(`[SYNC-PINGS] No ${network} nodes found`);
      return { total: 0, online: 0, offline: 0, avgPing: null };
    }
    
    // Extract unique IPs
    const nodeMap = new Map<string, string>(); // ip -> pubkey
    data.nodes.forEach((node: any) => {
      const ip = node.address?.split(':')[0];
      if (ip) nodeMap.set(ip, node.pubkey);
    });
    
    const ips = Array.from(nodeMap.keys());
    console.log(`[SYNC-PINGS] Pinging ${ips.length} ${network} nodes...`);
    
    // Ping in batches of 10
    const pingRecords: Array<{ ip: string; ping: number | null; status: 'online' | 'timeout' | 'offline'; port: number; pubkey?: string }> = [];
    const batchSize = 10;
    
    for (let i = 0; i < ips.length; i += batchSize) {
      const batch = ips.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(async (ip) => {
          const result = await pingNode(ip);
          return { ip, pubkey: nodeMap.get(ip), ...result };
        })
      );
      
      results.forEach(({ ip, pubkey, ping, status }) => {
        pingRecords.push({ ip, ping, status, port: 6000, pubkey });
      });
    }
    
    // Save to MongoDB
    const savedCount = await savePingRecordsBatch(pingRecords, network);
    
    // Calculate stats
    const onlineCount = pingRecords.filter(r => r.status === 'online').length;
    const offlineCount = pingRecords.filter(r => r.status !== 'online').length;
    const onlinePings = pingRecords.filter(r => r.ping !== null).map(r => r.ping as number);
    const avgPing = onlinePings.length > 0 
      ? Math.round(onlinePings.reduce((a, b) => a + b, 0) / onlinePings.length)
      : null;
    
    console.log(`[SYNC-PINGS] Saved ${savedCount} ping records for ${network} (${onlineCount} online, ${offlineCount} offline, avg: ${avgPing}ms)`);
    
    return {
      total: pingRecords.length,
      online: onlineCount,
      offline: offlineCount,
      avgPing,
    };
  } catch (error) {
    console.error(`[SYNC-PINGS] Error syncing ${network} pings:`, error);
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
  const network = (searchParams.get('network') as NetworkType) || 'devnet';
  
  if (network !== 'devnet' && network !== 'mainnet') {
    return NextResponse.json({ error: 'Invalid network. Use devnet or mainnet' }, { status: 400 });
  }

  try {
    const result = await syncPings(network);
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      network,
      ...result,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`[SYNC-PINGS] Error for ${network}:`, error);
    return NextResponse.json({ error: error.message || 'Sync failed', network }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const network = (searchParams.get('network') as NetworkType) || 'devnet';

  if (network !== 'devnet' && network !== 'mainnet') {
    return NextResponse.json({ error: 'Invalid network. Use devnet or mainnet' }, { status: 400 });
  }

  try {
    if (action === 'sync') {
      const startTime = Date.now();
      const result = await syncPings(network);
      return NextResponse.json({
        success: true,
        network,
        ...result,
        duration: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      message: 'XanDash Ping Sync API',
      networks: ['devnet', 'mainnet'],
      endpoints: {
        sync_devnet: 'GET /api/sync-pings?action=sync&network=devnet',
        sync_mainnet: 'GET /api/sync-pings?action=sync&network=mainnet',
        cron_devnet: 'POST /api/sync-pings?network=devnet',
        cron_mainnet: 'POST /api/sync-pings?network=mainnet',
      },
      collections: {
        devnet: 'node_pings',
        mainnet: 'mainnet_node_pings',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
