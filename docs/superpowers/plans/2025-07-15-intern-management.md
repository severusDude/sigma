# Intern Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Full CRUD for intern management (SGM-25, SGM-27, SGM-28) — create, list with search/filter, detail, update, soft-delete.

**Architecture:** Single page with dialog-based CRUD. Server actions for data access. Client forms with tanstack mutation + sonner toast. Shared data table for listing.

**Tech Stack:** Next.js 16, React 19, TypeScript, Prisma 7, Better Auth (admin plugin), TanStack Query, Sonner, shadcn/ui, @tanstack/react-table

## Global Constraints

- Import Excel batch (SGM-26) is out of scope
- Use generic `DataTable` from `components/shared/data-table`
- Form fields in `form-fields.tsx`, create/update forms are wrappers
- Mutation pattern: `useMutation` + `toast.promise` (match auth sign-in)
- Form validation: `react-hook-form` + `@hookform/resolvers/zod` + `zod`
- Permissions: server-side `requirePermission("intern", "create")` etc.
- Soft-delete via existing Prisma extension (`lib/prisma-soft-delete.ts`)
- All text/labels in Bahasa Indonesia

---

### Task 1: Foundation — ActionResponse + Types + Zod Schemas

**Files:**
- Create: `lib/types/index.ts` — generic `ActionResponse<T>`
- Modify: `features/hr/types/intern-types.ts` — TypeScript types
- Modify: `features/hr/schemas/intern-schemas.ts` — Zod schemas

**Interfaces:**
- Consumes: Prisma generated types (`InternProfile`, `User`, `Department`, `InternSupervisor`, `SupervisorProfile`, `InternStatus`)
- Produces: `ActionResponse<T>`, `InternWithRelations`, `InternRow`, `CreateInternInput`, `UpdateInternInput`, Zod schemas

- [ ] **Step 1: Create `lib/types/index.ts`**

```ts
export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
```

- [ ] **Step 2: Fill `features/hr/types/intern-types.ts`**

```ts
import type { InternProfile, User, Department, InternSupervisor, SupervisorProfile } from "@/generated/prisma";

export interface InternWithRelations extends InternProfile {
  user: Pick<User, "id" | "name" | "email">;
  department: Pick<Department, "id" | "name"> | null;
  supervisorAssignments: (InternSupervisor & {
    supervisor: SupervisorProfile & { user: Pick<User, "name" | "email"> };
  })[];
}

export interface InternRow {
  id: string;
  name: string;
  nik: string;
  institution: string;
  phone: string | null;
  email: string | null;
  department: string | null;
  departmentId: string | null;
  periodStart: Date;
  periodEnd: Date;
  status: string;
  supervisor: string | null;
  internProfile: InternWithRelations;
}
```

- [ ] **Step 3: Fill `features/hr/schemas/intern-schemas.ts`**

```ts
import z from "zod";
import { InternStatus } from "@/generated/prisma/enums";

export const createInternSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  nik: z.string().min(1, "NIK wajib diisi"),
  institution: z.string().min(1, "Institusi wajib diisi"),
  phone: z.string().optional(),
  email: z.email({ error: "Email tidak valid" }).optional().or(z.literal("")),
  departmentId: z.string().optional().or(z.literal("")),
  periodStart: z.coerce.date({ error: "Tanggal mulai wajib diisi" }),
  periodEnd: z.coerce.date({ error: "Tanggal selesai wajib diisi" }),
  status: z.nativeEnum(InternStatus).optional().default(InternStatus.active),
});

export const updateInternSchema = createInternSchema.partial();

export type CreateInternInput = z.infer<typeof createInternSchema>;
export type UpdateInternInput = z.infer<typeof updateInternSchema>;
```

---

### Task 2: Server Actions

**Files:**
- Modify: `features/hr/actions/intern-actions.ts`

**Interfaces:**
- Consumes: `ActionResponse<T>`, `InternWithRelations`, `InternRow`, `CreateInternInput`, `UpdateInternInput`, Prisma, Better Auth `auth`
- Produces: `getInterns()`, `getInternById()`, `createIntern()`, `updateIntern()`, `deleteIntern()`

