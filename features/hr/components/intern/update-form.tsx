"use client";

import { useState } from "react";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Loader2Icon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { InternFormFields } from "./form-fields";
import { updateIntern } from "../../actions/intern-actions";
import type { Intern } from "../../types/intern-types";
import {
  type UpdateInternInput,
  updateInternSchema,
} from "../../schemas/intern-schemas";

interface UpdateInternFormProps {
  intern: Intern;
  departmentOptions: { id: string; name: string }[];
  onSuccess: () => void;
}

export function UpdateInternForm({
  intern,
  departmentOptions,
  onSuccess,
}: UpdateInternFormProps) {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<DateRange | undefined>({
    from: intern.internProfile!.periodStart ?? undefined,
    to: intern.internProfile!.periodEnd ?? undefined,
  });

  const form = useForm<UpdateInternInput>({
    resolver: zodResolver(updateInternSchema),
    mode: "onChange",
    defaultValues: {
      name: intern.name,
      nik: intern.internProfile!.nik,
      institution: intern.internProfile!.institution,
      phone: intern.internProfile!.phone || "",
      email: intern.email || "",
      departmentId: intern.internProfile!.departmentId || "",
      periodStart: intern.internProfile!.periodStart,
      periodEnd: intern.internProfile!.periodEnd,
      status: intern.internProfile!.status,
    },
  });

  const periodStart = form.watch("periodStart");
  const periodEnd = form.watch("periodEnd");
  const periodValue = {
    from: periodStart ? new Date(periodStart) : undefined,
    to: periodEnd ? new Date(periodEnd) : undefined,
  };

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["update-intern", intern.id],
    mutationFn: async (values: UpdateInternInput) => {
      const res = await updateIntern(intern.id, values);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  async function onSubmit() {
    const values = form.getValues();
    if (period?.from) values.periodStart = period.from;
    if (period?.to) values.periodEnd = period.to;

    const mutationPromise = mutateAsync(values);
    toast.promise(mutationPromise, {
      loading: "Memperbarui data intern...",
      success: "Data intern berhasil diperbarui",
      error: (error) =>
        error instanceof Error ? error.message : "Gagal memperbarui intern",
    });
    try {
      await mutationPromise;
      queryClient.invalidateQueries({ queryKey: ["interns"] });
      onSuccess();
    } catch {}
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <InternFormFields
        control={form.control}
        departmentOptions={departmentOptions}
        periodValue={periodValue}
        onPeriodChange={(range) => {
          setPeriod(range);
          if (range?.from)
            form.setValue("periodStart", range.from, { shouldValidate: true });
          if (range?.to)
            form.setValue("periodEnd", range.to, { shouldValidate: true });
        }}
      />
      <footer className="flex gap-2 justify-end">
        <Button type="reset" disabled={isPending} variant="outline">
          Reset
        </Button>
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending && <Loader2Icon className="h-4 w-4 animate-spin" />}
          {isPending ? "Menyimpan..." : "Perbarui"}
        </Button>
      </footer>
    </form>
  );
}
