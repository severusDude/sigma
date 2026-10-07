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
import { deactivateIntern } from "../../actions/intern-actions";

interface DeactivateDialogProps {
  intern: Intern | null;
  onClose: () => void;
}

export function DeactivateDialog({ intern, onClose }: DeactivateDialogProps) {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["deactivate-intern", intern?.id],
    mutationFn: async () => {
      if (!intern) return;
      const res = await deactivateIntern(intern.id);
      if (!res.success) throw new Error(res.error);
    },
  });

  async function onConfirm() {
    const mutationPromise = mutateAsync();
    toast.promise(mutationPromise, {
      loading: "Menonaktifkan intern...",
      success: "Intern berhasil dinonaktifkan",
      error: (error) =>
        error instanceof Error ? error.message : "Gagal menonaktifkan intern",
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
          <AlertDialogTitle>Nonaktifkan Intern</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menonaktifkan{" "}
            <strong>{intern?.name}</strong>? Status akan berubah menjadi
            &quot;Ditarik&quot; dan akun tidak bisa login.
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
            {isPending ? "Menonaktifkan..." : "Nonaktifkan"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
