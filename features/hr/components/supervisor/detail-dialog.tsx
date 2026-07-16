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
import { getSupervisorById } from "../../actions/supervisor-actions";

interface DetailDialogProps {
  supervisorId: string | null;
  onClose: () => void;
}

export function DetailDialog({ supervisorId, onClose }: DetailDialogProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["supervisor", supervisorId],
    queryFn: async () => {
      if (!supervisorId) return null;
      const res = await getSupervisorById(supervisorId);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    enabled: !!supervisorId,
  });

  const supervisor = data?.supervisorProfile;

  return (
    <Dialog open={!!supervisorId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-screen max-w-screen md:min-w-[calc(100%-52rem)] md:h-fit gap-0">
        <DialogHeader className="sticky pb-4 -mx-6 space-y-4 border-b">
          <div className="px-6">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
              Detail Supervisor
            </DialogTitle>
            <DialogDescription>
              Informasi lengkap supervisor
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

            {data && supervisor && (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{data.name}</h3>
                    <p className="text-sm text-muted-foreground">{supervisor.nip}</p>
                  </div>
                  <Badge variant={supervisor.isActive ? "default" : "outline"}>
                    {supervisor.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Bidang</p>
                    <p className="font-medium">{supervisor.field}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">No. HP</p>
                    <p className="font-medium">{supervisor.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{supervisor.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Maksimal Intern</p>
                    <p className="font-medium">{supervisor.maxInterns}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Jumlah Intern Bimbingan</p>
                    <p className="font-medium">
                      {supervisor.internAssignments?.length || 0} Intern
                    </p>
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
