"use client";

import { useState } from "react";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { IssueStatus } from "@/generated/prisma/enums";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { IssueFormFields } from "./form-fields";
import type { Issue } from "../../types/issue-types";
import { updateIssue } from "../../actions/issue-actions";
import {
  issueFormSchema,
  type IssueFormInput,
} from "../../schemas/issue-schemas";

interface InternOption {
  id: string;
  name: string;
}

interface UpdateIssueFormProps {
  issue: Issue;
  internOptions: InternOption[];
  onSuccess: () => void;
}

export function UpdateIssueForm({
  issue,
  internOptions,
  onSuccess,
}: UpdateIssueFormProps) {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<DateRange | undefined>({
    from: issue.startDate ?? undefined,
    to: issue.endDate ?? undefined,
  });

  const form = useForm<IssueFormInput>({
    resolver: zodResolver(issueFormSchema),
    mode: "onChange",
    defaultValues: {
      title: issue.title,
      description: issue.description ?? "",
      internProfileId: issue.internProfile?.id ?? "",
      startDate: issue.startDate ?? undefined,
      endDate: issue.endDate ?? undefined,
      status: issue.status,
    },
  });

  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");
  const periodValue: DateRange = {
    from: startDate ? new Date(startDate) : undefined,
    to: endDate ? new Date(endDate) : undefined,
  };

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["update-issue", issue.id],
    mutationFn: async (values: IssueFormInput) => {
      const res = await updateIssue(issue.id, {
        title: values.title,
        description: values.description || undefined,
        internProfileId: values.internProfileId || undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
        status: values.status as IssueStatus | undefined,
      });
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Issue[]>(["issues"], (old) => {
        const list = old ?? [];
        return list.map((i) => (i.id === data.id ? data : i));
      });
      queryClient.invalidateQueries({ queryKey: ["issues"] });
    },
  });

  async function onSubmit() {
    const values = form.getValues();
    if (period?.from) values.startDate = period.from;
    if (period?.to) values.endDate = period.to;

    const mutationPromise = mutateAsync(values);
    toast.promise(mutationPromise, {
      loading: "Memperbarui rencana kegiatan...",
      success: "Rencana kegiatan berhasil diperbarui",
      error: (error) =>
        error instanceof Error
          ? error.message
          : "Gagal memperbarui rencana kegiatan",
    });
    try {
      await mutationPromise;
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      onSuccess();
    } catch {}
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <IssueFormFields
        control={form.control}
        internOptions={internOptions}
        periodValue={periodValue}
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
