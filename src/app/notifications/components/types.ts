// Type definitions for the notifications page

export interface User {
    email: string;
    telegramChatId?: string;
    telegramVerified: boolean;
}

export interface NodeBinding {
    nodeIp: string;
    network: string;
    pubkey?: string;
    testUsed: boolean;
    status?: string;
    uptime?: number;
    version?: string;
    credits?: number;
}

export interface SessionData {
    authenticated: boolean;
    user?: User;
    bindings?: NodeBinding[];
    csrfToken?: string;
}
