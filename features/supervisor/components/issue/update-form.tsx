"use client";

import z from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";

import { SelectItemType } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { IssueStatus } from "@/generated/prisma/enums";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { IssueFormFields } from "./form-fields";
import type { Issue } from "../../types/issue-types";
import { updateIssue } from "../../actions/issue-actions";

interface InternOption {
  id: string;
  name: string;
}

interface UpdateIssueFormProps {
  issue: Issue;
  internOptions: InternOption[];
  onSuccess: () => void;
}

const updateFormSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  description: z.string().optional(),
  internProfileId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
});

type UpdateFormInput = z.infer<typeof updateFormSchema>;

const statusOptions: SelectItemType<IssueStatus>[] = [
  { value: IssueStatus.active, label: "Aktif" },
  { value: IssueStatus.completed, label: "Selesai" },
  { value: IssueStatus.cancelled, label: "Dibatalkan" },
];

export function UpdateIssueForm({
  issue,
  internOptions,
  onSuccess,
}: UpdateIssueFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<UpdateFormInput>({
    resolver: zodResolver(updateFormSchema),
    mode: "onChange",
    defaultValues: {
      title: issue.title,
      description: issue.description ?? "",
      internProfileId: issue.internProfile?.id ?? "",
      startDate: issue.startDate
        ? new Date(issue.startDate).toISOString().split("T")[0]
        : "",
      endDate: issue.endDate
        ? new Date(issue.endDate).toISOString().split("T")[0]
        : "",
      status: issue.status,
    },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["update-issue", issue.id],
    mutationFn: async (values: UpdateFormInput) => {
      const res = await updateIssue(issue.id, {
        title: values.title,
        description: values.description || undefined,
        internProfileId: values.internProfileId || undefined,
        startDate: values.startDate ? new Date(values.startDate) : undefined,
        endDate: values.endDate ? new Date(values.endDate) : undefined,
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
    const mutationPromise = mutateAsync(values).then(() => onSuccess());
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
    } catch {}
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="edit-status">Status</Label>
        <Select
          items={statusOptions}
          value={form.watch("status")}
          onValueChange={(val) => form.setValue("status", val ?? "")}
        >
          <SelectTrigger id="edit-status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {statusOptions.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <IssueFormFields control={form.control} internOptions={internOptions} />

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
