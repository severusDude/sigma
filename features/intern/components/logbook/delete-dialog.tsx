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

import { deleteLogbook } from "../../actions/logbook-actions";
import type { Logbook } from "../../types/logbook-types";

interface DeleteDialogProps {
  logbook: Logbook | null;
  onClose: () => void;
}

export function DeleteDialog({ logbook, onClose }: DeleteDialogProps) {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["delete-logbook", logbook?.id],
    mutationFn: async () => {
      if (!logbook) return;
      const res = await deleteLogbook(logbook.id);
      if (!res.success) throw new Error(res.error);
    },
  });

  async function onConfirm() {
    const mutationPromise = mutateAsync();
    toast.promise(mutationPromise, {
      loading: "Menghapus logbook...",
      success: "Logbook berhasil dihapus",
      error: (error) =>
        error instanceof Error ? error.message : "Gagal menghapus logbook",
    });
    try {
      await mutationPromise;
      queryClient.invalidateQueries({ queryKey: ["logbooks"] });
      onClose();
    } catch {}
  }

  return (
    <AlertDialog open={!!logbook} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Logbook</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus entri logbook ini? Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="gap-2"
          >
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            {isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