- [ ] **Step 1: Fill `features/hr/actions/intern-actions.ts`**

```ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ActionResponse } from "@/lib/types";
import type { InternWithRelations, InternRow } from "../types/intern-types";
import type { CreateInternInput, UpdateInternInput } from "../schemas/intern-schemas";
import { createInternSchema, updateInternSchema } from "../schemas/intern-schemas";
import { requirePermission } from "@/lib/auth/authorize";

function toRow(intern: InternWithRelations): InternRow {
  const assignment = intern.supervisorAssignments?.[0];
  return {
    id: intern.id,
    name: intern.user.name,
    nik: intern.nik,
    institution: intern.institution,
    phone: intern.phone,
    email: intern.email,
    department: intern.department?.name ?? null,
    departmentId: intern.department?.id ?? null,
    periodStart: intern.periodStart,
    periodEnd: intern.periodEnd,
    status: intern.status,
    supervisor: assignment?.supervisor.user.name ?? null,
    internProfile: intern,
  };
}

export async function getInterns(
  query?: string,
): Promise<ActionResponse<InternRow[]>> {
  try {
    await requirePermission("intern", "read");

    const interns = await prisma.internProfile.findMany({
      where: {
        deletedAt: null,
        ...(query
          ? {
              OR: [
                { user: { name: { contains: query, mode: "insensitive" } } },
                { nik: { contains: query, mode: "insensitive" } },
                { institution: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
        supervisorAssignments: {
          include: {
            supervisor: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: interns.map(toRow) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengambil data intern",
    };
  }
}

export async function getInternById(
  id: string,
): Promise<ActionResponse<InternWithRelations>> {
  try {
    await requirePermission("intern", "read");

    const intern = await prisma.internProfile.findUnique({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
        supervisorAssignments: {
          include: {
            supervisor: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
      },
    });

    if (!intern) return { success: false, error: "Intern tidak ditemukan" };
    return { success: true, data: intern };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengambil data intern",
    };
  }
}

export async function createIntern(
  input: CreateInternInput,
): Promise<ActionResponse<InternWithRelations>> {
  try {
    await requirePermission("intern", "create");

    const parsed = createInternSchema.parse(input);

    const username =
      parsed.name
        .toLowerCase()
        .replace(/\s+/g, ".")
        .replace(/[^a-z0-9.]/g, "")
        .slice(0, 20) +
      Math.random().toString(36).slice(2, 6);

    const password = Math.random().toString(36).slice(2, 10);

    const user = await auth.api.createUser({
      body: {
        name: parsed.name,
        email: parsed.email || `${username}@sigma.app`,
        password,
        username,
        role: "intern",
      },
    });

    const intern = await prisma.internProfile.create({
      data: {
        userId: user.id,
        nik: parsed.nik,
        institution: parsed.institution,
        phone: parsed.phone || null,
        email: parsed.email || null,
        periodStart: parsed.periodStart,
        periodEnd: parsed.periodEnd,
        status: parsed.status,
        departmentId: parsed.departmentId || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
        supervisorAssignments: {
          include: {
            supervisor: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
      },
    });

    return { success: true, data: intern };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat intern",
    };
  }
}

export async function updateIntern(
  id: string,
  input: UpdateInternInput,
): Promise<ActionResponse<InternWithRelations>> {
  try {
    await requirePermission("intern", "update");

    const parsed = updateInternSchema.parse(input);

    if (parsed.name) {
      const intern = await prisma.internProfile.findUnique({
        where: { id },
        select: { userId: true },
      });
      if (intern) {
        await prisma.user.update({
          where: { id: intern.userId },
          data: { name: parsed.name },
        });
      }
    }

    const intern = await prisma.internProfile.update({
      where: { id },
      data: {
        ...(parsed.nik !== undefined && { nik: parsed.nik }),
        ...(parsed.institution !== undefined && { institution: parsed.institution }),
        ...(parsed.phone !== undefined && { phone: parsed.phone || null }),
        ...(parsed.email !== undefined && { email: parsed.email || null }),
        ...(parsed.periodStart !== undefined && { periodStart: parsed.periodStart }),
        ...(parsed.periodEnd !== undefined && { periodEnd: parsed.periodEnd }),
        ...(parsed.status !== undefined && { status: parsed.status }),
        ...(parsed.departmentId !== undefined && { departmentId: parsed.departmentId || null }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
        supervisorAssignments: {
          include: {
            supervisor: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
      },
    });

    return { success: true, data: intern };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui intern",
    };
  }
}

export async function deleteIntern(id: string): Promise<ActionResponse<void>> {
  try {
    await requirePermission("intern", "delete");

    await prisma.internProfile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus intern",
    };
  }
}
```

