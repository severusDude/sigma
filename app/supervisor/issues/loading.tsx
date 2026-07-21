import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="w-56 h-7" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-8 w-50" />
        <Skeleton className="h-8 w-35" />
        <Skeleton className="w-40 h-8" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-5 space-y-4 border rounded-xl border-border/50"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="w-16 h-5" />
              <Skeleton className="size-7" />
            </div>
            <Skeleton className="w-full h-5" />
            <Skeleton className="w-3/4 h-5" />
            <div className="space-y-2.5 pt-2">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-40 h-4" />
              <Skeleton className="w-24 h-4" />
            </div>
            <Skeleton className="w-full h-9" />
          </div>
        ))}
      </div>
    </div>
  );
}
