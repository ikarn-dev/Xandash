import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, getCollectionNames } from '@/libs/db/mongodb';

type NetworkType = 'devnet' | 'mainnet';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const network = (searchParams.get('network') as NetworkType) || 'devnet';

  if (network !== 'devnet' && network !== 'mainnet') {
    return NextResponse.json({ error: 'Invalid network' }, { status: 400 });
  }

  try {
    const db = await connectToDatabase();
    const collections = getCollectionNames(network);

    // Get counts
    const snapshotsCount = await db.collection(collections.NODE_SNAPSHOTS).countDocuments();
    const eventsCount = await db.collection(collections.NODE_EVENTS).countDocuments();

    // Get unique IPs
    const uniqueIPs = await db.collection(collections.NODE_SNAPSHOTS).distinct('ip');

    // Get latest snapshot
    const latestSnapshot = await db.collection(collections.NODE_SNAPSHOTS).findOne(
      {},
      { sort: { timestamp: -1 } }
    );

    // Get latest event
    const latestEvent = await db.collection(collections.NODE_EVENTS).findOne(
      {},
      { sort: { timestamp: -1 } }
    );

    // Get event type breakdown
    const eventTypes = await db.collection(collections.NODE_EVENTS).aggregate([
      { $group: { _id: '$event_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();

    return NextResponse.json({
      network,
      collections: {
        snapshots: collections.NODE_SNAPSHOTS,
        events: collections.NODE_EVENTS,
      },
      stats: {
        totalSnapshots: snapshotsCount,
        totalEvents: eventsCount,
        uniqueNodes: uniqueIPs.length,
      },
      latestSnapshot: latestSnapshot ? {
        ip: latestSnapshot.ip,
        pubkey: latestSnapshot.pubkey?.slice(0, 12) + '...',
        status: latestSnapshot.status,
        timestamp: latestSnapshot.timestamp,
        date: new Date(latestSnapshot.timestamp * 1000).toISOString(),
      } : null,
      latestEvent: latestEvent ? {
        ip: latestEvent.ip,
        type: latestEvent.event_type,
        timestamp: latestEvent.timestamp,
        date: new Date(latestEvent.timestamp * 1000).toISOString(),
      } : null,
      eventBreakdown: eventTypes.map(e => ({ type: e._id, count: e.count })),
      sampleIPs: uniqueIPs.slice(0, 10),
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Failed to get database status',
      network 
    }, { status: 500 });
  }
}
