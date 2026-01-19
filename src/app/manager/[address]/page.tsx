import { DashboardLayout } from '@/components/layout';
import { getDevnetData } from '@/libs/services/devnet-data-service';
import { getMainnetData } from '@/libs/services/mainnet-data-service';
import { ManagerProfileClient } from './ManagerProfileClient';
import { ToastDismisser } from '@/components/ui/ToastDismisser';
import type { Metadata } from 'next';
import type { ValidatorData } from '@/libs/server';

// Import managers data
import managersData from '../../../../managers_data/managers_node_data.json';

interface ManagersDataType {
    summary: {
        total_managers: number;
        total_pnode_pubkeys: number;
    };
    managers: {
        manager_index: number;
        manager_address: string;
        nodes: {
            pnode_pubkey: string;
            registered_time: string;
            node_label: string;
        }[];
    }[];
}

interface PageProps {
    params: Promise<{ address: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { address } = await params;
    const data = managersData as ManagersDataType;
    const manager = data.managers.find(m => m.manager_address === address);

    const title = manager
        ? `Manager #${manager.manager_index} - ${address.slice(0, 8)}...${address.slice(-4)} | XanDash`
        : `Manager ${address.slice(0, 8)}... | XanDash`;

    const description = manager
        ? `View details for Manager #${manager.manager_index} with ${manager.nodes.length} registered nodes on Xandeum Network.`
        : `View manager profile on Xandeum Network.`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `https://www.xandash.online/manager/${address}`,
        },
        alternates: {
            canonical: `https://www.xandash.online/manager/${address}`,
        },
    };
}

// Enable SSR with revalidation
export const revalidate = 30;

export default async function ManagerProfilePage({ params }: PageProps) {
    const { address } = await params;
    const decodedAddress = decodeURIComponent(address);

    // Get manager data from JSON
    const data = managersData as ManagersDataType;
    const manager = data.managers.find(m => m.manager_address === decodedAddress) || null;

    // Fetch from both devnet and mainnet networks
    const [devnetData, mainnetData] = await Promise.all([
        getDevnetData().catch(() => ({ nodes: [] })),
        getMainnetData().catch(() => ({ nodes: [] })),
    ]);

    // Transform nodes to ValidatorData format
    const now = Math.floor(Date.now() / 1000);
    const transformNodes = (nodes: any[]): ValidatorData[] => {
        return nodes.map((node, index) => {
            const timeDiff = now - (node.last_seen_timestamp || 0);
            // Same status logic as used in ManagersView
            let status: 'online' | 'syncing' | 'offline' = 'offline';
            if (timeDiff < 1800) status = 'online';        // Less than 30 minutes
            else if (timeDiff < 3600) status = 'syncing'; // 30-60 minutes

            return {
                pubkey: node.pubkey,
                address: node.address,
                status,
                score: 0,
                rank: index + 1,
                uptime: node.uptime || 0,
                storage_committed: node.storage_committed || 0,
                version: node.version || '',
                rpc_port: node.rpc_port || 0,
                is_public: node.is_public || false,
                last_seen_timestamp: node.last_seen_timestamp || 0,
                storage_used: node.storage_used || 0,
                storage_usage_percent: node.storage_usage_percent || 0,
                credits: node.credits || 0,
                // Include location data from mainnet
                country: node.country,
                country_code: node.country_code,
            };
        });
    };

    // Merge validators from both networks, create map with pubkey as key
    const devnetValidators = transformNodes(devnetData.nodes || []);
    const mainnetValidators = transformNodes(mainnetData.nodes || []);

    const validatorMap = new Map<string, ValidatorData>();
    mainnetValidators.forEach(v => validatorMap.set(v.pubkey, v));
    devnetValidators.forEach(v => validatorMap.set(v.pubkey, v)); // Devnet takes precedence

    const allValidators = Array.from(validatorMap.values());

    if (allValidators.length === 0) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-red-400">Error loading network data. Please try again later.</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <ToastDismisser toastId="node-profile-loading" />
            <ManagerProfileClient
                address={decodedAddress}
                manager={manager}
                allValidators={allValidators}
            />
        </DashboardLayout>
    );
}
