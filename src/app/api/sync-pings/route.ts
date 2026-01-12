import { NextRequest, NextResponse } from 'next/server';
import { savePingRecordsBatch } from '@/libs/db/node-service';
import { getMainnetData } from '@/libs/services/mainnet-data-service';
import { getDevnetData } from '@/libs/services/devnet-data-service';

/**
 * Sync Pings API - Automatically ping all nodes and save results
 * This endpoint is designed to be called by a cron job or scheduled task
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { network = 'devnet', timeout = 3000, batchSize = 50 } = body;

    if (network !== 'devnet' && network !== 'mainnet') {
      return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
    }

    let nodes: any[] = [];

    // Get nodes based on network
    if (network === 'mainnet') {
      const mainnetData = await getMainnetData();
      nodes = mainnetData.nodes || [];
    } else {
      // For devnet, use devnet data service
      const devnetData = await getDevnetData();
      nodes = devnetData.nodes || [];
    }

    if (nodes.length === 0) {
      return NextResponse.json({ 
        message: 'No nodes found to ping',
        network,
        pinged: 0,
        saved: 0
      });
    }

    // Extract IPs from nodes
    const nodeIps = nodes
      .map(node => {
        const ip = node.address?.split(':')[0] || node.ip;
        return ip && ip !== '127.0.0.1' ? { ip, pubkey: node.pubkey } : null;
      })
      .filter((node): node is NonNullable<typeof node> => node !== null);

    if (nodeIps.length === 0) {
      return NextResponse.json({ 
        message: 'No valid IPs found to ping',
        network,
        pinged: 0,
        saved: 0
      });
    }

    const results: Array<{
      ip: string;
      pubkey?: string;
      ping: number | null;
      status: 'online' | 'offline' | 'timeout';
      port: number;
    }> = [];

    // Ping nodes in batches to avoid overwhelming the system
    for (let i = 0; i < nodeIps.length; i += batchSize) {
      const batch = nodeIps.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(async (node) => {
          const result = await pingNode(node.ip, 6000, timeout);
          
          // If port 6000 fails, try port 9001
          if (result.status !== 'online') {
            const result9001 = await pingNode(node.ip, 9001, timeout);
            if (result9001.status === 'online') {
              return {
                ip: node.ip,
                pubkey: node.pubkey,
                ping: result9001.ping,
                status: result9001.status,
                port: 9001
              };
            }
          }
          
          return {
            ip: node.ip,
            pubkey: node.pubkey,
            ping: result.ping,
            status: result.status,
            port: 6000
          };
        })
      );
      
      results.push(...batchResults);
      
      // Small delay between batches to be nice to the network
      if (i + batchSize < nodeIps.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Save all ping results to database
    await savePingRecordsBatch(results, network);

    const successCount = results.filter(r => r.status === 'online').length;
    const timeoutCount = results.filter(r => r.status === 'timeout').length;
    const offlineCount = results.filter(r => r.status === 'offline').length;

    return NextResponse.json({
      message: 'Ping sync completed',
      network,
      pinged: results.length,
      saved: results.length,
      stats: {
        online: successCount,
        timeout: timeoutCount,
        offline: offlineCount,
        successRate: ((successCount / results.length) * 100).toFixed(1) + '%'
      }
    });

  } catch (error) {
    console.error('Sync pings API error:', error);
    return NextResponse.json({ error: 'Failed to sync pings' }, { status: 500 });
  }
}

// GET - Get sync status or trigger manual sync
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const network = (searchParams.get('network') as 'devnet' | 'mainnet') || 'devnet';
    const trigger = searchParams.get('trigger') === 'true';

    if (trigger) {
      // Trigger a manual sync by calling POST internally
      const syncRequest = new NextRequest(request.url, {
        method: 'POST',
        body: JSON.stringify({ network }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      return await POST(syncRequest);
    }

    return NextResponse.json({
      message: 'Ping sync endpoint ready',
      network,
      endpoints: {
        sync: 'POST /api/sync-pings',
        trigger: 'GET /api/sync-pings?trigger=true',
        status: 'GET /api/sync-pings'
      }
    });

  } catch (error) {
    console.error('Sync pings GET API error:', error);
    return NextResponse.json({ error: 'Failed to get sync status' }, { status: 500 });
  }
}

// TCP ping implementation
async function pingNode(ip: string, port: number, timeout: number): Promise<{
  ping: number | null;
  status: 'online' | 'offline' | 'timeout';
}> {
  const net = await import('net');
  
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