"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getInternById } from "../../actions/intern-actions";
import type { InternWithRelations } from "../../types/intern-types";

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

  return (
    <Dialog open={!!internId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail Intern</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {data && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{data.user.name}</h3>
                <p className="text-sm text-muted-foreground">{data.nik}</p>
              </div>
              <Badge>{statusLabel[data.status] || data.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Institusi</p>
                <p className="font-medium">{data.institution}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Departemen</p>
                <p className="font-medium">{data.department?.name || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">No. HP</p>
                <p className="font-medium">{data.phone || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{data.email || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Periode Mulai</p>
                <p className="font-medium">{formatDate(data.periodStart)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Periode Selesai</p>
                <p className="font-medium">{formatDate(data.periodEnd)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Supervisor</p>
                <p className="font-medium">
                  {data.supervisorAssignments?.[0]?.supervisorProfile?.user?.name || "-"}
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
