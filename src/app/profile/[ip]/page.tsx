import { DashboardLayout } from '@/components/layout';
import { NodeProfileClient } from './NodeProfileClient';

interface PageProps {
  params: Promise<{ ip: string }>;
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfilePage({ params }: PageProps) {
  const { ip } = await params;
  const decodedIP = decodeURIComponent(ip);

  return (
    <DashboardLayout>
      <NodeProfileClient ip={decodedIP} />
    </DashboardLayout>
  );
}
