import { 
  connectToDatabase, 
  NodeSnapshot, 
  NodeEventLog, 
  COLLECTIONS 
} from './mongodb';

// Threshold for storage change events (5% change)
const STORAGE_CHANGE_THRESHOLD = 0.05;
// Threshold for credits change events (100 credits)
const CREDITS_CHANGE_THRESHOLD = 100;

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
}): Promise<{ isNew: boolean; statusChanged: boolean; versionChanged: boolean; storageChanged: boolean; creditsChanged: boolean }> {
  const db = await connectToDatabase();
  const snapshotsCol = db.collection<NodeSnapshot>(COLLECTIONS.NODE_SNAPSHOTS);
  const eventsCol = db.collection<NodeEventLog>(COLLECTIONS.NODE_EVENTS);
  
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

// Save multiple node snapshots (batch)
export async function saveAllNodeSnapshots(nodes: any[], creditsMap?: Map<string, number>): Promise<{
  total: number;
  newNodes: number;
  statusChanges: number;
  versionChanges: number;
  storageChanges: number;
  creditsChanges: number;
}> {
  let newNodes = 0;
  let statusChanges = 0;
  let versionChanges = 0;
  let storageChanges = 0;
  let creditsChanges = 0;
  
  for (const node of nodes) {
    const ip = node.address?.split(':')[0] || '';
    if (!ip || ip === '127.0.0.1') continue; // Skip localhost
    
    const credits = creditsMap?.get(node.pubkey) || 0;
    
    const result = await saveNodeSnapshot({
      ip,
      pubkey: node.pubkey || '',
      address: node.address || '',
      status: node.status || 'unknown',
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
    });
    
    if (result.isNew) newNodes++;
    if (result.statusChanged) statusChanges++;
    if (result.versionChanged) versionChanges++;
    if (result.storageChanged) storageChanges++;
    if (result.creditsChanged) creditsChanges++;
  }
  
  return { total: nodes.length, newNodes, statusChanges, versionChanges, storageChanges, creditsChanges };
}

// Get node history from database
export async function getNodeHistory(ip: string, limit: number = 100): Promise<NodeSnapshot[]> {
  const db = await connectToDatabase();
  const col = db.collection<NodeSnapshot>(COLLECTIONS.NODE_SNAPSHOTS);
  
  return col
    .find({ ip })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
}

// Get node events/logs
export async function getNodeEvents(ip: string, limit: number = 50): Promise<NodeEventLog[]> {
  const db = await connectToDatabase();
  const col = db.collection<NodeEventLog>(COLLECTIONS.NODE_EVENTS);
  
  return col
    .find({ ip })
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
}

// Get latest snapshot for a node
export async function getLatestNodeSnapshot(ip: string): Promise<NodeSnapshot | null> {
  const db = await connectToDatabase();
  const col = db.collection<NodeSnapshot>(COLLECTIONS.NODE_SNAPSHOTS);
  
  return col.findOne({ ip }, { sort: { timestamp: -1 } });
}

// Get all events (for dashboard/monitoring)
export async function getAllRecentEvents(limit: number = 100): Promise<NodeEventLog[]> {
  const db = await connectToDatabase();
  const col = db.collection<NodeEventLog>(COLLECTIONS.NODE_EVENTS);
  
  return col
    .find({})
    .sort({ timestamp: -1 })
    .limit(limit)
    .toArray();
}

// Get node stats over time for charts
export async function getNodeStatsHistory(ip: string, hours: number = 24): Promise<NodeSnapshot[]> {
  const db = await connectToDatabase();
  const col = db.collection<NodeSnapshot>(COLLECTIONS.NODE_SNAPSHOTS);
  
  const cutoffTime = Math.floor(Date.now() / 1000) - (hours * 3600);
  
  return col
    .find({ ip, timestamp: { $gte: cutoffTime } })
    .sort({ timestamp: 1 })
    .toArray();
}

// Cleanup old snapshots (keep last 7 days)
export async function cleanupOldSnapshots(daysToKeep: number = 7): Promise<number> {
  const db = await connectToDatabase();
  const col = db.collection<NodeSnapshot>(COLLECTIONS.NODE_SNAPSHOTS);
  
  const cutoffTime = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 3600);
  
  const result = await col.deleteMany({ timestamp: { $lt: cutoffTime } });
  return result.deletedCount;
}

// Create indexes for better query performance
export async function createIndexes(): Promise<void> {
  const db = await connectToDatabase();
  
  // Node snapshots indexes
  const snapshotsCol = db.collection(COLLECTIONS.NODE_SNAPSHOTS);
  await snapshotsCol.createIndex({ ip: 1, timestamp: -1 });
  await snapshotsCol.createIndex({ pubkey: 1 });
  await snapshotsCol.createIndex({ timestamp: -1 });
  
  // Node events indexes
  const eventsCol = db.collection(COLLECTIONS.NODE_EVENTS);
  await eventsCol.createIndex({ ip: 1, timestamp: -1 });
  await eventsCol.createIndex({ event_type: 1, timestamp: -1 });
  await eventsCol.createIndex({ timestamp: -1 });
}
