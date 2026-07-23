"use client";

import { toast } from "sonner";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { SupervisorFormFields } from "./form-fields";
import { createSupervisor } from "../../actions/supervisor-actions";
import {
  createSupervisorSchema,
  type CreateSupervisorInput,
} from "../../schemas/supervisor-schemas";

interface CreateSupervisorFormProps {
  onSuccess: () => void;
}

export function CreateSupervisorForm({ onSuccess }: CreateSupervisorFormProps) {
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(createSupervisorSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      nip: "",
      field: "",
      phone: "",
      email: "",
      maxInterns: 5,
    },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["create-supervisor"],
    mutationFn: async (values: CreateSupervisorInput) => {
      const res = await createSupervisor(values);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });

  async function onSubmit() {
    const values = form.getValues();

    const mutationPromise = mutateAsync(values as CreateSupervisorInput);
    toast.promise(mutationPromise, {
      loading: "Menyimpan data supervisor...",
      success: "Supervisor berhasil ditambahkan",
      error: (error) =>
        error instanceof Error ? error.message : "Gagal menambahkan supervisor",
    });
    try {
      await mutationPromise;

      queryClient.invalidateQueries({ queryKey: ["supervisors"] });
      onSuccess();
    } catch {}
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <SupervisorFormFields control={form.control} />
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
