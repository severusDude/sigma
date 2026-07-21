"use client";

import z from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { IssueFormFields } from "./form-fields";
import type { Issue } from "../../types/issue-types";
import { createIssue } from "../../actions/issue-actions";

interface InternOption {
  id: string;
  name: string;
}

interface CreateIssueFormProps {
  internOptions: InternOption[];
  onSuccess: () => void;
}

const issueFormSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  description: z.string().optional(),
  internProfileId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type IssueFormInput = z.infer<typeof issueFormSchema>;

export function CreateIssueForm({
  internOptions,
  onSuccess,
}: CreateIssueFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<IssueFormInput>({
    resolver: zodResolver(issueFormSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      internProfileId: "",
      startDate: "",
      endDate: "",
    },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["create-issue"],
    mutationFn: async (values: IssueFormInput) => {
      const res = await createIssue({
        title: values.title,
        description: values.description || undefined,
        internProfileId: values.internProfileId || undefined,
        startDate: values.startDate ? new Date(values.startDate) : undefined,
        endDate: values.endDate ? new Date(values.endDate) : undefined,
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
    const mutationPromise = mutateAsync(values).then(() => onSuccess());
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
    } catch {}
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <IssueFormFields control={form.control} internOptions={internOptions} />
      <footer className="flex items-center justify-end w-full gap-2 pt-4 border-t border-border">
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
