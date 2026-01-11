import { NextRequest, NextResponse } from 'next/server';
import net from 'net';
import { savePingRecord, savePingRecordsBatch } from '@/libs/db/node-service';

// In-memory cache for ping results
const pingCache = new Map<string, { time: number; ping: number | null; status: string }>();
const CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * TCP ping - measures time to establish TCP connection
 * Fast and reliable way to check node connectivity
 */
async function tcpPing(ip: string, port: number, timeout: number = 3000): Promise<{ ping: number | null; status: string }> {
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
 * Ping a pNode - tries port 6000 first, then 9001
 */
async function pingNode(ip: string, port: number = 6000): Promise<{ ping: number | null; status: string }> {
  const tcpResult = await tcpPing(ip, port);
  if (tcpResult.status === 'online') {
    return tcpResult;
  }
  
  // Try alternate port 9001 if 6000 fails
  if (port === 6000) {
    const tcp9001 = await tcpPing(ip, 9001);
    if (tcp9001.status === 'online') {
      return tcp9001;
    }
  }
  
  return { ping: null, status: 'offline' };
}

/**
 * Get ping with caching
 */
async function getPing(ip: string, port: number = 6000, pubkey?: string, saveToDb: boolean = false, network: 'devnet' | 'mainnet' = 'devnet'): Promise<{ ping: number | null; status: string }> {
  const cacheKey = `${ip}:${port}`;
  const cached = pingCache.get(cacheKey);
  
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return { ping: cached.ping, status: cached.status };
  }

  const result = await pingNode(ip, port);
  pingCache.set(cacheKey, { time: Date.now(), ...result });
  
  // Save to MongoDB if requested
  if (saveToDb) {
    try {
      await savePingRecord(
        ip,
        result.ping,
        result.status as 'online' | 'timeout' | 'offline',
        port,
        pubkey,
        network
      );
    } catch (e) {
      // Don't fail the request if DB save fails
      console.error('Failed to save ping to DB:', e);
    }
  }
  
  return result;
}

// GET - Single IP ping
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');
    const port = parseInt(searchParams.get('port') || '6000');
    const pubkey = searchParams.get('pubkey') || undefined;
    const save = searchParams.get('save') === 'true';
    const network = (searchParams.get('network') || 'devnet') as 'devnet' | 'mainnet';

    if (!ip) {
      return NextResponse.json({ error: 'IP is required' }, { status: 400 });
    }

    const result = await getPing(ip, port, pubkey, save, network);

    return NextResponse.json({
      ip,
      port,
      ping: result.ping,
      status: result.status,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to ping node' }, { status: 500 });
  }
}

// POST - Batch ping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items: Array<{ ip: string; port?: number; pubkey?: string }> = body.items || [];
    const save = body.save === true;
    const network = (body.network || 'devnet') as 'devnet' | 'mainnet';

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    // Limit to 50 IPs per request
    const limitedItems = items.slice(0, 50);
    
    // Ping in parallel batches of 10
    const results: { [ip: string]: { ping: number | null; status: string } } = {};
    const pingRecords: Array<{ ip: string; ping: number | null; status: 'online' | 'timeout' | 'offline'; port: number; pubkey?: string }> = [];
    const batchSize = 10;
    
    for (let i = 0; i < limitedItems.length; i += batchSize) {
      const batch = limitedItems.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (item) => {
          const port = item.port || 6000;
          const result = await pingNode(item.ip, port);
          
          // Cache the result
          pingCache.set(`${item.ip}:${port}`, { time: Date.now(), ...result });
          
          return { ip: item.ip, port, pubkey: item.pubkey, ...result };
        })
      );
      
      batchResults.forEach(({ ip, port, pubkey, ping, status }) => {
        results[ip] = { ping, status };
        if (save) {
          pingRecords.push({ ip, ping, status: status as 'online' | 'timeout' | 'offline', port, pubkey });
        }
      });
    }
    
    // Save all pings to MongoDB in batch
    if (save && pingRecords.length > 0) {
      try {
        await savePingRecordsBatch(pingRecords, network);
      } catch (e) {
        console.error('Failed to save pings to DB:', e);
      }
    }

    return NextResponse.json({ results, saved: save ? pingRecords.length : 0 }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to ping nodes' }, { status: 500 });
  }
}
