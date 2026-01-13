import { MongoClient, Db, Collection } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'xandash';

// Connection options optimized for serverless
const options = {
  maxPoolSize: 10, // Limit connections per instance
  minPoolSize: 1,
  maxIdleTimeMS: 30000, // Close idle connections after 30s
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
};

// Global cache for connection reuse in serverless environment
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _mongoDb: Db | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development, use a global variable to preserve connection across hot reloads
  if (!global._mongoClientPromise) {
    const client = new MongoClient(MONGODB_URI, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, create a new client promise
  const client = new MongoClient(MONGODB_URI, options);
  clientPromise = client.connect();
}

export async function connectToDatabase(): Promise<Db> {
  try {
    // Return cached db if available
    if (global._mongoDb) {
      return global._mongoDb;
    }

    const client = await clientPromise;
    const db = client.db(DB_NAME);
    
    // Cache the db instance
    global._mongoDb = db;
    
    return db;
  } catch (error) {
    // Clear cache on error
    global._mongoDb = undefined;
    throw new Error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function getCollection<T extends Document>(name: string): Promise<Collection<T>> {
  if (!name || typeof name !== 'string') {
    throw new Error('Collection name must be a non-empty string');
  }
  
  const database = await connectToDatabase();
  return database.collection<T>(name);
}

/**
 * Gracefully close the MongoDB connection (mainly for cleanup scripts)
 */
export async function closeConnection(): Promise<void> {
  try {
    const client = await clientPromise;
    await client.close();
    global._mongoClientPromise = undefined;
    global._mongoDb = undefined;
  } catch (error) {
    // Ignore close errors in serverless
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

// Network-aware collection names
export const getCollectionNames = (network: 'devnet' | 'mainnet' = 'devnet') => ({
  NODE_SNAPSHOTS: network === 'mainnet' ? 'mainnet_node_snapshots' : 'node_snapshots',
  NODE_EVENTS: network === 'mainnet' ? 'mainnet_node_events' : 'node_events',
});

// Default collections (devnet) - for backward compatibility
export const COLLECTIONS = {
  NODE_SNAPSHOTS: 'node_snapshots',
  NODE_EVENTS: 'node_events',
};
