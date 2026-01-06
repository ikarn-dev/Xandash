export const ProfileSkeleton = () => (
  <div className="space-y-3 sm:space-y-4 px-2 sm:px-0 animate-pulse">
    {/* Header Skeleton */}
    <div className="relative bg-black border border-white/10 p-3 sm:p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 bg-white/10 rounded-lg"></div>
          <div className="w-16 h-8 bg-white/10 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="h-6 sm:h-7 bg-white/10 rounded w-48 sm:w-64"></div>
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-white/10 rounded-full"></div>
              <div className="h-5 w-14 bg-white/10 rounded-full"></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <div className="h-4 bg-white/5 rounded w-32"></div>
            <div className="h-4 bg-white/5 rounded w-24"></div>
            <div className="h-4 bg-white/5 rounded w-28"></div>
          </div>
        </div>
      </div>
    </div>

    {/* Stats Cards Skeleton */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-black/40 border border-white/10 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-3 h-3 bg-white/10 rounded"></div>
            <div className="h-3 bg-white/10 rounded w-12"></div>
          </div>
          <div className="h-6 sm:h-8 bg-white/10 rounded w-20 sm:w-24"></div>
        </div>
      ))}
    </div>

    {/* Charts Skeleton */}
    <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white/10 rounded"></div>
          <div className="h-4 bg-white/10 rounded w-32"></div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 w-10 bg-white/10 rounded"></div>
          ))}
        </div>
      </div>
      <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-black/20 border border-white/5 rounded-lg p-3">
            <div className="h-3 bg-white/10 rounded w-20 mb-2"></div>
            <div className="h-20 bg-white/5 rounded"></div>
          </div>
        ))}
      </div>
    </div>

    {/* Events Skeleton */}
    <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden">
      <div className="p-3 border-b border-white/10 flex items-center gap-2">
        <div className="w-4 h-4 bg-white/10 rounded"></div>
        <div className="h-4 bg-white/10 rounded w-24"></div>
      </div>
      <div className="p-3 space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2 bg-black/20 rounded">
            <div className="w-2 h-2 bg-white/10 rounded-full"></div>
            <div className="flex-1">
              <div className="h-3 bg-white/10 rounded w-3/4 mb-1"></div>
              <div className="h-2 bg-white/5 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
