// Skeleton loading — tampil saat data belum selesai di-fetch
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
        <div className="h-2.5 bg-gray-100 rounded animate-pulse w-1/2" />
      </div>
      <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
    </div>
  );
}

export function SkeletonSummary() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} className="h-24" />
      ))}
    </div>
  );
}
