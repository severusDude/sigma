"use client";

import { useState } from "react";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { InternStatus } from "@/generated/prisma/enums";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { InternFormFields } from "./form-fields";
import { createIntern } from "../../actions/intern-actions";
import {
  createInternSchema,
  type CreateInternInput,
} from "../../schemas/intern-schemas";

interface CreateInternFormProps {
  teamOptions: { id: string; name: string }[];
  onSuccess: () => void;
}

export function CreateInternForm({
  teamOptions,
  onSuccess,
}: CreateInternFormProps) {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  const form = useForm({
    resolver: zodResolver(createInternSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      nik: "",
      institution: "",
      phone: "",
      email: "",
      periodStart: undefined,
      periodEnd: undefined,
      status: InternStatus.active,
    },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["create-intern"],
    mutationFn: async (values: CreateInternInput) => {
      const res = await createIntern(values);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });

  async function onSubmit() {
    const values = form.getValues();
    if (period?.from) values.periodStart = period.from;
    if (period?.to) values.periodEnd = period.to;

    const mutationPromise = mutateAsync(values as CreateInternInput);
    toast.promise(mutationPromise, {
      loading: "Menyimpan data intern...",
      success: "Intern berhasil ditambahkan",
      error: (error) =>
        error instanceof Error ? error.message : "Gagal menambahkan intern",
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
        teamOptions={teamOptions}
        periodValue={period}
        onPeriodChange={(range) => {
          setPeriod(range);
          if (range?.from)
            form.setValue("periodStart", range.from, {
              shouldValidate: true,
            });
          if (range?.to)
            form.setValue("periodEnd", range.to, { shouldValidate: true });
        }}
      />
      <footer className="flex gap-2 w-full justify-end">
        <Button
          type="reset"
          variant="outline"
          disabled={isPending}
          onClick={() => form.reset()}
          className="gap-2 px-6 py-4"
        >
          Reset
        </Button>
        <Button type="submit" disabled={isPending} className="gap-2 px-8 py-4">
          {isPending && <Spinner />}
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </footer>
    </form>
  );
}
