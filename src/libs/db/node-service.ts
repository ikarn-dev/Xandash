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
  };
  
  await snapshotsCol.insertOne(snapshot);
  
  return { isNew, statusChanged, versionChanged, storageChanged, creditsChanged };
}

// Save multiple node snapshots (batch)
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
    });
  }
  
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

// Get node stats over time for charts
export async function getNodeStatsHistory(ip: string, hours: number = 24, network: NetworkType = 'devnet'): Promise<NodeSnapshot[]> {
  const db = await connectToDatabase();
  const collections = getCollectionNames(network);
  const col = db.collection<NodeSnapshot>(collections.NODE_SNAPSHOTS);
  
  if (hours === 0) {
    return col.find({ ip }).sort({ timestamp: 1 }).toArray();
  }
  
  const cutoffTime = Math.floor(Date.now() / 1000) - (hours * 3600);
  
  return col.find({ ip, timestamp: { $gte: cutoffTime } }).sort({ timestamp: 1 }).toArray();
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
    await snapshotsCol.createIndex({ ip: 1, timestamp: -1 });
    await snapshotsCol.createIndex({ pubkey: 1 });
    await snapshotsCol.createIndex({ timestamp: -1 });
    
    const eventsCol = db.collection(collections.NODE_EVENTS);
    await eventsCol.createIndex({ ip: 1, timestamp: -1 });
    await eventsCol.createIndex({ event_type: 1, timestamp: -1 });
    await eventsCol.createIndex({ timestamp: -1 });
  }
}
