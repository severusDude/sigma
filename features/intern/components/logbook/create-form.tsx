"use client";

import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useStorageToast } from "@/hooks/use-storage-toast";

import { LogbookFormFields } from "./form-fields";
import type { Logbook } from "../../types/logbook-types";
import { createLogbook } from "../../actions/logbook-actions";
import {
  logbookFormSchema,
  type LogbookFormInput,
} from "../../schemas/logbook-schemas";

interface CreateLogbookFormProps {
  issueOptions: { id: string; title: string }[];
  onSuccess: () => void;
}

export function CreateLogbookForm({
  issueOptions,
  onSuccess,
}: CreateLogbookFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<LogbookFormInput>({
    resolver: zodResolver(logbookFormSchema),
    mode: "onChange",
    defaultValues: {
      date: (() => {
        const d = new Date();
        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      })(),
      activity: "",
      startTime: "08:00",
      endTime: "16:00",
      issueId: "",
      notes: "",
    },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["create-logbook"],
    mutationFn: async (values: LogbookFormInput) => {
      const [sh, sm] = values.startTime.split(":").map(Number);
      const [eh, em] = values.endTime.split(":").map(Number);
      const duration = eh * 60 + em - (sh * 60 + sm);
      const res = await createLogbook({ ...values, duration });
      if (!res.success) throw res;
      return res.data!;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Logbook[]>(["logbooks"], (old) => {
        const list = old ?? [];
        return [data, ...list];
      });
      queryClient.invalidateQueries({ queryKey: ["logbooks"] });
    },
  });

  const { execute } = useStorageToast();

  async function onSubmit() {
    const values = form.getValues();
    await execute(
      async () => {
        const data = await mutateAsync(values);
        return { success: true, data } as const;
      },
      {
        loading: "Menyimpan logbook...",
        success: "Logbook berhasil ditambahkan",
        onSuccess: () => onSuccess(),
      },
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <LogbookFormFields control={form.control} issueOptions={issueOptions} />
      <footer className="flex items-center justify-end w-full gap-2 pt-4">
        <Button
          type="reset"
          variant="outline"
          disabled={isPending}
          className="px-4"
        >
          Reset
        </Button>
        <Button type="submit" disabled={isPending} className="px-8 space-x-2">
          {isPending && <Spinner />}
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </footer>
    </form>
  );
}
