/**
 * User Service - Manages notification user accounts and bindings
 */

import { getCollection, COLLECTIONS, NotificationUser, NodeBinding, OTPToken } from '@/libs/db/mongodb';
import { createHash, randomBytes } from 'crypto';

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash OTP for secure storage
 */
export function hashOTP(otp: string): string {
    return createHash('sha256').update(otp).digest('hex');
}

/**
 * Create or get a user by email
 */
export async function getOrCreateUser(email: string): Promise<NotificationUser> {
    const collection = await getCollection<NotificationUser>(COLLECTIONS.NOTIFICATION_USERS);

    const existingUser = await collection.findOne({ email: email.toLowerCase() });

    if (existingUser) {
        return existingUser as NotificationUser;
    }

    // Create new user
    const newUser: NotificationUser = {
        email: email.toLowerCase(),
        telegramVerified: false,
        createdAt: new Date(),
        lastLoginAt: new Date(),
    };

    await collection.insertOne(newUser as any);
    return newUser;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<NotificationUser | null> {
    const collection = await getCollection<NotificationUser>(COLLECTIONS.NOTIFICATION_USERS);
    const user = await collection.findOne({ email: email.toLowerCase() });
    return user as NotificationUser | null;
}

/**
 * Update user's last login time
 */
export async function updateLastLogin(email: string): Promise<void> {
    const collection = await getCollection<NotificationUser>(COLLECTIONS.NOTIFICATION_USERS);
    await collection.updateOne(
        { email: email.toLowerCase() },
        { $set: { lastLoginAt: new Date() } }
    );
}

/**
 * Link telegram to user account
 */
export async function linkTelegram(email: string, telegramChatId: string): Promise<void> {
    const collection = await getCollection<NotificationUser>(COLLECTIONS.NOTIFICATION_USERS);
    await collection.updateOne(
        { email: email.toLowerCase() },
        {
            $set: {
                telegramChatId,
                telegramVerified: true
            }
        }
    );
}

/**
 * Unlink telegram from user account
 */
export async function unlinkTelegram(email: string): Promise<void> {
    const collection = await getCollection<NotificationUser>(COLLECTIONS.NOTIFICATION_USERS);
    await collection.updateOne(
        { email: email.toLowerCase() },
        {
            $unset: { telegramChatId: "" },
            $set: { telegramVerified: false }
        }
    );
}

/**
 * Create login OTP
 */
export async function createLoginOTP(email: string): Promise<string> {
    const collection = await getCollection<OTPToken>(COLLECTIONS.OTP_TOKENS);

    // Delete any existing OTPs for this email
    await collection.deleteMany({ email: email.toLowerCase(), purpose: 'login' });

    const otp = generateOTP();
    const otpToken: OTPToken = {
        email: email.toLowerCase(),
        purpose: 'login',
        otpHash: hashOTP(otp),
        attempts: 0,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
        createdAt: new Date(),
    };

    await collection.insertOne(otpToken as any);
    return otp;
}

/**
 * Create telegram verification OTP
 */
export async function createTelegramOTP(email: string, telegramChatId: string): Promise<string> {
    const collection = await getCollection<OTPToken>(COLLECTIONS.OTP_TOKENS);

    // Delete any existing telegram OTPs for this email
    await collection.deleteMany({ email: email.toLowerCase(), purpose: 'telegram' });

    const otp = generateOTP();
    const otpToken: OTPToken = {
        email: email.toLowerCase(),
        purpose: 'telegram',
        telegramChatId,
        otpHash: hashOTP(otp),
        attempts: 0,
        expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
        createdAt: new Date(),
    };

    await collection.insertOne(otpToken as any);
    return otp;
}

/**
 * Verify OTP
 */
export async function verifyOTP(
    email: string,
    otp: string,
    purpose: 'login' | 'telegram'
): Promise<{ success: boolean; error?: string; telegramChatId?: string }> {
    const collection = await getCollection<OTPToken>(COLLECTIONS.OTP_TOKENS);

    const token = await collection.findOne({
        email: email.toLowerCase(),
        purpose
    });

    if (!token) {
        return { success: false, error: 'No verification code found. Please request a new one.' };
    }

    // Check expiry
    if (new Date() > token.expiresAt) {
        await collection.deleteOne({ _id: token._id });
        return { success: false, error: 'Verification code has expired. Please request a new one.' };
    }

    // Check attempts
    if (token.attempts >= MAX_OTP_ATTEMPTS) {
        await collection.deleteOne({ _id: token._id });
        return { success: false, error: 'Too many failed attempts. Please request a new code.' };
    }

    // Verify OTP
    if (hashOTP(otp) !== token.otpHash) {
        await collection.updateOne(
            { _id: token._id },
            { $inc: { attempts: 1 } }
        );
        return { success: false, error: 'Invalid verification code.' };
    }

    // Success - delete the token
    await collection.deleteOne({ _id: token._id });

    return {
        success: true,
        telegramChatId: token.telegramChatId
    };
}

/**
 * Get all node bindings for a user
 */
export async function getUserBindings(email: string): Promise<NodeBinding[]> {
    const collection = await getCollection<NodeBinding>(COLLECTIONS.NODE_BINDINGS);
    const bindings = await collection.find({ email: email.toLowerCase() }).toArray();
    return bindings as NodeBinding[];
}

/**
 * Bind a node to user account
 */
export async function bindNode(
    email: string,
    nodeIp: string,
    network: 'devnet' | 'mainnet',
    pubkey?: string
): Promise<{ success: boolean; error?: string }> {
    const collection = await getCollection<NodeBinding>(COLLECTIONS.NODE_BINDINGS);

    // Check if already bound by this user
    const existing = await collection.findOne({
        email: email.toLowerCase(),
        nodeIp,
        network
    });

    if (existing) {
        return { success: false, error: 'Node is already bound to your account.' };
    }

    // Check if bound by another user
    const boundByOther = await collection.findOne({ nodeIp, network });
    if (boundByOther) {
        return { success: false, error: 'This node is already bound to another account.' };
    }

    const binding: NodeBinding = {
        email: email.toLowerCase(),
        nodeIp,
        network,
        pubkey,
        testUsed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    await collection.insertOne(binding as any);
    return { success: true };
}

/**
 * Unbind a node from user account
 */
export async function unbindNode(
    email: string,
    nodeIp: string,
    network: 'devnet' | 'mainnet'
): Promise<{ success: boolean; error?: string }> {
    const collection = await getCollection<NodeBinding>(COLLECTIONS.NODE_BINDINGS);

    const result = await collection.deleteOne({
        email: email.toLowerCase(),
        nodeIp,
        network
    });

    if (result.deletedCount === 0) {
        return { success: false, error: 'Node not found in your bindings.' };
    }

    return { success: true };
}

/**
 * Mark test notification as used for a binding
 */
export async function markTestUsed(
    email: string,
    nodeIp: string,
    network: 'devnet' | 'mainnet'
): Promise<void> {
    const collection = await getCollection<NodeBinding>(COLLECTIONS.NODE_BINDINGS);
    await collection.updateOne(
        { email: email.toLowerCase(), nodeIp, network },
        { $set: { testUsed: true, updatedAt: new Date() } }
    );
}

/**
 * Get user by telegram chat ID
 */
export async function getUserByTelegram(telegramChatId: string): Promise<NotificationUser | null> {
    const collection = await getCollection<NotificationUser>(COLLECTIONS.NOTIFICATION_USERS);
    const user = await collection.findOne({ telegramChatId });
    return user as NotificationUser | null;
}

/**
 * Unbind all nodes for a telegram user
 */
export async function unbindAllNodesByTelegram(telegramChatId: string): Promise<number> {
    const user = await getUserByTelegram(telegramChatId);
    if (!user) return 0;

    const collection = await getCollection<NodeBinding>(COLLECTIONS.NODE_BINDINGS);
    const result = await collection.deleteMany({ email: user.email });
    return result.deletedCount;
}

/**
 * Unbind specific node by telegram user
 */
export async function unbindNodeByTelegram(
    telegramChatId: string,
    nodeIp: string
): Promise<{ success: boolean; error?: string }> {
    const user = await getUserByTelegram(telegramChatId);
    if (!user) {
        return { success: false, error: 'No account linked to this Telegram.' };
    }

    const collection = await getCollection<NodeBinding>(COLLECTIONS.NODE_BINDINGS);
    const result = await collection.deleteOne({
        email: user.email,
        nodeIp
    });

    if (result.deletedCount === 0) {
        return { success: false, error: 'Node not found in your bindings.' };
    }

    return { success: true };
}

/**
 * Create indexes for collections
 */
export async function createNotificationIndexes(): Promise<void> {
    const usersCollection = await getCollection<NotificationUser>(COLLECTIONS.NOTIFICATION_USERS);
    const bindingsCollection = await getCollection<NodeBinding>(COLLECTIONS.NODE_BINDINGS);
    const otpCollection = await getCollection<OTPToken>(COLLECTIONS.OTP_TOKENS);

    // User indexes
    await usersCollection.createIndex({ email: 1 }, { unique: true });
    await usersCollection.createIndex({ telegramChatId: 1 }, { sparse: true });

    // Binding indexes
    await bindingsCollection.createIndex({ email: 1 });
    await bindingsCollection.createIndex({ nodeIp: 1, network: 1 }, { unique: true });

    // OTP indexes with TTL
    await otpCollection.createIndex({ email: 1, purpose: 1 });
    await otpCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    console.log('✅ Notification indexes created');
}
