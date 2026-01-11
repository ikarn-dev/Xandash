import { NextRequest, NextResponse } from 'next/server';
import { getNodePingHistory, getNodePingStats, getLatestPingsForNodes } from '@/libs/db/node-service';

// GET - Get ping history for a node or batch of nodes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');
    const ips = searchParams.get('ips'); // comma-separated IPs for batch
    const hours = parseInt(searchParams.get('hours') || '24');
    const network = (searchParams.get('network') || 'devnet') as 'devnet' | 'mainnet';
    const stats = searchParams.get('stats') === 'true';

    // Batch request for latest pings
    if (ips) {
      const ipList = ips.split(',').map(ip => ip.trim()).filter(Boolean).slice(0, 100);
      const latestPings = await getLatestPingsForNodes(ipList, network);
      
      const results: Record<string, { ping: number | null; status: string; timestamp: number } | null> = {};
      ipList.forEach(ip => {
        const record = latestPings.get(ip);
        results[ip] = record ? {
          ping: record.ping,
          status: record.status,
          timestamp: record.timestamp,
        } : null;
      });
      
      return NextResponse.json({ results }, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    // Single IP request
    if (!ip) {
      return NextResponse.json({ error: 'IP or IPs parameter is required' }, { status: 400 });
    }

    // Get stats if requested
    if (stats) {
      const pingStats = await getNodePingStats(ip, hours, network);
      return NextResponse.json({
        ip,
        hours,
        network,
        stats: pingStats,
      }, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    // Get full history
    const history = await getNodePingHistory(ip, hours, network);
    
    return NextResponse.json({
      ip,
      hours,
      network,
      count: history.length,
      history: history.map(h => ({
        ping: h.ping,
        status: h.status,
        timestamp: h.timestamp,
      })),
    }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('Ping history error:', error);
    return NextResponse.json({ error: 'Failed to get ping history' }, { status: 500 });
  }
}
