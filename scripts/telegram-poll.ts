/**
 * Local Telegram Bot Polling Script
 * 
 * Use this for local development when webhook can't be set up.
 * Run with: npx tsx scripts/telegram-poll.ts
 * 
 * This script mirrors the functionality in src/app/api/telegram-webhook/route.ts
 */

import { MongoClient, Db } from 'mongodb';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local file (tsx doesn't auto-load like Next.js)
function loadEnvLocal() {
    try {
        const envPath = resolve(process.cwd(), '.env.local');
        const envContent = readFileSync(envPath, 'utf-8');

        for (const line of envContent.split('\n')) {
            const trimmed = line.trim();
            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith('#')) continue;

            const eqIndex = trimmed.indexOf('=');
            if (eqIndex === -1) continue;

            const key = trimmed.slice(0, eqIndex).trim();
            let value = trimmed.slice(eqIndex + 1).trim();

            // Remove surrounding quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            // Only set if not already defined (allow env vars to override file)
            if (!process.env[key]) {
                process.env[key] = value;
            }
        }
        console.log('✅ Loaded environment from .env.local');
    } catch (error) {
        console.warn('⚠️ Could not load .env.local:', (error as Error).message);
    }
}

// Load env before accessing any process.env variables
loadEnvLocal();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'xandash';

// API URLs for real-time data
const MAINNET_API_URL = process.env.MAINNET_API_URL || '';
const DEVNET_API_URL = process.env.DEVNET_API_URL || '';
const MAINNET_CREDITS_URL = 'https://podcredits.xandeum.network/api/mainnet-pod-credits';
const DEVNET_CREDITS_URL = 'https://podcredits.xandeum.network/api/pods-credits';

if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN environment variable is required');
    console.log('Set it with: $env:TELEGRAM_BOT_TOKEN="your_token"');
    process.exit(1);
}

let mongoClient: MongoClient;
let db: Db;

async function getDb(): Promise<Db> {
    if (!db) {
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        db = mongoClient.db(DB_NAME);
        console.log('✅ Connected to MongoDB');
    }
    return db;
}

function getCollectionNames(network: string) {
    const isMainnet = network === 'mainnet';
    return {
        NODE_SNAPSHOTS: isMainnet ? 'mainnet_node_snapshots' : 'node_snapshots',
    };
}

// Real-time node data type
interface LiveNodeData {
    pubkey: string;
    address: string;
    status: string;
    uptime: number;
    version: string;
    credits: number;
    storage_committed: number;
    storage_used: number;
    storage_usage_percent: number;
    manager_pubkey?: string;
    manager_nft_count?: number;
    manager_sbt_count?: number;
    manager_xand_balance?: number;
    last_seen_timestamp?: number;
    isLive: boolean;
}

/**
 * Fetch real-time node data from API with database fallback
 */
async function fetchNodeData(nodeIp: string, network: string): Promise<LiveNodeData | null> {
    let liveData: LiveNodeData | null = null;

    // Try real-time API first
    try {
        if (network === 'mainnet') {
            liveData = await fetchMainnetNode(nodeIp);
        } else {
            liveData = await fetchDevnetNode(nodeIp);
        }

        if (liveData) {
            // Enrich with credits
            const credits = await fetchCreditsForNode(liveData.pubkey, network);
            if (credits !== null) {
                liveData.credits = credits;
            }
            liveData.isLive = true;
            return liveData;
        }
    } catch (error) {
        console.error(`[API] Failed to fetch live data for ${nodeIp}:`, error);
    }

    // Fallback to database
    try {
        const database = await getDb();
        const collectionNames = getCollectionNames(network);
        const node = await database.collection(collectionNames.NODE_SNAPSHOTS).findOne({ ip: nodeIp });

        if (node) {
            return {
                pubkey: node.pubkey || '',
                address: node.address || `${nodeIp}:9001`,
                status: node.status || 'unknown',
                uptime: node.uptime || 0,
                version: node.version || 'unknown',
                credits: node.credits || 0,
                storage_committed: node.storage_committed || 0,
                storage_used: node.storage_used || 0,
                storage_usage_percent: node.storage_usage_percent || 0,
                manager_pubkey: node.manager_pubkey,
                manager_nft_count: node.manager_nft_count || 0,
                manager_sbt_count: node.manager_sbt_count || 0,
                manager_xand_balance: node.manager_xand_balance || 0,
                last_seen_timestamp: node.last_seen_timestamp,
                isLive: false,
            };
        }
    } catch (error) {
        console.error(`[DB] Failed to fetch snapshot for ${nodeIp}:`, error);
    }

    return null;
}

