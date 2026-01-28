import { NextRequest, NextResponse } from 'next/server';
import { getUserByTelegram, getUserBindings, unbindNodeByTelegram, unbindAllNodesByTelegram } from '@/libs/services/user-service';
import { getCollectionNames, connectToDatabase } from '@/libs/db/mongodb';
import { getVersionData } from '@/libs/server/server-dashboard';
import { getMainnetNodeByIp, MainnetNodeData } from '@/libs/services/mainnet-data-service';
import { getDevnetNodeByIp, DevnetNodeData } from '@/libs/services/devnet-data-service';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

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
    // Try real-time API first
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
                pubkey: apiNode.pubkey || '',
                address: apiNode.address || `${nodeIp}:9001`,
                status,
                uptime: apiNode.uptime || 0,
                version: apiNode.version || 'unknown',
                credits: apiNode.credits || 0,
                storage_committed: apiNode.storage_committed || 0,
                storage_used: apiNode.storage_used || 0,
                storage_usage_percent: apiNode.storage_usage_percent || 0,
                manager_pubkey: (apiNode as MainnetNodeData).manager_pubkey,
                manager_nft_count: (apiNode as MainnetNodeData).manager_nft_count || 0,
                manager_sbt_count: (apiNode as MainnetNodeData).manager_sbt_count || 0,
                manager_xand_balance: (apiNode as MainnetNodeData).manager_xand_balance || 0,
                last_seen_timestamp: apiNode.last_seen_timestamp,
                isLive: true,
            };
        }
    } catch (error) {
        console.error(`[API] Failed to fetch live data for ${nodeIp}:`, error);
    }

    // Fallback to database
    try {
        const db = await connectToDatabase();
        const collectionNames = getCollectionNames(network as 'mainnet' | 'devnet');
        const node = await db.collection(collectionNames.NODE_SNAPSHOTS).findOne({ ip: nodeIp });

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

interface TelegramUpdate {
    update_id: number;
    message?: {
        message_id: number;
        from: {
            id: number;
            is_bot: boolean;
            first_name: string;
            username?: string;
        };
        chat: {
            id: number;
            first_name: string;
            username?: string;
            type: string;
        };
        date: number;
        text?: string;
    };
}

/**
 * Format uptime from seconds to human readable
 */
function formatUptime(seconds: number): string {
    if (!seconds || seconds < 0) return '0h';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

/**
 * Get status emoji
 */
function getStatusEmoji(status: string): string {
    switch (status) {
        case 'online': return '🟢';
        case 'offline': return '🔴';
        case 'syncing': return '🟡';
        default: return '⚪';
    }
}

/**
 * Format storage bytes to human readable (dynamic units)
 */
function formatStorage(bytes: number): string {
    if (!bytes || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const index = Math.min(i, units.length - 1);
    const value = bytes / Math.pow(1024, index);
    return `${value.toFixed(2)} ${units[index]}`;
}

/**
 * Format percentage with smart precision
 */
function formatPercent(value: number): string {
    if (!value || value <= 0) return '0%';
    if (value < 0.01) return `${(value * 100).toFixed(4)}%`;
    if (value < 0.1) return `${(value * 100).toFixed(3)}%`;
    if (value < 1) return `${(value * 100).toFixed(2)}%`;
    return `${value.toFixed(2)}%`;
}

/**
 * Shorten wallet address for display
 */
function shortenAddress(address: string): string {
    if (!address || address.length < 12) return address || 'N/A';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Fetch location data for an IP
 */
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

/**
 * Send a message via Telegram Bot API
 */
async function sendMessage(chatId: number, text: string): Promise<boolean> {
    if (!TELEGRAM_BOT_TOKEN) {
        console.error('TELEGRAM_BOT_TOKEN not configured');
        return false;
    }

    try {
        const response = await fetch(`${TELEGRAM_API_BASE}${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
            }),
        });

        const data = await response.json();
        return data.ok;
    } catch (error) {
        console.error('Failed to send message:', error);
        return false;
    }
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

    // Fetch latest version
    const versionResult = await getVersionData();
    const latestVersion = versionResult.version?.version || 'unknown';

    // Fetch node data - real-time with DB fallback
    const nodeDetails = await Promise.all(bindings.map(async (binding) => {
        const nodeData = await fetchNodeData(binding.nodeIp, binding.network);
        return {
            ...binding,
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

        // Version comparison indicator
        const versionIndicator = node.version === latestVersion ? '✅' : (node.version !== 'unknown' ? '⚠️' : '');

        message += `${emoji} <code>${node.nodeIp}</code> (${node.network}) ${liveIcon}\n`;
        message += `   📦 Version: ${node.version} ${versionIndicator}\n`;
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
    message += `Latest version: <code>${latestVersion}</code>\n`;
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

    const db = await connectToDatabase();
    let online = 0, offline = 0, syncing = 0;

    for (const binding of bindings) {
        const collectionNames = getCollectionNames(binding.network);
        const node = await db.collection(collectionNames.NODE_SNAPSHOTS).findOne({ ip: binding.nodeIp });

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
    const versionResult = await getVersionData();

    if (!versionResult.version) {
        await sendMessage(chatId, `
❌ <b>Version Check Failed</b>

Unable to fetch the latest version information.
Please try again later.
        `.trim());
        return;
    }

    const { version, build, commit } = versionResult.version;

    let message = `📦 <b>Latest pNode Version</b>\n\n`;
    message += `🏷️ Version: <code>${version}</code>\n`;

    if (build) {
        message += `🔧 Build: <code>${build}</code>\n`;
    }
    if (commit) {
        message += `📝 Commit: <code>${commit}</code>\n`;
    }

    message += `\n<i>Use /list to check your nodes' versions</i>`;

    await sendMessage(chatId, message.trim());
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

    // Fetch node data (real-time with DB fallback), version, and location in parallel
    const [nodeData, versionResult, location] = await Promise.all([
        fetchNodeData(nodeIp, binding.network),
        getVersionData(),
        fetchLocationData(nodeIp)
    ]);

    const latestVersion = versionResult.version?.version || 'unknown';

    if (!nodeData) {
        await sendMessage(chatId, `
⚠️ <b>No Data Available</b>

Node <code>${nodeIp}</code> is bound but no data found from API or database.
        `.trim());
        return;
    }

    const statusEmoji = getStatusEmoji(nodeData.status);
    const nodeVersion = nodeData.version || 'unknown';
    const versionIndicator = nodeVersion === latestVersion ? '✅' : (nodeVersion !== 'unknown' ? '⚠️ Update available' : '');
    const isRegistered = !!nodeData.manager_pubkey;
    const regStatus = isRegistered ? '✅ Yes' : '❌ No';
    const dataSource = nodeData.isLive ? 'Live' : 'Cached';

    let message = `
🖥️ <b>Node Details</b> (${dataSource})

<b>IP:</b> <code>${nodeIp}</code>
<b>Pubkey:</b> <code>${shortenAddress(nodeData.pubkey)}</code>
<b>Network:</b> ${binding.network}
<b>Status:</b> ${statusEmoji} ${nodeData.status}
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
   📦 Version: <code>${nodeVersion}</code> ${versionIndicator}
   🏷️ Latest: <code>${latestVersion}</code>
   ⏱️ Uptime: ${formatUptime(nodeData.uptime || 0)}
   💰 Credits: ${(nodeData.credits || 0).toLocaleString()}
`;

    // Storage section
    message += `
<b>💾 Storage:</b>
   Used: ${formatStorage(nodeData.storage_used || 0)}
   Committed: ${formatStorage(nodeData.storage_committed || 0)}
   Usage: ${formatPercent(nodeData.storage_usage_percent || 0)}
`;

    // Registration & Manager section
    message += `
<b>🏷️ Registration:</b> ${regStatus}`;

    if (isRegistered) {
        message += `
<b>👤 Manager Wallet:</b>
   <code>${nodeData.manager_pubkey}</code>`;

        const nftCount = nodeData.manager_nft_count || 0;
        const sbtCount = nodeData.manager_sbt_count || 0;
        const xandBalance = nodeData.manager_xand_balance || 0;

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
 * POST /api/telegram-webhook
 * 
 * Handles incoming Telegram bot messages
 */
export async function POST(request: NextRequest) {
    try {
        const update: TelegramUpdate = await request.json();

        // Handle message
        if (update.message?.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text.trim();
            const firstName = update.message.from.first_name || 'there';

            // Parse command and arguments
            const [command, ...argParts] = text.split(' ');
            const args = argParts.join(' ');

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

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Telegram webhook error:', error);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}

/**
 * GET /api/telegram-webhook
 * 
 * Health check and webhook management endpoint
 * 
 * Actions:
 * - ?action=setup - Register webhook with Telegram
 * - ?action=info - Get current webhook info
 * - ?action=delete - Remove webhook
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!TELEGRAM_BOT_TOKEN) {
        return NextResponse.json({
            error: 'TELEGRAM_BOT_TOKEN not configured in environment variables'
        }, { status: 500 });
    }

    // Construct webhook URL from request
    const host = request.headers.get('host') || 'www.xandash.online';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const webhookUrl = `${protocol}://${host}/api/telegram-webhook`;

    try {
        if (action === 'setup') {
            // Register webhook with Telegram
            const response = await fetch(`${TELEGRAM_API_BASE}${TELEGRAM_BOT_TOKEN}/setWebhook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: webhookUrl }),
            });
            const data = await response.json();

            return NextResponse.json({
                success: data.ok,
                message: data.ok ? 'Webhook registered successfully' : data.description,
                webhookUrl,
            });
        }

        if (action === 'info') {
            // Get current webhook info
            const response = await fetch(`${TELEGRAM_API_BASE}${TELEGRAM_BOT_TOKEN}/getWebhookInfo`);
            const data = await response.json();

            return NextResponse.json({
                success: data.ok,
                webhook: data.result,
            });
        }

        if (action === 'delete') {
            // Delete webhook (switch to polling mode)
            const response = await fetch(`${TELEGRAM_API_BASE}${TELEGRAM_BOT_TOKEN}/deleteWebhook`);
            const data = await response.json();

            return NextResponse.json({
                success: data.ok,
                message: data.ok ? 'Webhook deleted' : data.description,
            });
        }

        // Default: health check
        return NextResponse.json({
            status: 'ok',
            message: 'Telegram webhook endpoint active',
            setup: 'Add ?action=setup to register webhook',
            info: 'Add ?action=info to check webhook status',
        });
    } catch (error) {
        console.error('Webhook management error:', error);
        return NextResponse.json({ error: 'Failed to manage webhook' }, { status: 500 });
    }
}
