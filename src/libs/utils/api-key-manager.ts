/**
 * API Key Manager with Backup Failover Support
 * 
 * This utility manages API keys for external services (OpenRouter, Helius)
 * with automatic failover to backup keys when rate limits are hit.
 * 
 * Features:
 * - Primary and backup API keys (up to 9 backups for Helius, 3 for OpenRouter)
 * - Automatic failover when rate limits are detected
 * - Automatic recovery to primary key after reset period
 * - In-memory state tracking per service
 */

export interface ApiKeyConfig {
    primary: string;
    backups: string[];
}

export interface ApiKeyState {
    currentKeyIndex: number; // 0 = primary, 1-3 = backup keys
    lastFailureTime: number;
    failureCount: number;
    isPrimaryDisabled: boolean;
    primaryDisabledAt: number;
}

// Rate limit reset duration (in milliseconds)
// Primary key will be re-enabled after this duration
const PRIMARY_RESET_DURATION = 60 * 1000; // 1 minute - check if primary is available again

// How long to wait before retrying a failed key
const KEY_COOLDOWN_DURATION = 30 * 1000; // 30 seconds

// In-memory state for each service
const serviceStates: Map<string, ApiKeyState> = new Map();

/**
 * Get OpenRouter API keys from environment variables
 */
export function getOpenRouterKeys(): ApiKeyConfig {
    const primary = process.env.OPENROUTER_API_KEY || '';
    const backups = [
        process.env.OPENROUTER_API_KEY_BACKUP_1 || '',
        process.env.OPENROUTER_API_KEY_BACKUP_2 || '',
        process.env.OPENROUTER_API_KEY_BACKUP_3 || '',
    ].filter(key => key.length > 0);

    return { primary, backups };
}

/**
 * Get Helius API keys from environment variables
 */
export function getHeliusKeys(): ApiKeyConfig {
    const primary = process.env.HELIUS_API_KEY || '';
    const backups = [
        process.env.HELIUS_API_KEY_2 || '',
        process.env.HELIUS_API_KEY_BACKUP_1 || '',
        process.env.HELIUS_API_KEY_BACKUP_2 || '',
        process.env.HELIUS_API_KEY_BACKUP_3 || '',
        process.env.HELIUS_API_KEY_BACKUP_4 || '',
        process.env.HELIUS_API_KEY_BACKUP_5 || '',
        process.env.HELIUS_API_KEY_BACKUP_6 || '',
        process.env.HELIUS_API_KEY_BACKUP_7 || '',
        process.env.HELIUS_API_KEY_BACKUP_8 || '',
    ].filter(key => key.length > 0);

    return { primary, backups };
}

/**
 * Get or initialize state for a service
 */
function getServiceState(serviceName: string): ApiKeyState {
    if (!serviceStates.has(serviceName)) {
        serviceStates.set(serviceName, {
            currentKeyIndex: 0,
            lastFailureTime: 0,
            failureCount: 0,
            isPrimaryDisabled: false,
            primaryDisabledAt: 0,
        });
    }
    return serviceStates.get(serviceName)!;
}

/**
 * Get all available keys as an array (primary first, then backups)
 */
function getAllKeys(config: ApiKeyConfig): string[] {
    const keys: string[] = [];
    if (config.primary) keys.push(config.primary);
    keys.push(...config.backups);
    return keys;
}

/**
 * Check if we should try to restore primary key
 */
function shouldRestorePrimary(state: ApiKeyState): boolean {
    if (!state.isPrimaryDisabled) return false;

    const timeSinceDisabled = Date.now() - state.primaryDisabledAt;
    return timeSinceDisabled >= PRIMARY_RESET_DURATION;
}

/**
 * Get the current active API key for a service
 */