/**
 * Fetch mainnet node from RPC API
 */
async function fetchMainnetNode(nodeIp: string): Promise<LiveNodeData | null> {
    if (!MAINNET_API_URL) return null;

    try {
        const response = await fetch(MAINNET_API_URL, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) return null;

        const data = await response.json();
        const pods = data.pods || data.result?.pods || data.data?.pods ||
            (Array.isArray(data) ? data : []);

        const node = pods.find((p: any) => p.address?.split(':')[0] === nodeIp);
        if (!node) return null;

        const timeDiff = Math.floor(Date.now() / 1000) - (node.last_seen_timestamp || 0);
        const status = timeDiff <= 3600 ? 'online' : timeDiff < 7200 ? 'syncing' : 'offline';

        return {
            pubkey: node.pubkey || '',
            address: node.address || `${nodeIp}:9001`,
            status,
            uptime: node.uptime || 0,
            version: node.version || 'unknown',
            credits: node.credits || 0,
            storage_committed: node.storage_committed || 0,
            storage_used: node.storage_used || 0,
            storage_usage_percent: node.storage_usage_percent || 0,
            last_seen_timestamp: node.last_seen_timestamp,
            isLive: true,
        };
    } catch {
        return null;
    }
}

/**
 * Fetch devnet node from API
 */
async function fetchDevnetNode(nodeIp: string): Promise<LiveNodeData | null> {
    if (!DEVNET_API_URL) return null;

    try {
        const response = await fetch(DEVNET_API_URL, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) return null;

        const data = await response.json();
        const pods = data.pods || data.result?.pods || data.data?.pods ||
            (Array.isArray(data) ? data : []);

        const node = pods.find((p: any) => p.address?.split(':')[0] === nodeIp);
        if (!node) return null;

        const timeDiff = Math.floor(Date.now() / 1000) - (node.last_seen_timestamp || 0);
        const status = timeDiff <= 3600 ? 'online' : timeDiff < 7200 ? 'syncing' : 'offline';

        return {
            pubkey: node.pubkey || '',
            address: node.address || `${nodeIp}:9001`,
            status,
            uptime: node.uptime || 0,
            version: node.version || 'unknown',
            credits: node.credits || 0,
            storage_committed: node.storage_committed || 0,
            storage_used: node.storage_used || 0,
            storage_usage_percent: node.storage_usage_percent || 0,
            last_seen_timestamp: node.last_seen_timestamp,
            isLive: true,
        };
    } catch {
        return null;
    }
}

/**
 * Fetch credits for a specific node
 */
async function fetchCreditsForNode(pubkey: string, network: string): Promise<number | null> {
    if (!pubkey) return null;

    try {
        const url = network === 'mainnet' ? MAINNET_CREDITS_URL : DEVNET_CREDITS_URL;
        const response = await fetch(url, {
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) return null;

        const data = await response.json();
        const credits = data.pods_credits || [];
        const entry = credits.find((c: any) => c.pod_id === pubkey);

        return entry?.credits ?? null;
    } catch {
        return null;
    }
}

function formatUptime(seconds: number): string {
    if (!seconds || seconds < 0) return '0h';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function getStatusEmoji(status: string): string {
    switch (status) {
        case 'online': return '🟢';
        case 'offline': return '🔴';
        case 'syncing': return '🟡';
        default: return '⚪';
    }
}

function formatStorage(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const index = Math.min(i, units.length - 1);
    const value = bytes / Math.pow(1024, index);
    return `${value.toFixed(2)} ${units[index]}`;
}

function formatPercent(value: number): string {
    if (!value || value <= 0) return '0%';
    if (value < 0.01) return `${(value * 100).toFixed(4)}%`;
    if (value < 0.1) return `${(value * 100).toFixed(3)}%`;
    if (value < 1) return `${(value * 100).toFixed(2)}%`;
    return `${value.toFixed(2)}%`;
}

function shortenAddress(address: string): string {
    if (!address || address.length < 12) return address || 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

async function fetchLocationData(ip: string): Promise<{ country: string; city: string; provider: string } | null> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp`, {
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (res.ok) {
            const data = await res.json();
            if (data.status === 'success') {
                return {
                    country: data.country || 'Unknown',
                    city: data.city || 'Unknown',
                    provider: data.isp || 'Unknown',
                };
            }
        }
    } catch {
        // Ignore errors
    }
    return null;
}

async function sendMessage(chatId: number, text: string): Promise<boolean> {
    try {
        console.log(`📤 Sending message to ${chatId}...`);
        const response = await fetch(`${TELEGRAM_API_BASE}${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
            }),
        });

        const data = await response.json();
        if (data.ok) {
            console.log(`✅ Message sent successfully to ${chatId}`);
        } else {
            console.error(`❌ Failed to send message: ${data.description}`);
        }
        return data.ok;
    } catch (error) {
        console.error('❌ Failed to send message:', error);
        return false;
    }
}

