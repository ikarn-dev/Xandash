'use client';

import type { ValidatorData } from '@/libs/server';

// Manager node from JSON data
export interface ManagerNode {
    pnode_pubkey: string;
    registered_time: string;
    node_label: string;
}

// Manager data from JSON
export interface Manager {
    manager_index: number;
    manager_address: string;
    nodes: ManagerNode[];
}

// Enriched node data with live validator info
export interface EnrichedNodeData {
    pnode_pubkey: string;
    registered_time: string;
    node_label: string;
    validator?: ValidatorData;
    isOnline: boolean;
    ip?: string;
}

// Manager profile data with enriched nodes
export interface ManagerProfileData {
    manager: Manager;
    enrichedNodes: EnrichedNodeData[];
    stats: ManagerStats;
}

// Manager statistics
export interface ManagerStats {
    totalNodes: number;
    activeNodes: number;
    totalStorage: number;
    usedStorage: number;
    totalCredits: number;
    avgUptime: number;
}
