/**
 * Network Service - Centralized network configuration and utilities
 * Handles mainnet vs devnet specific logic
 */

export type NetworkType = 'devnet' | 'mainnet';

export interface NetworkConfig {
  name: string;
  displayName: string;
  color: string;
  glowColor: string;
  badgeColor: string;
  creditsApiUrl: string;
  apiUrl: string;
}

/**
 * Network configurations
 * All URLs from environment variables - no hardcoding
 * Note: These are evaluated at module load time
 */
export const NETWORK_CONFIGS: Record<NetworkType, NetworkConfig> = {
  devnet: {
    name: 'devnet',
    displayName: 'Devnet',
    color: 'green',
    glowColor: 'rgba(74,222,128,0.8)',
    badgeColor: 'bg-green-500/20 text-green-400 border-green-500/30',
    creditsApiUrl: process.env.NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL || '',
    apiUrl: process.env.DEVNET_API_URL || '',
  },
  mainnet: {
    name: 'mainnet',
    displayName: 'Mainnet',
    color: 'blue',
    glowColor: 'rgba(59,130,246,0.8)',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    creditsApiUrl: process.env.NEXT_PUBLIC_POD_CREDITS_MAINNET_URL || '',
    apiUrl: '', // Mainnet uses external data sources only
  },
};

/**
 * Get network configuration
 */
export function getNetworkConfig(network: NetworkType): NetworkConfig {
  return NETWORK_CONFIGS[network];
}

/**
 * Get credits API URL for network
 * Reads directly from env to ensure fresh value
 */
export function getCreditsApiUrl(network: NetworkType): string {
  if (network === 'mainnet') {
    return process.env.NEXT_PUBLIC_POD_CREDITS_MAINNET_URL || '';
  }
  return process.env.NEXT_PUBLIC_POD_CREDITS_EXTERNAL_URL || '';
}

/**
 * Get API URL for network
 */
export function getApiUrl(network: NetworkType): string {
  return NETWORK_CONFIGS[network].apiUrl;
}

/**
 * Check if network is mainnet
 */
export function isMainnetNetwork(network: NetworkType): boolean {
  return network === 'mainnet';
}

/**
 * Get network display color classes
 */
export function getNetworkColorClasses(network: NetworkType) {
  const config = NETWORK_CONFIGS[network];
  return {
    badge: config.badgeColor,
    dot: `bg-${config.color}-400`,
    glow: `shadow-[0_0_6px_${config.glowColor}]`,
    text: `text-${config.color}-400`,
    border: `border-${config.color}-500/30`,
  };
}

/**
 * Storage keys for network-specific data
 */
export const STORAGE_KEYS = {
  network: 'xandash_network',
  bookmarks: (network: NetworkType) => `leaderboard_bookmarks_${network}`,
  filters: (network: NetworkType) => `node_filters_${network}`,
} as const;
