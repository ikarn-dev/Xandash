'use client';

import React from 'react';

// Skeleton loader components for manager profile
export const ManagerProfileSkeleton = () => {
    return (
        <div className="space-y-3 sm:space-y-4 px-2 sm:px-0 animate-pulse">
            {/* Header skeleton */}
            <div className="bg-black border border-white/10 p-3 sm:p-4">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="w-10 h-10 bg-white/10 rounded" />
                        <div className="w-20 h-8 bg-white/10 rounded" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-white/10 rounded" />
                            <div className="w-40 h-6 bg-white/10 rounded" />
                        </div>
                        <div className="flex gap-2">
                            <div className="w-16 h-5 bg-white/10 rounded-full" />
                            <div className="w-24 h-5 bg-white/10 rounded-full" />
                        </div>
                        <div className="w-64 h-4 bg-white/10 rounded" />
                    </div>
                </div>
            </div>

            {/* Stats cards skeleton */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-black/40 border border-white/10 p-3 sm:p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                            <div className="w-4 h-4 bg-white/10 rounded" />
                            <div className="w-16 h-3 bg-white/10 rounded" />
                        </div>
                        <div className="w-20 h-8 bg-white/10 rounded" />
                        <div className="w-12 h-3 bg-white/10 rounded mt-2" />
                    </div>
                ))}
            </div>

            {/* Nodes section skeleton */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-white/10 rounded" />
                        <div className="w-36 h-6 bg-white/10 rounded" />
                    </div>
                    <div className="w-24 h-4 bg-white/10 rounded" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-black/40 border border-white/10 overflow-hidden">
                            <div className="p-3 sm:p-4 border-b border-white/5">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-white/10 rounded-full" />
                                        <div className="space-y-1">
                                            <div className="w-40 h-4 bg-white/10 rounded" />
                                            <div className="w-24 h-3 bg-white/10 rounded" />
                                        </div>
                                    </div>
                                    <div className="w-16 h-6 bg-white/10 rounded-full" />
                                </div>
                            </div>
                            <div className="p-3 sm:p-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {[...Array(4)].map((_, j) => (
                                        <div key={j} className="space-y-1">
                                            <div className="w-12 h-3 bg-white/10 rounded" />
                                            <div className="w-16 h-5 bg-white/10 rounded" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
