import {
  connectToDatabase,
  NodeSnapshot,
  NodeEventLog,
  getCollectionNames
} from './mongodb';
import { dispatchNotifications, shouldNotify } from '@/libs/services/notification-dispatcher';

// Threshold for storage change events (5% change)
const STORAGE_CHANGE_THRESHOLD = 0.05;
// Threshold for credits change events (100 credits)
const CREDITS_CHANGE_THRESHOLD = 100;

type NetworkType = 'devnet' | 'mainnet';

// Save a node snapshot and detect changes
export async function saveNodeSnapshot(nodeData: {
  ip: string;
  pubkey: string;
  address: string;
  status: string;
  uptime: number;
  storage_committed: number;
  storage_used: number;
  storage_usage_percent: number;
  version: string;
  rpc_port: number;
  is_public: boolean;
  last_seen_timestamp: number;
  credits?: number;
  active_streams?: number;
  // Manager data (optional)
  manager_pubkey?: string;
  manager_nft_count?: number;
  manager_sbt_count?: number;
  manager_xand_balance?: number;
  manager_data_updated?: number;
  manager_nft_names?: string[];
  manager_sbt_names?: string[];
}, network: NetworkType = 'devnet'): Promise<{ isNew: boolean; statusChanged: boolean; versionChanged: boolean; storageChanged: boolean; creditsChanged: boolean }> {
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const snapshotsCol = db.collection<NodeSnapshot>(collections.NODE_SNAPSHOTS);
  const eventsCol = db.collection<NodeEventLog>(collections.NODE_EVENTS);

  const now = Date.now();
  const timestamp = Math.floor(now / 1000);

  const lastSnapshot = await snapshotsCol.findOne(
    { ip: nodeData.ip },
    { sort: { timestamp: -1 } }
  );

  let isNew = false;
  let statusChanged = false;
  let versionChanged = false;
  let storageChanged = false;
  let creditsChanged = false;

  const timeDiff = timestamp - (nodeData.last_seen_timestamp || 0);
  let status: 'online' | 'offline' | 'syncing' = 'offline';
  if (timeDiff < 300) status = 'online';
  else if (timeDiff < 3600) status = 'syncing';

  if (!lastSnapshot) {
    isNew = true;
    await eventsCol.insertOne({
      ip: nodeData.ip,
      pubkey: nodeData.pubkey,
      event_type: 'node_new',
      new_status: status,
      new_value: nodeData.version,
      details: {
        version: nodeData.version,
        storage_committed: nodeData.storage_committed,
        storage_usage_percent: nodeData.storage_usage_percent,
        is_public: nodeData.is_public,
        credits: nodeData.credits || 0,
      },
      timestamp,
      created_at: new Date(),
    });
  } else {
    if (lastSnapshot.status !== status) {
      statusChanged = true;
      await eventsCol.insertOne({
        ip: nodeData.ip,
        pubkey: nodeData.pubkey,
        event_type: status === 'online' ? 'node_online' : status === 'offline' ? 'node_offline' : 'status_change',
        previous_status: lastSnapshot.status,
        new_status: status,
        previous_value: lastSnapshot.uptime,
        new_value: nodeData.uptime,
        details: {
          previous_last_seen: lastSnapshot.last_seen_timestamp,
          new_last_seen: nodeData.last_seen_timestamp,
        },
        timestamp,
        created_at: new Date(),
      });
    }

    if (lastSnapshot.version !== nodeData.version && nodeData.version) {
      versionChanged = true;
      await eventsCol.insertOne({
        ip: nodeData.ip,
        pubkey: nodeData.pubkey,
        event_type: 'version_change',
        previous_version: lastSnapshot.version,
        new_version: nodeData.version,
        previous_value: lastSnapshot.version,
        new_value: nodeData.version,
        timestamp,
        created_at: new Date(),
      });
    }

    const prevStorage = lastSnapshot.storage_usage_percent || 0;
    const newStorage = nodeData.storage_usage_percent || 0;
    const storageDiff = Math.abs(newStorage - prevStorage);

    if (storageDiff > STORAGE_CHANGE_THRESHOLD) {
      storageChanged = true;
      await eventsCol.insertOne({
        ip: nodeData.ip,
        pubkey: nodeData.pubkey,
        event_type: 'storage_change',
        previous_value: prevStorage,
        new_value: newStorage,
        details: {
          previous_committed: lastSnapshot.storage_committed,
          new_committed: nodeData.storage_committed,
          previous_used: lastSnapshot.storage_used,
          new_used: nodeData.storage_used,
        },
        timestamp,
        created_at: new Date(),
      });
    }

    const prevCredits = lastSnapshot.credits || 0;
    const newCredits = nodeData.credits ?? null;

    // For mainnet: only use previous credits if current is null (API failed)
    // If API returned 0, that's a valid value
    let finalCredits: number;
    if (network === 'mainnet' && newCredits === null && prevCredits > 0) {
      finalCredits = prevCredits;
    } else {
      finalCredits = newCredits ?? 0;
    }

    const creditsDiff = Math.abs(finalCredits - prevCredits);

    if (creditsDiff >= CREDITS_CHANGE_THRESHOLD) {
      creditsChanged = true;
      await eventsCol.insertOne({
        ip: nodeData.ip,
        pubkey: nodeData.pubkey,
        event_type: 'credits_change',
        previous_value: prevCredits,
        new_value: finalCredits,
        timestamp,
        created_at: new Date(),
      });
    }
  }

  // For mainnet: only use previous credits if current is null (API failed)
  let snapshotCredits: number;
  if (network === 'mainnet' && nodeData.credits === null && lastSnapshot?.credits && lastSnapshot.credits > 0) {
    snapshotCredits = lastSnapshot.credits;
  } else {
    snapshotCredits = nodeData.credits ?? 0;
  }

  const snapshot: NodeSnapshot = {
    ip: nodeData.ip,
    pubkey: nodeData.pubkey,
    address: nodeData.address,
    status,
    uptime: nodeData.uptime,
    storage_committed: nodeData.storage_committed,
    storage_used: nodeData.storage_used,
    storage_usage_percent: nodeData.storage_usage_percent,
    version: nodeData.version,
    rpc_port: nodeData.rpc_port,
    is_public: nodeData.is_public,
    last_seen_timestamp: nodeData.last_seen_timestamp,
    credits: snapshotCredits,
    active_streams: nodeData.active_streams || 0,
    timestamp,
    created_at: new Date(),
    // Manager data (if provided)
    ...(nodeData.manager_pubkey && {
      manager_pubkey: nodeData.manager_pubkey,
      manager_nft_count: nodeData.manager_nft_count || 0,
      manager_sbt_count: nodeData.manager_sbt_count || 0,
      manager_xand_balance: nodeData.manager_xand_balance || 0,
      manager_data_updated: nodeData.manager_data_updated || timestamp,
      manager_nft_names: nodeData.manager_nft_names || [],
      manager_sbt_names: nodeData.manager_sbt_names || [],
    }),
  };

  await snapshotsCol.insertOne(snapshot);

  return { isNew, statusChanged, versionChanged, storageChanged, creditsChanged };
}

