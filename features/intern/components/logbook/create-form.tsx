"use client";

import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";

import { LogbookFormFields } from "./form-fields";
import { createLogbook } from "../../actions/logbook-actions";
import {
  createLogbookSchema,
  type CreateLogbookInput,
} from "../../schemas/logbook-schemas";

interface CreateLogbookFormProps {
  issueOptions?: { id: string; title: string }[];
  onSuccess: () => void;
}

export function CreateLogbookForm({ issueOptions, onSuccess }: CreateLogbookFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<CreateLogbookInput>({
    resolver: zodResolver(createLogbookSchema),
    mode: "onChange",
    defaultValues: {
      date: undefined,
      activity: "",
      duration: undefined,
      issueId: "",
      notes: "",
    },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["create-logbook"],
    mutationFn: async (values: CreateLogbookInput) => {
      const res = await createLogbook(values);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  async function onSubmit() {
    const values = form.getValues();
    const mutationPromise = mutateAsync(values);
    toast.promise(mutationPromise, {
      loading: "Menyimpan logbook...",
      success: "Logbook berhasil ditambahkan",
      error: (error) =>
        error instanceof Error ? error.message : "Gagal menambahkan logbook",
    });
    try {
      await mutationPromise;
      await queryClient.invalidateQueries({ queryKey: ["logbooks"] });
      onSuccess();
    } catch {}
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <LogbookFormFields control={form.control} issueOptions={issueOptions} />
      <Button type="submit" disabled={isPending} className="gap-2 w-full">
        {isPending && <Loader2Icon className="size-4 animate-spin" />}
        {isPending ? "Menyimpan..." : "Simpan"}
      </Button>
    </form>
  );
}
