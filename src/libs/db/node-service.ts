import { 
  connectToDatabase, 
  NodeSnapshot, 
  NodeEventLog, 
  getCollectionNames 
} from './mongodb';

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
}, network: NetworkType = 'devnet'): Promise<{ isNew: boolean; statusChanged: boolean; versionChanged: boolean; storageChanged: boolean; creditsChanged: boolean }> {
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const snapshotsCol = db.collection<NodeSnapshot>(collections.NODE_SNAPSHOTS);
  const eventsCol = db.collection<NodeEventLog>(collections.NODE_EVENTS);
  
  const now = Date.now();
  const timestamp = Math.floor(now / 1000);
  
  // Get the latest snapshot for this node
  const lastSnapshot = await snapshotsCol.findOne(
    { ip: nodeData.ip },
    { sort: { timestamp: -1 } }
  );
  
  let isNew = false;
  let statusChanged = false;
  let versionChanged = false;
  let storageChanged = false;
  let creditsChanged = false;
  
  // Determine node status
  const timeDiff = timestamp - (nodeData.last_seen_timestamp || 0);
  let status: 'online' | 'offline' | 'syncing' = 'offline';
  if (timeDiff < 300) status = 'online';
  else if (timeDiff < 3600) status = 'syncing';
  
  // Check if this is a new node
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
    // Check for status change
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
    
    // Check for version change
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
    
    // Check for significant storage change (more than 5%)
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
    
    // Check for significant credits change
    const prevCredits = lastSnapshot.credits || 0;
    const newCredits = nodeData.credits || 0;
    const creditsDiff = Math.abs(newCredits - prevCredits);
    
    if (creditsDiff >= CREDITS_CHANGE_THRESHOLD) {
      creditsChanged = true;
      await eventsCol.insertOne({
        ip: nodeData.ip,
        pubkey: nodeData.pubkey,
        event_type: 'credits_change',
        previous_value: prevCredits,
        new_value: newCredits,
        timestamp,
        created_at: new Date(),
      });
    }
  }
  
  // Save the new snapshot
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
    credits: nodeData.credits || 0,
    active_streams: nodeData.active_streams || 0,
    timestamp,
    created_at: new Date(),
  };
  
  await snapshotsCol.insertOne(snapshot);
  
  return { isNew, statusChanged, versionChanged, storageChanged, creditsChanged };
}

// Save multiple node snapshots (batch) - OPTIMIZED
export async function saveAllNodeSnapshots(nodes: any[], creditsMap?: Map<string, number>, network: NetworkType = 'devnet'): Promise<{
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
  
  // Filter valid nodes
  const validNodes = nodes.filter(node => {
    const ip = node.address?.split(':')[0] || '';
    return ip && ip !== '127.0.0.1';
  });
  
  if (validNodes.length === 0) {
    return { total: 0, newNodes: 0, statusChanges: 0, versionChanges: 0, storageChanges: 0, creditsChanges: 0 };
  }
  
  // Get all IPs
  const ips = validNodes.map(n => n.address?.split(':')[0]);
  
  // Batch fetch latest snapshots for all nodes
  const latestSnapshots = await snapshotsCol.aggregate([
    { $match: { ip: { $in: ips } } },
    { $sort: { timestamp: -1 } },
    { $group: { _id: '$ip', doc: { $first: '$$ROOT' } } }
  ]).toArray();
  
  const snapshotMap = new Map(latestSnapshots.map(s => [s._id, s.doc]));
  
  // Prepare batch inserts
  const snapshotsToInsert: NodeSnapshot[] = [];
  const eventsToInsert: NodeEventLog[] = [];
  
  let newNodes = 0;
  let statusChanges = 0;
  let versionChanges = 0;
  let storageChanges = 0;
  let creditsChanges = 0;
  
  for (const node of validNodes) {
    const ip = node.address?.split(':')[0];
    const credits = creditsMap?.get(node.pubkey) || 0;
    const lastSnapshot = snapshotMap.get(ip);
    
    // Determine node status
    const timeDiff = timestamp - (node.last_seen_timestamp || 0);
    let status: 'online' | 'offline' | 'syncing' = 'offline';
    if (timeDiff < 300) status = 'online';
    else if (timeDiff < 3600) status = 'syncing';
    
    // Check for changes and create events
    if (!lastSnapshot) {
      newNodes++;
      eventsToInsert.push({
        ip,
        pubkey: node.pubkey || '',
        event_type: 'node_new',
        new_status: status,
        new_value: node.version || '',
        details: {
          version: node.version,
          storage_committed: node.storage_committed,
          credits,
        },
        timestamp,
        created_at: new Date(),
      });
    } else {
      // Status change
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
      
      // Version change
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
      
      // Storage change (>5%)
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
      
      // Credits change (>100)
      const prevCredits = lastSnapshot.credits || 0;
      if (Math.abs(credits - prevCredits) >= CREDITS_CHANGE_THRESHOLD) {
        creditsChanges++;
        eventsToInsert.push({
          ip,
          pubkey: node.pubkey || '',
          event_type: 'credits_change',
          previous_value: prevCredits,
          new_value: credits,
          timestamp,
          created_at: new Date(),
        });
      }
    }
    
    // Add snapshot
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
      credits,
      active_streams: node.active_streams || 0,
      timestamp,
      created_at: new Date(),
    });
  }
  
  // Batch insert all snapshots and events
  if (snapshotsToInsert.length > 0) {
    await snapshotsCol.insertMany(snapshotsToInsert, { ordered: false });
  }
  if (eventsToInsert.length > 0) {
    await eventsCol.insertMany(eventsToInsert, { ordered: false });
  }
  
  return { total: validNodes.length, newNodes, statusChanges, versionChanges, storageChanges, creditsChanges };
}

