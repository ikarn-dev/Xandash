import { NextRequest, NextResponse } from 'next/server';
import { 
  getNodeHistory, 
  getNodeEvents, 
  getLatestNodeSnapshot,
  getNodeStatsHistory,
  getAllRecentEvents 
} from '@/libs/db/node-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ip = searchParams.get('ip');
    const type = searchParams.get('type') || 'history'; // history, events, latest, stats, all-events
    const limit = parseInt(searchParams.get('limit') || '100');
    const hours = parseInt(searchParams.get('hours') || '24');

    // Get all recent events (no IP required)
    if (type === 'all-events') {
      const events = await getAllRecentEvents(limit);
      return NextResponse.json({ events });
    }

    if (!ip) {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
    }

    switch (type) {
      case 'history': {
        const history = await getNodeHistory(ip, limit);
        return NextResponse.json({ 
          ip, 
          history,
          count: history.length 
        });
      }
      
      case 'events': {
        const events = await getNodeEvents(ip, limit);
        return NextResponse.json({ 
          ip, 
          events,
          count: events.length 
        });
      }
      
      case 'latest': {
        const snapshot = await getLatestNodeSnapshot(ip);
        return NextResponse.json({ 
          ip, 
          snapshot 
        });
      }
      
      case 'stats': {
        const stats = await getNodeStatsHistory(ip, hours);
        return NextResponse.json({ 
          ip, 
          stats,
          hours,
          count: stats.length 
        });
      }
      
      default:
        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }
  } catch (error) {
    console.error('Node history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch node history' },
      { status: 500 }
    );
  }
}
