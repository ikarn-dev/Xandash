import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/libs/services/session-service';
import { getUserByEmail, createTelegramOTP, verifyOTP, linkTelegram, unlinkTelegram } from '@/libs/services/user-service';
import { sendOTPTelegram, sendWelcomeTelegram, sendUnlinkTelegram } from '@/libs/services/telegram-service';

/**
 * POST /api/notifications/telegram/bind
 * 
 * Send OTP to telegram for verification
 */
export async function POST(request: NextRequest) {
    try {
        const email = await requireSession();
        const body = await request.json();
        const { telegramChatId } = body;

        if (!telegramChatId) {
            return NextResponse.json(
                { error: 'Telegram Chat ID is required' },
                { status: 400 }
            );
        }

        // Create OTP
        const otp = await createTelegramOTP(email, telegramChatId);

        // Send OTP via Telegram
        const result = await sendOTPTelegram(telegramChatId, otp);

        if (!result.success) {
            return NextResponse.json(
                { error: 'Failed to send verification code. Check your Chat ID.' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Verification code sent to Telegram',
        });

    } catch (error) {
        if (error instanceof Error && error.message === 'Not authenticated') {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        console.error('Telegram bind error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/notifications/telegram/bind
 * 
 * Verify OTP and link telegram
 */
export async function PUT(request: NextRequest) {
    try {
        const email = await requireSession();
        const body = await request.json();
        const { otp } = body;

        if (!otp) {
            return NextResponse.json(
                { error: 'Verification code is required' },
                { status: 400 }
            );
        }

        // Verify OTP
        const result = await verifyOTP(email, otp, 'telegram');

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        // Link telegram
        if (result.telegramChatId) {
            await linkTelegram(email, result.telegramChatId);

            // Send welcome message
            await sendWelcomeTelegram(result.telegramChatId, email);
        }

        // Get updated user
        const user = await getUserByEmail(email);

        return NextResponse.json({
            success: true,
            message: 'Telegram linked successfully',
            telegramChatId: user?.telegramChatId,
        });

    } catch (error) {
        if (error instanceof Error && error.message === 'Not authenticated') {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        console.error('Telegram verify error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/notifications/telegram/bind
 * 
 * Unlink telegram from account
 */
export async function DELETE() {
    try {
        const email = await requireSession();

        // Get user's telegram chat ID before unlinking
        const user = await getUserByEmail(email);
        const chatId = user?.telegramChatId;

        await unlinkTelegram(email);

        // Send goodbye message if chat ID exists
        if (chatId) {
            await sendUnlinkTelegram(chatId);
        }

        return NextResponse.json({
            success: true,
            message: 'Telegram unlinked',
        });

    } catch (error) {
        if (error instanceof Error && error.message === 'Not authenticated') {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }
        console.error('Telegram unlink error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
