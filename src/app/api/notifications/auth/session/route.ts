import { NextResponse } from 'next/server';
import { getSession } from '@/libs/services/session-service';
import { getUserByEmail, getUserBindings } from '@/libs/services/user-service';
import { setCSRFToken } from '@/libs/services/csrf-service';

/**
 * GET /api/notifications/auth/session
 * 
 * Get current session and user data
 * Also generates a new CSRF token for state-changing operations
 */
export async function GET() {
    try {
        const session = await getSession();

        // Generate CSRF token for all requests (authenticated or not)
        const csrfToken = await setCSRFToken();

        if (!session) {
            const response = NextResponse.json({
                authenticated: false,
                csrfToken,
            });
            // Add cache-control headers to prevent caching
            response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            response.headers.set('Pragma', 'no-cache');
            response.headers.set('Expires', '0');
            return response;
        }

        // Get user data
        const user = await getUserByEmail(session.email);

        if (!user) {
            return NextResponse.json({
                authenticated: false,
                csrfToken,
            });
        }

        // Get user's bound nodes
        const bindings = await getUserBindings(session.email);

        const response = NextResponse.json({
            authenticated: true,
            user: {
                email: user.email,
                telegramChatId: user.telegramChatId,
                telegramVerified: user.telegramVerified,
                createdAt: user.createdAt,
                lastLoginAt: user.lastLoginAt,
            },
            bindings: bindings.map(b => ({
                nodeIp: b.nodeIp,
                network: b.network,
                pubkey: b.pubkey,
                testUsed: b.testUsed,
                createdAt: b.createdAt,
            })),
            expiresAt: new Date(session.exp * 1000).toISOString(),
            csrfToken,
        });
        
        // Add cache-control headers to prevent caching
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        
        return response;

    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
