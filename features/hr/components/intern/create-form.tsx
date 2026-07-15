"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createInternSchema, type CreateInternInput } from "../../schemas/intern-schemas";
import { createIntern } from "../../actions/intern-actions";
import { InternFormFields } from "./form-fields";

interface CreateInternFormProps {
  departmentOptions: { id: string; name: string }[];
  onSuccess: () => void;
}

export function CreateInternForm({ departmentOptions, onSuccess }: CreateInternFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<CreateInternInput>({
    resolver: zodResolver(createInternSchema) as any,
    mode: "onChange",
    defaultValues: { status: "active" as const },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["create-intern"],
    mutationFn: async (values: CreateInternInput) => {
      const res = await createIntern(values);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  async function onSubmit() {
    const mutationPromise = mutateAsync(form.getValues());
    toast.promise(mutationPromise, {
      loading: "Menyimpan data intern...",
      success: "Intern berhasil ditambahkan",
      error: (error) => error instanceof Error ? error.message : "Gagal menambahkan intern",
    });
    try {
      await mutationPromise;
      queryClient.invalidateQueries({ queryKey: ["interns"] });
      onSuccess();
    } catch {}
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <InternFormFields control={form.control} departmentOptions={departmentOptions} />
      <Button type="submit" disabled={isPending} className="gap-2 w-full">
        {isPending && <Loader2Icon className="h-4 w-4 animate-spin" />}
        {isPending ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}
