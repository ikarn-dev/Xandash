import { DashboardLayout } from '@/components/layout';

/**
 * Loading UI for the managers page
 */
export default function Loading() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header skeleton */}
                <div className="text-center space-y-2">
                    <div className="h-8 w-40 bg-white/10 rounded mx-auto"></div>
                    <div className="h-4 w-56 bg-white/10 rounded mx-auto"></div>
                </div>
                
                {/* Search and filters skeleton */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 h-10 bg-white/10 rounded-lg"></div>
                    <div className="flex gap-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-10 w-20 bg-white/10 rounded-lg"></div>
                        ))}
                    </div>
                </div>
                
                {/* Stats cards skeleton */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-black/80 border border-white/10 p-4 rounded-lg text-center">
                            <div className="h-6 w-16 bg-white/10 rounded mx-auto mb-2"></div>
                            <div className="h-4 w-20 bg-white/10 rounded mx-auto"></div>
                        </div>
                    ))}
                </div>
                
                {/* Managers grid skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="bg-black/80 border border-white/10 p-6 rounded-lg">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-white/10 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-5 w-24 bg-white/10 rounded mb-1"></div>
                                    <div className="h-4 w-32 bg-white/10 rounded"></div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <div className="h-4 w-16 bg-white/10 rounded"></div>
                                    <div className="h-4 w-12 bg-white/10 rounded"></div>
                                </div>
                                <div className="flex justify-between">
                                    <div className="h-4 w-20 bg-white/10 rounded"></div>
                                    <div className="h-4 w-16 bg-white/10 rounded"></div>
                                </div>
                                <div className="flex justify-between">
                                    <div className="h-4 w-14 bg-white/10 rounded"></div>
                                    <div className="h-4 w-10 bg-white/10 rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}