/**
 * Email Service using Resend.com API
 * 
 * Requires RESEND_API_KEY environment variable
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'notifications@xandash.online';

interface EmailResponse {
  success: boolean;
  error?: string;
  messageId?: string;
}

/**
 * Send an email via Resend API
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<EmailResponse> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      return { success: false, error: 'Failed to send email' };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: 'Email service error' };
  }
}
/**
 * Send OTP verification email for login
 */
export async function sendOTPEmail(
  email: string,
  otp: string
): Promise<EmailResponse> {
  const subject = 'XanDash - Your Login Code';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #171717; padding: 20px; margin: 0; }
        .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .logo { color: #9333ea; font-size: 24px; font-weight: bold; margin-bottom: 24px; }
        h2 { color: #171717; }
        .otp { background: #f3e8ff; border-radius: 8px; padding: 16px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #7c3aed; margin: 24px 0; border: 1px solid #e9d5ff; }
        .info { color: #525252; font-size: 14px; margin: 16px 0; }
        .footer { color: #737373; font-size: 12px; margin-top: 24px; border-top: 1px solid #e5e5e5; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">XanDash</div>
        <h2 style="margin: 0;">Login Verification</h2>
        <p class="info">Use the following code to log in to XanDash Node Notifications:</p>
        <div class="otp">${otp}</div>
        <p class="info">This code will expire in 10 minutes.</p>
        <p class="info">If you didn't request this code, please ignore this email.</p>
        <div class="footer">
          This email was sent by XanDash Node Notification System<br>
          © ${new Date().getFullYear()} XanDash
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(email, subject, html);
}


/**
 * Send notification email for node events
 */
export async function sendNotificationEmail(
  email: string,
  notification: {
    nodeIp: string;
    eventType: string;
    title: string;
    message: string;
    previousValue?: string | number;
    newValue?: string | number;
  }
): Promise<EmailResponse> {
  const subject = `XanDash Alert: ${notification.title}`;

  const changeInfo = notification.previousValue !== undefined && notification.newValue !== undefined
    ? `<p style="color: #525252; font-size: 14px;">Changed from <strong>${notification.previousValue}</strong> to <strong>${notification.newValue}</strong></p>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="color-scheme" content="light dark">
      <meta name="supported-color-schemes" content="light dark">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #171717; padding: 20px; margin: 0; }
        .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .logo { color: #9333ea; font-size: 24px; font-weight: bold; margin-bottom: 24px; }
        h2 { color: #171717; margin: 0; }
        .alert-box { background: #f3e8ff; border-left: 4px solid #9333ea; border-radius: 4px; padding: 16px; margin: 16px 0; }
        .alert-box p { color: #374151; }
        .node-ip { color: #7c3aed; font-family: monospace; font-weight: bold; }
        .info { color: #525252; font-size: 14px; }
        .footer { color: #737373; font-size: 12px; margin-top: 24px; border-top: 1px solid #e5e5e5; padding-top: 16px; }
        .button { display: inline-block; background: #9333ea; color: #ffffff !important; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">XanDash Alert</div>
        <h2>${notification.title}</h2>
        <div class="alert-box">
          <p style="margin: 0;"><strong>Node:</strong> <span class="node-ip">${notification.nodeIp}</span></p>
          <p style="margin: 8px 0 0 0;">${notification.message}</p>
          ${changeInfo}
        </div>
        <a href="https://www.xandash.online/profile/${notification.nodeIp}" class="button">View Node Details</a>
        <div class="footer">
          This is an automated alert from XanDash Node Notification System<br>
          You can manage your notification preferences at xandash.online<br>
          © ${new Date().getFullYear()} XanDash
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(email, subject, html);
}

/**
 * Send test notification email
 */
export async function sendTestEmail(
  email: string,
  nodeIp: string
): Promise<EmailResponse> {
  return sendNotificationEmail(email, {
    nodeIp,
    eventType: 'test',
    title: 'Test Notification',
    message: 'This is a test notification to confirm your email is correctly configured. You will receive alerts when your node experiences status changes, version updates, or other important events.',
  });
}
