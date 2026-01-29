import { NextResponse } from 'next/server';
import { clearSession } from '@/libs/services/session-service';
import { clearCSRFToken } from '@/libs/services/csrf-service';

/**
 * POST /api/notifications/auth/logout
 *
 * Clear session and logout user
 *
 * Note: CSRF protection is not required for logout because:
 * 1. The session cookie is httpOnly and cannot be read by JavaScript
 * 2. Logout is a "safe" action - the worst case is the user gets logged out
 * 3. The session is already validated server-side
 */
export async function POST() {
    try {
        await clearSession();
        await clearCSRFToken();

        // Create response with cache-busting headers
        const response = NextResponse.json({
            success: true,
            message: 'Logged out successfully',
        });
        
        // Add cache-control headers to prevent caching of this response
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        response.headers.set('Pragma', 'no-cache');
        response.headers.set('Expires', '0');
        
        return response;

    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
