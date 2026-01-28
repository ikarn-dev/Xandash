import { NextResponse } from 'next/server';
import { getSession } from '@/libs/services/session-service';
import { getUserByEmail, getUserBindings } from '@/libs/services/user-service';

/**
 * GET /api/notifications/auth/session
 * 
 * Get current session and user data
 */
export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({
                authenticated: false,
            });
        }

        // Get user data
        const user = await getUserByEmail(session.email);

        if (!user) {
            return NextResponse.json({
                authenticated: false,
            });
        }

        // Get user's bound nodes
        const bindings = await getUserBindings(session.email);

        return NextResponse.json({
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
        });

    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
