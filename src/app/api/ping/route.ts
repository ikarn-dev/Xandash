import { NextRequest, NextResponse } from 'next/server';
import net from 'net';
import { savePingRecord, savePingRecordsBatch } from '@/libs/db/node-service';

// In-memory cache for ping results
const pingCache = new Map<string, { time: number; ping: number | null; status: string }>();

// POST - Ping a node or batch of nodes and save results
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ip, ips, port = 6000, timeout = 3000, network = 'devnet', save = true } = body;

    if (network !== 'devnet' && network !== 'mainnet') {
      return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
    }

    // Batch ping
    if (ips && Array.isArray(ips)) {
      const results = await Promise.all(
        ips.map(async (targetIp: string) => {
          const result = await performPing(targetIp, port, timeout);
          return { ip: targetIp, ...result };
        })
      );

      // Save to database if requested
      if (save) {
        const pingRecords = results.map(r => ({
          ip: r.ip,
          ping: r.ping,
          status: r.status as 'online' | 'offline' | 'timeout',
          port
        }));
        
        await savePingRecordsBatch(pingRecords, network);
      }

      return NextResponse.json({ results }, {
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    // Single ping
    if (!ip) {
      return NextResponse.json({ error: 'IP address or IPs array is required' }, { status: 400 });
    }

    const result = await performPing(ip, port, timeout);

    // Save to database if requested
    if (save) {
      await savePingRecord({
        ip,
        ping: result.ping,
        status: result.status as 'online' | 'offline' | 'timeout',
        port
      }, network);
    }

    return NextResponse.json({ ip, ...result }, {
      headers: { 'Cache-Control': 'no-store' }
    });

  } catch (error) {
    console.error('Ping API error:', error);
    return NextResponse.json({ error: 'Failed to ping node(s)' }, { status: 500 });
  }
}

// GET - Get cached ping result
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');
    const port = parseInt(searchParams.get('port') || '6000');
    const timeout = parseInt(searchParams.get('timeout') || '3000');

    if (!ip) {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
    }

    // Check cache first
    const cacheKey = `${ip}:${port}`;
    const cached = pingCache.get(cacheKey);
    
    if (cached && Date.now() - cached.time < 30000) { // 30 second cache
      return NextResponse.json({
        ip,
        ping: cached.ping,
        status: cached.status,
        cached: true
      });
    }

    // Perform fresh ping
    const result = await performPing(ip, port, timeout);
    
    // Update cache
    pingCache.set(cacheKey, {
      time: Date.now(),
      ping: result.ping,
      status: result.status
    });

    return NextResponse.json({ ip, ...result, cached: false }, {
      headers: { 'Cache-Control': 'no-store' }
    });

  } catch (error) {
    console.error('Ping GET API error:', error);
    return NextResponse.json({ error: 'Failed to ping node' }, { status: 500 });
  }
}

// Perform TCP ping
async function performPing(ip: string, port: number, timeout: number): Promise<{
  ping: number | null;
  status: 'online' | 'offline' | 'timeout';
}> {
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