---

### Task 3: Form Fields + Create Form + Update Form

**Files:**
- Modify: `features/hr/components/intern/form-fields.tsx`
- Modify: `features/hr/components/intern/create-form.tsx`
- Modify: `features/hr/components/intern/update-form.tsx`

**Interfaces:**
- Consumes: `Control<CreateInternInput>`, department list, `createIntern`, `updateIntern`
- Produces: `<InternFormFields>`, `<CreateInternForm>`, `<UpdateInternForm>`

- [ ] **Step 1: Fill `features/hr/components/intern/form-fields.tsx`**

```tsx
"use client";

import { Controller, type Control } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import type { CreateInternInput } from "../../schemas/intern-schemas";

interface InternFormFieldsProps {
  control: Control<CreateInternInput>;
  departmentOptions: { id: string; name: string }[];
}

export function InternFormFields({ control, departmentOptions }: InternFormFieldsProps) {
  return (
    <div className="grid gap-4">
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
            <Input {...field} id="name" placeholder="Masukkan nama lengkap" aria-invalid={fieldState.invalid} />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="nik"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="nik">NIK</FieldLabel>
            <Input {...field} id="nik" placeholder="Masukkan NIK" aria-invalid={fieldState.invalid} />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="institution"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="institution">Institusi</FieldLabel>
            <Input {...field} id="institution" placeholder="Masukkan asal institusi" aria-invalid={fieldState.invalid} />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="phone"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="phone">No. HP</FieldLabel>
              <Input {...field} id="phone" placeholder="085xxxxx" aria-invalid={fieldState.invalid} />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input {...field} id="email" type="email" placeholder="email@example.com" aria-invalid={fieldState.invalid} />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <Controller
        name="departmentId"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="department">Departemen</FieldLabel>
            <Select value={field.value || ""} onValueChange={(val) => field.onChange(val || undefined)}>
              <SelectTrigger id="department" aria-invalid={fieldState.invalid}>
                <SelectValue placeholder="Pilih departemen" />
              </SelectTrigger>
              <SelectContent>
                {departmentOptions.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="periodStart"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="periodStart">Tanggal Mulai</FieldLabel>
              <Input
                {...field}
                id="periodStart" type="date"
                value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : (field.value || "")}
                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          name="periodEnd"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="periodEnd">Tanggal Selesai</FieldLabel>
              <Input
                {...field}
                id="periodEnd" type="date"
                value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : (field.value || "")}
                onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Fill `features/hr/components/intern/create-form.tsx`**

```tsx
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
    resolver: zodResolver(createInternSchema),
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
```

- [ ] **Step 3: Fill `features/hr/components/intern/update-form.tsx`**

```tsx
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
    resolver: zodResolver(updateInternSchema),
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
      <InternFormFields control={form.control} departmentOptions={departmentOptions} />
      <Button type="submit" disabled={isPending} className="gap-2 w-full">
        {isPending && <Loader2Icon className="h-4 w-4 animate-spin" />}
        {isPending ? "Menyimpan..." : "Perbarui"}
      </Button>
    </form>
  );
}
```

---

### Task 4: Columns + Dialogs

**Files:**
- Modify: `features/hr/components/intern/columns.tsx`
- Modify: `features/hr/components/intern/detail-dialog.tsx`
- Modify: `features/hr/components/intern/delete-dialog.tsx`

**Interfaces:**
- Consumes: `InternRow`, `InternWithRelations`, `getInternById`, `deleteIntern`, `DataTable` helpers
- Produces: `createColumns()`, `<DetailDialog>`, `<DeleteDialog>`

- [ ] **Step 1: Fill `features/hr/components/intern/columns.tsx`**

```tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { EyeIcon, PencilIcon, Trash2Icon } from "lucide-react";
import {
  withSelectColumn,
  withActionColumn,
  type ActionOption,
} from "@/components/shared/data-table/column-helpers";
import type { InternRow } from "../../types/intern-types";

