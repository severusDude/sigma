"use client";

import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { Issue } from "../../types/issue-types";
import { deleteIssue } from "../../actions/issue-actions";

interface DeleteDialogProps {
  issue: Issue | null;
  onClose: () => void;
}

export function DeleteDialog({ issue, onClose }: DeleteDialogProps) {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["delete-issue", issue?.id],
    mutationFn: async () => {
      if (!issue) return;
      const res = await deleteIssue(issue.id);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.setQueryData<Issue[]>(["issues"], (old) => {
        const list = old ?? [];
        return list.filter((i) => i.id !== issue?.id);
      });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });

  async function handleDelete() {
    if (!issue) return;
    const mutationPromise = mutateAsync().then(() => onClose());
    toast.promise(mutationPromise, {
      loading: "Menghapus rencana kegiatan...",
      success: "Rencana kegiatan berhasil dihapus",
      error: (error) =>
        error instanceof Error
          ? error.message
          : "Gagal menghapus rencana kegiatan",
    });
    try {
      await mutationPromise;
    } catch {}
  }

  return (
    <AlertDialog open={!!issue} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2Icon className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Hapus Rencana Kegiatan?</AlertDialogTitle>
          <AlertDialogDescription>
            {issue?._count.logbooks && issue._count.logbooks > 0 ? (
              <span>
                Rencana kegiatan <strong>&ldquo;{issue?.title}&rdquo;</strong>{" "}
                memiliki {issue._count.logbooks} entri logbook terkait. Tidak
                dapat dihapus. Ubah status menjadi &ldquo;Dibatalkan&rdquo; jika
                tidak digunakan.
              </span>
            ) : (
              <span>
                Yakin ingin menghapus rencana kegiatan{" "}
                <strong>&ldquo;{issue?.title}&rdquo;</strong>? Tindakan ini
                tidak dapat dibatalkan.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending || (issue?._count.logbooks ?? 0) > 0}
            onClick={handleDelete}
          >
            {isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
