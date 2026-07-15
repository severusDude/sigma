"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getInternById } from "../../actions/intern-actions";

interface DetailDialogProps {
  internId: string | null;
  onClose: () => void;
}

const statusLabel: Record<string, string> = {
  active: "Aktif",
  completed: "Selesai",
  withdrawn: "Ditarik",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function DetailDialog({ internId, onClose }: DetailDialogProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["intern", internId],
    queryFn: async () => {
      if (!internId) return null;
      const res = await getInternById(internId);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    enabled: !!internId,
  });

  const intern = data?.internProfile;

  return (
    <Dialog open={!!internId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-screen max-w-screen md:min-w-[calc(100%-52rem)] md:h-fit gap-0">
        <DialogHeader className="sticky pb-4 -mx-6 space-y-4 border-b">
          <div className="px-6">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
              Detail Intern
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap peserta magang
            </DialogDescription>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100vh-12rem)] -mr-6 pr-6">
          <div className="pt-6">
            {isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            )}

            {data && intern && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{data.name}</h3>
                    <p className="text-sm text-muted-foreground">{intern.nik}</p>
                  </div>
                  <Badge>{statusLabel[intern.status] || intern.status}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Institusi</p>
                    <p className="font-medium">{intern.institution}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">No. HP</p>
                    <p className="font-medium">{intern.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{intern.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Periode Mulai</p>
                    <p className="font-medium">{formatDate(intern.periodStart)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Periode Selesai</p>
                    <p className="font-medium">{formatDate(intern.periodEnd)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
