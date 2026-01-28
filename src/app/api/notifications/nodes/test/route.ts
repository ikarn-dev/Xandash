import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/libs/services/session-service';
import { getUserByEmail, getUserBindings, markTestUsed } from '@/libs/services/user-service';
import { sendTestEmail } from '@/libs/services/email-service';
import { sendTestTelegram } from '@/libs/services/telegram-service';

/**
 * POST /api/notifications/nodes/test
 * 
 * Send test notification to all bound channels
 */
export async function POST(request: NextRequest) {
    try {
        const email = await requireSession();
        const body = await request.json();
        const { nodeIp, network = 'devnet' } = body;

        // Validate inputs
        if (!nodeIp) {
            return NextResponse.json(
                { error: 'Node IP is required' },
                { status: 400 }
            );
        }

        // Get user and bindings
        const user = await getUserByEmail(email);
        const bindings = await getUserBindings(email);

        // Find the specific binding
        const binding = bindings.find(b => b.nodeIp === nodeIp && b.network === network);

        if (!binding) {
            return NextResponse.json(
                { error: 'Node not found in your bindings' },
                { status: 404 }
            );
        }

        // Check if test already used
        if (binding.testUsed) {
            return NextResponse.json(
                { error: 'Test notification already used for this binding' },
                { status: 400 }
            );
        }

        const results: { email?: boolean; telegram?: boolean } = {};

        // Send email test
        const emailResult = await sendTestEmail(email, nodeIp);
        results.email = emailResult.success;

        // Send telegram test if linked
        if (user?.telegramChatId && user.telegramVerified) {
            const telegramResult = await sendTestTelegram(user.telegramChatId, nodeIp);
            results.telegram = telegramResult.success;
        }

        // Mark test as used
        await markTestUsed(email, nodeIp, network);

        return NextResponse.json({
            success: true,
            message: 'Test notification sent',
            results,
        });

    } catch (error) {
        if (error instanceof Error && error.message === 'Not authenticated') {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }
        console.error('Test notification error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
