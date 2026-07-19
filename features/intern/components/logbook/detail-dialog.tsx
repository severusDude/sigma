"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ClockIcon, CalendarDaysIcon, FileTextIcon, MessageSquareIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { useQuery } from "@tanstack/react-query";
import { getLogbookById } from "../../actions/logbook-actions";
import type { Logbook } from "../../types/logbook-types";
import { LogbookStatus } from "@/generated/prisma/enums";

interface DetailDialogProps {
  logbookId: string | null;
  onClose: () => void;
}

const statusLabel: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  [LogbookStatus.pending_review]: { label: "Menunggu Review", variant: "outline" },
  [LogbookStatus.approved]: { label: "Disetujui", variant: "default" },
  [LogbookStatus.revision]: { label: "Revisi", variant: "destructive" },
};

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} menit`;
  if (m === 0) return `${h} jam`;
  return `${h} jam ${m} menit`;
}

export function DetailDialog({ logbookId, onClose }: DetailDialogProps) {
  const { data: logbook, isLoading } = useQuery({
    queryKey: ["logbook", logbookId],
    queryFn: async () => {
      if (!logbookId) return null;
      const res = await getLogbookById(logbookId);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    enabled: !!logbookId,
  });

  const status = logbook ? statusLabel[logbook.status] : null;

  return (
    <Dialog open={!!logbookId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-screen max-w-screen md:min-w-[calc(100%-52rem)] md:h-fit gap-0">
        <DialogHeader className="sticky pb-4 -mx-6 space-y-4 border-b">
          <div className="px-6">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
              Detail Logbook
            </DialogTitle>
            <DialogDescription>Informasi lengkap entri logbook</DialogDescription>
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
            {logbook && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="size-4 text-muted-foreground" />
                    <span className="font-medium">
                      {format(new Date(logbook.date), "EEEE, d MMMM yyyy", { locale: id })}
                    </span>
                  </div>
                  {status && <Badge variant={status.variant}>{status.label}</Badge>}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ClockIcon className="size-4" />
                  <span>Durasi: {formatDuration(logbook.duration)}</span>
                </div>

                {logbook.issue && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileTextIcon className="size-4 text-muted-foreground" />
                    <span>
                      Tugas: <span className="font-medium">{logbook.issue.title}</span>
                    </span>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Kegiatan
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">{logbook.activity}</p>
                </div>

                {logbook.notes && (
                  <div className="flex gap-2 rounded-md bg-muted p-4">
                    <MessageSquareIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Catatan Pembimbing
                      </p>
                      <p className="text-sm mt-1">{logbook.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
