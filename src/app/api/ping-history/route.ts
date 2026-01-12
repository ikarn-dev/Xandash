import { NextRequest, NextResponse } from 'next/server';
import { getNodePingHistory, getNodePingStats, getLatestPingsForNodes } from '@/libs/db/node-service';

// GET - Get ping history for a node or batch of nodes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');
    const ips = searchParams.get('ips');
    const limit = parseInt(searchParams.get('limit') || '100');
    const hours = parseInt(searchParams.get('hours') || '24');
    const network = (searchParams.get('network') as 'devnet' | 'mainnet') || 'devnet';
    const statsOnly = searchParams.get('stats') === 'true';

    if (network !== 'devnet' && network !== 'mainnet') {
      return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
    }

    // Batch request for multiple IPs (latest pings only)
    if (ips) {
      const ipList = ips.split(',').map(ip => ip.trim()).filter(Boolean);
      if (ipList.length === 0) {
        return NextResponse.json({ error: 'No valid IPs provided' }, { status: 400 });
      }

      const latestPings = await getLatestPingsForNodes(ipList, network);
      return NextResponse.json({ latestPings }, {
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    // Single IP request
    if (!ip) {
      return NextResponse.json({ error: 'IP address or IPs list is required' }, { status: 400 });
    }

    if (statsOnly) {
      // Return only stats
      const stats = await getNodePingStats(ip, hours, network);
      return NextResponse.json({ ip, network, stats }, {
        headers: { 'Cache-Control': 'no-store' }
      });
    }

    // Return full history and stats
    const [history, stats] = await Promise.all([
      getNodePingHistory(ip, limit, network),
      getNodePingStats(ip, hours, network)
    ]);

    return NextResponse.json({
      ip,
      network,
      history,
      stats,
      count: history.length
    }, {
      headers: { 'Cache-Control': 'no-store' }
    });

  } catch (error) {
    console.error('Ping history API error:', error);
    return NextResponse.json({ error: 'Failed to fetch ping history' }, { status: 500 });
  }
}