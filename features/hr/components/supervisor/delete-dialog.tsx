"use client";

import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { Supervisor } from "../../types/supervisor-types";
import { deleteSupervisor } from "../../actions/supervisor-actions";

interface DeleteDialogProps {
  supervisor: Supervisor | null;
  onClose: () => void;
}

export function DeleteDialog({ supervisor, onClose }: DeleteDialogProps) {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["delete-supervisor", supervisor?.id],
    mutationFn: async () => {
      if (!supervisor) return;
      const res = await deleteSupervisor(supervisor.id);
      if (!res.success) throw new Error(res.error);
    },
  });

  async function onConfirm() {
    const mutationPromise = mutateAsync();
    toast.promise(mutationPromise, {
      loading: "Menghapus supervisor...",
      success: "Supervisor berhasil dihapus",
      error: (error) =>
        error instanceof Error ? error.message : "Gagal menghapus supervisor",
    });
    try {
      await mutationPromise;
      queryClient.invalidateQueries({ queryKey: ["supervisors"] });
      onClose();
    } catch {}
  }

  return (
    <AlertDialog open={!!supervisor} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Supervisor</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus <strong>{supervisor?.name}</strong>?
            Data yang dihapus dapat dipulihkan oleh admin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="gap-2"
          >
            {isPending && <Loader2Icon className="h-4 w-4 animate-spin" />}
            {isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
