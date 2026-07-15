"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updateInternSchema, type UpdateInternInput } from "../../schemas/intern-schemas";
import { updateIntern } from "../../actions/intern-actions";
import { InternFormFields } from "./form-fields";
import type { InternWithRelations } from "../../types/intern-types";

interface UpdateInternFormProps {
  intern: InternWithRelations;
  departmentOptions: { id: string; name: string }[];
  onSuccess: () => void;
}

export function UpdateInternForm({ intern, departmentOptions, onSuccess }: UpdateInternFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<UpdateInternInput>({
    resolver: zodResolver(updateInternSchema) as any,
    mode: "onChange",
  });

  useEffect(() => {
    form.reset({
      name: intern.user.name,
      nik: intern.nik,
      institution: intern.institution,
      phone: intern.phone || "",
      email: intern.email || "",
      departmentId: intern.departmentId || "",
      periodStart: intern.periodStart,
      periodEnd: intern.periodEnd,
      status: intern.status,
    });
  }, [intern, form]);

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["update-intern", intern.id],
    mutationFn: async (values: UpdateInternInput) => {
      const res = await updateIntern(intern.id, values);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  async function onSubmit() {
    const mutationPromise = mutateAsync(form.getValues());
    toast.promise(mutationPromise, {
      loading: "Memperbarui data intern...",
      success: "Data intern berhasil diperbarui",
      error: (error) => error instanceof Error ? error.message : "Gagal memperbarui intern",
    });
    try {
      await mutationPromise;
      queryClient.invalidateQueries({ queryKey: ["interns"] });
      onSuccess();
    } catch {}
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <InternFormFields control={form.control as any} departmentOptions={departmentOptions} />
      <Button type="submit" disabled={isPending} className="gap-2 w-full">
        {isPending && <Loader2Icon className="h-4 w-4 animate-spin" />}
        {isPending ? "Menyimpan..." : "Perbarui"}
      </Button>
    </form>
  );
}
