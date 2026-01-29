/**
 * User Session Service - Manages single-device login enforcement
 */

import { getCollection, COLLECTIONS, NotificationUser } from '@/libs/db/mongodb';
import { randomBytes } from 'crypto';

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
    return randomBytes(32).toString('hex');
}

/**
 * Update user's active session in database
 */
export async function updateUserSession(
    email: string,
    sessionId: string
): Promise<void> {
    const collection = await getCollection<NotificationUser>(COLLECTIONS.NOTIFICATION_USERS);

    await collection.updateOne(
        { email: email.toLowerCase() },
        {
            $set: {
                activeSessionId: sessionId,
                lastSessionCreatedAt: new Date(),
            },
        }
    );
}

/**
 * Check if user has an active session
 */
export async function checkActiveSession(
    email: string
): Promise<{ hasActiveSession: boolean; sessionId?: string }> {
    const collection = await getCollection<NotificationUser>(COLLECTIONS.NOTIFICATION_USERS);

    const user = await collection.findOne({ email: email.toLowerCase() });

    if (!user || !user.activeSessionId) {
        return { hasActiveSession: false };
    }

    const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
    const sessionAge = Date.now() - (user.lastSessionCreatedAt?.getTime() || 0);

    if (sessionAge > SESSION_DURATION_MS) {
        // Session expired
        return { hasActiveSession: false };
    }

    return {
        hasActiveSession: true,
        sessionId: user.activeSessionId
    };
}

/**
 * Clear active session from database
 */
export async function clearActiveSession(email: string): Promise<void> {
    const collection = await getCollection<NotificationUser>(COLLECTIONS.NOTIFICATION_USERS);

    await collection.updateOne(
        { email: email.toLowerCase() },
        {
            $unset: {
                activeSessionId: "",
                lastSessionCreatedAt: "",
            },
        }
    );
}
