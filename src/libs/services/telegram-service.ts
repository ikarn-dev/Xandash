/**
 * Telegram Bot Service
 * 
 * Requires TELEGRAM_BOT_TOKEN environment variable
 * 
 * To set up:
 * 1. Message @BotFather on Telegram
 * 2. Create a new bot with /newbot
 * 3. Copy the token to TELEGRAM_BOT_TOKEN env var
 * 4. Users need to start a conversation with the bot first
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_BASE = 'https://api.telegram.org/bot';

interface TelegramResponse {
    success: boolean;
    error?: string;
    messageId?: number;
}

/**
 * Send a message via Telegram Bot API
 */
async function sendMessage(
    chatId: string,
    text: string,
    parseMode: 'HTML' | 'Markdown' = 'HTML'
): Promise<TelegramResponse> {
    if (!TELEGRAM_BOT_TOKEN) {
        console.error('TELEGRAM_BOT_TOKEN not configured');
        return { success: false, error: 'Telegram bot not configured' };
    }

    try {
        const response = await fetch(`${TELEGRAM_API_BASE}${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: parseMode,
            }),
        });

        const data = await response.json();

        if (!data.ok) {
            console.error('Telegram API error:', data);

            // Handle specific errors
            if (data.error_code === 403) {
                return { success: false, error: 'Bot was blocked by user. Please start a conversation with the bot first.' };
            }
            if (data.error_code === 400 && data.description?.includes('chat not found')) {
                return { success: false, error: 'Chat not found. Please start a conversation with the bot first.' };
            }

            return { success: false, error: data.description || 'Failed to send message' };
        }

        return { success: true, messageId: data.result.message_id };
    } catch (error) {
        console.error('Telegram send error:', error);
        return { success: false, error: 'Telegram service error' };
    }
}

/**
 * Send OTP verification message via Telegram
 */
export async function sendOTPTelegram(
    chatId: string,
    otp: string
): Promise<TelegramResponse> {
    const text = `
🔐 <b>XanDash Verification</b>

Your verification code to link Telegram:

<code>${otp}</code>

This code will expire in 10 minutes.

If you didn't request this, please ignore this message.
  `.trim();

    return sendMessage(chatId, text, 'HTML');
}


/**
 * Send notification message via Telegram
 */
export async function sendNotificationTelegram(
    chatId: string,
    notification: {
        nodeIp: string;
        eventType: string;
        title: string;
        message: string;
        previousValue?: string | number;
        newValue?: string | number;
    }
): Promise<TelegramResponse> {
    const emoji = getEventEmoji(notification.eventType);

    let changeInfo = '';
    if (notification.previousValue !== undefined && notification.newValue !== undefined) {
        changeInfo = `\n📊 Changed: <code>${notification.previousValue}</code> → <code>${notification.newValue}</code>`;
    }

    const text = `
${emoji} <b>${notification.title}</b>

🖥️ Node: <code>${notification.nodeIp}</code>

${notification.message}${changeInfo}

<a href="https://www.xandash.online/profile/${notification.nodeIp}">View Node Details</a>
  `.trim();

    return sendMessage(chatId, text, 'HTML');
}

/**
 * Send test notification via Telegram
 */
export async function sendTestTelegram(
    chatId: string,
    nodeIp: string
): Promise<TelegramResponse> {
    return sendNotificationTelegram(chatId, {
        nodeIp,
        eventType: 'test',
        title: 'Test Notification',
        message: '✅ This is a test notification to confirm your Telegram is correctly configured.\n\nYou will receive alerts for:\n• Node status changes\n• Version updates\n• Credit changes\n• Other important events',
    });
}

/**
 * Send welcome message when Telegram is successfully linked
 */
export async function sendWelcomeTelegram(
    chatId: string,
    email: string
): Promise<TelegramResponse> {
    const text = `
🎉 <b>Telegram Linked Successfully!</b>

Your Telegram is now connected to your XanDash account.

📧 <b>Account:</b> <code>${email}</code>

<b>You'll receive alerts for:</b>
• 🟢🔴 Node online/offline
• 🔄 Node restarts
• 📦 Version updates
• 💰 Credits depleted

<b>Quick Commands:</b>
/list - View your nodes
/status - Status summary
/help - All commands

<a href="https://www.xandash.online/notifications">Manage Notifications</a>
    `.trim();

    return sendMessage(chatId, text, 'HTML');
}

/**
 * Send goodbye message when Telegram is unlinked
 */
export async function sendUnlinkTelegram(
    chatId: string
): Promise<TelegramResponse> {
    const text = `
👋 <b>Telegram Unlinked</b>

Your Telegram has been disconnected from your XanDash account.

You will no longer receive notifications via Telegram.

To reconnect, visit <a href="https://www.xandash.online/notifications">xandash.online/notifications</a>
    `.trim();

    return sendMessage(chatId, text, 'HTML');
}

/**
 * Get emoji for event type
 */
function getEventEmoji(eventType: string): string {
    const emojis: Record<string, string> = {
        'node_online': '🟢',
        'node_offline': '🔴',
        'status_change': '🔄',
        'version_change': '🆕',
        'storage_change': '💾',
        'credits_change': '💰',
        'node_new': '✨',
        'test': '🧪',
    };
    return emojis[eventType] || '📢';
}

/**
 * Get bot info (useful for debugging)
 */
export async function getBotInfo(): Promise<{ username?: string; error?: string }> {
    if (!TELEGRAM_BOT_TOKEN) {
        return { error: 'TELEGRAM_BOT_TOKEN not configured' };
    }

    try {
        const response = await fetch(`${TELEGRAM_API_BASE}${TELEGRAM_BOT_TOKEN}/getMe`);
        const data = await response.json();

        if (data.ok) {
            return { username: data.result.username };
        }
        return { error: data.description };
    } catch (error) {
        return { error: 'Failed to get bot info' };
    }
}
