/**
 * Node Statistics Utilities
 * Centralized calculations for node statistics
 */

import { getNodeStatus, DEFAULT_STATUS_CONFIG, type NodeStatus } from './node-status';

export interface NodeData {
  pubkey: string;
  last_seen_timestamp: number;
  uptime?: number;
  storage_committed?: number;
  storage_used?: number;
  is_public?: boolean;
  version?: string;
}

export interface NodeStats {
  total: number;
  online: number;
  syncing: number;
  offline: number;
  public: number;
  private: number;
  onlinePercentage: number;
}

export interface StorageStats {
  totalCommitted: number;
  totalUsed: number;
  usagePercentage: number;
  averageCommitted: number;
  averageUsed: number;
}

export interface UptimeStats {
  averageUptime: number;
  maxUptime: number;
  minUptime: number;
  medianUptime: number;
}

export interface VersionStats {
  totalVersions: number;
  latestVersion: string;
  versionDistribution: Array<{
    version: string;
    count: number;
    percentage: number;
    isLatest: boolean;
  }>;
}

/**
 * Calculate comprehensive node statistics
 */
export function calculateNodeStats(
  nodes: NodeData[],
  referenceTime: number = Math.floor(Date.now() / 1000)
): NodeStats {
  const total = nodes.length;
  
  let online = 0;
  let syncing = 0;
  let offline = 0;
  let publicCount = 0;
  
  nodes.forEach(node => {
    const status = getNodeStatus(node.last_seen_timestamp, referenceTime);
    
    if (status === 'online') online++;
    else if (status === 'syncing') syncing++;
    else offline++;
    
    if (node.is_public) publicCount++;
  });
  
  return {
    total,
    online,
    syncing,
    offline,
    public: publicCount,
    private: total - publicCount,
    onlinePercentage: total > 0 ? (online / total) * 100 : 0,
  };
}

/**
 * Calculate storage statistics
 */
export function calculateStorageStats(nodes: NodeData[]): StorageStats {
  const totalCommitted = nodes.reduce((sum, node) => sum + (node.storage_committed || 0), 0);
  const totalUsed = nodes.reduce((sum, node) => sum + (node.storage_used || 0), 0);
  
  return {
    totalCommitted,
    totalUsed,
    usagePercentage: totalCommitted > 0 ? (totalUsed / totalCommitted) * 100 : 0,
    averageCommitted: nodes.length > 0 ? totalCommitted / nodes.length : 0,
    averageUsed: nodes.length > 0 ? totalUsed / nodes.length : 0,
  };
}

/**
 * Calculate uptime statistics
 */
export function calculateUptimeStats(nodes: NodeData[]): UptimeStats {
  const uptimes = nodes.map(node => node.uptime || 0).filter(u => u > 0);
  
  if (uptimes.length === 0) {
    return {
      averageUptime: 0,
      maxUptime: 0,
      minUptime: 0,
      medianUptime: 0,
    };
  }
  
  const sorted = [...uptimes].sort((a, b) => a - b);
  const sum = uptimes.reduce((a, b) => a + b, 0);
  
  return {
    averageUptime: sum / uptimes.length,
    maxUptime: Math.max(...uptimes),
    minUptime: Math.min(...uptimes),
    medianUptime: sorted[Math.floor(sorted.length / 2)],
  };
}

/**
 * Calculate version distribution statistics
 */
export function calculateVersionStats(nodes: NodeData[]): VersionStats {
  const versionCounts = new Map<string, number>();
  
  nodes.forEach(node => {
    const version = node.version || 'unknown';
    versionCounts.set(version, (versionCounts.get(version) || 0) + 1);
  });
  
  const totalNodes = nodes.length;
  const versionEntries = Array.from(versionCounts.entries());
  
  // Sort by count (highest first) - Latest = most nodes
  const sortedByCount = versionEntries.sort(([, a], [, b]) => b - a);
  const latestVersion = sortedByCount[0]?.[0] || 'unknown';
  
  const versionDistribution = sortedByCount.map(([version, count]) => ({
    version,
    count,
    percentage: (count / totalNodes) * 100,
    isLatest: version === latestVersion && version !== 'unknown',
  }));
  
  return {
    totalVersions: versionCounts.size,
    latestVersion,
    versionDistribution,
  };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
}

/**
 * Format uptime to human-readable string
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Format number with locale-specific separators
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}
