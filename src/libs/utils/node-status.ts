/**
 * Node Status Utilities
 * Centralized logic for determining node status
 */

export type NodeStatus = 'online' | 'syncing' | 'offline';

export interface NodeStatusConfig {
  onlineThreshold: number;  // seconds
  syncingThreshold: number; // seconds
}

/**
 * Default status thresholds
 * - Online: last seen <= 60 minutes (3600s)
 * - Syncing: last seen > 60 minutes and < 120 minutes (3600-7200s)
 * - Offline: last seen >= 120 minutes (7200s)
 */
export const DEFAULT_STATUS_CONFIG: NodeStatusConfig = {
  onlineThreshold: 3600,  // 60 minutes
  syncingThreshold: 7200, // 120 minutes (2 hours)
};

/**
 * Calculate node status based on last seen timestamp
 */
export function getNodeStatus(
  lastSeenTimestamp: number,
  referenceTime: number = Math.floor(Date.now() / 1000),
  config: NodeStatusConfig = DEFAULT_STATUS_CONFIG
): NodeStatus {
  const timeDiff = referenceTime - lastSeenTimestamp;

  if (timeDiff <= config.onlineThreshold) {
    return 'online';
  } else if (timeDiff < config.syncingThreshold) {
    return 'syncing';
  } else {
    return 'offline';
  }
}

/**
 * Check if node is online
 */
export function isNodeOnline(
  lastSeenTimestamp: number,
  referenceTime: number = Math.floor(Date.now() / 1000),
  config: NodeStatusConfig = DEFAULT_STATUS_CONFIG
): boolean {
  return getNodeStatus(lastSeenTimestamp, referenceTime, config) === 'online';
}

/**
 * Check if node is syncing
 */
export function isNodeSyncing(
  lastSeenTimestamp: number,
  referenceTime: number = Math.floor(Date.now() / 1000),
  config: NodeStatusConfig = DEFAULT_STATUS_CONFIG
): boolean {
  return getNodeStatus(lastSeenTimestamp, referenceTime, config) === 'syncing';
}

/**
 * Check if node is offline
 */
export function isNodeOffline(
  lastSeenTimestamp: number,
  referenceTime: number = Math.floor(Date.now() / 1000),
  config: NodeStatusConfig = DEFAULT_STATUS_CONFIG
): boolean {
  return getNodeStatus(lastSeenTimestamp, referenceTime, config) === 'offline';
}

/**
 * Get status badge color classes
 */
export function getStatusColorClasses(status: NodeStatus) {
  switch (status) {
    case 'online':
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500/30',
        dot: 'bg-green-400',
      };
    case 'syncing':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        dot: 'bg-amber-400',
      };
    case 'offline':
      return {
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/30',
        dot: 'bg-red-400',
      };
  }
}

/**
 * Get status display text
 */
export function getStatusDisplayText(status: NodeStatus): string {
  switch (status) {
    case 'online':
      return 'Active';
    case 'syncing':
      return 'Syncing';
    case 'offline':
      return 'Offline';
  }
}

/**
 * Calculate time difference in human-readable format
 */
export function formatTimeDiff(seconds: number): string {
  if (seconds < 60) {
    return `${Math.floor(seconds)}s ago`;
  } else if (seconds < 3600) {
    return `${Math.floor(seconds / 60)}m ago`;
  } else if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)}h ago`;
  } else {
    return `${Math.floor(seconds / 86400)}d ago`;
  }
}
