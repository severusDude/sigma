"use client";

import { useState } from "react";
import { ArrowDown, ArrowRightIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { ActiveSupervisorOption } from "../../types/supervisor-types";
import { reassignAllInterns } from "../../actions/supervisor-actions";

interface ReassignAllDialogProps {
  open: boolean;
  onClose: () => void;
  supervisors: ActiveSupervisorOption[];
}

export function ReassignAllDialog({
  open,
  onClose,
  supervisors,
}: ReassignAllDialogProps) {
  const queryClient = useQueryClient();
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["reassign-all"],
    mutationFn: async () => {
      const res = await reassignAllInterns(fromId, toId);
      if (!res.success) throw new Error(res.error ?? "Gagal me-reassign");
      return res;
    },
  });

  const fromSupervisor = supervisors.find((s) => s.id === fromId);
  const toSupervisor = supervisors.find((s) => s.id === toId);
  const availableTo = supervisors.filter((s) => s.id !== fromId);

  async function onSubmit() {
    if (!fromId || !toId) {
      toast.error("Pilih supervisor asal dan tujuan");
      return;
    }

    const mutationPromise = mutateAsync();
    toast.promise(mutationPromise, {
      loading: "Memindahkan semua intern...",
      success: (res) =>
        `${res.count} intern berhasil dipindahkan`,
      error: (error) =>
        error instanceof Error ? error.message : "Gagal memindahkan intern",
    });

    try {
      await mutationPromise;
      queryClient.invalidateQueries({ queryKey: ["supervisors"] });
      queryClient.invalidateQueries({ queryKey: ["interns"] });
      setFromId("");
      setToId("");
      onClose();
    } catch {}
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-screen max-w-screen md:min-w-[calc(100%-52rem)] md:h-fit gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-1 border-b">
          <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
            Reassign Semua Intern
          </DialogTitle>
          <DialogDescription>
            Pindahkan semua intern bimbingan dari satu supervisor ke supervisor lain
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6">
          {/* Supervisor Asal */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Supervisor Asal
            </label>
            <Select
              value={fromId}
              onValueChange={(val) => {
                setFromId(val ?? "");
                if (val === toId) setToId("");
              }}
            >
              <SelectTrigger
                className="w-full border-0 bg-muted px-4 py-2.5 data-placeholder:text-muted-foreground"
                value={fromId}
              >
                <SelectValue placeholder="Pilih Supervisor Asal...">
                  {(value: string | null) =>
                    value
                      ? (supervisors.find((s) => s.id === value)?.name ?? value)
                      : null
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {supervisors.map((sup) => (
                  <SelectItem key={sup.id} value={sup.id}>
                    <div className="flex flex-col">
                      <span>{sup.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {sup.nip} · {sup.currentCount} intern aktif
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fromSupervisor && fromSupervisor.currentCount === 0 && (
              <p className="text-xs text-amber-600">
                Supervisor ini tidak memiliki intern bimbingan
              </p>
            )}
          </div>

          {/* Arrow */}
          <div className="flex justify-center -my-2">
            <ArrowDown className="size-5 text-muted-foreground/40" />
          </div>

          {/* Supervisor Tujuan */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Supervisor Tujuan
            </label>
            <Select
              value={toId}
              onValueChange={(val) => setToId(val ?? "")}
            >
              <SelectTrigger
                className="w-full border-0 bg-muted px-4 py-2.5 data-placeholder:text-muted-foreground"
                value={toId}
              >
                <SelectValue placeholder="Pilih Supervisor Tujuan...">
                  {(value: string | null) =>
                    value
                      ? (supervisors.find((s) => s.id === value)?.name ?? value)
                      : null
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {availableTo.length === 0 && (
                  <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                    Tidak ada supervisor lain
                  </div>
                )}
                {availableTo.map((sup) => {
                  const isFull = sup.currentCount >= sup.maxInterns;
                  return (
                    <SelectItem key={sup.id} value={sup.id}>
                      <div className="flex flex-col">
                        <span>{sup.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {sup.nip} · {sup.currentCount}/{sup.maxInterns} intern
                          {isFull ? " (Penuh)" : ""}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          {fromSupervisor && toSupervisor && fromSupervisor.currentCount > 0 && (
            <div className="rounded-lg border bg-muted/50 p-3 text-sm">
              <p>
                <strong>{fromSupervisor.currentCount}</strong> intern akan dipindahkan dari{" "}
                <strong>{fromSupervisor.name}</strong> ke{" "}
                <strong>{toSupervisor.name}</strong>
              </p>
              {toSupervisor.currentCount + fromSupervisor.currentCount >
                toSupervisor.maxInterns && (
                <p className="text-xs text-amber-600 mt-1">
                  Perhatian: Supervisor tujuan akan melebihi batas maksimal ({toSupervisor.maxInterns} intern)
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFromId("");
                setToId("");
                onClose();
              }}
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={
                isPending || !fromId || !toId || fromSupervisor?.currentCount === 0
              }
              className="gap-2"
            >
              {isPending && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              {isPending ? "Memproses..." : "Reassign"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
