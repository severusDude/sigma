"use client";

import { useState } from "react";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { IssueFormFields } from "./form-fields";
import type { Issue } from "../../types/issue-types";
import { createIssue } from "../../actions/issue-actions";
import {
  issueFormSchema,
  type IssueFormInput,
} from "../../schemas/issue-schemas";

interface InternOption {
  id: string;
  name: string;
}

interface CreateIssueFormProps {
  internOptions: InternOption[];
  onSuccess: () => void;
}

export function CreateIssueForm({
  internOptions,
  onSuccess,
}: CreateIssueFormProps) {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  const form = useForm<IssueFormInput>({
    resolver: zodResolver(issueFormSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      internProfileId: "",
      startDate: undefined,
      endDate: undefined,
    },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["create-issue"],
    mutationFn: async (values: IssueFormInput) => {
      const res = await createIssue({
        title: values.title,
        description: values.description || undefined,
        internProfileId: values.internProfileId || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
      });
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Issue[]>(["issues"], (old) => {
        const list = old ?? [];
        return [data, ...list];
      });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });

  async function onSubmit() {
    const values = form.getValues();
    if (period?.from) values.startDate = period.from;
    if (period?.to) values.endDate = period.to;

    const mutationPromise = mutateAsync(values as IssueFormInput);
    toast.promise(mutationPromise, {
      loading: "Menyimpan rencana kegiatan...",
      success: "Rencana kegiatan berhasil dibuat",
      error: (error) =>
        error instanceof Error
          ? error.message
          : "Gagal membuat rencana kegiatan",
    });
    try {
      await mutationPromise;
      onSuccess();
    } catch {}
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <IssueFormFields
        control={form.control}
        internOptions={internOptions}
        periodValue={period}
        onPeriodChange={(range) => {
          setPeriod(range);
          if (range?.from)
            form.setValue("startDate", range.from, { shouldValidate: true });
          if (range?.to)
            form.setValue("endDate", range.to, { shouldValidate: true });
        }}
      />
      <footer className="flex items-center justify-end w-full gap-2 pt-4">
        <Button
          type="reset"
          variant="outline"
          disabled={isPending}
          className="px-4"
          onClick={() => form.reset()}
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