const statusLabel: Record<string, string> = {
  active: "Aktif",
  completed: "Selesai",
  withdrawn: "Ditarik",
};

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  completed: "secondary",
  withdrawn: "outline",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

const baseColumns: ColumnDef<InternRow>[] = [
  {
    id: "nameNik",
    header: "Nama",
    accessorFn: (row) => row.name,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        <span className="text-xs text-muted-foreground">{row.original.nik}</span>
      </div>
    ),
  },
  {
    accessorKey: "institution",
    header: "Institusi",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status] || "outline"}>
        {statusLabel[row.original.status] || row.original.status}
      </Badge>
    ),
  },
  {
    id: "period",
    header: "Periode",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(row.original.periodStart)} - {formatDate(row.original.periodEnd)}
      </span>
    ),
  },
];

export function createColumns(actions: {
  onView: (row: InternRow) => void;
  onEdit: (row: InternRow) => void;
  onDelete: (row: InternRow) => void;
}) {
  const actionOptions: ActionOption<InternRow>[] = [
    {
      label: "Lihat Detail",
      icon: <EyeIcon className="size-4" />,
      onClick: (row) => actions.onView(row as InternRow),
    },
    {
      label: "Edit",
      icon: <PencilIcon className="size-4" />,
      onClick: (row) => actions.onEdit(row as InternRow),
    },
    {
      label: "Hapus",
      icon: <Trash2Icon className="size-4" />,
      onClick: (row) => actions.onDelete(row as InternRow),
      destructive: true,
    },
  ];

  return withSelectColumn(withActionColumn(baseColumns, actionOptions));
}
```

- [ ] **Step 2: Fill `features/hr/components/intern/detail-dialog.tsx`**

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getInternById } from "../../actions/intern-actions";
import type { InternWithRelations } from "../../types/intern-types";

interface DetailDialogProps {
  internId: string | null;
  onClose: () => void;
}

const statusLabel: Record<string, string> = {
  active: "Aktif",
  completed: "Selesai",
  withdrawn: "Ditarik",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function DetailDialog({ internId, onClose }: DetailDialogProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["intern", internId],
    queryFn: async () => {
      if (!internId) return null;
      const res = await getInternById(internId);
      if (!res.success) throw new Error(res.error);
      return res.data;
    },
    enabled: !!internId,
  });

  return (
    <Dialog open={!!internId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail Intern</DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {data && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{data.user.name}</h3>
                <p className="text-sm text-muted-foreground">{data.nik}</p>
              </div>
              <Badge>{statusLabel[data.status] || data.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Institusi</p>
                <p className="font-medium">{data.institution}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Departemen</p>
                <p className="font-medium">{data.department?.name || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">No. HP</p>
                <p className="font-medium">{data.phone || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Email</p>
                <p className="font-medium">{data.email || "-"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Periode Mulai</p>
                <p className="font-medium">{formatDate(data.periodStart)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Periode Selesai</p>
                <p className="font-medium">{formatDate(data.periodEnd)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Supervisor</p>
                <p className="font-medium">
                  {data.supervisorAssignments?.[0]?.supervisor?.user?.name || "-"}
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Fill `features/hr/components/intern/delete-dialog.tsx`**

```tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
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
import { deleteIntern } from "../../actions/intern-actions";
import type { InternRow } from "../../types/intern-types";

interface DeleteDialogProps {
  intern: InternRow | null;
  onClose: () => void;
}