// Save multiple node snapshots (batch) with optional manager data
export async function saveAllNodeSnapshots(
  nodes: any[],
  creditsMap?: Map<string, number>,
  network: NetworkType = 'devnet',
  managerAssetsMap?: Map<string, any> // Map of pubkey -> manager assets data
): Promise<{
  total: number;
  newNodes: number;
  statusChanges: number;
  versionChanges: number;
  storageChanges: number;
  creditsChanges: number;
}> {
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const snapshotsCol = db.collection<NodeSnapshot>(collections.NODE_SNAPSHOTS);
  const eventsCol = db.collection<NodeEventLog>(collections.NODE_EVENTS);

  const now = Date.now();
  const timestamp = Math.floor(now / 1000);

  const validNodes = nodes.filter(node => {
    const ip = node.address?.split(':')[0] || '';
    return ip && ip !== '127.0.0.1';
  });

  if (validNodes.length === 0) {
    return { total: 0, newNodes: 0, statusChanges: 0, versionChanges: 0, storageChanges: 0, creditsChanges: 0 };
  }

  const ips = validNodes.map(n => n.address?.split(':')[0]);

  const latestSnapshots = await snapshotsCol.aggregate([
    { $match: { ip: { $in: ips } } },
    { $sort: { timestamp: -1 } },
    { $group: { _id: '$ip', doc: { $first: '$$ROOT' } } }
  ]).toArray();

  const snapshotMap = new Map(latestSnapshots.map(s => [s._id, s.doc]));

  const snapshotsToInsert: NodeSnapshot[] = [];
  const eventsToInsert: NodeEventLog[] = [];

  let newNodes = 0;
  let statusChanges = 0;
  let versionChanges = 0;
  let storageChanges = 0;
  let creditsChanges = 0;

  for (const node of validNodes) {
    const ip = node.address?.split(':')[0];
    // Get credits from creditsMap, node data, or default to null (unknown)
    let credits: number | null = creditsMap?.get(node.pubkey) ?? node.credits ?? null;
    const lastSnapshot = snapshotMap.get(ip);

    // For mainnet: only use previous credits if current fetch returned null (API failed)
    // If API returned 0, that's a valid value - don't override it
    if (network === 'mainnet' && credits === null && lastSnapshot?.credits && lastSnapshot.credits > 0) {
      credits = lastSnapshot.credits;
    }

    // Convert null to 0 for storage
    const finalCredits = credits ?? 0;

    const timeDiff = timestamp - (node.last_seen_timestamp || 0);
    let status: 'online' | 'offline' | 'syncing' = 'offline';
    if (timeDiff < 300) status = 'online';
    else if (timeDiff < 3600) status = 'syncing';

    if (!lastSnapshot) {
      newNodes++;
      eventsToInsert.push({
        ip,
        pubkey: node.pubkey || '',
        event_type: 'node_new',
        new_status: status,
        new_value: node.version || '',
        details: { version: node.version, storage_committed: node.storage_committed, credits: finalCredits },
        timestamp,
        created_at: new Date(),
      });
    } else {
      if (lastSnapshot.status !== status) {
        statusChanges++;
        eventsToInsert.push({
          ip,
          pubkey: node.pubkey || '',
          event_type: status === 'online' ? 'node_online' : status === 'offline' ? 'node_offline' : 'status_change',
          previous_status: lastSnapshot.status,
          new_status: status,
          previous_value: lastSnapshot.uptime,
          new_value: node.uptime,
          details: { previous_last_seen: lastSnapshot.last_seen_timestamp, new_last_seen: node.last_seen_timestamp },
          timestamp,
          created_at: new Date(),
        });
      }

      if (lastSnapshot.version !== node.version && node.version) {
        versionChanges++;
        eventsToInsert.push({
          ip,
          pubkey: node.pubkey || '',
          event_type: 'version_change',
          previous_version: lastSnapshot.version,
          new_version: node.version,
          previous_value: lastSnapshot.version,
          new_value: node.version,
          timestamp,
          created_at: new Date(),
        });
      }

      // Detect uptime reset (node restart) - when:
      // 1. Uptime becomes exactly 0, OR
      // 2. Uptime drops significantly (more than 50%) from a high value (> 1 hour)
      const prevUptime = lastSnapshot.uptime || 0;
      const newUptime = node.uptime || 0;
      const uptimeReset = (prevUptime > 0 && newUptime === 0) ||
        (prevUptime > 3600 && newUptime < prevUptime * 0.5);
      if (uptimeReset) {
        // Uptime dropped significantly or became 0 - node likely restarted
        eventsToInsert.push({
          ip,
          pubkey: node.pubkey || '',
          event_type: 'uptime_reset',
          previous_value: prevUptime,
          new_value: newUptime,
          details: {
            previous_uptime_hours: Math.floor(prevUptime / 3600),
            new_uptime_hours: Math.floor(newUptime / 3600),
            reset_type: newUptime === 0 ? 'uptime_zero' : 'significant_drop',
          },
          timestamp,
          created_at: new Date(),
        });
      }

      const prevStorage = lastSnapshot.storage_usage_percent || 0;
      const newStorage = node.storage_usage_percent || 0;
      if (Math.abs(newStorage - prevStorage) > STORAGE_CHANGE_THRESHOLD) {
        storageChanges++;
        eventsToInsert.push({
          ip,
          pubkey: node.pubkey || '',
          event_type: 'storage_change',
          previous_value: prevStorage,
          new_value: newStorage,
          timestamp,
          created_at: new Date(),
        });
      }

      const prevCredits = lastSnapshot.credits || 0;

      // Detect credits_zero: Credits dropped from > 0 to exactly 0
      // Only notify if previous credits was positive (not already 0)
      if (prevCredits > 0 && finalCredits === 0) {
        eventsToInsert.push({
          ip,
          pubkey: node.pubkey || '',
          event_type: 'credits_zero',
          previous_value: prevCredits,
          new_value: 0,
          details: {
            previous_credits: prevCredits,
          },
          timestamp,
          created_at: new Date(),
        });
      }

      // Regular credits change tracking (for significant changes)
      if (Math.abs(finalCredits - prevCredits) >= CREDITS_CHANGE_THRESHOLD) {
        creditsChanges++;
        eventsToInsert.push({
          ip,
          pubkey: node.pubkey || '',
          event_type: 'credits_change',
          previous_value: prevCredits,
          new_value: finalCredits,
          timestamp,
          created_at: new Date(),
        });
      }
    }

    // Get manager assets data for this node
    const managerAssets = managerAssetsMap?.get(node.pubkey);

    snapshotsToInsert.push({
      ip,
      pubkey: node.pubkey || '',
      address: node.address || '',
      status,
      uptime: node.uptime || 0,
      storage_committed: node.storage_committed || 0,
      storage_used: node.storage_used || 0,
      storage_usage_percent: node.storage_usage_percent || 0,
      version: node.version || '',
      rpc_port: node.rpc_port || 0,
      is_public: node.is_public || false,
      last_seen_timestamp: node.last_seen_timestamp || 0,
      credits: finalCredits,
      active_streams: node.active_streams || 0,
      timestamp,
      created_at: new Date(),
      // Manager data (if available)
      ...(managerAssets && {
        manager_pubkey: managerAssets.manager_pubkey,
        manager_nft_count: managerAssets.nft_count || 0,
        manager_sbt_count: managerAssets.sbt_count || 0,
        manager_xand_balance: managerAssets.xand_balance || 0,
        manager_data_updated: managerAssets.last_updated || timestamp,
        manager_nft_names: managerAssets.nft_names || [],
        manager_sbt_names: managerAssets.sbt_names || [],
      }),
    });
  }

  if (snapshotsToInsert.length > 0) {
    await snapshotsCol.insertMany(snapshotsToInsert, { ordered: false });
  }
  if (eventsToInsert.length > 0) {
    await eventsCol.insertMany(eventsToInsert, { ordered: false });

    // Dispatch notifications for notifiable events (async, don't block sync)
    const notifiableEvents = eventsToInsert.filter(e => shouldNotify(e.event_type));
    if (notifiableEvents.length > 0) {
      // Fire and forget - don't wait for notifications to complete
      dispatchNotifications(notifiableEvents, network).catch(err => {
        console.error('Notification dispatch error:', err);
      });
    }
  }

  return { total: validNodes.length, newNodes, statusChanges, versionChanges, storageChanges, creditsChanges };
}

