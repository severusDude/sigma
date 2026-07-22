import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <ScrollArea className="w-full max-h-[calc(100vh-5rem)] mx-auto space-y-8 pr-2">
      <Skeleton className="w-48 h-4 mb-4" />

      <div className="p-8 mb-4 space-y-6 border rounded-xl">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            <Skeleton className="w-3/4 h-8" />
            <Skeleton className="w-full h-5" />
            <Skeleton className="w-2/3 h-5" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="w-20 h-9" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-48 h-7" />
            <Skeleton className="w-8 h-5" />
          </div>
          <Skeleton className="w-32 h-8" />
        </div>

        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 space-y-4 border rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="rounded-full size-9" />
                <Skeleton className="h-5 w-44" />
              </div>
              <Skeleton className="w-40 h-6" />
            </div>

            {[1, 2].map((j) => (
              <div key={j} className="p-4 space-y-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="rounded-full size-8" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-full h-4" />
                    <Skeleton className="w-3/4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
