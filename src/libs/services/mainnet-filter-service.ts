/**
 * Mainnet Filter Service
 * Handles filtering devnet nodes to show only mainnet nodes
 */

import { getCreditsApiUrl } from './network-service';

export interface PodCredit {
  pod_id: string;
  credits: number;
}

export interface MainnetCreditsResponse {
  pods_credits: PodCredit[];
  status: string;
}

/**
 * Fetch mainnet pubkeys from credits API
 * Returns a Map of pubkey -> credits for quick lookup
 */
export async function fetchMainnetPubkeys(): Promise<Map<string, number>> {
  try {
    const mainnetCreditsUrl = getCreditsApiUrl('mainnet');
    
    console.log('[Mainnet Filter] Fetching pubkeys from:', mainnetCreditsUrl);
    
    const response = await fetch(mainnetCreditsUrl, {
      headers: { 'User-Agent': 'XanDash/1.0' },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('[Mainnet Filter] API error:', response.status);
      return new Map();
    }

    const data: MainnetCreditsResponse = await response.json();
    
    if (!data.pods_credits || !Array.isArray(data.pods_credits)) {
      console.error('[Mainnet Filter] Invalid response structure:', data);
      return new Map();
    }

    const pubkeyMap = new Map<string, number>();
    data.pods_credits.forEach(pod => {
      pubkeyMap.set(pod.pod_id, pod.credits);
    });
    
    console.log('[Mainnet Filter] Loaded pubkeys:', pubkeyMap.size);
    
    return pubkeyMap;
  } catch (error) {
    console.error('[Mainnet Filter] Failed to fetch mainnet pubkeys:', error);
    return new Map();
  }
}

/**
 * Filter nodes to only include mainnet nodes
 * Enriches nodes with mainnet_credits and is_mainnet fields
 */
export function filterMainnetNodes<T extends { pubkey: string }>(
  nodes: T[],
  mainnetPubkeys: Map<string, number>
): Array<T & { mainnet_credits: number; is_mainnet: boolean }> {
  console.log('[Mainnet Filter] Filtering nodes:', {
    totalNodes: nodes.length,
    mainnetPubkeys: mainnetPubkeys.size
  });
  
  const filtered = nodes
    .filter(node => mainnetPubkeys.has(node.pubkey))
    .map(node => ({
      ...node,
      mainnet_credits: mainnetPubkeys.get(node.pubkey) || 0,
      is_mainnet: true
    }));
  
  console.log('[Mainnet Filter] Filtered result:', filtered.length, 'nodes');
  
  return filtered;
}

/**
 * Check if a node is a mainnet node
 */
export function isMainnetNode(pubkey: string, mainnetPubkeys: Map<string, number>): boolean {
  return mainnetPubkeys.has(pubkey);
}