async function getUserByTelegram(chatId: string) {
    const database = await getDb();
    return database.collection('notification_users').findOne({
        telegramChatId: chatId,
        telegramVerified: true
    });
}

async function getUserBindings(email: string) {
    const database = await getDb();
    return database.collection('node_bindings').find({ email: email.toLowerCase() }).toArray();
}

async function unbindNodeByTelegram(chatId: string, nodeIp: string): Promise<{ success: boolean; error?: string }> {
    const user = await getUserByTelegram(chatId);
    if (!user) {
        return { success: false, error: 'No account linked to this Telegram.' };
    }

    const database = await getDb();
    const result = await database.collection('node_bindings').deleteOne({
        email: user.email,
        nodeIp
    });

    if (result.deletedCount > 0) {
        return { success: true };
    }
    return { success: false, error: 'Node not found in your bindings.' };
}

async function unbindAllNodesByTelegram(chatId: string): Promise<number> {
    const user = await getUserByTelegram(chatId);
    if (!user) return 0;

    const database = await getDb();
    const result = await database.collection('node_bindings').deleteMany({ email: user.email });
    return result.deletedCount;
}

/**
 * Handle /list command - list all bound nodes with status
 */
async function handleListCommand(chatId: number): Promise<void> {
    const user = await getUserByTelegram(chatId.toString());

    if (!user) {
        await sendMessage(chatId, `
❌ <b>No Account Linked</b>

Your Telegram is not linked to any XanDash account.

To link your account:
1. Visit xandash.online/notifications
2. Log in with your email
3. Link your Telegram in the dashboard
        `.trim());
        return;
    }

    const bindings = await getUserBindings(user.email);

    if (bindings.length === 0) {
        await sendMessage(chatId, `
📋 <b>Your Bound Nodes</b>

No nodes bound to your account yet.

Visit xandash.online/notifications to add nodes.
        `.trim());
        return;
    }

    // Fetch node data - real-time with DB fallback
    const nodeDetails = await Promise.all(bindings.map(async (binding) => {
        const nodeData = await fetchNodeData(binding.nodeIp as string, binding.network as string);
        return {
            nodeIp: binding.nodeIp as string,
            network: binding.network as string,
            status: nodeData?.status || 'unknown',
            uptime: nodeData?.uptime || 0,
            version: nodeData?.version || 'unknown',
            credits: nodeData?.credits || 0,
            storageCommitted: nodeData?.storage_committed || 0,
            storageUsed: nodeData?.storage_used || 0,
            storagePercent: nodeData?.storage_usage_percent || 0,
            managerPubkey: nodeData?.manager_pubkey || null,
            managerNftCount: nodeData?.manager_nft_count || 0,
            managerSbtCount: nodeData?.manager_sbt_count || 0,
            managerXandBalance: nodeData?.manager_xand_balance || 0,
            isLive: nodeData?.isLive || false,
        };
    }));

    const liveCount = nodeDetails.filter(n => n.isLive).length;
    const sourceIndicator = liveCount === nodeDetails.length
        ? 'Live'
        : liveCount > 0
            ? `${liveCount}/${nodeDetails.length} Live`
            : 'Cached';

    let message = `📋 <b>Your Bound Nodes</b> (${sourceIndicator})\n\n`;

    for (const node of nodeDetails) {
        const emoji = getStatusEmoji(node.status);
        const isRegistered = !!node.managerPubkey;
        const regIcon = isRegistered ? '✅' : '❌';
        const liveIcon = node.isLive ? '' : '[cached]';

        message += `${emoji} <code>${node.nodeIp}</code> (${node.network})${liveIcon ? ` ${liveIcon}` : ''}\n`;
        message += `   📦 Version: ${node.version}\n`;
        message += `   ⏱️ Uptime: ${formatUptime(node.uptime)}\n`;
        message += `   💰 Credits: ${node.credits.toLocaleString()}\n`;
        message += `   💾 ${formatStorage(node.storageUsed)} / ${formatStorage(node.storageCommitted)} (${formatPercent(node.storagePercent)})\n`;
        message += `   🏷️ Registered: ${regIcon}\n`;

        if (isRegistered) {
            message += `   👤 Manager: <code>${shortenAddress(node.managerPubkey || '')}</code>\n`;
            if (node.managerNftCount > 0 || node.managerSbtCount > 0) {
                message += `   🖼️ NFTs: ${node.managerNftCount} | SBTs: ${node.managerSbtCount}\n`;
            }
        }
        message += `\n`;
    }

    message += `Total: ${nodeDetails.length} node(s)\n`;
    message += `\nUse /node <code>&lt;ip&gt;</code> for full details`;

    await sendMessage(chatId, message.trim());
}

