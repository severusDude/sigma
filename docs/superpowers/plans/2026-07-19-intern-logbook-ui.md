# Intern Logbook UI Implementation Plan

**Goal:** Build the full UI layer for interns to manage their logbook entries — timeline view, create/update/detail/delete dialogs, stats cards.

**Architecture:** Client page component orchestrates state and data fetching via TanStack Query. Timeline cards grouped by week. CRUD dialogs follow the same pattern as HR intern CRUD. StatBlock for KPI cards. No DataTable.

**Tech Stack:** Next.js 16, React 19, TanStack Query 5, shadcn/ui, StatBlock component, date-fns, sonner, lucide-react.

## Global Constraints

- All UI components are `"use client"`
- Use existing `StatBlock` from `@/components/shared/stat-block`
- Use existing `Badge`, `Button`, `Dialog`, `AlertDialog`, `Card`, `Tabs`, `ScrollArea`, `Avatar` from shadcn/ui
- Mutations: `useMutation` + `toast.promise` + `queryClient.invalidateQueries({ queryKey: ['logbooks'] })`
- Data fetching: `useQuery({ queryKey: ['logbooks'], queryFn: () => getLogbooks() })`
- Date formatting: `date-fns` with `id` locale
- Week grouping: ISO week via `date-fns` `getISOWeek`, `format`
- All server actions already exist at `features/intern/actions/logbook-actions.ts`
- All types/schemas already exist

---

### Task 1: Create AlertBanner component

**Files:**
- Create: `features/intern/components/logbook/alert-banner.tsx`

- [ ] **Step 1: Create AlertBanner**

```tsx
"use client";

import { AlertTriangleIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AlertBannerProps {
  message: string;
  variant?: "warning" | "info";
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function AlertBanner({
  message,
  variant = "warning",
  action,
  className,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4",
        variant === "warning" &&
          "border-amber-200 bg-amber-50 text-amber-900",
        variant === "info" && "border-blue-200 bg-blue-50 text-blue-900",
        className,
      )}
    >
      <AlertTriangleIcon
        className={cn(
          "mt-0.5 size-5 shrink-0",
          variant === "warning" && "text-amber-600",
          variant === "info" && "text-blue-600",
        )}
      />
      <p className="flex-1 text-sm">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            "text-sm font-medium underline-offset-2 hover:underline",
            variant === "warning" && "text-amber-800",
            variant === "info" && "text-blue-800",
          )}
        >
          {action.label}
        </button>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/intern/components/logbook/alert-banner.tsx && git commit -m "feat: add AlertBanner for logbook warnings"
```

---

### Task 2: Create LogbookCard component

**Files:**
- Create: `features/intern/components/logbook/logbook-card.tsx`

- [ ] **Step 1: Create LogbookCard**

```tsx
"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  MoreHorizontalIcon,
  EyeIcon,
  PencilIcon,
  Trash2Icon,
  ClockIcon,
  MessageSquareIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Logbook } from "../../types/logbook-types";
import { LogbookStatus } from "@/generated/prisma/enums";

interface LogbookCardProps {
  logbook: Logbook;
  onView: (logbook: Logbook) => void;
  onEdit: (logbook: Logbook) => void;
  onDelete: (logbook: Logbook) => void;
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }
> = {
  [LogbookStatus.pending_review]: {
    label: "MENUNGGU REVIEW",
    variant: "outline",
    icon: <ClockIcon className="size-3.5 text-amber-600" />,
  },
  [LogbookStatus.approved]: {
    label: "DISETUJUI",
    variant: "default",
    icon: <CheckCircle2Icon className="size-3.5" />,
  },
  [LogbookStatus.revision]: {
    label: "REVISI",
    variant: "destructive",
    icon: <AlertCircleIcon className="size-3.5" />,
  },
};

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} Menit`;
  if (m === 0) return `${h} Jam`;
  return `${h} Jam ${m} Menit`;
}

