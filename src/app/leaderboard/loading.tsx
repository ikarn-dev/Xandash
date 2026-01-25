import { DashboardLayout } from '@/components/layout';

/**
 * Loading UI for the leaderboard page
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
                
                {/* Tabs skeleton */}
                <div className="flex justify-center">
                    <div className="flex space-x-1 bg-black/50 p-1 rounded-lg">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-8 w-24 bg-white/10 rounded"></div>
                        ))}
                    </div>
                </div>
                
                {/* Stats cards skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-black/80 border border-white/10 p-6 rounded-lg text-center">
                            <div className="h-8 w-16 bg-white/10 rounded mx-auto mb-2"></div>
                            <div className="h-4 w-20 bg-white/10 rounded mx-auto"></div>
                        </div>
                    ))}
                </div>
                
                {/* Leaderboard table skeleton */}
                <div className="bg-black border border-white/10 rounded-lg overflow-hidden">
                    <div className="bg-white/5 border-b border-white/10 px-4 py-3">
                        <div className="flex space-x-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-4 w-16 bg-white/10 rounded"></div>
                            ))}
                        </div>
                    </div>
                    <div className="divide-y divide-white/5">
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className="px-4 py-3 flex space-x-4">
                                <div className="h-4 w-8 bg-white/10 rounded"></div>
                                <div className="h-4 w-24 bg-white/10 rounded"></div>
                                <div className="h-4 w-20 bg-white/10 rounded"></div>
                                <div className="h-4 w-16 bg-white/10 rounded"></div>
                                <div className="h-4 w-12 bg-white/10 rounded"></div>
                                <div className="h-4 w-14 bg-white/10 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}