// Get node history from database
export async function getNodeHistory(ip: string, limit: number = 100, network: NetworkType = 'devnet'): Promise<NodeSnapshot[]> {
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const col = db.collection<NodeSnapshot>(collections.NODE_SNAPSHOTS);
  
  return col
    .find({ ip })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
}

// Get node events/logs
export async function getNodeEvents(ip: string, limit: number = 50, network: NetworkType = 'devnet'): Promise<NodeEventLog[]> {
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const col = db.collection<NodeEventLog>(collections.NODE_EVENTS);
  
  return col
    .find({ ip })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
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
  
  return col
    .find({})
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
}

// Get node stats over time for charts
export async function getNodeStatsHistory(ip: string, hours: number = 24, network: NetworkType = 'devnet'): Promise<NodeSnapshot[]> {
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const col = db.collection<NodeSnapshot>(collections.NODE_SNAPSHOTS);
  
  // If hours is 0, fetch all data (no time filter)
  if (hours === 0) {
    return col
      .find({ ip })
      .sort({ timestamp: 1 })
      .toArray();
  }
  
  const cutoffTime = Math.floor(Date.now() / 1000) - (hours * 3600);
  
  return col
    .find({ ip, timestamp: { $gte: cutoffTime } })
    .sort({ timestamp: 1 })
    .toArray();
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
  
  // Create indexes for specified network or both
  const networks: NetworkType[] = network ? [network] : ['devnet', 'mainnet'];
  
  for (const net of networks) {
    const collections = getCollectionNames(net);
    
    // Node snapshots indexes
    const snapshotsCol = db.collection(collections.NODE_SNAPSHOTS);
    await snapshotsCol.createIndex({ ip: 1, timestamp: -1 });
    await snapshotsCol.createIndex({ pubkey: 1 });
    await snapshotsCol.createIndex({ timestamp: -1 });
    
    // Node events indexes
    const eventsCol = db.collection(collections.NODE_EVENTS);
    await eventsCol.createIndex({ ip: 1, timestamp: -1 });
    await eventsCol.createIndex({ event_type: 1, timestamp: -1 });
    await eventsCol.createIndex({ timestamp: -1 });
    
    // Node pings indexes
    const pingsCol = db.collection(collections.NODE_PINGS);
    await pingsCol.createIndex({ ip: 1, timestamp: -1 });
    await pingsCol.createIndex({ timestamp: -1 });
  }
}

// ============== PING DATA FUNCTIONS ==============

export interface NodePingRecord {
  ip: string;
  pubkey?: string;
  ping: number | null;
  status: 'online' | 'timeout' | 'offline';
  port: number;
  timestamp: number;
  created_at: Date;
}

// Save a single ping record
export async function savePingRecord(
  ip: string,
  ping: number | null,
  status: 'online' | 'timeout' | 'offline',
  port: number = 6000,
  pubkey?: string,
  network: NetworkType = 'devnet'
): Promise<void> {
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const col = db.collection(collections.NODE_PINGS);
  
  const timestamp = Math.floor(Date.now() / 1000);
  
  await col.insertOne({
    ip,
    pubkey,
    ping,
    status,
    port,
    timestamp,
    created_at: new Date(),
  });
}

