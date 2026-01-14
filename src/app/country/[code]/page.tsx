import { DashboardLayout } from '@/components/layout';
import { CountryProfileClient } from './CountryProfileClient';
import { generateMetadata } from './metadata';

interface PageProps {
  params: Promise<{ code: string }>;
}

export { generateMetadata };

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CountryProfilePage({ params }: PageProps) {
  const { code } = await params;
  const decodedCode = decodeURIComponent(code).toLowerCase();

  return (
    <DashboardLayout>
      <CountryProfileClient countryCode={decodedCode} />
    </DashboardLayout>
  );
}
