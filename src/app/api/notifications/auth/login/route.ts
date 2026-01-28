import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser, createLoginOTP } from '@/libs/services/user-service';
import { sendOTPEmail } from '@/libs/services/email-service';

/**
 * POST /api/notifications/auth/login
 * 
 * Send OTP to email for login
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;

        // Validate email
        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Get or create user
        await getOrCreateUser(email);

        // Create OTP
        const otp = await createLoginOTP(email);

        // Send OTP via email
        const emailResult = await sendOTPEmail(email, otp);

        if (!emailResult.success) {
            console.error('Failed to send OTP email:', emailResult.error);
            return NextResponse.json(
                { error: 'Failed to send verification email. Please try again.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Verification code sent to your email',
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
