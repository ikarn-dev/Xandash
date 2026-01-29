import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP, updateLastLogin, getUserByEmail } from '@/libs/services/user-service';
import { createSession } from '@/libs/services/session-service';

/**
 * POST /api/notifications/auth/verify
 * 
 * Verify OTP and create session
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, otp, forceLogin = false } = body;

        // Validate inputs
        if (!email || !otp) {
            return NextResponse.json(
                { error: 'Email and verification code are required' },
                { status: 400 }
            );
        }

        // Verify OTP
        const result = await verifyOTP(email, otp, 'login');

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        // Update last login
        await updateLastLogin(email);

        // Create session (with force login flag if provided)
        try {
            await createSession(email, forceLogin);
        } catch (sessionError: any) {
            if (sessionError.message === 'ACTIVE_SESSION_EXISTS') {
                return NextResponse.json(
                    {
                        error: 'You are already logged in on another device',
                        requiresForceLogin: true
                    },
                    { status: 409 }
                );
            }
            throw sessionError;
        }

        // Get user data
        const user = await getUserByEmail(email);

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            user: {
                email: user?.email,
                telegramChatId: user?.telegramChatId,
                telegramVerified: user?.telegramVerified,
            },
        });

    } catch (error) {
        console.error('Verify error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
