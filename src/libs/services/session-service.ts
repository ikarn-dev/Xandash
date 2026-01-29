/**
 * Session Service - JWT-based authentication for notification system
 * Uses HTTP-only cookies for secure session management
 */

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { randomBytes } from 'crypto';
import { generateSessionId, updateUserSession, checkActiveSession, clearActiveSession as clearActiveSessionDb } from './user-session-service';

// In production, SESSION_SECRET is required
// In development, auto-generate a random secret (resets on server restart)
const SESSION_SECRET = process.env.SESSION_SECRET || (
    process.env.NODE_ENV === 'production'
        ? undefined  // Will throw error in production
        : randomBytes(32).toString('hex')  // Auto-generate for dev
);

const SESSION_NAME = 'xandash_session';
const SESSION_DURATION_DAYS = 7;

// Convert secret to Uint8Array for jose
const getSecretKey = () => {
    if (!SESSION_SECRET) {
        throw new Error('SESSION_SECRET environment variable is required in production');
    }
    return new TextEncoder().encode(SESSION_SECRET);
};

export interface SessionPayload {
    email: string;
    sessionId?: string; // Session ID for single-device enforcement
    iat: number;  // Issued at
    exp: number;  // Expires
}

/**
 * Create a new session for a user
 */
export async function createSession(email: string, forceLogin = false): Promise<void> {
    if (!forceLogin) {
        // Check if there's an active session on another device
        const activeCheck = await checkActiveSession(email);
        if (activeCheck.hasActiveSession) {
            throw new Error('ACTIVE_SESSION_EXISTS');
        }
    }

    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

    const token = await new SignJWT({ email, sessionId })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresAt)
        .sign(getSecretKey());

    // Update user's active session in database
    await updateUserSession(email, sessionId);

    const cookieStore = await cookies();
    cookieStore.set(SESSION_NAME, token, {
        httpOnly: true,
        // Use secure cookies in production OR when explicitly set
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', // Changed from 'strict' to allow redirects after login
        expires: expiresAt,
        path: '/',
    });
}

/**
 * Get current session from cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_NAME)?.value;

    if (!token) {
        return null;
    }

    try {
        const { payload } = await jwtVerify(token, getSecretKey(), {
            algorithms: ['HS256'],
        });

        const sessionPayload = {
            email: payload.email as string,
            sessionId: payload.sessionId as string | undefined,
            iat: payload.iat as number,
            exp: payload.exp as number,
        };

        // Validate session ID matches active session
        if (sessionPayload.sessionId) {
            const activeCheck = await checkActiveSession(sessionPayload.email);
            if (activeCheck.hasActiveSession &&
                activeCheck.sessionId !== sessionPayload.sessionId) {
                // Session invalidated by login on another device
                return null;
            }
        }

        return sessionPayload;
    } catch {
        // Invalid or expired token
        return null;
    }
}

/**
 * Verify session and return email if valid
 * Throws error if not authenticated
 */
export async function requireSession(): Promise<string> {
    const session = await getSession();

    if (!session) {
        throw new Error('Not authenticated');
    }

    return session.email;
}

/**
 * Clear the session (logout)
 * Always clears the cookie even if session is invalid
 */
export async function clearSession(): Promise<void> {
    const cookieStore = await cookies();
    
    // Get session before deleting cookie
    let sessionEmail: string | null = null;
    try {
        const session = await getSession();
        if (session) {
            sessionEmail = session.email;
        }
    } catch {
        // Ignore errors - we still want to clear the cookie
    }

    // Delete the cookie first
    cookieStore.delete(SESSION_NAME);
    
    // Then clear from database
    if (sessionEmail) {
        try {
            await clearActiveSessionDb(sessionEmail);
        } catch (error) {
            console.error('Failed to clear active session in database:', error);
        }
    }
}

/**
 * Refresh session expiration
 */
export async function refreshSession(): Promise<void> {
    const session = await getSession();

    if (session) {
        await createSession(session.email, true); // Force to avoid re-checking active session
    }
}
