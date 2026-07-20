"use client";

import { toast } from "sonner";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { LogbookFormFields } from "./form-fields";
import type { Logbook } from "../../types/logbook-types";
import { updateLogbook } from "../../actions/logbook-actions";
import {
  logbookFormSchema,
  type LogbookFormInput,
} from "../../schemas/logbook-schemas";

interface UpdateLogbookFormProps {
  logbook: Logbook;
  issueOptions?: { id: string; title: string }[];
  onSuccess: () => void;
}

function computeEndTime(duration: number): string {
  const startMinutes = 8 * 60;
  const endMinutes = startMinutes + duration;
  const h = Math.floor(endMinutes / 60);
  const m = endMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function UpdateLogbookForm({
  logbook,
  issueOptions,
  onSuccess,
}: UpdateLogbookFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<LogbookFormInput>({
    resolver: zodResolver(logbookFormSchema),
    mode: "onChange",
    defaultValues: {
      date: logbook.date ? new Date(logbook.date) : undefined,
      activity: logbook.activity,
      startTime: "08:00",
      endTime: computeEndTime(logbook.duration || 480),
      issueId: logbook.issueId || "",
      notes: logbook.notes || "",
    },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["update-logbook", logbook.id],
    mutationFn: async (values: LogbookFormInput) => {
      const [sh, sm] = values.startTime.split(":").map(Number);
      const [eh, em] = values.endTime.split(":").map(Number);
      const duration = eh * 60 + em - (sh * 60 + sm);
      const res = await updateLogbook(logbook.id, { ...values, duration });
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
          {isPending && <Spinner />}
          {isPending ? "Menyimpan..." : "Perbarui"}
        </Button>
      </footer>
    </form>
  );
}