/**
 * Handle /status command - show brief status of all nodes
 */
async function handleStatusCommand(chatId: number): Promise<void> {
    const user = await getUserByTelegram(chatId.toString());

    if (!user) {
        await sendMessage(chatId, `❌ No account linked. Visit xandash.online/notifications to set up.`);
        return;
    }

    const bindings = await getUserBindings(user.email);

    if (bindings.length === 0) {
        await sendMessage(chatId, `📊 No nodes bound to your account.`);
        return;
    }

    const database = await getDb();
    let online = 0, offline = 0, syncing = 0;

    for (const binding of bindings) {
        const collectionNames = getCollectionNames(binding.network);
        const node = await database.collection(collectionNames.NODE_SNAPSHOTS).findOne({ ip: binding.nodeIp });

        if (node?.status === 'online') online++;
        else if (node?.status === 'offline') offline++;
        else if (node?.status === 'syncing') syncing++;
    }

    await sendMessage(chatId, `
📊 <b>Node Status Summary</b>

🟢 Online: ${online}
🔴 Offline: ${offline}
🟡 Syncing: ${syncing}

Total: ${bindings.length} node(s)

Use /list for detailed info.
    `.trim());
}

/**
 * Handle /unbind command - unbind a specific node
 */
async function handleUnbindCommand(chatId: number, args: string): Promise<void> {
    const nodeIp = args.trim();

    if (!nodeIp) {
        await sendMessage(chatId, `
⚠️ <b>Usage:</b> /unbind &lt;nodeIp&gt;

Example: <code>/unbind 192.168.1.1</code>

Use /list to see your bound nodes.
        `.trim());
        return;
    }

    const result = await unbindNodeByTelegram(chatId.toString(), nodeIp);

    if (result.success) {
        await sendMessage(chatId, `✅ Node <code>${nodeIp}</code> has been unbound.`);
    } else {
        await sendMessage(chatId, `❌ ${result.error || 'Failed to unbind node.'}`);
    }
}

/**
 * Handle /unbindall command - unbind all nodes
 */
async function handleUnbindAllCommand(chatId: number): Promise<void> {
    const count = await unbindAllNodesByTelegram(chatId.toString());

    if (count > 0) {
        await sendMessage(chatId, `✅ Unbound ${count} node(s) from your account.`);
    } else {
        await sendMessage(chatId, `ℹ️ No nodes to unbind.`);
    }
}

/**
 * Handle /latestversion command - show the latest pNode version
 */
