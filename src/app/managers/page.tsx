import { DashboardLayout } from '@/components/layout';
import { getValidatorsData } from '@/libs/server';
import { getDevnetData } from '@/libs/services/devnet-data-service';
import { ManagersPageClient } from './ManagersPageClient';
import type { Metadata } from 'next';
import type { ValidatorData } from '@/libs/server';

export const metadata: Metadata = {
    title: 'Managers - Xandeum Network | XanDash',
    description: 'Browse all Xandeum Managers and their associated nodes.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function transformDevnetNodes(devnetNodes: any[]): ValidatorData[] {
    const now = Math.floor(Date.now() / 1000);
    return devnetNodes.map((node: any, index: number) => {
        const timeDiff = now - (node.last_seen_timestamp || now);
        let status: 'online' | 'syncing' | 'offline' = 'offline';
        if (timeDiff < 1800) status = 'online';
        else if (timeDiff < 3600) status = 'syncing';

        return {
            pubkey: node.pubkey || `devnet-node-${index}`,
            address: node.address || '',
            status,
            score: 0,
            rank: 0,
            uptime: node.uptime || 0,
            storage_committed: node.storage_committed || 0,
            storage_used: node.storage_used || 0,
            storage_usage_percent: node.storage_usage_percent || 0,
            version: node.version || '',
            rpc_port: node.rpc_port || 0,
            is_public: node.is_public || false,
            last_seen_timestamp: node.last_seen_timestamp || 0,
            credits: node.credits,
            isDuplicate: false,
            duplicateCount: 0,
            country: node.country,
            country_code: node.country_code,
            provider: node.provider
        };
    });
}

export default async function ManagersPage() {
    // Fetch Mainnet Data
    const { validators: mainnetValidators, error: mainnetError } = await getValidatorsData();

    // Fetch Devnet Data
    const { nodes: devnetRawNodes } = await getDevnetData();
    const devnetValidators = transformDevnetNodes(devnetRawNodes);

    if (mainnetError) {
        console.error('Error loading Mainnet Managers data:', mainnetError);
    }

    return (
        <DashboardLayout>
            <ManagersPageClient
                mainnetValidators={mainnetValidators}
                devnetValidators={devnetValidators}
            />
        </DashboardLayout>
    );
}

