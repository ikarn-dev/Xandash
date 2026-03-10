'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { getNodeStatus } from '@/libs/utils/node-status';
import type { ValidatorData } from '@/libs/server';

interface UseNodesDataResult {
  allValidators: ValidatorData[];
  dataFetchTime: number;
  stats: {
    total: number;
    online: number;
    public: number;
  };
  isLoadingNetwork: boolean;
  fetchData: (showToast?: boolean) => Promise<void>;
}

export function useNodesData(network: string): UseNodesDataResult {
  const [allValidators, setAllValidators] = useState<ValidatorData[]>([]);
  const [dataFetchTime, setDataFetchTime] = useState<number>(Math.floor(Date.now() / 1000));
  const [stats, setStats] = useState({ total: 0, online: 0, public: 0 });
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(false);
  const [lastNetwork, setLastNetwork] = useState<string | null>(null);

  // Track if this is the initial load
  const isInitialLoad = useRef(true);

  const fetchData = useCallback(async (showToast = false) => {
    try {
      const response = await fetch(`/api/nodes?includeAll=true&network=${network}&_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch nodes');
      }

      const data = await response.json();

      if (data.nodes && Array.isArray(data.nodes)) {
        const serverTime = data.serverTimestamp || Math.floor(Date.now() / 1000);

        // Transform nodes with status calculation
        const allNodes: ValidatorData[] = data.nodes.map((node: any, index: number) => {
          const lastSeenTimestamp = node.last_seen_timestamp || 0;

          const status = getNodeStatus(lastSeenTimestamp, serverTime);

          const isOnline = status === 'online';

          const uptimeScore = Math.min((node.uptime || 0) / (30 * 24 * 3600), 1) * 40;
          const storageScore = Math.min((node.storage_committed || 0) / (100 * 1024 ** 3), 1) * 30;
          const onlineScore = isOnline ? 30 : 0;
          const totalScore = uptimeScore + storageScore + onlineScore;

          return {
            address: node.address || node.ip || '',
            pubkey: node.pubkey || node.pod_id || `validator-${index}-${Date.now()}`,
            is_public: node.is_public || false,
            storage_committed: node.storage_committed || node.storage || 0,
            storage_used: node.storage_used || 0,
            usage_percent: node.usage_percent || 0,
            storage_usage_percent: node.storage_usage_percent || 0,
            rpc_port: node.rpc_port || 0,
            version: node.version || '',
            uptime: node.uptime || 0,
            last_seen_timestamp: lastSeenTimestamp,
            status: status,
            score: totalScore,
            rank: 0,
            duplicateCount: 0,
            isDuplicate: false,
          };
        });

        // Duplicate detection
        const uniqueValidators: ValidatorData[] = [];
        const pubkeyGroups = new Map<string, ValidatorData[]>();
        const addressGroups = new Map<string, ValidatorData[]>();

        allNodes.forEach(validator => {
          const pubkey = validator.pubkey;
          if (!pubkeyGroups.has(pubkey)) {
            pubkeyGroups.set(pubkey, []);
          }
          pubkeyGroups.get(pubkey)!.push(validator);
        });

        allNodes.forEach(validator => {
          const address = validator.address;
          if (!addressGroups.has(address)) {
            addressGroups.set(address, []);
          }
          addressGroups.get(address)!.push(validator);
        });

        const processedValidatorIds = new Set<string>();

        pubkeyGroups.forEach((validators) => {
          if (validators.length > 1) {
            validators.sort((a, b) => b.last_seen_timestamp - a.last_seen_timestamp);
            const mostRecent = validators[0];
            const validatorId = `${mostRecent.pubkey}-${mostRecent.address}`;

            if (!processedValidatorIds.has(validatorId)) {
              mostRecent.isDuplicate = false;
              mostRecent.duplicateCount = validators.length - 1;
              uniqueValidators.push(mostRecent);
              processedValidatorIds.add(validatorId);
            }
          }
        });

        addressGroups.forEach((validators) => {
          if (validators.length > 1) {
            validators.sort((a, b) => b.last_seen_timestamp - a.last_seen_timestamp);
            const mostRecent = validators[0];
            const validatorId = `${mostRecent.pubkey}-${mostRecent.address}`;

            if (!processedValidatorIds.has(validatorId)) {
              mostRecent.isDuplicate = false;
              mostRecent.duplicateCount = validators.length - 1;
              uniqueValidators.push(mostRecent);
              processedValidatorIds.add(validatorId);
            } else {
              const existingValidator = uniqueValidators.find(v => `${v.pubkey}-${v.address}` === validatorId);
              if (existingValidator) {
                existingValidator.duplicateCount = Math.max(existingValidator.duplicateCount || 0, validators.length - 1);
              }
            }
          }
        });

        allNodes.forEach(validator => {
          const validatorId = `${validator.pubkey}-${validator.address}`;
          if (!processedValidatorIds.has(validatorId)) {
            const pubkeyDuplicates = pubkeyGroups.get(validator.pubkey)?.length || 1;
            const addressDuplicates = addressGroups.get(validator.address)?.length || 1;

            if (pubkeyDuplicates === 1 && addressDuplicates === 1) {
              validator.isDuplicate = false;
              validator.duplicateCount = 0;
              uniqueValidators.push(validator);
              processedValidatorIds.add(validatorId);
            }
          }
        });

        uniqueValidators.sort((a, b) => b.score - a.score);
        uniqueValidators.forEach((validator, index) => {
          validator.rank = index + 1;
        });

        const duplicateCount = uniqueValidators.reduce((total, v) => total + (v.duplicateCount || 0), 0);

        // Update data in place to avoid full re-render on refresh
        // Only do full replacement on initial load or network change
        setAllValidators(prevValidators => {
          if (isInitialLoad.current || prevValidators.length === 0) {
            isInitialLoad.current = false;
            return uniqueValidators;
          }

          // Update existing validators in place by matching pubkey
          const updatedValidators = prevValidators.map(prev => {
            const updated = uniqueValidators.find(v => v.pubkey === prev.pubkey);
            if (updated) {
              // Update properties without creating new object reference if values are same
              if (
                prev.status === updated.status &&
                prev.uptime === updated.uptime &&
                prev.last_seen_timestamp === updated.last_seen_timestamp &&
                prev.storage_used === updated.storage_used &&
                prev.storage_usage_percent === updated.storage_usage_percent &&
                prev.score === updated.score &&
                prev.rank === updated.rank
              ) {
                return prev; // No changes, keep same reference
              }
              // Return updated object
              return { ...prev, ...updated };
            }
            return prev;
          });

          // Add any new validators
          const existingPubkeys = new Set(prevValidators.map(v => v.pubkey));
          const newValidators = uniqueValidators.filter(v => !existingPubkeys.has(v.pubkey));

          // Remove validators that no longer exist
          const currentPubkeys = new Set(uniqueValidators.map(v => v.pubkey));
          const filteredValidators = updatedValidators.filter(v => currentPubkeys.has(v.pubkey));

          if (newValidators.length > 0) {
            return [...filteredValidators, ...newValidators];
          }

          return filteredValidators;
        });

        setDataFetchTime(serverTime);

        const newStats = {
          total: uniqueValidators.length,
          online: uniqueValidators.filter(v => v.status === 'online').length,
          public: uniqueValidators.filter(v => v.is_public).length,
        };
        setStats(newStats);

        if (showToast) {
          toast.success(`Updated ${uniqueValidators.length} pNodes (${duplicateCount} duplicates)`);
        }
      }
    } catch (error) {
      console.error('Auto-refresh failed:', error);
    }
  }, [network]);

  // Refetch data when network changes
  useEffect(() => {
    if (lastNetwork === null || network !== lastNetwork) {
      isInitialLoad.current = true; // Reset for network change
      setIsLoadingNetwork(true);
      setLastNetwork(network);
      if (lastNetwork !== null) {
        setAllValidators([]);
      }
      fetchData(false).finally(() => {
        setIsLoadingNetwork(false);
      });
    }
  }, [network, lastNetwork, fetchData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    allValidators,
    dataFetchTime,
    stats,
    isLoadingNetwork,
    fetchData,
  };
}
