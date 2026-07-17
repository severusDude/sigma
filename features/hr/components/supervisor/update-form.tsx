"use client";

import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { SupervisorFormFields } from "./form-fields";
import { updateSupervisor } from "../../actions/supervisor-actions";
import type { Supervisor } from "../../types/supervisor-types";
import {
  type UpdateSupervisorInput,
  updateSupervisorSchema,
} from "../../schemas/supervisor-schemas";

interface UpdateSupervisorFormProps {
  supervisor: Supervisor;
  onSuccess: () => void;
}

export function UpdateSupervisorForm({
  supervisor,
  onSuccess,
}: UpdateSupervisorFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<UpdateSupervisorInput>({
    resolver: zodResolver(updateSupervisorSchema),
    mode: "onChange",
    defaultValues: {
      name: supervisor.name,
      nip: supervisor.supervisorProfile!.nip,
      field: supervisor.supervisorProfile!.field,
      phone: supervisor.supervisorProfile!.phone || "",
      email: supervisor.email || "",
      maxInterns: supervisor.supervisorProfile!.maxInterns,
    },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["update-supervisor", supervisor.id],
    mutationFn: async (values: UpdateSupervisorInput) => {
      const res = await updateSupervisor(supervisor.id, values);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  async function onSubmit() {
    const values = form.getValues();

    const mutationPromise = mutateAsync(values);
    toast.promise(mutationPromise, {
      loading: "Memperbarui data supervisor...",
      success: "Data supervisor berhasil diperbarui",
      error: (error) =>
        error instanceof Error ? error.message : "Gagal memperbarui supervisor",
    });
    try {
      await mutationPromise;
      queryClient.invalidateQueries({ queryKey: ["supervisors"] });
      onSuccess();
    } catch {}
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <SupervisorFormFields
        control={form.control}
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
