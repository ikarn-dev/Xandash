import { DashboardLayout } from '@/components/layout';

/**
 * Loading UI for the compare page
 */
export default function Loading() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header skeleton */}
                <div className="text-center space-y-2">
                    <div className="h-8 w-48 bg-white/10 rounded mx-auto"></div>
                    <div className="h-4 w-64 bg-white/10 rounded mx-auto"></div>
                </div>
                
                {/* Compare type switcher skeleton */}
                <div className="flex justify-center">
                    <div className="flex space-x-1 bg-black/50 p-1 rounded-lg">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="h-8 w-20 bg-white/10 rounded"></div>
                        ))}
                    </div>
                </div>
                
                {/* Node selectors skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-black/80 border border-white/10 p-4 rounded-lg">
                            <div className="h-10 w-full bg-white/10 rounded mb-3"></div>
                            <div className="space-y-2">
                                <div className="h-4 w-3/4 bg-white/10 rounded"></div>
                                <div className="h-4 w-1/2 bg-white/10 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Compare button skeleton */}
                <div className="flex justify-center">
                    <div className="h-12 w-32 bg-white/10 rounded-lg"></div>
                </div>
                
                {/* Results skeleton */}
                <div className="space-y-4">
                    <div className="h-6 w-32 bg-white/10 rounded"></div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-64 bg-white/5 rounded-xl border border-white/10"></div>
                        <div className="h-64 bg-white/5 rounded-xl border border-white/10"></div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}