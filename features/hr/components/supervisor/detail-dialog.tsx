"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, ArrowLeftRightIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getSupervisorById,
  getSupervisorInterns,
  reassignIntern,
} from "../../actions/supervisor-actions";
import type { ActiveSupervisorOption } from "../../types/supervisor-types";

interface DetailDialogProps {
  supervisorId: string | null;
  onClose: () => void;
  supervisors: ActiveSupervisorOption[];
}

export function DetailDialog({
  supervisorId,
  onClose,
  supervisors,
}: DetailDialogProps) {
  const queryClient = useQueryClient();
  const [reassigningId, setReassigningId] = useState<string | null>(null);

  useEffect(() => {
    setReassigningId(null);
  }, [supervisorId]);

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

  const { data: interns = [], isLoading: internsLoading } = useQuery({
    queryKey: ["supervisor-interns", supervisorId],
    queryFn: async () => {
      if (!supervisorId) return [];
      const res = await getSupervisorInterns(supervisorId);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    enabled: !!supervisorId,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const { mutateAsync: reassignAsync, isPending: isReassigning } = useMutation({
    mutationKey: ["reassign-intern"],
    mutationFn: async ({
      internProfileId,
      newSupervisorProfileId,
    }: {
      internProfileId: string;
      newSupervisorProfileId: string;
    }) => {
      const res = await reassignIntern(internProfileId, newSupervisorProfileId);
      if (!res.success) throw new Error(res.error);
      return res;
    },
    onSuccess: async (_res, variables) => {
      if (!supervisorId) return;
      const internsKey = ["supervisor-interns", supervisorId];

      await queryClient.cancelQueries({ queryKey: internsKey, exact: true });

      queryClient.setQueryData(internsKey, (old: typeof interns | undefined) =>
        (old ?? []).filter(
          (i) => i.internProfileId !== variables.internProfileId,
        ),
      );

      queryClient.invalidateQueries({ queryKey: ["supervisor", supervisorId] });
      queryClient.invalidateQueries({ queryKey: ["supervisors"] });
      queryClient.invalidateQueries({ queryKey: ["interns"] });
    },
  });

  async function handleReassign(
    internProfileId: string,
    newSupervisorProfileId: string,
  ) {
    const mutationPromise = reassignAsync({
      internProfileId,
      newSupervisorProfileId,
    });
    toast.promise(mutationPromise, {
      loading: "Memindahkan intern...",
      success: (res) => {
        if (res.warning) {
          setTimeout(() => toast.warning(res.warning), 2000);
        }
        return "Intern berhasil dipindahkan";
      },
      error: (error) =>
        error instanceof Error ? error.message : "Gagal memindahkan intern",
    });

    try {
      await mutationPromise;
      setReassigningId(null);
    } catch {
      // error toast sudah ditangani oleh toast.promise
    }
  }

  const supervisor = data?.supervisorProfile;
  const availableSupervisors = supervisors.filter(
    (s) => s.id !== supervisor?.id,
  );

  return (
    <Dialog open={!!supervisorId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-screen max-w-screen md:min-w-[calc(100%-32rem)] md:h-fit gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-1 border-b">
          <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
            Detail Supervisor
          </DialogTitle>
          <DialogDescription>Informasi lengkap supervisor</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100vh-12rem)]">
          <div className="px-6 py-6 space-y-6">
            {isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            )}

            {data && supervisor && (
              <>
                {/* Info Supervisor */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{data.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {supervisor.nip}
                      </p>
                    </div>
                    <Badge
                      variant={supervisor.isActive ? "default" : "outline"}
                    >
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
                      <p className="text-muted-foreground">
                        Jumlah Intern Bimbingan
                      </p>
                      <p className="font-medium">
                        {supervisor.internAssignments?.length || 0} Intern
                      </p>
                    </div>
                  </div>
                </div>

                {/* Daftar Intern Bimbingan */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    Daftar Intern Bimbingan
                    <span className="text-muted-foreground font-normal ml-1">
                      ({interns.length})
                    </span>
                  </h4>

                  {internsLoading && (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  )}

                  {!internsLoading && interns.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Belum ada intern yang dibimbing
                    </p>
                  )}

                  {!internsLoading && interns.length > 0 && (
                    <div className="space-y-2">
                      {interns.map((intern) => (
                        <div
                          key={intern.internProfileId}
                          className="flex items-center justify-between rounded-lg border bg-card p-3"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">
                              {intern.internName}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {intern.nim} · {intern.institution}
                              {intern.departmentName
                                ? ` - ${intern.departmentName}`
                                : ""}
                            </p>
                          </div>

                          <div className="shrink-0 ml-3">
                            {reassigningId === intern.internProfileId ? (
                              <div className="flex items-center gap-2">
                                <Select
                                  value=""
                                  onValueChange={(val) => {
                                    if (val) {
                                      handleReassign(
                                        intern.internProfileId,
                                        val,
                                      );
                                    }
                                  }}
                                >
                                  <SelectTrigger
                                    className="h-8 w-44 border-0 bg-muted px-3 text-xs data-placeholder:text-muted-foreground"
                                    value=""
                                  >
                                    <SelectValue placeholder="Pilih Supervisor...">
                                      {(value: string | null) =>
                                        value
                                          ? (supervisors.find(
                                              (s) => s.id === value,
                                            )?.name ?? value)
                                          : null
                                      }
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent alignItemWithTrigger={false}>
                                    {availableSupervisors.map((sup) => (
                                      <SelectItem key={sup.id} value={sup.id}>
                                        <div className="flex items-center gap-2">
                                          <span>{sup.name}</span>
                                          <span className="text-[10px] text-muted-foreground">
                                            {sup.currentCount}/{sup.maxInterns}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  onClick={() => setReassigningId(null)}
                                >
                                  <XIcon className="size-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setReassigningId(intern.internProfileId)
                                }
                                className="gap-1.5 text-xs"
                                disabled={isReassigning}
                              >
                                <ArrowLeftRightIcon className="size-3.5" />
                                Pindahkan
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
