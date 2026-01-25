import { DashboardLayout } from '@/components/layout';

/**
 * Loading UI for the STOINC calculator page
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
                
                {/* Calculator form skeleton */}
                <div className="max-w-2xl mx-auto bg-black/80 border border-white/10 rounded-lg p-6">
                    <div className="space-y-6">
                        {/* Input fields skeleton */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="h-4 w-24 bg-white/10 rounded mb-2"></div>
                                <div className="h-12 w-full bg-white/10 rounded"></div>
                            </div>
                            <div>
                                <div className="h-4 w-28 bg-white/10 rounded mb-2"></div>
                                <div className="h-12 w-full bg-white/10 rounded"></div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="h-4 w-32 bg-white/10 rounded mb-2"></div>
                                <div className="h-12 w-full bg-white/10 rounded"></div>
                            </div>
                            <div>
                                <div className="h-4 w-28 bg-white/10 rounded mb-2"></div>
                                <div className="h-12 w-full bg-white/10 rounded"></div>
                            </div>
                        </div>
                        
                        {/* Boost factor skeleton */}
                        <div>
                            <div className="h-4 w-32 bg-white/10 rounded mb-3"></div>
                            <div className="flex gap-2">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-10 w-16 bg-white/10 rounded"></div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Calculate button skeleton */}
                        <div className="h-12 w-full bg-white/10 rounded"></div>
                    </div>
                </div>
                
                {/* Results skeleton */}
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-black/80 border border-white/10 rounded-lg p-6 text-center">
                            <div className="h-6 w-20 bg-white/10 rounded mx-auto mb-2"></div>
                            <div className="h-8 w-24 bg-white/10 rounded mx-auto mb-1"></div>
                            <div className="h-4 w-16 bg-white/10 rounded mx-auto"></div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}