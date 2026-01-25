import { DashboardLayout } from '@/components/layout';

/**
 * Loading UI for the network page
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
                
                {/* Network stats skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-black/80 border border-white/10 p-6 rounded-lg text-center">
                            <div className="h-12 w-12 bg-white/10 rounded-full mx-auto mb-3"></div>
                            <div className="h-6 w-16 bg-white/10 rounded mx-auto mb-2"></div>
                            <div className="h-4 w-20 bg-white/10 rounded mx-auto"></div>
                        </div>
                    ))}
                </div>
                
                {/* Map skeleton */}
                <div className="w-full h-96 bg-white/5 rounded-xl border border-white/10"></div>
                
                {/* Countries grid skeleton */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="bg-black/80 border border-white/10 p-4 rounded-lg">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-6 bg-white/10 rounded"></div>
                                <div className="h-5 w-24 bg-white/10 rounded"></div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 w-16 bg-white/10 rounded"></div>
                                <div className="h-4 w-20 bg-white/10 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}