export function LogbookCard({ logbook, onView, onEdit, onDelete }: LogbookCardProps) {
  const status = statusConfig[logbook.status] ?? statusConfig.pending_review;

  return (
    <Card className="border-l-4 border-l-transparent hover:border-l-muted-foreground/20 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2 min-w-0">
            {/* Date + Duration + Status */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-foreground">
                {format(new Date(logbook.date), "EEEE, d MMMM yyyy", { locale: id })}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDuration(logbook.duration)}
              </span>
              <Badge variant={status.variant} className="gap-1">
                {status.icon}
                {status.label}
              </Badge>
            </div>

            {/* Title */}
            <p className="text-sm font-semibold">
              {logbook.issue?.title || "Kegiatan Harian"}
            </p>

            {/* Activity */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {logbook.activity}
            </p>

            {/* Supervisor note (for revision) */}
            {logbook.notes && logbook.status === LogbookStatus.revision && (
              <div className="flex gap-2 rounded-md bg-muted p-3 mt-2">
                <MessageSquareIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Catatan Pembimbing
                  </p>
                  <p className="text-sm text-foreground">{logbook.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="size-8 shrink-0">
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(logbook)}>
                <EyeIcon className="mr-2 size-4" />
                Detail
              </DropdownMenuItem>
              {logbook.status !== LogbookStatus.approved && (
                <DropdownMenuItem onClick={() => onEdit(logbook)}>
                  <PencilIcon className="mr-2 size-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {logbook.status === LogbookStatus.pending_review && (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(logbook)}
                >
                  <Trash2Icon className="mr-2 size-4" />
                  Hapus
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/intern/components/logbook/logbook-card.tsx && git commit -m "feat: add LogbookCard timeline entry component"
```

---

### Task 3: Create WeekGroup component

**Files:**
- Create: `features/intern/components/logbook/week-group.tsx`

- [ ] **Step 1: Create WeekGroup**

```tsx
"use client";

import type { ReactNode } from "react";

interface WeekGroupProps {
  label: string;
  children: ReactNode;
}

export function WeekGroup({ label, children }: WeekGroupProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/intern/components/logbook/week-group.tsx && git commit -m "feat: add WeekGroup component for timeline sections"
```

---

### Task 4: Create FormFields component

**Files:**
- Create: `features/intern/components/logbook/form-fields.tsx`

- [ ] **Step 1: Create FormFields**

```tsx
"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LogbookFormFieldsProps<T extends FieldValues> {
  control: Control<T>;
  issueOptions?: { id: string; title: string }[];
}

export function LogbookFormFields<T extends FieldValues>({
  control,
  issueOptions = [],
}: LogbookFormFieldsProps<T>) {
  return (
    <div className="grid gap-4">
      <Controller
        name={"date" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>Tanggal</FieldLabel>
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {field.value
                      ? format(new Date(field.value), "d MMMM yyyy", { locale: id })
                      : "Pilih tanggal"}
                  </Button>
                }
              />
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) => field.onChange(date)}
                  locale={id}
                />
              </PopoverContent>
            </Popover>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name={"activity" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="activity">Kegiatan</FieldLabel>
            <Textarea
              {...field}
              id="activity"
              placeholder="Deskripsikan kegiatan yang dilakukan"
              rows={4}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name={"duration" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="duration">Durasi (menit)</FieldLabel>
            <Input
              {...field}
              id="duration"
              type="number"
              min={1}
              max={480}
              placeholder="480"
              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : "")}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {issueOptions.length > 0 && (
        <Controller
          name={"issueId" as FieldPath<T>}
          control={control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="issue">Tugas Terkait</FieldLabel>
              <Select
                value={field.value || ""}
                onValueChange={(val) => field.onChange(val || undefined)}
              >
                <SelectTrigger id="issue">
                  <SelectValue placeholder="Pilih Issue (opsional)" />
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  {issueOptions.map((issue) => (
                    <SelectItem key={issue.id} value={issue.id}>
                      {issue.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add features/intern/components/logbook/form-fields.tsx && git commit -m "feat: add LogbookFormFields shared form component"
```

---

### Task 5: Create CRUD dialog forms (CreateForm, UpdateForm, DetailDialog, DeleteDialog)

**Files:**
- Create: `features/intern/components/logbook/create-form.tsx`
- Create: `features/intern/components/logbook/update-form.tsx`
- Create: `features/intern/components/logbook/detail-dialog.tsx`
- Create: `features/intern/components/logbook/delete-dialog.tsx`

- [ ] **Step 1: Create create-form.tsx**

```tsx
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
      queryClient.invalidateQueries({ queryKey: ["logbooks"] });
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
```

- [ ] **Step 2: Create update-form.tsx**

```tsx
"use client";

import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";

import { LogbookFormFields } from "./form-fields";
import { updateLogbook } from "../../actions/logbook-actions";
import type { Logbook } from "../../types/logbook-types";
import {
  updateLogbookSchema,
  type UpdateLogbookInput,
} from "../../schemas/logbook-schemas";

interface UpdateLogbookFormProps {
  logbook: Logbook;
  issueOptions?: { id: string; title: string }[];
  onSuccess: () => void;
}

export function UpdateLogbookForm({ logbook, issueOptions, onSuccess }: UpdateLogbookFormProps) {
  const queryClient = useQueryClient();

  const form = useForm<UpdateLogbookInput>({
    resolver: zodResolver(updateLogbookSchema),
    mode: "onChange",
    defaultValues: {
      date: logbook.date ? new Date(logbook.date) : undefined,
      activity: logbook.activity,
      duration: logbook.duration,
      issueId: logbook.issueId || "",
      notes: logbook.notes || "",
    },
  });

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["update-logbook", logbook.id],
    mutationFn: async (values: UpdateLogbookInput) => {
      const res = await updateLogbook(logbook.id, values);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
  });

  async function onSubmit() {
    const values = form.getValues();
    const mutationPromise = mutateAsync(values);
    toast.promise(mutationPromise, {
      loading: "Memperbarui logbook...",
      success: "Logbook berhasil diperbarui",
      error: (error) =>
        error instanceof Error ? error.message : "Gagal memperbarui logbook",
    });
    try {
      await mutationPromise;
      queryClient.invalidateQueries({ queryKey: ["logbooks"] });
      onSuccess();
    } catch {}
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <LogbookFormFields control={form.control} issueOptions={issueOptions} />
      <footer className="flex gap-2 justify-end">
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending && <Loader2Icon className="size-4 animate-spin" />}
          {isPending ? "Menyimpan..." : "Perbarui"}
        </Button>
      </footer>
    </form>
  );
}
```

- [ ] **Step 3: Create detail-dialog.tsx**

```tsx
"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ClockIcon, CalendarDaysIcon, FileTextIcon, MessageSquareIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { useQuery } from "@tanstack/react-query";
import { getLogbookById } from "../../actions/logbook-actions";
import type { Logbook } from "../../types/logbook-types";
import { LogbookStatus } from "@/generated/prisma/enums";

interface DetailDialogProps {
  logbookId: string | null;
  onClose: () => void;
}

const statusLabel: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  [LogbookStatus.pending_review]: { label: "Menunggu Review", variant: "outline" },
  [LogbookStatus.approved]: { label: "Disetujui", variant: "default" },
  [LogbookStatus.revision]: { label: "Revisi", variant: "destructive" },
};

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} menit`;
  if (m === 0) return `${h} jam`;
  return `${h} jam ${m} menit`;
}

export function DetailDialog({ logbookId, onClose }: DetailDialogProps) {
  const { data: logbook, isLoading } = useQuery({
    queryKey: ["logbook", logbookId],
    queryFn: async () => {
      if (!logbookId) return null;
      const res = await getLogbookById(logbookId);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    enabled: !!logbookId,
  });

  const status = logbook ? statusLabel[logbook.status] : null;

  return (
    <Dialog open={!!logbookId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-screen max-w-screen md:min-w-[calc(100%-52rem)] md:h-fit gap-0">
        <DialogHeader className="sticky pb-4 -mx-6 space-y-4 border-b">
          <div className="px-6">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
              Detail Logbook
            </DialogTitle>
            <DialogDescription>Informasi lengkap entri logbook</DialogDescription>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100vh-12rem)] -mr-6 pr-6">
          <div className="pt-6">
            {isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            )}
            {logbook && (
              <div className="space-y-6">
                {/* Status and Date */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="size-4 text-muted-foreground" />
                    <span className="font-medium">
                      {format(new Date(logbook.date), "EEEE, d MMMM yyyy", { locale: id })}
                    </span>
                  </div>
                  {status && <Badge variant={status.variant}>{status.label}</Badge>}
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ClockIcon className="size-4" />
                  <span>Durasi: {formatDuration(logbook.duration)}</span>
                </div>

                {/* Issue */}
                {logbook.issue && (
                  <div className="flex items-center gap-2 text-sm">
                    <FileTextIcon className="size-4 text-muted-foreground" />
                    <span>
                      Tugas: <span className="font-medium">{logbook.issue.title}</span>
                    </span>
                  </div>
                )}

                {/* Activity */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Kegiatan
                  </h4>
                  <p className="text-sm whitespace-pre-wrap">{logbook.activity}</p>
                </div>

                {/* Supervisor Notes */}
                {logbook.notes && (
                  <div className="flex gap-2 rounded-md bg-muted p-4">
                    <MessageSquareIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Catatan Pembimbing
                      </p>
                      <p className="text-sm mt-1">{logbook.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Create delete-dialog.tsx**

```tsx
"use client";

import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { deleteLogbook } from "../../actions/logbook-actions";
import type { Logbook } from "../../types/logbook-types";

interface DeleteDialogProps {
  logbook: Logbook | null;
  onClose: () => void;
}

export function DeleteDialog({ logbook, onClose }: DeleteDialogProps) {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["delete-logbook", logbook?.id],
    mutationFn: async () => {
      if (!logbook) return;
      const res = await deleteLogbook(logbook.id);
      if (!res.success) throw new Error(res.error);
    },
  });

  async function onConfirm() {
    const mutationPromise = mutateAsync();
    toast.promise(mutationPromise, {
      loading: "Menghapus logbook...",
      success: "Logbook berhasil dihapus",
      error: (error) =>
        error instanceof Error ? error.message : "Gagal menghapus logbook",
    });
    try {
      await mutationPromise;
      queryClient.invalidateQueries({ queryKey: ["logbooks"] });
      onClose();
    } catch {}
  }

  return (
    <AlertDialog open={!!logbook} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Logbook</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus entri logbook ini? Tindakan ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="gap-2"
          >
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            {isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 5: Commit all**

```bash
git add features/intern/components/logbook/create-form.tsx features/intern/components/logbook/update-form.tsx features/intern/components/logbook/detail-dialog.tsx features/intern/components/logbook/delete-dialog.tsx && git commit -m "feat: add logbook CRUD dialog components"
```

---

### Task 6: Create the main LogbookPage

**Files:**
- Modify: `features/intern/pages/logbook-page.tsx` (currently empty)
- Modify: `app/intern/logbook/page.tsx` (to render the page)

- [ ] **Step 1: Write LogbookPage**

```tsx
"use client";

import { useMemo, useState } from "react";

import { format, getISOWeek, startOfWeek, endOfWeek, differenceInDays, differenceInCalendarDays } from "date-fns";
import { id } from "date-fns/locale";
import {
  PlusIcon,
  CalendarDaysIcon,
  ClipboardCheckIcon,
  ClockIcon,
  BookOpenIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  StatBlock,
  StatHeader,
  StatIcon,
  StatTitle,
  StatDescription,
  StatContent,
  StatMain,
  StatValue,
} from "@/components/shared/stat-block";

import { getLogbooks } from "../actions/logbook-actions";
import type { Logbook } from "../types/logbook-types";
import { LogbookCard } from "../components/logbook/logbook-card";
import { WeekGroup } from "../components/logbook/week-group";
import { AlertBanner } from "../components/logbook/alert-banner";
import { CreateLogbookForm } from "../components/logbook/create-form";
import { UpdateLogbookForm } from "../components/logbook/update-form";
import { DetailDialog } from "../components/logbook/detail-dialog";
import { DeleteDialog } from "../components/logbook/delete-dialog";

interface LogbookPageProps {
  periodStart?: Date;
  periodEnd?: Date;
  internName?: string;
}

function groupByWeek(logbooks: Logbook[]) {
  const now = new Date();
  const currentWeek = getISOWeek(now);
  const currentYear = now.getFullYear();

  const groups: { label: string; logbooks: Logbook[] }[] = [];
  const weekMap = new Map<string, Logbook[]>();

  for (const lb of logbooks) {
    const d = new Date(lb.date);
    const week = getISOWeek(d);
    const year = d.getFullYear();
    const key = `${year}-W${String(week).padStart(2, "0")}`;

    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key)!.push(lb);
  }

  const sortedWeeks = Array.from(weekMap.entries()).sort(([a], [b]) => b.localeCompare(a));

  for (const [key, lbs] of sortedWeeks) {
    const [yearStr, weekStr] = key.split("-W");
    const weekNum = Number(weekStr);
    const yearNum = Number(yearStr);

    let label: string;
    if (weekNum === currentWeek && yearNum === currentYear) {
      label = "Minggu Ini";
    } else if (weekNum === currentWeek - 1 && yearNum === currentYear) {
      label = "Minggu Lalu";
    } else {
      // Use start date of the week as label
      const start = startOfWeek(new Date(yearNum, 0, 1 + (weekNum - 1) * 7), { weekStartsOn: 1 });
      label = format(start, "d MMM yyyy", { locale: id });
    }

    groups.push({ label, logbooks: lbs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) });
  }

  return groups;
}

export default function LogbookPage({ periodStart, periodEnd, internName }: LogbookPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [updateLogbook, setUpdateLogbook] = useState<Logbook | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteLogbook, setDeleteLogbook] = useState<Logbook | null>(null);

  const { data: logbooks = [], isLoading } = useQuery({
    queryKey: ["logbooks"],
    queryFn: async () => {
      const res = await getLogbooks();
      if (!res.success) throw new Error(res.error);
      return res.data ?? [];
    },
  });

  const weekGroups = useMemo(() => groupByWeek(logbooks), [logbooks]);

  const approvedCount = useMemo(
    () => logbooks.filter((lb) => lb.status === "approved").length,
    [logbooks],
  );

  // Check for 2+ consecutive unfilled days
  const hasConsecutiveMiss = useMemo(() => {
    if (logbooks.length === 0) return false;
    const dates = logbooks.map((lb) => new Date(lb.date).toDateString());
    const uniqueDates = new Set(dates);
    const today = new Date();
    let streak = 0;
    for (let i = 1; i <= 5; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (!uniqueDates.has(d.toDateString())) {
        streak++;
        if (streak >= 2) return true;
      } else {
        streak = 0;
      }
    }
    return false;
  }, [logbooks]);

  // Calculate period stats
  const totalDays = periodStart && periodEnd ? differenceInDays(periodEnd, periodStart) : 0;
  const elapsedDays = periodStart ? differenceInCalendarDays(new Date(), periodStart) : 0;
  const activeDays = Math.max(0, Math.min(elapsedDays, totalDays));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Logbook Harian</h1>
          <p className="text-sm text-muted-foreground">
            Catat dan kelola kegiatan harian magang Anda
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <PlusIcon className="size-4" />
          Tambah Logbook
        </Button>
      </div>

      {/* Alert Banner */}
      {hasConsecutiveMiss && (
        <AlertBanner
          message="Anda belum mengisi logbook 2 hari terakhir. Segera lengkapi logbook Anda untuk evaluasi mingguan."
          action={{ label: "Lengkapi Sekarang", onClick: () => setCreateOpen(true) }}
        />
      )}

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock mode="single">
          <StatHeader>
            <StatIcon icon={<CalendarDaysIcon className="size-5" />} />
            <div>
              <StatTitle>Periode Magang</StatTitle>
            </div>
          </StatHeader>
          <StatContent>
            <StatMain>
              <StatValue>
                {periodStart && periodEnd
                  ? `${format(periodStart, "d MMM", { locale: id })} - ${format(periodEnd, "d MMM yyyy", { locale: id })}`
                  : "—"}
              </StatValue>
            </StatMain>
          </StatContent>
        </StatBlock>

        <StatBlock mode="range" data={{ current: activeDays, previous: totalDays }}>
          <StatHeader>
            <StatIcon icon={<ClockIcon className="size-5" />} />
            <div>
              <StatTitle>Status Hari</StatTitle>
            </div>
          </StatHeader>
          <StatContent>
            <StatMain>
              <StatValue />
            </StatMain>
          </StatContent>
        </StatBlock>

        <StatBlock mode="single">
          <StatHeader>
            <StatIcon icon={<ClipboardCheckIcon className="size-5" />} />
            <div>
              <StatTitle>Presensi</StatTitle>
            </div>
          </StatHeader>
          <StatContent>
            <StatMain>
              <StatValue>—</StatValue>
            </StatMain>
            <StatDescription>Fitur presensi belum tersedia</StatDescription>
          </StatContent>
        </StatBlock>

        <StatBlock mode="single">
          <StatHeader>
            <StatIcon icon={<BookOpenIcon className="size-5" />} />
            <div>
              <StatTitle>Logbook Diterima</StatTitle>
            </div>
          </StatHeader>
          <StatContent>
            <StatMain>
              <StatValue>{approvedCount}</StatValue>
            </StatMain>
            <StatDescription>Entri disetujui</StatDescription>
          </StatContent>
        </StatBlock>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="riwayat">
        <TabsList>
          <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
          <TabsTrigger value="statistik">Statistik</TabsTrigger>
        </TabsList>
        <TabsContent value="riwayat" className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : weekGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpenIcon className="size-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Belum ada entri logbook</p>
              <Button
                variant="outline"
                className="mt-4 gap-2"
                onClick={() => setCreateOpen(true)}
              >
                <PlusIcon className="size-4" />
                Buat Entri Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {weekGroups.map((group) => (
                <WeekGroup key={group.label} label={group.label}>
                  {group.logbooks.map((lb) => (
                    <LogbookCard
                      key={lb.id}
                      logbook={lb}
                      onView={(l) => setDetailId(l.id)}
                      onEdit={(l) => setUpdateLogbook(l)}
                      onDelete={(l) => setDeleteLogbook(l)}
                    />
                  ))}
                </WeekGroup>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="statistik" className="mt-4">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">Statistik akan tersedia pada pembaruan berikutnya</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="h-screen max-w-screen md:min-w-[calc(100%-52rem)] md:h-fit gap-0">
          <DialogHeader className="sticky pb-4 -mx-6 space-y-4 border-b">
            <div className="px-6">
              <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
                Tambah Logbook
              </DialogTitle>
              <DialogDescription>Catat kegiatan harian magang Anda</DialogDescription>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(100vh-12rem)] -mr-6 pr-6">
            <div className="pt-6">
              <CreateLogbookForm onSuccess={() => setCreateOpen(false)} />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog
        open={!!updateLogbook}
        onOpenChange={(open) => !open && setUpdateLogbook(null)}
      >
        <DialogContent className="h-screen max-w-screen md:min-w-[calc(100%-52rem)] md:h-fit gap-0">
          <DialogHeader className="sticky pb-4 -mx-6 space-y-4 border-b">
            <div className="px-6">
              <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
                Edit Logbook
              </DialogTitle>
              <DialogDescription>Perbarui entri logbook Anda</DialogDescription>
            </div>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(100vh-12rem)] -mr-6 pr-6">
            <div className="pt-6">
              {updateLogbook && (
                <UpdateLogbookForm
                  logbook={updateLogbook}
                  onSuccess={() => setUpdateLogbook(null)}
                />
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <DetailDialog logbookId={detailId} onClose={() => setDetailId(null)} />

      {/* Delete Dialog */}
      <DeleteDialog
        logbook={deleteLogbook}
        onClose={() => setDeleteLogbook(null)}
      />
    </div>
  );
}
```

- [ ] **Step 2: Update the route page to pass props**

Replace `app/intern/logbook/page.tsx`:

```tsx
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/helpers/guard";
import { Role } from "@/generated/prisma/enums";
import LogbookPage from "@/features/intern/pages/logbook-page";

export default async function Page() {
  const { user } = await requireAuth([Role.admin, Role.intern]);

  const internProfile = await prisma.internProfile.findUnique({
    where: { userId: user.id },
    select: {
      periodStart: true,
      periodEnd: true,
    },
  });

  return (
    <LogbookPage
      periodStart={internProfile?.periodStart ?? undefined}
      periodEnd={internProfile?.periodEnd ?? undefined}
      internName={user.name}
    />
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add features/intern/pages/logbook-page.tsx app/intern/logbook/page.tsx && git commit -m "feat: add LogbookPage with timeline, stats, and CRUD dialogs"
```

---

### Task 7: Final verification

- [ ] **Step 1: Type check**

Run: `npx tsc --noEmit`
Expected: No errors
