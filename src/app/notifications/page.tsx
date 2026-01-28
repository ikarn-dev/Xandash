import { Suspense } from 'react';
import NotificationsPageClient from './NotificationsPageClient';
import { Metadata } from 'next';
import { DashboardLayout } from '@/components/layout';

export const metadata: Metadata = {
    title: 'Notifications | XanDash',
    description: 'Set up email and Telegram notifications for your Xandeum nodes. Get alerted about status changes, new versions, and more.',
};

export default function NotificationsPage() {
    return (
        <DashboardLayout>
            <Suspense fallback={
                <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-white/50"></div>
                </div>
            }>
                <NotificationsPageClient />
            </Suspense>
        </DashboardLayout>
    );
}

