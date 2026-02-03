'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useNetwork } from '@/libs/context/network-context';
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
    ManagerAssetsSummary,
} from './components';

interface PodCredit {
    pod_id: string;
    credits: number;
}

interface LocationData {
    country: string;
    country_code: string;
    city: string;
    lat?: number;
    lon?: number;
    region: string;
    provider: string;
    ip: string;
}

interface ManagerProfileClientProps {
    address: string;
    manager: Manager | null;
    mainnetValidators: ValidatorData[];
    devnetValidators: ValidatorData[];
    loading?: boolean;
    error?: string | null;
}

export function ManagerProfileClient({
    address,
    manager,
    mainnetValidators,
    devnetValidators,
    loading = false,
    error = null,
}: ManagerProfileClientProps) {
    const router = useRouter();
    const { isMainnet, network } = useNetwork();
    const [credits, setCredits] = useState<{ [pubkey: string]: number }>({});
    const [locations, setLocations] = useState<{ [ip: string]: LocationData | null }>({});
    const [loadingLocations, setLoadingLocations] = useState(false);

    // Track in-flight requests to prevent duplicates
    const creditsFetchRef = useRef<string | null>(null);
    const locationsFetchRef = useRef<string | null>(null);
    const mountedRef = useRef(true);

    // Select validators based on current network
    const allValidators = useMemo(() => {
        return isMainnet ? mainnetValidators : devnetValidators;
    }, [isMainnet, mainnetValidators, devnetValidators]);

    // Check if manager has any nodes on the current network
    const managerHasNodesOnCurrentNetwork = useMemo(() => {
        if (!manager) return false;

        const networkPubkeys = new Set(allValidators.map(v => v.pubkey));
        return manager.nodes.some(node => networkPubkeys.has(node.pnode_pubkey));
    }, [manager, allValidators]);

    // Cleanup on unmount
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Fetch credits data on mount and when network changes
    useEffect(() => {
        const fetchKey = `${network}-${manager?.manager_address}`;

        const fetchCredits = async () => {
            // Deduplicate: skip if already fetching
            if (creditsFetchRef.current === fetchKey) {
                return;
            }

            creditsFetchRef.current = fetchKey;

            try {
                // Fetch credits for current network only
                const response = await fetch(`/api/pod-credits?network=${network}`).catch(() => null);

                const creditsMap: { [pubkey: string]: number } = {};

                if (response?.ok) {
                    const data = await response.json();
                    if (data.pods_credits && Array.isArray(data.pods_credits)) {
                        data.pods_credits.forEach((pod: PodCredit) => {
                            creditsMap[pod.pod_id] = pod.credits;
                        });
                    }
                }

                if (mountedRef.current && creditsFetchRef.current === fetchKey) {
                    setCredits(creditsMap);
                }
            } catch (error) {
                console.error('Failed to fetch credits:', error);
            } finally {
                if (creditsFetchRef.current === fetchKey) {
                    creditsFetchRef.current = null;
                }
            }
        };

        if (manager && managerHasNodesOnCurrentNetwork) {
            fetchCredits();
        } else {
            // Clear credits when manager has no nodes on current network
            setCredits({});
        }
    }, [manager, network, managerHasNodesOnCurrentNetwork]);

    // Fetch geolocation data for node IPs
    useEffect(() => {
        // Create a unique key for this fetch
        const nodeIPs = manager?.nodes
            .map(node => {
                const validator = allValidators.find(v => v.pubkey === node.pnode_pubkey);
                return validator?.address ? extractIPFromAddress(validator.address) : null;
            })
            .filter((ip): ip is string => ip !== null && ip !== undefined) || [];

        const uniqueIPs = Array.from(new Set(nodeIPs));
        const fetchKey = uniqueIPs.sort().join(',');

        const fetchLocations = async () => {
            if (!manager || allValidators.length === 0 || !managerHasNodesOnCurrentNetwork) {
                setLocations({});
                return;
            }

            // Deduplicate: skip if already fetching same IPs
            if (locationsFetchRef.current === fetchKey || uniqueIPs.length === 0) {
                return;
            }

            locationsFetchRef.current = fetchKey;
            setLoadingLocations(true);

            try {
                const locationData = await getLocationsForIPs(uniqueIPs);

                if (mountedRef.current && locationsFetchRef.current === fetchKey) {
                    setLocations(locationData);
                }
            } catch (error) {
                console.error('Failed to fetch geolocation data:', error);
            } finally {
                if (mountedRef.current && locationsFetchRef.current === fetchKey) {
                    setLoadingLocations(false);
                    locationsFetchRef.current = null;
                }
            }
        };

        fetchLocations();
    }, [manager, allValidators, managerHasNodesOnCurrentNetwork]);

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
        if (!manager || !managerHasNodesOnCurrentNetwork) return [];

        return manager.nodes
            .filter(node => pubkeyToNode.has(node.pnode_pubkey)) // Only include nodes on current network
            .map(node => {
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
    }, [manager, pubkeyToNode, credits, locations, managerHasNodesOnCurrentNetwork]);

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
            avgScore: activeNodes.length > 0
                ? activeNodes.reduce((sum, n) => sum + (n.validator?.score || 0), 0) / activeNodes.length
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

    // Manager not found in JSON data
    if (!manager) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="text-white/60 text-xl mb-4">Manager Not Found</div>
                <div className="text-white/40 text-center mb-6">
                    No manager found with address: <span className="font-mono text-white/60">{address}</span>
                </div>
                <button
                    onClick={() => router.push('/managers')}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                    View All Managers
                </button>
            </div>
        );
    }

    // Manager has no nodes on current network
    if (!managerHasNodesOnCurrentNetwork) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                    <svg className="w-8 h-8 text-white/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4M12 8h.01" />
                    </svg>
                </div>
                <div className="text-white/60 text-xl mb-2">Manager Not Found on {isMainnet ? 'Mainnet' : 'Devnet'}</div>
                <div className="text-white/40 text-center mb-2 max-w-md">
                    Manager <span className="font-mono text-white/60">{address.slice(0, 8)}...{address.slice(-4)}</span> does not have any nodes on {isMainnet ? 'Mainnet' : 'Devnet'}.
                </div>
                <div className="text-white/30 text-sm text-center mb-6">
                    Try switching to {isMainnet ? 'Devnet' : 'Mainnet'} to view this manager&apos;s nodes.
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => router.push('/managers')}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer rounded-lg"
                    >
                        View All Managers
                    </button>
                    <button
                        onClick={() => router.back()}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer rounded-lg border border-white/10"
                    >
                        Go Back
                    </button>
                </div>
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

            {/* Assets Summary (XAND, XENO, NFTs, SBTs) */}
            <ManagerAssetsSummary managerAddress={manager.manager_address} />

            {/* Stats Cards */}
            <ManagerStatsCards stats={stats} />

            {/* Nodes List */}
            <ManagerNodesList nodes={enrichedNodes} />
        </div>
    );
}
