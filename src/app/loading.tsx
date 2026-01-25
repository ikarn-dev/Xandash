import { DashboardLayout } from '@/components/layout';
import { DashboardSkeleton } from '@/components/dashboard';

/**
 * Loading UI for the home page
 * This shows instantly during navigation, improving perceived performance
 */
export default function Loading() {
    return (
        <DashboardLayout>
            {/* Instant skeleton loading state */}
            <div className="mb-4 sm:mb-6 h-[28px] bg-black/30 border-b border-white/5" />
            <DashboardSkeleton />
        </DashboardLayout>
    );
}
