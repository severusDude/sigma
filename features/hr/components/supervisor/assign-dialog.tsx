"use client";

import { useEffect } from "react";
import { PlusIcon, Trash2Icon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useIsMobile } from "@/hooks/use-mobile";
import type {
  UnassignedIntern,
  ActiveSupervisorOption,
} from "../../types/supervisor-types";
import { assignMultipleInterns } from "../../actions/supervisor-actions";
import {
  assignMultipleSchema,
  type AssignMultipleInput,
} from "../../schemas/supervisor-schemas";

interface AssignDialogProps {
  open: boolean;
  onClose: () => void;
  interns: UnassignedIntern[];
  supervisors: ActiveSupervisorOption[];
}

export function AssignDialog({
  open,
  onClose,
  interns,
  supervisors,
}: AssignDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<AssignMultipleInput>({
    resolver: zodResolver(assignMultipleSchema),
    mode: "onChange",
    defaultValues: {
      supervisorProfileId: "",
      interns: [{ internProfileId: "" }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "interns",
  });

  const supervisorId = form.watch("supervisorProfileId");

  useEffect(() => {
    if (supervisorId) {
      replace([{ internProfileId: "" }]);
    }
  }, [supervisorId, replace]);

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["assign-multiple"],
    mutationFn: async (values: AssignMultipleInput) => {
      const res = await assignMultipleInterns(values);
      if (!res.success) throw new Error(res.error);
      return res;
    },
  });

  async function onSubmit() {
    const values = form.getValues();

    const mutationPromise = mutateAsync(values);
    toast.promise(mutationPromise, {
      loading: "Memproses assignment...",
      success: (res) => {
        if (res.warning) {
          setTimeout(() => toast.warning(res.warning), 2000);
        }
        return "Intern berhasil di-assign ke Supervisor";
      },
      error: (error) =>
        error instanceof Error ? error.message : "Gagal meng-assign intern",
    });

    try {
      await mutationPromise;
      queryClient.invalidateQueries({ queryKey: ["supervisors"] });
      queryClient.invalidateQueries({ queryKey: ["interns"] });
      form.reset();
      onClose();
    } catch {}
  }

  const isMobile = useIsMobile();

  const selectedSupervisor = supervisors.find(
    (s) => s.id === supervisorId,
  );

  const formContent = (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <Controller
        name="supervisorProfileId"
        control={form.control}
        render={({ field, fieldState }) => (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Pilih Supervisor
            </label>
            <Select
              value={field.value}
              onValueChange={(val) => field.onChange(val ?? "")}
            >
              <SelectTrigger
                className="w-full border-0 bg-muted px-4 py-2.5 data-placeholder:text-muted-foreground"
                value={field.value}
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder="Pilih Supervisor...">
                  {(value: string | null) =>
                    value
                      ? (supervisors.find((s) => s.id === value)?.name ?? value)
                      : null
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {supervisors.map((sup) => {
                  const isFull = sup.currentCount >= sup.maxInterns;
                  return (
                    <SelectItem key={sup.id} value={sup.id}>
                      <div className="flex flex-col">
                        <span>{sup.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {sup.nip} · {sup.currentCount}/{sup.maxInterns} intern
                          {isFull ? " (Penuh)" : ""}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {fieldState.error && (
              <p className="text-xs text-destructive">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />

      {supervisorId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">
              Daftar Intern
            </label>
          </div>

          {fields.map((fieldItem, index) => {
            const takenInternIds = fields
              .map((f, i) =>
                i !== index ? (f as { internProfileId: string }).internProfileId : null,
              )
              .filter((id): id is string => id !== null && id !== "");

            const availableInterns = interns.filter(
              (intern) => !takenInternIds.includes(intern.id),
            );

            return (
              <div key={fieldItem.id} className="flex items-center gap-2">
                <div className="flex-1 space-y-1.5">
                  <Controller
                    name={`interns.${index}.internProfileId`}
                    control={form.control}
                    render={({ field: internField, fieldState: internFieldState }) => (
                      <>
                        <Select
                          value={internField.value}
                          onValueChange={(val) => internField.onChange(val ?? "")}
                        >
                          <SelectTrigger
                            className="w-full border-0 bg-muted px-4 py-2.5 data-placeholder:text-muted-foreground"
                            value={internField.value}
                            aria-invalid={internFieldState.invalid}
                          >
                            <SelectValue placeholder="Pilih Intern...">
                              {(value: string | null) =>
                                value ? (interns.find((i) => i.id === value)?.name ?? value) : null
                              }
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent alignItemWithTrigger={false}>
                            {availableInterns.length === 0 && (
                              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                                Tidak ada intern tersedia
                              </div>
                            )}
                            {availableInterns.map((intern) => (
                              <SelectItem key={intern.id} value={intern.id}>
                                <div className="flex flex-col">
                                  <span>{intern.name}</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {intern.institution}
                                    {intern.teamName ? ` - ${intern.teamName}` : ""}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {internFieldState.error && (
                          <p className="text-xs text-destructive">{internFieldState.error.message}</p>
                        )}
                      </>
                    )}
                  />
                </div>

                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => remove(index)}
                    className="mb-0.5 shrink-0"
                  >
                    <Trash2Icon className="size-4 text-destructive" />
                  </Button>
                )}
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ internProfileId: "" })}
            className="w-full gap-2"
          >
            <PlusIcon className="size-4" />
            Tambah Intern
          </Button>
        </div>
      )}

      {supervisorId && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => { form.reset(); onClose(); }}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isPending || !form.formState.isValid} className="gap-2">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            {isPending ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      )}
    </form>
  );

  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="h-screen max-w-screen md:min-w-[calc(100%-32rem)] md:h-fit gap-0 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 space-y-1 border-b">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
              Assign Intern ke Supervisor
            </DialogTitle>
            <DialogDescription>
              Tetapkan beberapa intern sekaligus ke supervisor
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(100vh-12rem)]">
            <div className="px-6 py-6">{formContent}</div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Assign Intern ke Supervisor</DrawerTitle>
          <DrawerDescription>
            Tetapkan beberapa intern sekaligus ke supervisor
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-6 overflow-y-auto max-h-[calc(100dvh-12rem)]">
          {formContent}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
