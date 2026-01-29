/**
 * CSRF Protection Service
 * Generates and validates CSRF tokens for state-changing operations
 */

import { cookies } from 'next/headers';
import { randomBytes, createHash } from 'crypto';

const CSRF_COOKIE_NAME = 'xandash_csrf';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(): string {
    return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Hash a CSRF token for cookie storage
 */
function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

/**
 * Set CSRF token cookie and return the token
 */
export async function setCSRFToken(): Promise<string> {
    const token = generateCSRFToken();
    const cookieStore = await cookies();
    
    cookieStore.set(CSRF_COOKIE_NAME, hashToken(token), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
    });
    
    return token;
}

/**
 * Get CSRF token from cookie
 */
export async function getCSRFToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * Validate CSRF token from request header against cookie
 */
export async function validateCSRFToken(requestToken: string | null): Promise<boolean> {
    if (!requestToken) {
        return false;
    }
    
    const cookieToken = await getCSRFToken();
    if (!cookieToken) {
        return false;
    }
    
    // Hash the request token and compare with cookie
    const hashedRequestToken = hashToken(requestToken);
    return hashedRequestToken === cookieToken;
}

/**
 * Clear CSRF token cookie
 */
export async function clearCSRFToken(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(CSRF_COOKIE_NAME);
}
