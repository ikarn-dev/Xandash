import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateUser, createLoginOTP, canRequestOTP } from '@/libs/services/user-service';
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

        // Check rate limiting
        const rateCheck = await canRequestOTP(email, 'login');
        if (!rateCheck.allowed) {
            return NextResponse.json(
                {
                    error: `Please wait ${rateCheck.remainingSeconds} seconds before requesting a new code`,
                    remainingSeconds: rateCheck.remainingSeconds,
                    rateLimited: true
                },
                { status: 429 }
            );
        }

        // Get or create user
        try {
            await getOrCreateUser(email);
        } catch (dbError) {
            console.error('Database error in getOrCreateUser:', dbError);
            return NextResponse.json(
                { error: 'Database error. Please try again later.' },
                { status: 500 }
            );
        }

        // Create OTP
        let otp: string;
        try {
            otp = await createLoginOTP(email);
        } catch (otpError: any) {
            // Handle rate limit error from createLoginOTP
            if (otpError.message?.includes('wait')) {
                const match = otpError.message.match(/(\d+) seconds/);
                const seconds = match ? parseInt(match[1]) : 120;
                return NextResponse.json(
                    {
                        error: otpError.message,
                        remainingSeconds: seconds,
                        rateLimited: true
                    },
                    { status: 429 }
                );
            }
            console.error('Error creating OTP:', otpError);
            return NextResponse.json(
                { error: 'Failed to create verification code. Please try again.' },
                { status: 500 }
            );
        }

        // Send OTP via email
        let emailResult;
        try {
            emailResult = await sendOTPEmail(email, otp);
        } catch (emailError) {
            console.error('Email service error:', emailError);
            return NextResponse.json(
                { error: 'Email service is temporarily unavailable. Please try again later.' },
                { status: 503 }
            );
        }

        if (!emailResult.success) {
            console.error('Failed to send OTP email:', emailResult.error);

            // Check if it's a configuration issue
            if (emailResult.error?.includes('not configured')) {
                return NextResponse.json(
                    { error: 'Email service is not configured. Please contact support.' },
                    { status: 503 }
                );
            }

            return NextResponse.json(
                { error: 'Failed to send verification email. Please try again in a few moments.' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Verification code sent to your email',
        });

    } catch (error) {
        console.error('Unexpected login error:', error);
        // Log the full error for debugging
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
        }
        return NextResponse.json(
            { error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        );
    }
}
