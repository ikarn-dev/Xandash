import { DashboardLayout } from '@/components/layout';

/**
 * Loading UI for the XAND token page
 */
export default function Loading() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header skeleton */}
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-white/10 rounded-full mx-auto"></div>
                    <div className="h-8 w-32 bg-white/10 rounded mx-auto"></div>
                    <div className="h-4 w-48 bg-white/10 rounded mx-auto"></div>
                </div>
                
                {/* Price and stats skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-black/80 border border-white/10 p-6 rounded-lg text-center">
                        <div className="h-8 w-24 bg-white/10 rounded mx-auto mb-2"></div>
                        <div className="h-4 w-16 bg-white/10 rounded mx-auto"></div>
                    </div>
                    <div className="bg-black/80 border border-white/10 p-6 rounded-lg text-center">
                        <div className="h-8 w-20 bg-white/10 rounded mx-auto mb-2"></div>
                        <div className="h-4 w-20 bg-white/10 rounded mx-auto"></div>
                    </div>
                    <div className="bg-black/80 border border-white/10 p-6 rounded-lg text-center">
                        <div className="h-8 w-16 bg-white/10 rounded mx-auto mb-2"></div>
                        <div className="h-4 w-24 bg-white/10 rounded mx-auto"></div>
                    </div>
                </div>
                
                {/* Market stats skeleton */}
                <div className="bg-black/80 border border-white/10 rounded-lg p-6">
                    <div className="h-6 w-32 bg-white/10 rounded mb-4"></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="text-center">
                                <div className="h-6 w-16 bg-white/10 rounded mx-auto mb-1"></div>
                                <div className="h-3 w-20 bg-white/10 rounded mx-auto"></div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Links and about skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-black/80 border border-white/10 rounded-lg p-6">
                        <div className="h-6 w-24 bg-white/10 rounded mb-4"></div>
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-4 w-32 bg-white/10 rounded"></div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-black/80 border border-white/10 rounded-lg p-6">
                        <div className="h-6 w-28 bg-white/10 rounded mb-4"></div>
                        <div className="space-y-2">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-4 bg-white/10 rounded" style={{ width: `${100 - i * 10}%` }}></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}