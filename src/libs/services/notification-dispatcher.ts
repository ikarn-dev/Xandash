/**
 * Notification Dispatcher Service
 * 
 * Dispatches notifications to bound users when node events occur.
 * Called from the sync cron job when events are detected.
 */

import { getCollection, COLLECTIONS, NodeEventLog, NotificationUser, NodeBinding } from '@/libs/db/mongodb';
import { sendNotificationEmail } from './email-service';
import { sendNotificationTelegram } from './telegram-service';

type NetworkType = 'devnet' | 'mainnet';

interface DispatchResult {
    nodeIp: string;
    emailSent: boolean;
    telegramSent: boolean;
    errors: string[];
}

interface BindingWithUser {
    email: string;
    telegramChatId?: string;
    telegramVerified: boolean;
    nodeIp: string;
}

/**
 * Get all bindings with user telegram info for a network
 */
async function getAllBindingsWithUsers(network: NetworkType): Promise<BindingWithUser[]> {
    const bindingsCollection = await getCollection<NodeBinding>(COLLECTIONS.NODE_BINDINGS);
    const usersCollection = await getCollection<NotificationUser>(COLLECTIONS.NOTIFICATION_USERS);

    const bindings = await bindingsCollection.find({ network }).toArray();
    const results: BindingWithUser[] = [];

    for (const binding of bindings) {
        const user = await usersCollection.findOne({ email: binding.email });
        if (user) {
            results.push({
                email: binding.email,
                telegramChatId: user.telegramChatId,
                telegramVerified: user.telegramVerified,
                nodeIp: binding.nodeIp,
            });
        }
    }

    return results;
}

/**
 * Get binding with user info for a specific node
 */
async function getBindingForNode(nodeIp: string, network: NetworkType): Promise<BindingWithUser | null> {
    const bindingsCollection = await getCollection<NodeBinding>(COLLECTIONS.NODE_BINDINGS);
    const usersCollection = await getCollection<NotificationUser>(COLLECTIONS.NOTIFICATION_USERS);

    const binding = await bindingsCollection.findOne({ nodeIp, network });
    if (!binding) return null;

    const user = await usersCollection.findOne({ email: binding.email });
    if (!user) return null;

    return {
        email: binding.email,
        telegramChatId: user.telegramChatId,
        telegramVerified: user.telegramVerified,
        nodeIp: binding.nodeIp,
    };
}

/**
 * Get human-readable event title
 */
function getEventTitle(eventType: string): string {
    const titles: Record<string, string> = {
        'node_online': 'Node Back Online',
        'node_offline': 'Node Went Offline',
        'node_new': 'New Node Detected',
        'status_change': 'Node Status Changed',
        'version_change': 'Version Updated',
        'storage_change': 'Storage Changed',
        'credits_change': 'Credits Changed',
        'uptime_reset': 'Node Restarted',
        'credits_zero': 'Credits Depleted',
    };
    return titles[eventType] || 'Node Event';
}

/**
 * Get event message
 */
function getEventMessage(event: NodeEventLog): string {
    switch (event.event_type) {
        case 'node_online':
            return 'Your node is back online and operational.';
        case 'node_offline':
            return 'Your node has gone offline. Please check your node status.';
        case 'node_new':
            return 'A new node has been registered.';
        case 'status_change':
            return `Node status changed from ${event.previous_status || 'unknown'} to ${event.new_status || 'unknown'}.`;
        case 'version_change':
            return `Node version updated from ${event.previous_version || 'unknown'} to ${event.new_version || 'unknown'}.`;
        case 'storage_change':
            return 'Node storage allocation has changed.';
        case 'credits_change':
            return 'Node credits have changed.';
        case 'uptime_reset':
            return `Node uptime reset detected. Previous uptime: ${Math.floor((event.previous_value as number || 0) / 3600)} hours.`;
        case 'credits_zero':
            return `Your node credits have dropped to 0. Previous credits: ${event.previous_value}. Please add credits to continue operation.`;
        default:
            return 'A node event has occurred.';
    }
}

/**
 * Dispatch notification for a single event
 */