// Save multiple ping records (batch)
export async function savePingRecordsBatch(
  records: Array<{
    ip: string;
    ping: number | null;
    status: 'online' | 'timeout' | 'offline';
    port?: number;
    pubkey?: string;
  }>,
  network: NetworkType = 'devnet'
): Promise<number> {
  if (records.length === 0) return 0;
  
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const col = db.collection(collections.NODE_PINGS);
  
  const timestamp = Math.floor(Date.now() / 1000);
  const now = new Date();
  
  const documents = records.map(r => ({
    ip: r.ip,
    pubkey: r.pubkey,
    ping: r.ping,
    status: r.status,
    port: r.port || 6000,
    timestamp,
    created_at: now,
  }));
  
  const result = await col.insertMany(documents, { ordered: false });
  return result.insertedCount;
}

// Get ping history for a node
export async function getNodePingHistory(
  ip: string,
  hours: number = 24,
  network: NetworkType = 'devnet'
): Promise<NodePingRecord[]> {
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const col = db.collection<NodePingRecord>(collections.NODE_PINGS);
  
  if (hours === 0) {
    return col.find({ ip }).sort({ timestamp: 1 }).toArray();
  }
  
  const cutoffTime = Math.floor(Date.now() / 1000) - (hours * 3600);
  
  return col
    .find({ ip, timestamp: { $gte: cutoffTime } })
    .sort({ timestamp: 1 })
    .toArray();
}

// Get latest ping for a node
export async function getLatestPing(
  ip: string,
  network: NetworkType = 'devnet'
): Promise<NodePingRecord | null> {
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const col = db.collection<NodePingRecord>(collections.NODE_PINGS);
  
  return col.findOne({ ip }, { sort: { timestamp: -1 } });
}

// Get latest pings for multiple nodes
export async function getLatestPingsForNodes(
  ips: string[],
  network: NetworkType = 'devnet'
): Promise<Map<string, NodePingRecord>> {
  if (ips.length === 0) return new Map();
  
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const col = db.collection<NodePingRecord>(collections.NODE_PINGS);
  
  // Get latest ping for each IP using aggregation
  const results = await col.aggregate([
    { $match: { ip: { $in: ips } } },
    { $sort: { timestamp: -1 } },
    { $group: { _id: '$ip', doc: { $first: '$$ROOT' } } }
  ]).toArray();
  
  const map = new Map<string, NodePingRecord>();
  results.forEach(r => {
    if (r.doc) map.set(r._id, r.doc);
  });
  
  return map;
}

// Get ping statistics for a node
export async function getNodePingStats(
  ip: string,
  hours: number = 24,
  network: NetworkType = 'devnet'
): Promise<{
  avgPing: number | null;
  minPing: number | null;
  maxPing: number | null;
  successRate: number;
  totalPings: number;
} | null> {
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const col = db.collection<NodePingRecord>(collections.NODE_PINGS);
  
  const cutoffTime = Math.floor(Date.now() / 1000) - (hours * 3600);
  
  const pings = await col
    .find({ ip, timestamp: { $gte: cutoffTime } })
    .toArray();
  
  if (pings.length === 0) return null;
  
  const successfulPings = pings.filter(p => p.ping !== null && p.status === 'online');
  const pingValues = successfulPings.map(p => p.ping as number);
  
  return {
    avgPing: pingValues.length > 0 ? Math.round(pingValues.reduce((a, b) => a + b, 0) / pingValues.length) : null,
    minPing: pingValues.length > 0 ? Math.min(...pingValues) : null,
    maxPing: pingValues.length > 0 ? Math.max(...pingValues) : null,
    successRate: (successfulPings.length / pings.length) * 100,
    totalPings: pings.length,
  };
}

// Cleanup old ping records (keep last 7 days by default)
export async function cleanupOldPings(daysToKeep: number = 7, network: NetworkType = 'devnet'): Promise<number> {
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const col = db.collection(collections.NODE_PINGS);
  
  const cutoffTime = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 3600);
  
  const result = await col.deleteMany({ timestamp: { $lt: cutoffTime } });
  return result.deletedCount;
}
