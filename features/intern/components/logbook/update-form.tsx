"use client";

import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";

import { LogbookFormFields } from "./form-fields";
import { updateLogbook } from "../../actions/logbook-actions";
import type { Logbook } from "../../types/logbook-types";
import {
  updateLogbookSchema,
  type UpdateLogbookInput,
} from "../../schemas/logbook-schemas";

interface UpdateLogbookFormProps {
  logbook: Logbook;
  issueOptions?: { id: string; title: string }[];
  onSuccess: () => void;
}

export function UpdateLogbookForm({
  logbook,
  issueOptions,
  onSuccess,
}: UpdateLogbookFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<UpdateLogbookInput>({
    resolver: zodResolver(updateLogbookSchema),
    mode: "onChange",
    defaultValues: {
      date: logbook.date ? new Date(logbook.date) : undefined,
      activity: logbook.activity,
      duration: logbook.duration || 0,
      issueId: logbook.issueId || "",
      notes: logbook.notes || "",
    },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["update-logbook", logbook.id],
    mutationFn: async (values: UpdateLogbookInput) => {
      const res = await updateLogbook(logbook.id, values);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Logbook[]>(["logbooks"], (old) => {
        if (!old) return [data];
        return old.map((item) => (item.id === data.id ? data : item));
      });
      queryClient.invalidateQueries({ queryKey: ["logbooks"] });
    },
  });

  async function onSubmit() {
    const values = form.getValues();
    const mutationPromise = mutateAsync(values).then(() => onSuccess());
    toast.promise(mutationPromise, {
      loading: "Memperbarui logbook...",
      success: "Logbook berhasil diperbarui",
      error: (error) =>
        error instanceof Error ? error.message : "Gagal memperbarui logbook",
    });
    try {
      await mutationPromise;
    } catch {}
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <LogbookFormFields control={form.control} issueOptions={issueOptions} />
      <footer className="flex justify-end w-full gap-2">
        <Button
          variant="outline"
          type="reset"
          disabled={isPending}
          onClick={() => form.reset()}
          className="px-4 space-x-2"
        >
          Reset
        </Button>
        <Button type="submit" disabled={isPending} className="px-8 space-x-2">
          {isPending && <Loader2Icon className="size-4 animate-spin" />}
          {isPending ? "Menyimpan..." : "Perbarui"}
        </Button>
      </footer>
    </form>
  );
}
