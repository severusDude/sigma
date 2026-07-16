# Intern Management Feature — Design Spec

## Overview

HR intern management CRUD for SIGMA (Sistem Informasi Management Magang).
Implements SGM-10 sub-tasks: SGM-25 (Form Registrasi), SGM-27 (Daftar Intern + Search/Filter), SGM-28 (Detail/Edit/Soft-delete).
Import Excel batch (SGM-26) is out of scope for this session.

## Architecture

```
Server Actions (intern-actions.ts)
  ├── createIntern  → creates User + InternProfile in Prisma transaction
  ├── getInterns    → paginated list with search/filter/sort
  ├── getInternById → single intern with User, Department, Supervisor relations
  ├── updateIntern  → updates InternProfile fields
  └── deleteIntern  → soft-delete via Prisma extension

Intern Page (server component, fetches initial data)
  └── DataTable (client, @tanstack/react-table)
        ├── Create Dialog → CreateForm (wraps form-fields)
        ├── Update Dialog → UpdateForm (wraps form-fields, prefilled)
        ├── Detail Dialog → read-only display
        └── Delete Dialog → confirmation + toast
```

All mutations use `useMutation` (TanStack Query) + `toast.promise` (Sonner), matching auth sign-in pattern.

## Data Model

Primary models (already in `prisma/schema.prisma`):
- `User` — auth user, linked via `InternProfile.userId`
- `InternProfile` — core intern data
- `Department` — division placement
- `SupervisorProfile` — supervisor assignment
- `InternSupervisor` — many-to-many assignment

## Server Actions (`features/hr/actions/intern-actions.ts`)

- `getInterns(params)` — accepts search query, page, pageSize, filters, sort; returns paginated InternWithRelations[]
- `getInternById(id)` — returns InternProfile with User, Department, Supervisor assignments
- `createIntern(data)` — Prisma transaction: create User (generate cuid() for id, generated username from name/NIK, hashed password via Better Auth) + InternProfile
- `updateIntern(id, data)` — update InternProfile fields, return updated record
- `deleteIntern(id)` — Prisma soft-delete on InternProfile (extension handles `deletedAt`)

## Types (`features/hr/types/intern-types.ts`)

- `InternWithRelations` — InternProfile + User + Department + SupervisorProfile[]
- `InternListResponse` — `{ data: InternWithRelations[], total: number, page: number, pageSize: number }`

## Generic Action Response (`lib/types/index.ts`)

```ts
export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};
```

Reusable across all feature actions.

## Schemas (`features/hr/schemas/intern-schemas.ts`)

```ts
createInternSchema = z.object({
  name: z.string().min(1),
  nik: z.string().min(1),
  institution: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  departmentId: z.string().optional(),
  periodStart: z.date(),
  periodEnd: z.date(),
  status: z.nativeEnum(InternStatus).optional().default("active"),
});

updateInternSchema = createInternSchema.partial();
```

Types inferred via `z.infer<>`. Satisfies Prisma `InternProfileCreateInput`.

## Form Fields (`features/hr/components/intern/form-fields.tsx`)

Shared component used by both CreateForm and UpdateForm.

| Field | Component | Source |
|-------|-----------|--------|
| Nama Lengkap | Input | User.name |
| NIK | Input | InternProfile.nik |
| Institusi | Input | InternProfile.institution |
| No. HP | Input | InternProfile.phone |
| Email | Input | InternProfile.email |
| Departemen | Select (from departments) | InternProfile.departmentId |
| Tanggal Mulai | Input type="date" | InternProfile.periodStart |
| Tanggal Selesai | Input type="date" | InternProfile.periodEnd |

Each field uses `Controller` from react-hook-form + `Field` UI components (matching auth sign-in pattern).

## Forms (`create-form.tsx`, `update-form.tsx`)

Both are wrappers around `form-fields.tsx`:
- `CreateForm` — empty form, calls `createIntern` mutation, on success closes dialog + refetches table
- `UpdateForm` — prefilled from selected intern, calls `updateIntern` mutation, on success closes dialog + refetches table

Mutation pattern:
```tsx
const { mutateAsync } = useMutation({
  mutationKey: ["create-intern"],
  mutationFn: (values) => createIntern(values),
});
const mutationPromise = mutateAsync(data);
toast.promise(mutationPromise, { loading, success, error });
```

## Columns (`features/hr/components/intern/columns.tsx`)

`ColumnDef<InternWithRelations, unknown>[]` with:

- **Nama + NIK** (combined column): Nama in larger font, NIK below in smaller/faded text
- **Institusi**: plain text
- **Status**: badge component (active=green, completed=blue, withdrawn=gray)
- **Periode**: formatted date range (e.g., "15 Jul 2026 - 15 Okt 2026")

Wrapped with `withSelectColumn()` + `withActionColumn()` (View Detail, Edit, Delete).

## Dialogs

- **DetailDialog**: Read-only view with all intern info + department + supervisor assignments
- **DeleteDialog**: Confirmation with "Apakah Anda yakin?" + Cancel/Hapus buttons
- Create and Update are dialog-wrapped forms

## Page (`features/hr/pages/intern-page.tsx`)

Server component that:
1. Fetches initial intern list and departments (for form select)
2. Renders DataTable as client component
3. Manages dialog state (create/update/detail/delete open/close)

Wired via `app/hr/intern/page.tsx`:
```tsx
import InternPage from "@/features/hr/pages/intern-page";
export default function Page() { return <InternPage />; }
```

## Permissions

HR role has `intern: [create, read, update, delete]` (already defined in `lib/auth/permissions.ts`).
Actions protected via `requirePermission("intern", "create")` server-side.

## Files to Create/Modify

| File | Action |
|------|--------|
| `lib/types/index.ts` | Create — generic `ActionResponse<T>` type |
| `features/hr/schemas/intern-schemas.ts` | Modify — Zod schemas |
| `features/hr/types/intern-types.ts` | Modify — TS types with relations |
| `features/hr/actions/intern-actions.ts` | Modify — server actions |
| `features/hr/components/intern/form-fields.tsx` | Modify — shared form fields |
| `features/hr/components/intern/create-form.tsx` | Modify — create form |
| `features/hr/components/intern/update-form.tsx` | Modify — update form |
| `features/hr/components/intern/columns.tsx` | Modify — table columns |
| `features/hr/components/intern/delete-dialog.tsx` | Modify — delete confirmation |
| `features/hr/components/intern/detail-dialog.tsx` | Modify — detail view |
| `features/hr/pages/intern-page.tsx` | Modify — main page |
| `app/hr/intern/page.tsx` | Create — Next.js page wrapper |