export function getActiveApiKey(serviceName: 'openrouter' | 'helius'): string {
    const config = serviceName === 'openrouter' ? getOpenRouterKeys() : getHeliusKeys();
    const state = getServiceState(serviceName);
    const allKeys = getAllKeys(config);

    if (allKeys.length === 0) {
        console.warn(`[ApiKeyManager] No API keys configured for ${serviceName}`);
        return '';
    }

    // Check if we should restore primary key
    if (shouldRestorePrimary(state)) {
        console.log(`[ApiKeyManager] Attempting to restore primary key for ${serviceName}`);
        state.currentKeyIndex = 0;
        state.isPrimaryDisabled = false;
        state.failureCount = 0;
    }

    // Ensure current index is valid
    if (state.currentKeyIndex >= allKeys.length) {
        state.currentKeyIndex = 0;
    }

    return allKeys[state.currentKeyIndex];
}

/**
 * Report that the current API key has hit a rate limit
 * This will switch to the next available backup key
 */
export function reportRateLimitHit(serviceName: 'openrouter' | 'helius'): boolean {
    const config = serviceName === 'openrouter' ? getOpenRouterKeys() : getHeliusKeys();
    const state = getServiceState(serviceName);
    const allKeys = getAllKeys(config);

    state.failureCount++;
    state.lastFailureTime = Date.now();

    // If primary key failed, mark it as disabled
    if (state.currentKeyIndex === 0) {
        state.isPrimaryDisabled = true;
        state.primaryDisabledAt = Date.now();
        console.log(`[ApiKeyManager] Primary key disabled for ${serviceName}, will retry in ${PRIMARY_RESET_DURATION / 1000}s`);
    }

    // Try to switch to next backup key
    const nextIndex = state.currentKeyIndex + 1;
    if (nextIndex < allKeys.length) {
        state.currentKeyIndex = nextIndex;
        console.log(`[ApiKeyManager] Switched ${serviceName} to backup key ${nextIndex}`);
        return true;
    }

    // No more backup keys available, cycle back but keep primary disabled if it was
    if (state.isPrimaryDisabled && allKeys.length > 1) {
        state.currentKeyIndex = 1; // Start from first backup
        console.log(`[ApiKeyManager] Cycled back to first backup for ${serviceName}`);
        return true;
    } else if (!state.isPrimaryDisabled) {
        state.currentKeyIndex = 0;
        console.log(`[ApiKeyManager] No backups available for ${serviceName}, staying on primary`);
        return false;
    }

    console.warn(`[ApiKeyManager] All keys exhausted for ${serviceName}`);
    return false;
}

/**
 * Report successful API call - this resets failure count
 * If primary is currently disabled and cooldown has passed, this triggers a check
 */
export function reportSuccess(serviceName: 'openrouter' | 'helius'): void {
    const state = getServiceState(serviceName);
    state.failureCount = 0;
}

/**
 * Force reset state for a service (useful for testing or manual intervention)
 */
export function resetServiceState(serviceName: 'openrouter' | 'helius'): void {
    serviceStates.set(serviceName, {
        currentKeyIndex: 0,
        lastFailureTime: 0,
        failureCount: 0,
        isPrimaryDisabled: false,
        primaryDisabledAt: 0,
    });
    console.log(`[ApiKeyManager] Reset state for ${serviceName}`);
}

/**
 * Get current key status for monitoring/debugging
 */
export function getKeyStatus(serviceName: 'openrouter' | 'helius'): {
    currentKeyIndex: number;
    totalKeys: number;
    isPrimaryActive: boolean;
    isPrimaryDisabled: boolean;
    timeSincePrimaryDisabled: number | null;
    failureCount: number;
} {
    const config = serviceName === 'openrouter' ? getOpenRouterKeys() : getHeliusKeys();
    const state = getServiceState(serviceName);
    const allKeys = getAllKeys(config);

    return {
        currentKeyIndex: state.currentKeyIndex,
        totalKeys: allKeys.length,
        isPrimaryActive: state.currentKeyIndex === 0,
        isPrimaryDisabled: state.isPrimaryDisabled,
        timeSincePrimaryDisabled: state.isPrimaryDisabled
            ? Date.now() - state.primaryDisabledAt
            : null,
        failureCount: state.failureCount,
    };
}

/**
 * Check if an API response indicates a rate limit error
 * Common rate limit indicators for OpenRouter and Helius
 */