// Get node history from database
export async function getNodeHistory(ip: string, limit: number = 100, network: NetworkType = 'devnet'): Promise<NodeSnapshot[]> {
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const col = db.collection<NodeSnapshot>(collections.NODE_SNAPSHOTS);

  return col.find({ ip }).sort({ timestamp: -1 }).limit(limit).toArray();
}

// Get node events/logs
export async function getNodeEvents(ip: string, limit: number = 50, network: NetworkType = 'devnet'): Promise<NodeEventLog[]> {
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const col = db.collection<NodeEventLog>(collections.NODE_EVENTS);

  return col.find({ ip }).sort({ timestamp: -1 }).limit(limit).toArray();
}

// Get latest snapshot for a node
export async function getLatestNodeSnapshot(ip: string, network: NetworkType = 'devnet'): Promise<NodeSnapshot | null> {
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const col = db.collection<NodeSnapshot>(collections.NODE_SNAPSHOTS);

  return col.findOne({ ip }, { sort: { timestamp: -1 } });
}

// Get all events (for dashboard/monitoring)
export async function getAllRecentEvents(limit: number = 100, network: NetworkType = 'devnet'): Promise<NodeEventLog[]> {
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const col = db.collection<NodeEventLog>(collections.NODE_EVENTS);

  return col.find({}).sort({ timestamp: -1 }).limit(limit).toArray();
}