async function handleLatestVersionCommand(chatId: number): Promise<void> {
    try {
        let version: string | null = null;
        let source = '';

        // Method 1: Get most common version from online nodes in database
        const database = await getDb();

        // Try mainnet first
        const mainnetResult = await database.collection('mainnet_node_snapshots').aggregate([
            { $match: { status: 'online' } },
            { $group: { _id: '$version', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 1 }
        ]).toArray();

        if (mainnetResult.length > 0 && mainnetResult[0]._id) {
            const v = mainnetResult[0]._id.toString();
            if (v && v !== 'unknown' && /^\d+\.\d+/.test(v)) {
                version = v;
                source = 'mainnet';
            }
        }

        // Fallback to devnet if mainnet has no data
        if (!version) {
            const devnetResult = await database.collection('node_snapshots').aggregate([
                { $match: { status: 'online' } },
                { $group: { _id: '$version', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ]).toArray();

            if (devnetResult.length > 0 && devnetResult[0]._id) {
                const v = devnetResult[0]._id.toString();
                if (v && v !== 'unknown' && /^\d+\.\d+/.test(v)) {
                    version = v;
                    source = 'devnet';
                }
            }
        }

        // Method 2: Fallback to stats API if database has no version
        if (!version) {
            const apiUrl = process.env.MAINNET_API_URL;

            if (apiUrl) {
                try {
                    const res = await fetch(apiUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                        },
                        signal: AbortSignal.timeout(5000),
                    });

                    if (res.ok) {
                        const data = await res.json();
                        // Try to extract version from pod data
                        const pods = data.pods || data.result?.pods || data.data?.pods ||
                            (Array.isArray(data) ? data : []);
                        if (Array.isArray(pods) && pods.length > 0) {
                            // Get most common version from online pods
                            const versions: Record<string, number> = {};
                            for (const pod of pods) {
                                const v = pod.version;
                                if (v && v !== 'unknown') {
                                    versions[v] = (versions[v] || 0) + 1;
                                }
                            }
                            const sorted = Object.entries(versions).sort((a, b) => b[1] - a[1]);
                            if (sorted.length > 0) {
                                version = sorted[0][0];
                                source = 'api';
                            }
                        }
                    }
                } catch {
                    // Ignore API errors
                }
            }
        }

        // Default fallback
        if (!version) {
            version = '0.7.3';
            source = 'default';
        }

        let message = `📦 <b>Latest pNode Version</b>\n\n`;
        message += `🏷️ Version: <code>${version}</code>\n`;

        if (source && source !== 'default') {
            message += `📡 Source: ${source}\n`;
        }

        message += `\n<i>Use /list to check your nodes' versions</i>`;

        await sendMessage(chatId, message.trim());
    } catch (error) {
        console.error('Version command error:', error);
        await sendMessage(chatId, `
❌ <b>Version Check Failed</b>

Unable to fetch the latest version information.
Please try again later.
        `.trim());
    }
}

/**
 * Handle /node command - show details for a specific node
 */
async function handleNodeCommand(chatId: number, args: string): Promise<void> {
    const nodeIp = args.trim();

    if (!nodeIp) {
        await sendMessage(chatId, `
⚠️ <b>Usage:</b> /node &lt;nodeIp&gt;

Example: <code>/node 192.168.1.1</code>

Use /list to see your bound nodes.
        `.trim());
        return;
    }

    const user = await getUserByTelegram(chatId.toString());

    if (!user) {
        await sendMessage(chatId, `❌ No account linked. Visit xandash.online/notifications to set up.`);
        return;
    }

    const bindings = await getUserBindings(user.email);
    const binding = bindings.find(b => b.nodeIp === nodeIp);

    if (!binding) {
        await sendMessage(chatId, `
❌ <b>Node Not Found</b>

<code>${nodeIp}</code> is not bound to your account.

Use /list to see your bound nodes.
        `.trim());
        return;
    }

    // Fetch node data - real-time with DB fallback
    const node = await fetchNodeData(nodeIp, binding.network as string);

    if (!node) {
        await sendMessage(chatId, `
⚠️ <b>No Data Available</b>

Node <code>${nodeIp}</code> is bound but no data found from API or database.
        `.trim());
        return;
    }

    // Fetch location data
    const location = await fetchLocationData(nodeIp);

    const statusEmoji = getStatusEmoji(node.status);
    const nodeVersion = node.version || 'unknown';
    const isRegistered = !!node.manager_pubkey;
    const regStatus = isRegistered ? '✅ Yes' : '❌ No';
    const dataSource = node.isLive ? 'Live' : 'Cached';

    let message = `
🖥️ <b>Node Details</b> (${dataSource})

<b>IP:</b> <code>${nodeIp}</code>
<b>Pubkey:</b> <code>${shortenAddress(node.pubkey)}</code>
<b>Network:</b> ${binding.network}
<b>Status:</b> ${statusEmoji} ${node.status}
`;

    // Location section
    if (location) {
        message += `
<b>📍 Location:</b>
   ${location.city}, ${location.country}
   Provider: ${location.provider}
`;
    }

    // Core metrics
    message += `
<b>📊 Core Metrics:</b>
   📦 Version: <code>${nodeVersion}</code>
   ⏱️ Uptime: ${formatUptime(node.uptime || 0)}
   💰 Credits: ${(node.credits || 0).toLocaleString()}
`;

    // Storage section
    message += `
<b>💾 Storage:</b>
   Used: ${formatStorage(node.storage_used || 0)}
   Committed: ${formatStorage(node.storage_committed || 0)}
   Usage: ${formatPercent(node.storage_usage_percent || 0)}
`;

    // Registration & Manager section
    message += `
<b>🏷️ Registration:</b> ${regStatus}`;

    if (isRegistered) {
        message += `
<b>👤 Manager Wallet:</b>
   <code>${node.manager_pubkey}</code>`;

        const nftCount = node.manager_nft_count || 0;
        const sbtCount = node.manager_sbt_count || 0;
        const xandBalance = node.manager_xand_balance || 0;

        if (nftCount > 0 || sbtCount > 0 || xandBalance > 0) {
            message += `

<b>🖼️ Manager Assets:</b>
   NFTs: ${nftCount}
   SBTs: ${sbtCount}`;
            if (xandBalance > 0) {
                message += `
   XAND: ${xandBalance.toLocaleString()}`;
            }
        }
    }

    message += `

<a href="https://www.xandash.online/profile/${nodeIp}?network=${binding.network}">View Full Profile →</a>
    `;

    await sendMessage(chatId, message.trim());
}

/**
 * Handle incoming message
 */
async function handleMessage(chatId: number, text: string, firstName: string): Promise<void> {
    const [command, ...argParts] = text.split(' ');
    const args = argParts.join(' ');

    console.log(`📨 Command: ${command} | Args: ${args} | From: ${firstName}`);

    if (command === '/start') {
        await sendMessage(chatId, `
👋 <b>Welcome to XanDash, ${firstName}!</b>

🆔 <b>Your Chat ID:</b>
<code>${chatId}</code>
<i>(Copy this to link your Telegram)</i>

<b>Quick Setup:</b>
1️⃣ Visit <a href="https://www.xandash.online/notifications">xandash.online/notifications</a>
2️⃣ Log in with your email
3️⃣ Paste your Chat ID to link Telegram
4️⃣ Add your pNode IP addresses

<b>You'll receive alerts for:</b>
• 🟢🔴 Node online/offline
• 🔄 Node restarts
• 📦 Version updates
• 💰 Credits depleted

Type /help for all commands
        `.trim());
    } else if (command === '/help') {
        await sendMessage(chatId, `
ℹ️ <b>XanDash Bot Commands</b>

<b>📋 Nodes</b>
/list - View all bound nodes
/node &lt;ip&gt; - View specific node details
/status - Quick status summary

<b>🔗 Management</b>
/unbind &lt;ip&gt; - Unbind a node
/unbindall - Unbind all nodes

<b>📦 Version</b>
/latestversion - Show latest pNode version

<b>🆔 Account</b>
/id - Show your Chat ID
/start - Setup instructions

Need help? Visit <a href="https://www.xandash.online/notifications">xandash.online/notifications</a>
        `.trim());
    } else if (command === '/id') {
        await sendMessage(chatId, `
🆔 <b>Your Chat ID</b>

<code>${chatId}</code>

Use this to link Telegram at:
<a href="https://www.xandash.online/notifications">xandash.online/notifications</a>
        `.trim());
    } else if (command === '/list') {
        await handleListCommand(chatId);
    } else if (command === '/status') {
        await handleStatusCommand(chatId);
    } else if (command === '/unbind') {
        await handleUnbindCommand(chatId, args);
    } else if (command === '/unbindall') {
        await handleUnbindAllCommand(chatId);
    } else if (command === '/latestversion' || command === '/version') {
        await handleLatestVersionCommand(chatId);
    } else if (command === '/node') {
        await handleNodeCommand(chatId, args);
    } else {
        await sendMessage(chatId, `
I don't understand that command. 

Use /help to see available commands.
        `.trim());
    }
}

async function getUpdates(offset: number): Promise<any[]> {
    try {
        const response = await fetch(
            `${TELEGRAM_API_BASE}${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`
        );
        const data = await response.json();
        return data.ok ? data.result : [];
    } catch (error) {
        console.error('Error getting updates:', error);
        return [];
    }
}

async function main() {
    console.log('🤖 XanDash Telegram Bot - Local Polling Mode');
    console.log('📡 Listening for messages...\n');

    let offset = 0;

    // Connect to MongoDB first
    await getDb();

    while (true) {
        const updates = await getUpdates(offset);

        for (const update of updates) {
            offset = update.update_id + 1;

            if (update.message?.text) {
                const chatId = update.message.chat.id;
                const text = update.message.text.trim();
                const firstName = update.message.from.first_name || 'User';

                await handleMessage(chatId, text, firstName);
            }
        }
    }
}

main().catch((error) => {
    console.error('Bot error:', error);
    process.exit(1);
});
