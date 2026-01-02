import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, COLLECTIONS } from '@/libs/db/mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    
    // Get counts from each collection
    const snapshotsCount = await db.collection(COLLECTIONS.NODE_SNAPSHOTS).countDocuments();
    const eventsCount = await db.collection(COLLECTIONS.NODE_EVENTS).countDocuments();
    
    // Get recent snapshots (last 10)
    const recentSnapshots = await db.collection(COLLECTIONS.NODE_SNAPSHOTS)
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
    
    // Get recent events
    const recentEvents = await db.collection(COLLECTIONS.NODE_EVENTS)
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
    
    // Get unique nodes count
    const uniqueNodes = await db.collection(COLLECTIONS.NODE_SNAPSHOTS).distinct('ip');
    
    // Get oldest and newest snapshot timestamps
    const oldestSnapshot = await db.collection(COLLECTIONS.NODE_SNAPSHOTS)
      .findOne({}, { sort: { timestamp: 1 } });
    const newestSnapshot = await db.collection(COLLECTIONS.NODE_SNAPSHOTS)
      .findOne({}, { sort: { timestamp: -1 } });
    
    // Get snapshots per node (sample)
    const snapshotsPerNode = await db.collection(COLLECTIONS.NODE_SNAPSHOTS).aggregate([
      { $group: { _id: '$ip', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).toArray();

    return NextResponse.json({
      status: 'connected',
      database: process.env.MONGODB_DB_NAME || 'xandash',
      collections: {
        snapshots: snapshotsCount,
        events: eventsCount,
      },
      uniqueNodes: uniqueNodes.length,
      timeRange: {
        oldest: oldestSnapshot ? new Date(oldestSnapshot.timestamp * 1000).toISOString() : null,
        newest: newestSnapshot ? new Date(newestSnapshot.timestamp * 1000).toISOString() : null,
      },
      snapshotsPerNode: snapshotsPerNode.map(s => ({ ip: s._id, count: s.count })),
      recentSnapshots: recentSnapshots.map(s => ({
        ip: s.ip,
        status: s.status,
        uptime: s.uptime,
        storage_committed: s.storage_committed,
        credits: s.credits,
        version: s.version,
        timestamp: new Date(s.timestamp * 1000).toISOString(),
      })),
      recentEvents: recentEvents.map(e => ({
        event_type: e.event_type,
        ip: e.ip,
        timestamp: new Date(e.timestamp * 1000).toISOString(),
        previous_value: e.previous_value,
        new_value: e.new_value,
        details: e.details,
      })),
    });
  } catch (error) {
    console.error('DB status error:', error);
    return NextResponse.json(
      { status: 'error', error: String(error) },
      { status: 500 }
    );
  }
}