// Get node stats over time for charts - optimized for performance
export async function getNodeStatsHistory(ip: string, hours: number = 24, network: NetworkType = 'devnet'): Promise<NodeSnapshot[]> {
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const col = db.collection<NodeSnapshot>(collections.NODE_SNAPSHOTS);

  if (hours === 0) {
    // For all-time, get last 168 data points with simple query
    const projection = {
      _id: 0,
      timestamp: 1,
      credits: 1,
      uptime: 1,
      storage_committed: 1,
      storage_used: 1,
      storage_usage_percent: 1,
      status: 1
    };

    return col.find({ ip }, { projection })
      .sort({ timestamp: -1 })
      .limit(168)
      .toArray()
      .then(results => results.reverse());
  }

  const cutoffTime = Math.floor(Date.now() / 1000) - (hours * 3600);

  // For longer time ranges, bucket data to reduce points
  const bucketSeconds = hours > 48 ? 3600 : hours > 12 ? 1800 : 900;

  const pipeline = [
    { $match: { ip, timestamp: { $gte: cutoffTime } } },
    {
      $group: {
        _id: { $subtract: ['$timestamp', { $mod: ['$timestamp', bucketSeconds] }] },
        timestamp: { $first: '$timestamp' },
        credits: { $avg: '$credits' },
        uptime: { $max: '$uptime' },
        storage_committed: { $avg: '$storage_committed' },
        storage_used: { $avg: '$storage_used' },
        storage_usage_percent: { $avg: '$storage_usage_percent' },
        status: { $first: '$status' }
      }
    },
    {
      $project: {
        _id: 0,
        timestamp: '$_id',
        credits: { $round: ['$credits', 0] },
        uptime: 1,
        storage_committed: { $round: ['$storage_committed', 0] },
        storage_used: { $round: ['$storage_used', 0] },
        storage_usage_percent: { $round: ['$storage_usage_percent', 2] },
        status: 1
      }
    },
    { $sort: { timestamp: 1 } },
    { $limit: 200 }
  ];

  return col.aggregate<NodeSnapshot>(pipeline).toArray();
}

