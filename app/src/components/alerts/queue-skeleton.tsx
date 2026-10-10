export function QueueSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-surface px-4 py-3">
            <div className="h-3 w-16 animate-pulse rounded bg-surface-2" />
            <div className="mt-2 h-5 w-10 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border/60 px-3 py-2.5">
            <div className="h-5 w-14 animate-pulse rounded bg-surface-2" />
            <div
              className="h-4 flex-1 animate-pulse rounded bg-surface-2"
              style={{ maxWidth: `${60 - i * 2}%` }}
            />
            <div className="hidden h-4 w-24 animate-pulse rounded bg-surface-2 md:block" />
            <div className="h-4 w-10 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
