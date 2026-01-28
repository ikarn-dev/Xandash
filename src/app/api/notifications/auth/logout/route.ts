import { NextResponse } from 'next/server';
import { clearSession } from '@/libs/services/session-service';

/**
 * POST /api/notifications/auth/logout
 * 
 * Clear session and logout user
 */
export async function POST() {
    try {
        await clearSession();

        return NextResponse.json({
            success: true,
            message: 'Logged out successfully',
        });

    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
