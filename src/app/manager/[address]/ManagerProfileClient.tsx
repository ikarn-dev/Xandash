'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ValidatorData } from '@/libs/server';
import { getLocationsForIPs, extractIPFromAddress } from '@/libs/services/geolocation';
import {
    Manager,
    EnrichedNodeData,
    ManagerStats,
    ManagerProfileHeader,
    ManagerStatsCards,
    ManagerNodesList,
    ManagerProfileSkeleton,
    ManagerWalletAssets,
} from './components';

interface PodCredit {
    pod_id: string;
    credits: number;
}

interface LocationData {
    country: string;
    country_code: string;
    city: string;
    lat: number;
    lon: number;
    region: string;
    provider: string;
    ip: string;
}

interface ManagerProfileClientProps {
    address: string;
    manager: Manager | null;
    allValidators: ValidatorData[];
    loading?: boolean;
    error?: string | null;
}

export function ManagerProfileClient({
    address,
    manager,
    allValidators,
    loading = false,
    error = null,
}: ManagerProfileClientProps) {
    const router = useRouter();
    const [credits, setCredits] = useState<{ [pubkey: string]: number }>({});
    const [locations, setLocations] = useState<{ [ip: string]: LocationData | null }>({});
    const [loadingLocations, setLoadingLocations] = useState(false);

    // Fetch credits data on mount
    useEffect(() => {
        const fetchCredits = async () => {
            try {
                // Fetch from both networks
                const [devnetRes, mainnetRes] = await Promise.all([
                    fetch('/api/pod-credits?network=devnet').catch(() => null),
                    fetch('/api/pod-credits?network=mainnet').catch(() => null),
                ]);

                const creditsMap: { [pubkey: string]: number } = {};

                if (devnetRes?.ok) {
                    const data = await devnetRes.json();
                    if (data.pods_credits && Array.isArray(data.pods_credits)) {
                        data.pods_credits.forEach((pod: PodCredit) => {
                            creditsMap[pod.pod_id] = pod.credits;
                        });
                    }
                }

                if (mainnetRes?.ok) {
                    const data = await mainnetRes.json();
                    if (data.pods_credits && Array.isArray(data.pods_credits)) {
                        data.pods_credits.forEach((pod: PodCredit) => {
                            // Merge, mainnet takes precedence if duplicate
                            if (!creditsMap[pod.pod_id]) {
                                creditsMap[pod.pod_id] = pod.credits;
                            }
                        });
                    }
                }

                setCredits(creditsMap);
            } catch (error) {
                console.error('Failed to fetch credits:', error);
            }
        };

        if (manager) {
            fetchCredits();
        }
    }, [manager]);

    // Fetch geolocation data for node IPs
    useEffect(() => {
        const fetchLocations = async () => {
            if (!manager || allValidators.length === 0) return;

            setLoadingLocations(true);
            try {
                // Get unique IPs from validators that match manager's nodes
                const nodeIPs = manager.nodes
                    .map(node => {
                        const validator = allValidators.find(v => v.pubkey === node.pnode_pubkey);
                        return validator?.address ? extractIPFromAddress(validator.address) : null;
                    })
                    .filter((ip): ip is string => ip !== null && ip !== undefined);

                const uniqueIPs = Array.from(new Set(nodeIPs));

                if (uniqueIPs.length > 0) {
                    const locationData = await getLocationsForIPs(uniqueIPs);
                    setLocations(locationData);
                }
            } catch (error) {
                console.error('Failed to fetch geolocation data:', error);
            } finally {
                setLoadingLocations(false);
            }
        };

        fetchLocations();
    }, [manager, allValidators]);

    // Create pubkey → validator map for O(1) lookup
    const pubkeyToNode = useMemo(() => {
        const map = new Map<string, ValidatorData>();
        allValidators.forEach(v => {
            if (v.pubkey) map.set(v.pubkey, v);
        });
        return map;
    }, [allValidators]);

    // Enrich nodes with validator data, credits, and location
    const enrichedNodes = useMemo((): EnrichedNodeData[] => {
        if (!manager) return [];

        return manager.nodes.map(node => {
            const validator = pubkeyToNode.get(node.pnode_pubkey);
            const ip = validator?.address?.split(':')[0];

            // Get location data for this IP
            const locationData = ip ? locations[ip] : null;

            // Merge credits data
            const nodeCredits = credits[node.pnode_pubkey] || validator?.credits || 0;
            const enrichedValidator = validator ? {
                ...validator,
                credits: nodeCredits,
                // Add location data to validator
                country: locationData?.country || validator.country,
                country_code: locationData?.country_code || validator.country_code,
            } : undefined;

            return {
                ...node,
                validator: enrichedValidator,
                isOnline: !!validator,
                ip,
            };
        });
    }, [manager, pubkeyToNode, credits, locations]);

    // Calculate stats from enriched nodes
    const stats = useMemo((): ManagerStats => {
        const activeNodes = enrichedNodes.filter(n => n.isOnline);

        return {
            totalNodes: enrichedNodes.length,
            activeNodes: activeNodes.length,
            totalStorage: activeNodes.reduce((sum, n) => sum + (n.validator?.storage_committed || 0), 0),
            usedStorage: activeNodes.reduce((sum, n) => sum + (n.validator?.storage_used || 0), 0),
            totalCredits: activeNodes.reduce((sum, n) => sum + (n.validator?.credits || 0), 0),
            avgUptime: activeNodes.length > 0
                ? activeNodes.reduce((sum, n) => sum + (n.validator?.uptime || 0), 0) / activeNodes.length
                : 0,
        };
    }, [enrichedNodes]);

    // Loading state
    if (loading) {
        return <ManagerProfileSkeleton />;
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="text-red-400 text-xl mb-4">Error</div>
                <div className="text-white/60 text-center mb-6">{error}</div>
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                    Go Back
                </button>
            </div>
        );
    }

    // Not found state
    if (!manager) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="text-white/60 text-xl mb-4">Manager Not Found</div>
                <div className="text-white/40 text-center mb-6">
                    No manager found with address: <span className="font-mono text-white/60">{address}</span>
                </div>
                <button
                    onClick={() => router.push('/nodes')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                    View All Nodes
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-full overflow-hidden space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Header */}
            <ManagerProfileHeader
                manager={manager}
                stats={stats}
            />

            {/* Stats Cards */}
            <ManagerStatsCards stats={stats} />

            {/* Wallet Assets (SOL, Tokens, NFTs) */}
            <ManagerWalletAssets walletAddress={manager.manager_address} />

            {/* Nodes List */}
            <ManagerNodesList nodes={enrichedNodes} />
        </div>
    );
}