export function isRateLimitError(response: Response | null, error?: Error | unknown): boolean {
    if (!response && !error) return false;

    // Check HTTP status codes indicating rate limits
    if (response) {
        const rateLimitStatuses = [429, 402, 503]; // Too Many Requests, Payment Required, Service Unavailable
        if (rateLimitStatuses.includes(response.status)) {
            return true;
        }
    }

    // Check error messages for rate limit indicators
    if (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const rateLimitIndicators = [
            'rate limit',
            'rate_limit',
            'ratelimit',
            'too many requests',
            'quota exceeded',
            'credits exhausted',
            'insufficient credits',
            'payment required',
        ];

        const lowerMessage = errorMessage.toLowerCase();
        return rateLimitIndicators.some(indicator => lowerMessage.includes(indicator));
    }

    return false;
}

/**
 * Wrapper for making API calls with automatic failover
 * @param serviceName - The service to use (openrouter or helius)
 * @param makeRequest - Function that makes the actual request, receives the API key
 * @param maxRetries - Maximum number of retries across all keys (default: total keys)
 */
export async function withApiKeyFailover<T>(
    serviceName: 'openrouter' | 'helius',
    makeRequest: (apiKey: string) => Promise<{ response: Response; data: T }>,
    maxRetries?: number
): Promise<{ response: Response; data: T }> {
    const config = serviceName === 'openrouter' ? getOpenRouterKeys() : getHeliusKeys();
    const allKeys = getAllKeys(config);
    const retries = maxRetries ?? allKeys.length;

    for (let attempt = 0; attempt < retries; attempt++) {
        const apiKey = getActiveApiKey(serviceName);

        if (!apiKey) {
            throw new Error(`No API key available for ${serviceName}`);
        }

        try {
            const result = await makeRequest(apiKey);

            // Check if response indicates rate limit
            if (isRateLimitError(result.response)) {
                console.log(`[ApiKeyManager] Rate limit detected for ${serviceName} on attempt ${attempt + 1}`);
                const switched = reportRateLimitHit(serviceName);
                if (!switched || attempt >= retries - 1) {
                    throw new Error(`Rate limit exceeded for ${serviceName}, no more backup keys available`);
                }
                continue;
            }

            // Success
            reportSuccess(serviceName);
            return result;

        } catch (error) {
            // Check if error indicates rate limit
            if (isRateLimitError(null, error)) {
                console.log(`[ApiKeyManager] Rate limit error for ${serviceName} on attempt ${attempt + 1}`);
                const switched = reportRateLimitHit(serviceName);
                if (!switched || attempt >= retries - 1) {
                    throw error;
                }
                continue;
            }

            // Other errors - don't switch keys, just throw
            throw error;
        }
    }

    throw new Error(`All retries exhausted for ${serviceName}`);
}

/**
 * Get Helius RPC URL with the currently active API key
 */
export function getHeliusRpcUrl(): string {
    const apiKey = getActiveApiKey('helius');
    if (!apiKey) {
        console.warn('[ApiKeyManager] No Helius API key available');
        return 'https://mainnet.helius-rpc.com';
    }
    return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
}

/**
 * Get Helius RPC URL with a specific key index (for parallel requests)
 * This allows making parallel requests using different API keys
 */
export function getHeliusRpcUrlByIndex(index: number): string {
    const config = getHeliusKeys();
    const allKeys = getAllKeys(config);

    if (allKeys.length === 0) {
        console.warn('[ApiKeyManager] No Helius API keys available');
        return 'https://mainnet.helius-rpc.com';
    }

    // Use modulo to wrap around if index exceeds available keys
    const keyIndex = index % allKeys.length;
    const apiKey = allKeys[keyIndex];

    return `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
}

/**
 * Get the total number of available Helius API keys
 */
export function getHeliusKeyCount(): number {
    const config = getHeliusKeys();
    return getAllKeys(config).length;
}

/**
 * Get all Helius RPC URLs for parallel request distribution
 */
export function getAllHeliusRpcUrls(): string[] {
    const config = getHeliusKeys();
    const allKeys = getAllKeys(config);

    return allKeys.map(key => `https://mainnet.helius-rpc.com/?api-key=${key}`);
}
