import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, COLLECTIONS } from '@/libs/db/mongodb';

export async function GET(request: NextRequest) {
  try {
    const db = await connectToDatabase();
    
    // Get counts from each collection
    const snapshotsCount = await db.collection(COLLECTIONS.NODE_SNAPSHOTS).countDocuments();
    const eventsCount = await db.collection(COLLECTIONS.NODE_EVENTS).countDocuments();
    
    // Get recent events
    const recentEvents = await db.collection(COLLECTIONS.NODE_EVENTS)
      .find({})
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
    
    // Get unique nodes count
    const uniqueNodes = await db.collection(COLLECTIONS.NODE_SNAPSHOTS).distinct('ip');
    
    // Get sample snapshot
    const sampleSnapshot = await db.collection(COLLECTIONS.NODE_SNAPSHOTS)
      .findOne({}, { sort: { timestamp: -1 } });

    return NextResponse.json({
      status: 'connected',
      collections: {
        snapshots: snapshotsCount,
        events: eventsCount,
      },
      uniqueNodes: uniqueNodes.length,
      recentEvents: recentEvents.map(e => ({
        event_type: e.event_type,
        ip: e.ip,
        timestamp: new Date(e.timestamp * 1000).toISOString(),
        details: e.event_type === 'node_new' ? e.details : undefined,
      })),
      sampleSnapshot: sampleSnapshot ? {
        ip: sampleSnapshot.ip,
        status: sampleSnapshot.status,
        uptime: sampleSnapshot.uptime,
        storage_committed: sampleSnapshot.storage_committed,
        credits: sampleSnapshot.credits,
        timestamp: new Date(sampleSnapshot.timestamp * 1000).toISOString(),
      } : null,
    });
  } catch (error) {
    console.error('DB status error:', error);
    return NextResponse.json(
      { status: 'error', error: String(error) },
      { status: 500 }
    );
  }
}