export function DeleteDialog({ intern, onClose }: DeleteDialogProps) {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationKey: ["delete-intern", intern?.id],
    mutationFn: async () => {
      if (!intern) return;
      const res = await deleteIntern(intern.id);
      if (!res.success) throw new Error(res.error);
    },
  });

  async function onConfirm() {
    const mutationPromise = mutateAsync();
    toast.promise(mutationPromise, {
      loading: "Menghapus intern...",
      success: "Intern berhasil dihapus",
      error: (error) => error instanceof Error ? error.message : "Gagal menghapus intern",
    });
    try {
      await mutationPromise;
      queryClient.invalidateQueries({ queryKey: ["interns"] });
      onClose();
    } catch {}
  }

  return (
    <AlertDialog open={!!intern} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Intern</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus <strong>{intern?.name}</strong>?
            Data yang dihapus dapat dipulihkan oleh admin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending} className="gap-2">
            {isPending && <Loader2Icon className="h-4 w-4 animate-spin" />}
            {isPending ? "Menghapus..." : "Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

### Task 5: Page Composition + App Router Page

**Files:**
- Create: `features/hr/components/intern/intern-page-client.tsx`
- Modify: `features/hr/pages/intern-page.tsx`
- Create: `app/hr/intern/page.tsx`

**Interfaces:**
- Consumes: All previous components, `getInterns`, `DataTable`, `createColumns`

- [ ] **Step 1: Create `features/hr/components/intern/intern-page-client.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataTable } from "@/components/shared/data-table";
import { getInterns } from "../../actions/intern-actions";
import { createColumns } from "./columns";
import { CreateInternForm } from "./create-form";
import { UpdateInternForm } from "./update-form";
import { DetailDialog } from "./detail-dialog";
import { DeleteDialog } from "./delete-dialog";
import type { InternRow } from "../../types/intern-types";
import type { InternWithRelations } from "../../types/intern-types";

interface InternClientPageProps {
  departments: { id: string; name: string }[];
}

export function InternClientPage({ departments }: InternClientPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editIntern, setEditIntern] = useState<InternWithRelations | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteIntern, setDeleteIntern] = useState<InternRow | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["interns"],
    queryFn: async () => {
      const res = await getInterns();
      if (!res.success) throw new Error(res.error);
      return res.data ?? [];
    },
  });

  const columns = createColumns({
    onView: (row) => setDetailId(row.id),
    onEdit: (row) => setEditIntern(row.internProfile),
    onDelete: (row) => setDeleteIntern(row),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Intern</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data peserta magang
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <PlusIcon className="size-4" />
          Tambah Intern
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data ?? []}
        filterCategories={[
          {
            id: "status",
            label: "Status",
            options: [
              { label: "Aktif", value: "active" },
              { label: "Selesai", value: "completed" },
              { label: "Ditarik", value: "withdrawn" },
            ],
          },
        ]}
      />

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Intern Baru</DialogTitle>
          </DialogHeader>
          <CreateInternForm
            departmentOptions={departments}
            onSuccess={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editIntern} onOpenChange={(open) => !open && setEditIntern(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Intern</DialogTitle>
          </DialogHeader>
          {editIntern && (
            <UpdateInternForm
              intern={editIntern}
              departmentOptions={departments}
              onSuccess={() => setEditIntern(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <DetailDialog internId={detailId} onClose={() => setDetailId(null)} />

      {/* Delete Dialog */}
      <DeleteDialog intern={deleteIntern} onClose={() => setDeleteIntern(null)} />
    </div>
  );
}
```

- [ ] **Step 2: Fill `features/hr/pages/intern-page.tsx`**

```tsx
import { prisma } from "@/lib/prisma";
import { InternClientPage } from "../components/intern/intern-page-client";

export default async function InternPage() {
  const departments = await prisma.department.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return <InternClientPage departments={departments} />;
}
```

- [ ] **Step 3: Create `app/hr/intern/page.tsx`**

```tsx
import InternPage from "@/features/hr/pages/intern-page";

export default function Page() {
  return <InternPage />;
}
```
