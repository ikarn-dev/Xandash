import { DashboardLayout } from '@/components/layout';
import { XandInfoClient } from './XandInfoClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'XAND Token - Price, Market Cap & Analytics | XanDash',
  description: 'Live XAND token price, market cap, 24h volume, and price charts. Track Xandeum native token performance with real-time CoinGecko data.',
  keywords: ['XAND token', 'Xandeum token', 'crypto price', 'market cap', 'token analytics', 'cryptocurrency'],
  openGraph: {
    title: 'XAND Token - Price, Market Cap & Analytics',
    description: 'Live XAND token price, market cap, and analytics with real-time data.',
    url: 'https://www.xandash.online/xand',
  },
  alternates: {
    canonical: 'https://www.xandash.online/xand',
  },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function XandPage() {
  return (
    <DashboardLayout>
      <XandInfoClient />
    </DashboardLayout>
  );
}
