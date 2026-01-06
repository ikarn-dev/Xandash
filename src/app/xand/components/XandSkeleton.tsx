export function XandSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-white/5 rounded-lg"></div>
      <div className="h-16 bg-white/5 rounded-lg"></div>
      <div className="h-24 bg-white/5 rounded-lg"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-lg"></div>)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-48 bg-white/5 rounded-lg"></div>
        <div className="h-48 bg-white/5 rounded-lg"></div>
      </div>
    </div>
  );
}
