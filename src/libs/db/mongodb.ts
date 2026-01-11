import { MongoClient, Db, Collection } from 'mongodb';

// MongoDB connection
let client: MongoClient | null = null;
let db: Db | null = null;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'xandash';

export async function connectToDatabase(): Promise<Db> {
  if (db) return db;

  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    // Test the connection
    await db.admin().ping();
    
    return db;
  } catch (error) {
    // Clean up on connection failure
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        // Ignore close errors
      }
      client = null;
    }
    db = null;
    
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCollection<T extends Document>(name: string): Promise<Collection<T>> {
  try {
    if (!name || typeof name !== 'string') {
      throw new Error('Collection name must be a non-empty string');
    }
    
    const database = await connectToDatabase();
    return database.collection<T>(name);
  } catch (error) {
    throw new Error(`Failed to get collection '${name}': ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Gracefully close the MongoDB connection
 */
export async function closeConnection(): Promise<void> {
  try {
    if (client) {
      await client.close();
      client = null;
      db = null;
    }
  } catch (error) {
    throw new Error(`Failed to close MongoDB connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Node snapshot - stores ALL pod data from API
export interface NodeSnapshot {
  _id?: string;
  ip: string;
  pubkey: string;
  address: string;
  status: 'online' | 'offline' | 'syncing';
  uptime: number;
  storage_committed: number;
  storage_used: number;
  storage_usage_percent: number;
  version: string;
  rpc_port: number;
  is_public: boolean;
  last_seen_timestamp: number;
  credits: number;
  active_streams?: number;
  timestamp: number;
  created_at: Date;
}

// Node event log - tracks all changes
export interface NodeEventLog {
  _id?: string;
  ip: string;
  pubkey: string;
  event_type: 'node_online' | 'node_offline' | 'node_new' | 'status_change' | 'version_change' | 'storage_change' | 'credits_change';
  previous_value?: string | number;
  new_value?: string | number;
  previous_status?: string;
  new_status?: string;
  previous_version?: string;
  new_version?: string;
  details?: Record<string, any>;
  timestamp: number;
  created_at: Date;
}

// Node ping history - stores ping measurements
export interface NodePingRecord {
  _id?: string;
  ip: string;
  pubkey?: string;
  ping: number | null;
  status: 'online' | 'timeout' | 'offline';
  port: number;
  timestamp: number;
  created_at: Date;
}

// Network-aware collection names
export const getCollectionNames = (network: 'devnet' | 'mainnet' = 'devnet') => ({
  NODE_SNAPSHOTS: network === 'mainnet' ? 'mainnet_node_snapshots' : 'node_snapshots',
  NODE_EVENTS: network === 'mainnet' ? 'mainnet_node_events' : 'node_events',
  NODE_PINGS: network === 'mainnet' ? 'mainnet_node_pings' : 'node_pings',
});

// Default collections (devnet) - for backward compatibility
export const COLLECTIONS = {
  NODE_SNAPSHOTS: 'node_snapshots',
  NODE_EVENTS: 'node_events',
  NODE_PINGS: 'node_pings',
};
