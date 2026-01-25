import { DashboardLayout } from '@/components/layout';

/**
 * Loading UI for the nodes page
 */
export default function Loading() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header skeleton */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="h-8 w-32 bg-white/10 rounded"></div>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-24 bg-white/10 rounded"></div>
                        <div className="h-10 w-20 bg-white/10 rounded"></div>
                    </div>
                </div>
                
                {/* Stats cards skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-black/80 border border-white/10 p-4 rounded-lg">
                            <div className="h-6 w-16 bg-white/10 rounded mb-2"></div>
                            <div className="h-4 w-12 bg-white/10 rounded"></div>
                        </div>
                    ))}
                </div>
                
                {/* Filters skeleton */}
                <div className="flex flex-wrap gap-2">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-8 w-20 bg-white/10 rounded-full"></div>
                    ))}
                </div>
                
                {/* Table skeleton */}
                <div className="bg-black border border-white/10 rounded-lg overflow-hidden">
                    <div className="bg-white/5 border-b border-white/10 px-4 py-3">
                        <div className="flex space-x-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="h-4 w-16 bg-white/10 rounded"></div>
                            ))}
                        </div>
                    </div>
                    <div className="divide-y divide-white/5">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="px-4 py-3 flex space-x-4">
                                {[...Array(8)].map((_, j) => (
                                    <div key={j} className="h-4 w-16 bg-white/10 rounded"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}