export async function dispatchNotification(
    event: NodeEventLog,
    network: NetworkType = 'devnet'
): Promise<DispatchResult> {
    const result: DispatchResult = {
        nodeIp: event.ip,
        emailSent: false,
        telegramSent: false,
        errors: [],
    };

    // Get binding for this node
    const binding = await getBindingForNode(event.ip, network);

    if (!binding) {
        // No bindings for this node
        return result;
    }

    const notification = {
        nodeIp: event.ip,
        eventType: event.event_type,
        title: getEventTitle(event.event_type),
        message: getEventMessage(event),
        previousValue: event.previous_value,
        newValue: event.new_value,
    };

    // Send to email (always - email is required)
    try {
        const emailResult = await sendNotificationEmail(binding.email, notification);
        result.emailSent = emailResult.success;
        if (!emailResult.success && emailResult.error) {
            result.errors.push(`Email: ${emailResult.error}`);
        }
    } catch (error) {
        result.errors.push(`Email: ${error}`);
    }

    // Send to telegram if verified
    if (binding.telegramVerified && binding.telegramChatId) {
        try {
            const telegramResult = await sendNotificationTelegram(binding.telegramChatId, notification);
            result.telegramSent = telegramResult.success;
            if (!telegramResult.success && telegramResult.error) {
                result.errors.push(`Telegram: ${telegramResult.error}`);
            }
        } catch (error) {
            result.errors.push(`Telegram: ${error}`);
        }
    }

    return result;
}

/**
 * Dispatch notifications for multiple events (batch)
 */
export async function dispatchNotifications(
    events: NodeEventLog[],
    network: NetworkType = 'devnet'
): Promise<{
    total: number;
    dispatched: number;
    emailsSent: number;
    telegramsSent: number;
    errors: string[];
}> {
    const results = {
        total: events.length,
        dispatched: 0,
        emailsSent: 0,
        telegramsSent: 0,
        errors: [] as string[],
    };

    if (events.length === 0) {
        return results;
    }

    // Get all bindings once for efficiency
    const allBindings = await getAllBindingsWithUsers(network);
    const bindingsMap = new Map(allBindings.map(b => [b.nodeIp, b]));

    // Process each event
    for (const event of events) {
        const binding = bindingsMap.get(event.ip);

        if (!binding) {
            continue; // No binding for this node
        }

        const notification = {
            nodeIp: event.ip,
            eventType: event.event_type,
            title: getEventTitle(event.event_type),
            message: getEventMessage(event),
            previousValue: event.previous_value,
            newValue: event.new_value,
        };

        let dispatched = false;

        // Send to email (always)
        try {
            const emailResult = await sendNotificationEmail(binding.email, notification);
            if (emailResult.success) {
                results.emailsSent++;
                dispatched = true;
            } else if (emailResult.error) {
                results.errors.push(`${event.ip}/${event.event_type} Email: ${emailResult.error}`);
            }
        } catch (error) {
            results.errors.push(`${event.ip} Email error: ${error}`);
        }

        // Send to telegram if verified
        if (binding.telegramVerified && binding.telegramChatId) {
            try {
                const telegramResult = await sendNotificationTelegram(binding.telegramChatId, notification);
                if (telegramResult.success) {
                    results.telegramsSent++;
                    dispatched = true;
                } else if (telegramResult.error) {
                    results.errors.push(`${event.ip}/${event.event_type} Telegram: ${telegramResult.error}`);
                }
            } catch (error) {
                results.errors.push(`${event.ip} Telegram error: ${error}`);
            }
        }

        if (dispatched) {
            results.dispatched++;
        }
    }

    return results;
}

/**
 * Check if notifications should be sent for an event type
 * Some events might be too noisy to notify
 */
export function shouldNotify(eventType: string): boolean {
    // Events that should trigger notifications
    const notifiableEvents = [
        'node_online',
        'node_offline',
        'status_change',
        'version_change',
        'uptime_reset',
        'credits_zero',  // Notify when credits drop from > 0 to exactly 0
        // 'credits_change', // Can be noisy, enable if needed
        // 'storage_change', // Can be noisy, enable if needed
    ];

    return notifiableEvents.includes(eventType);
}
