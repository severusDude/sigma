import { Skeleton } from "@/components/ui/skeleton";

const sizeMap = {
  thumbnail: { h: "h-60" },
  modal: { h: "h-[80vh]" },
  full: { h: "h-[calc(100vh-12rem)]" },
} as const;

export function PreviewSkeleton({ size = "modal" }: { size?: keyof typeof sizeMap }) {
  return (
    <div className={`w-full ${sizeMap[size].h} flex items-center justify-center bg-muted/20 rounded-md`}>
      <Skeleton className="w-full h-full" />
    </div>
  );
}
