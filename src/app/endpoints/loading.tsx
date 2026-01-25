import { DashboardLayout } from '@/components/layout';

/**
 * Loading UI for the endpoints page
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
                
                {/* Network selector skeleton */}
                <div className="flex justify-center">
                    <div className="flex space-x-1 bg-black/50 p-1 rounded-lg">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="h-8 w-20 bg-white/10 rounded"></div>
                        ))}
                    </div>
                </div>
                
                {/* Stats cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-black/80 border border-white/10 p-4 rounded-lg text-center">
                            <div className="h-6 w-16 bg-white/10 rounded mx-auto mb-2"></div>
                            <div className="h-4 w-20 bg-white/10 rounded mx-auto"></div>
                        </div>
                    ))}
                </div>
                
                {/* Uptime graph skeleton */}
                <div className="bg-black/80 border border-white/10 rounded-lg p-6">
                    <div className="h-6 w-32 bg-white/10 rounded mb-4"></div>
                    <div className="h-64 bg-white/5 rounded"></div>
                </div>
                
                {/* Endpoints list skeleton */}
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-black/80 border border-white/10 rounded-lg p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-6 w-32 bg-white/10 rounded"></div>
                                <div className="h-4 w-16 bg-white/10 rounded"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...Array(6)].map((_, j) => (
                                    <div key={j} className="bg-white/5 border border-white/10 rounded p-4">
                                        <div className="h-4 w-24 bg-white/10 rounded mb-2"></div>
                                        <div className="h-3 w-32 bg-white/10 rounded mb-1"></div>
                                        <div className="h-3 w-20 bg-white/10 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}