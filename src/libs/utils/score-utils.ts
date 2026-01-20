
/**
 * Calculates Node Score based on Uptime, Storage, and Online Status
 * Formula:
 * - Uptime (40%): Max 40 points for 30 days (2,592,000 seconds) uptime
 * - Storage (30%): Max 30 points for 100GB (107,374,182,400 bytes) committed
 * - Online (30%): Flat 30 points if last seen < 1 hour (3600s)
 */
export function calculateNodeScore(node: {
    uptime: number;
    storage_committed: number;
    last_seen_timestamp: number;
}, now: number = Math.floor(Date.now() / 1000)): number {
    const timeDiff = now - (node.last_seen_timestamp || now);
    const isOnline = timeDiff <= 3600;

    // Max 40 points for 30 days uptime
    // uptime is assumed to be in seconds
    const uptimeScore = Math.min((node.uptime || 0) / (30 * 24 * 3600), 1) * 40;

    // Max 30 points for 100GB storage
    const storageScore = Math.min((node.storage_committed || 0) / (100 * 1024 ** 3), 1) * 30;

    // 30 points for being online
    const onlineScore = isOnline ? 30 : 0;

    return uptimeScore + storageScore + onlineScore;
}
