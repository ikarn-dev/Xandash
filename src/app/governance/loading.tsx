import { DashboardLayout } from '@/components/layout';

/**
 * Loading UI for the governance page
 */
export default function Loading() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header skeleton */}
                <div className="text-center space-y-2">
                    <div className="h-8 w-44 bg-white/10 rounded mx-auto"></div>
                    <div className="h-4 w-64 bg-white/10 rounded mx-auto"></div>
                </div>
                
                {/* Stats cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-black/80 border border-white/10 p-6 rounded-lg text-center">
                            <div className="h-6 w-6 bg-white/10 rounded mx-auto mb-3"></div>
                            <div className="h-8 w-16 bg-white/10 rounded mx-auto mb-2"></div>
                            <div className="h-4 w-20 bg-white/10 rounded mx-auto"></div>
                        </div>
                    ))}
                </div>
                
                {/* Tabs skeleton */}
                <div className="flex justify-center">
                    <div className="flex space-x-1 bg-black/50 p-1 rounded-lg">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-8 w-20 bg-white/10 rounded"></div>
                        ))}
                    </div>
                </div>
                
                {/* Content skeleton */}
                <div className="bg-black/80 border border-white/10 rounded-lg p-6">
                    <div className="space-y-4">
                        <div className="h-6 w-32 bg-white/10 rounded"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded">
                                        <div className="h-4 w-32 bg-white/10 rounded"></div>
                                        <div className="h-4 w-16 bg-white/10 rounded"></div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-4">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded">
                                        <div className="h-4 w-28 bg-white/10 rounded"></div>
                                        <div className="h-4 w-20 bg-white/10 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}