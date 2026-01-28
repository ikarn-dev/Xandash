/**
 * Version Service
 * Gets the latest pNode version from node snapshots in database
 */

import { connectToDatabase, getCollectionNames } from '@/libs/db/mongodb';

/**
 * Get the most common (latest) version from online nodes in the database
 * This is used as a fallback when RPC API is unavailable
 */
export async function getLatestVersionFromNodes(network: 'mainnet' | 'devnet' = 'mainnet'): Promise<string | null> {
    try {
        const db = await connectToDatabase();
        const collectionNames = getCollectionNames(network);

        // Aggregate to find the most common version among online nodes
        const result = await db.collection(collectionNames.NODE_SNAPSHOTS).aggregate([
            // Only consider online nodes
            { $match: { status: 'online' } },
            // Group by version and count
            {
                $group: {
                    _id: '$version',
                    count: { $sum: 1 }
                }
            },
            // Sort by count descending (most common first)
            { $sort: { count: -1 } },
            // Take the top result
            { $limit: 1 }
        ]).toArray();

        if (result.length > 0 && result[0]._id) {
            const version = result[0]._id.toString();
            // Validate it looks like a version string
            if (version && version !== 'unknown' && /^\d+\.\d+/.test(version)) {
                return version;
            }
        }

        // Fallback: get any node with a valid version
        const anyNode = await db.collection(collectionNames.NODE_SNAPSHOTS).findOne(
            { version: { $regex: /^\d+\.\d+/, $ne: 'unknown' } },
            { projection: { version: 1 }, sort: { last_seen_timestamp: -1 } }
        );

        if (anyNode?.version) {
            return anyNode.version;
        }

        return null;
    } catch (error) {
        console.error('Error getting latest version from DB:', error);
        return null;
    }
}

/**
 * Get version distribution across all nodes
 */
export async function getVersionDistribution(network: 'mainnet' | 'devnet' = 'mainnet'): Promise<Array<{ version: string; count: number }>> {
    try {
        const db = await connectToDatabase();
        const collectionNames = getCollectionNames(network);

        const result = await db.collection(collectionNames.NODE_SNAPSHOTS).aggregate([
            { $match: { status: 'online' } },
            {
                $group: {
                    _id: '$version',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]).toArray();

        return result.map(r => ({
            version: r._id?.toString() || 'unknown',
            count: r.count
        }));
    } catch (error) {
        console.error('Error getting version distribution:', error);
        return [];
    }
}
