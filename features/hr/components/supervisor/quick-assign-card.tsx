"use client";

import { useState } from "react";
import { ClipboardList, ArrowDownIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  UnassignedIntern,
  ActiveSupervisorOption,
} from "../../types/supervisor-types";
import { assignSupervisor } from "../../actions/supervisor-actions";

interface QuickAssignCardProps {
  interns: UnassignedIntern[];
  supervisors: ActiveSupervisorOption[];
}

export function QuickAssignCard({
  interns,
  supervisors,
}: QuickAssignCardProps) {
  const [internId, setInternId] = useState("");
  const [supervisorId, setSupervisorId] = useState("");
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["assign-supervisor"],
    mutationFn: async () => {
      const res = await assignSupervisor(internId, supervisorId);
      if (!res.success) throw new Error(res.error);
      return res;
    },
  });

  async function onSubmit() {
    if (!internId || !supervisorId) {
      toast.error("Pilih intern dan supervisor terlebih dahulu");
      return;
    }

    const mutationPromise = mutateAsync();
    toast.promise(mutationPromise, {
      loading: "Memproses assignment...",
      success: (res) => {
        if (res.warning) {
          setTimeout(() => toast.warning(res.warning), 2000);
        }
        return "Supervisor berhasil di-assign ke Intern";
      },
      error: (error) =>
        error instanceof Error ? error.message : "Gagal meng-assign supervisor",
    });

    try {
      await mutationPromise;
      queryClient.invalidateQueries({ queryKey: ["supervisors"] });
      queryClient.invalidateQueries({ queryKey: ["interns"] });
      setInternId("");
      setSupervisorId("");
    } catch {}
  }

  const selectedSupervisor = supervisors.find((s) => s.id === supervisorId);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2">
        <ClipboardList className="size-4 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Quick Assign</h3>
      </div>

      {/* Section 1 - Pilih Intern */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Pilih Intern (Tanpa Supervisor)
        </label>
        <Select
          value={internId}
          onValueChange={(val) => setInternId(val ?? "")}
        >
          <SelectTrigger
            className="w-full border-0 bg-muted px-4 py-2.5 data-placeholder:text-muted-foreground"
            value={internId}
          >
            <SelectValue placeholder="Pilih Peserta Magang...">
              {(value: string | null) =>
                value ? (interns.find((i) => i.id === value)?.name ?? value) : null
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {interns.length === 0 && (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                Semua intern sudah memiliki supervisor
              </div>
            )}
            {interns.map((intern) => (
              <SelectItem key={intern.id} value={intern.id}>
                <div className="flex flex-col">
                  <span>{intern.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {intern.institution}
                    {intern.teamName ? ` - ${intern.teamName}` : ""}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Connector */}
      <div className="flex justify-center py-1">
        <ArrowDownIcon className="size-4 text-muted-foreground/40" />
      </div>

      {/* Section 2 - Assign ke Supervisor */}
      <div className="mb-5">
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Assign ke Supervisor
        </label>
        <Select
          value={supervisorId}
          onValueChange={(val) => setSupervisorId(val ?? "")}
        >
          <SelectTrigger
            className="w-full border-0 bg-muted px-4 py-2.5 data-placeholder:text-muted-foreground"
            value={supervisorId}
          >
            <SelectValue placeholder="Pilih Supervisor...">
              {(value: string | null) =>
                value
                  ? (supervisors.find((s) => s.id === value)?.name ?? value)
                  : null
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {supervisors.map((sup) => {
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
        {selectedSupervisor &&
          selectedSupervisor.currentCount >= selectedSupervisor.maxInterns && (
            <p className="mt-1 text-[11px] text-amber-600">
              Supervisor ini sudah mencapai batas maksimal intern
            </p>
          )}
      </div>

      {/* Button */}
      <Button
        onClick={onSubmit}
        disabled={isPending || !internId || !supervisorId}
        className="w-full gap-2"
      >
        {isPending && <Loader2Icon className="size-4 animate-spin" />}
        {isPending ? "Memproses..." : "Proses Assignment"}
      </Button>
    </div>
  );
}
