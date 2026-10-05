export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-border/50 rounded-xl ${className}`}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 lg:p-8 space-y-6 animate-in fade-in">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  );
}