// Cleanup old snapshots (keep last 7 days)
export async function cleanupOldSnapshots(daysToKeep: number = 7, network: NetworkType = 'devnet'): Promise<number> {
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const col = db.collection<NodeSnapshot>(collections.NODE_SNAPSHOTS);

  const cutoffTime = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 3600);

  const result = await col.deleteMany({ timestamp: { $lt: cutoffTime } });
  return result.deletedCount;
}

// Create indexes for better query performance
export async function createIndexes(network?: NetworkType): Promise<void> {
  const db = await connectToDatabase();

  const networks: NetworkType[] = network ? [network] : ['devnet', 'mainnet'];

  for (const net of networks) {
    const collections = getCollectionNames(net);

    const snapshotsCol = db.collection(collections.NODE_SNAPSHOTS);
    // Compound index for efficient time-range queries per IP
    await snapshotsCol.createIndex({ ip: 1, timestamp: -1 });
    // Index for batch queries with multiple IPs
    await snapshotsCol.createIndex({ timestamp: -1, ip: 1 });
    await snapshotsCol.createIndex({ pubkey: 1 });

    const eventsCol = db.collection(collections.NODE_EVENTS);
    await eventsCol.createIndex({ ip: 1, timestamp: -1 });
    await eventsCol.createIndex({ event_type: 1, timestamp: -1 });
    await eventsCol.createIndex({ timestamp: -1 });
  }
}

// Batch fetch stats for multiple nodes (optimized for compare page)
export async function getBatchNodeStatsHistory(
  ips: string[],
  hours: number = 24,
  network: NetworkType = 'devnet'
): Promise<Record<string, NodeSnapshot[]>> {
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const col = db.collection<NodeSnapshot>(collections.NODE_SNAPSHOTS);

  const cutoffTime = Math.floor(Date.now() / 1000) - (hours * 3600);

  // For 7 days of data, bucket into hourly averages to reduce data points
  // This dramatically improves performance while maintaining chart accuracy
  const bucketSeconds = hours > 48 ? 3600 : hours > 12 ? 1800 : 900; // 1h, 30m, or 15m buckets

  const pipeline = [
    {
      $match: {
        ip: { $in: ips },
        timestamp: { $gte: cutoffTime }
      }
    },
    {
      // Bucket data by time intervals
      $group: {
        _id: {
          ip: '$ip',
          bucket: { $subtract: ['$timestamp', { $mod: ['$timestamp', bucketSeconds] }] }
        },
        timestamp: { $first: '$timestamp' },
        credits: { $avg: '$credits' },
        uptime: { $max: '$uptime' },
        storage_committed: { $avg: '$storage_committed' },
        storage_used: { $avg: '$storage_used' },
        storage_usage_percent: { $avg: '$storage_usage_percent' }
      }
    },
    {
      $project: {
        _id: 0,
        ip: '$_id.ip',
        timestamp: '$_id.bucket',
        credits: { $round: ['$credits', 0] },
        uptime: 1,
        storage_committed: { $round: ['$storage_committed', 0] },
        storage_used: { $round: ['$storage_used', 0] },
        storage_usage_percent: { $round: ['$storage_usage_percent', 2] }
      }
    },
    { $sort: { ip: 1, timestamp: 1 } }
  ];

  const allResults = await col.aggregate<NodeSnapshot & { ip: string }>(pipeline).toArray();

  // Group results by IP
  const resultsByIp: Record<string, NodeSnapshot[]> = {};
  ips.forEach(ip => { resultsByIp[ip] = []; });

  allResults.forEach(doc => {
    if (resultsByIp[doc.ip]) {
      resultsByIp[doc.ip].push(doc);
    }
  });

  return resultsByIp;
}
