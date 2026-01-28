import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/libs/services/session-service';
import { getUserBindings, bindNode, unbindNode } from '@/libs/services/user-service';
import { getCollectionNames } from '@/libs/db/mongodb';
import { connectToDatabase } from '@/libs/db/mongodb';
import { getMainnetNodeByIp, MainnetNodeData } from '@/libs/services/mainnet-data-service';
import { getDevnetNodeByIp, DevnetNodeData } from '@/libs/services/devnet-data-service';

type NetworkType = 'devnet' | 'mainnet';

/**
 * Fetch real-time node data from API with database fallback
 */
async function fetchNodeData(nodeIp: string, network: NetworkType) {
    // Try real-time API first (same as Telegram bot does)
    try {
        let apiNode: MainnetNodeData | DevnetNodeData | null = null;

        if (network === 'mainnet') {
            apiNode = await getMainnetNodeByIp(nodeIp);
        } else {
            apiNode = await getDevnetNodeByIp(nodeIp);
        }

        if (apiNode) {
            const timeDiff = Math.floor(Date.now() / 1000) - (apiNode.last_seen_timestamp || 0);
            const status = timeDiff <= 3600 ? 'online' : timeDiff < 7200 ? 'syncing' : 'offline';

            return {
                status,
                uptime: apiNode.uptime || 0,
                version: apiNode.version || 'unknown',
                credits: apiNode.credits || 0,
                storageCommitted: apiNode.storage_committed || 0,
                storageUsed: apiNode.storage_used || 0,
                lastSeen: apiNode.last_seen_timestamp || 0,
                isLive: true,
            };
        }
    } catch (error) {
        console.error(`[API] Failed to fetch live data for ${nodeIp}:`, error);
    }

    // Fallback to database snapshot
    try {
        const db = await connectToDatabase();
        const collectionNames = getCollectionNames(network);
        const node = await db.collection(collectionNames.NODE_SNAPSHOTS).findOne({ ip: nodeIp });

        if (node) {
            return {
                status: node.status || 'unknown',
                uptime: node.uptime || 0,
                version: node.version || 'unknown',
                credits: node.credits || 0,
                storageCommitted: node.storage_committed || 0,
                storageUsed: node.storage_used || 0,
                lastSeen: node.last_seen_timestamp || 0,
                isLive: false,
            };
        }
    } catch (error) {
        console.error(`[DB] Failed to fetch snapshot for ${nodeIp}:`, error);
    }

    return null;
}

/**
 * Verify node exists in the database
 */
async function verifyNodeExists(nodeIp: string, network: NetworkType): Promise<{ exists: boolean; pubkey?: string }> {
    const db = await connectToDatabase();
    const collectionNames = getCollectionNames(network);

    const node = await db.collection(collectionNames.NODE_SNAPSHOTS).findOne({ ip: nodeIp });

    if (node) {
        return { exists: true, pubkey: node.pubkey };
    }

    return { exists: false };
}

/**
 * GET /api/notifications/nodes
 * 
 * Get user's bound nodes with current status (real-time data preferred)
 */
export async function GET() {
    try {
        const email = await requireSession();
        const bindings = await getUserBindings(email);

        // Fetch real-time node data for each binding (same as Telegram bot)
        const nodesWithStatus = await Promise.all(
            bindings.map(async (binding) => {
                const nodeData = await fetchNodeData(binding.nodeIp, binding.network);

                return {
                    nodeIp: binding.nodeIp,
                    network: binding.network,
                    pubkey: binding.pubkey,
                    testUsed: binding.testUsed,
                    createdAt: binding.createdAt,
                    // Real-time node data (or DB fallback)
                    status: nodeData?.status || 'unknown',
                    uptime: nodeData?.uptime || 0,
                    version: nodeData?.version || 'unknown',
                    credits: nodeData?.credits || 0,
                    storageCommitted: nodeData?.storageCommitted || 0,
                    storageUsed: nodeData?.storageUsed || 0,
                    lastSeen: nodeData?.lastSeen || 0,
                    isLive: nodeData?.isLive || false,
                };
            })
        );

        return NextResponse.json({
            success: true,
            nodes: nodesWithStatus,
        });

    } catch (error) {
        if (error instanceof Error && error.message === 'Not authenticated') {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }
        console.error('Get nodes error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/notifications/nodes
 * 
 * Bind a new node to user account
 */
export async function POST(request: NextRequest) {
    try {
        const email = await requireSession();
        const body = await request.json();
        const { nodeIp, network = 'devnet' } = body;

        // Validate inputs
        if (!nodeIp) {
            return NextResponse.json(
                { error: 'Node IP is required' },
                { status: 400 }
            );
        }

        // Validate IP format
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(nodeIp)) {
            return NextResponse.json(
                { error: 'Invalid IP address format' },
                { status: 400 }
            );
        }

        // Verify node exists
        const nodeCheck = await verifyNodeExists(nodeIp, network as NetworkType);
        if (!nodeCheck.exists) {
            return NextResponse.json(
                { error: `Node ${nodeIp} not found in ${network} network` },
                { status: 404 }
            );
        }

        // Bind node
        const result = await bindNode(email, nodeIp, network as NetworkType, nodeCheck.pubkey);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Node ${nodeIp} bound successfully`,
            pubkey: nodeCheck.pubkey,
        });

    } catch (error) {
        if (error instanceof Error && error.message === 'Not authenticated') {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }
        console.error('Bind node error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/notifications/nodes
 * 
 * Unbind a node from user account
 */
export async function DELETE(request: NextRequest) {
    try {
        const email = await requireSession();
        const { searchParams } = new URL(request.url);
        const nodeIp = searchParams.get('nodeIp');
        const network = (searchParams.get('network') || 'devnet') as NetworkType;

        // Validate inputs
        if (!nodeIp) {
            return NextResponse.json(
                { error: 'Node IP is required' },
                { status: 400 }
            );
        }

        // Unbind node
        const result = await unbindNode(email, nodeIp, network);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Node ${nodeIp} unbound successfully`,
        });

    } catch (error) {
        if (error instanceof Error && error.message === 'Not authenticated') {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }
        console.error('Unbind node error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
