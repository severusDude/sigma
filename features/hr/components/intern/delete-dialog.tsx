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

import type { Intern } from "../../types/intern-types";
import { deleteIntern } from "../../actions/intern-actions";

interface DeleteDialogProps {
  intern: Intern | null;
  onClose: () => void;
}

export function DeleteDialog({ intern, onClose }: DeleteDialogProps) {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["delete-intern", intern?.id],
    mutationFn: async () => {
      if (!intern) return;
      const res = await deleteIntern(intern.id);
      if (!res.success) throw new Error(res.error);
    },
  });

  async function onConfirm() {
    const mutationPromise = mutateAsync();
    toast.promise(mutationPromise, {
      loading: "Menghapus intern...",
      success: "Intern berhasil dihapus",
      error: (error) =>
        error instanceof Error ? error.message : "Gagal menghapus intern",
    });
    try {
      await mutationPromise;
      queryClient.invalidateQueries({ queryKey: ["interns"] });
      onClose();
    } catch {}
  }

  return (
    <AlertDialog open={!!intern} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Intern</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus <strong>{intern?.name}</strong>?
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
