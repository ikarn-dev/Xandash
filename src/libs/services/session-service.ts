/**
 * Session Service - JWT-based authentication for notification system
 * Uses HTTP-only cookies for secure session management
 */

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { randomBytes } from 'crypto';

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
    iat: number;  // Issued at
    exp: number;  // Expires
}

/**
 * Create a new session for a user
 */
export async function createSession(email: string): Promise<void> {
    const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

    const token = await new SignJWT({ email })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expiresAt)
        .sign(getSecretKey());

    const cookieStore = await cookies();
    cookieStore.set(SESSION_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
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

        return {
            email: payload.email as string,
            iat: payload.iat as number,
            exp: payload.exp as number,
        };
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
 */
export async function clearSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_NAME);
}

/**
 * Refresh session expiration
 */
export async function refreshSession(): Promise<void> {
    const session = await getSession();

    if (session) {
        await createSession(session.email);
    }
}
