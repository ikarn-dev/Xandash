import { DashboardLayout } from '@/components/layout';
import { DashboardSkeleton } from '@/components/dashboard';

/**
 * Loading UI for the home page only
 * This shows instantly during homepage navigation, improving perceived performance
 * Other routes now have their own specific loading.tsx files
 */
export default function Loading() {
    return (
        <DashboardLayout>
            {/* Instant skeleton loading state for homepage */}
            <div className="mb-4 sm:mb-6 h-[28px] bg-black/30 border-b border-white/5" />
            <DashboardSkeleton />
        </DashboardLayout>
    );
}
