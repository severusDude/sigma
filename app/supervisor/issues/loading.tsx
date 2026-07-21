export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="h-7 w-56 rounded animate-pulse bg-muted" />
        <div className="h-4 w-80 rounded animate-pulse bg-muted" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="h-8 w-[200px] rounded animate-pulse bg-muted" />
        <div className="h-8 w-[140px] rounded animate-pulse bg-muted" />
        <div className="h-8 w-[160px] rounded animate-pulse bg-muted" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl border border-border/50 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-16 rounded animate-pulse bg-muted" />
              <div className="size-7 rounded animate-pulse bg-muted" />
            </div>
            <div className="h-5 w-full rounded animate-pulse bg-muted" />
            <div className="h-5 w-3/4 rounded animate-pulse bg-muted" />
            <div className="space-y-2.5 pt-2">
              <div className="h-4 w-32 rounded animate-pulse bg-muted" />
              <div className="h-4 w-40 rounded animate-pulse bg-muted" />
              <div className="h-4 w-24 rounded animate-pulse bg-muted" />
            </div>
            <div className="h-9 w-full rounded animate-pulse bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
