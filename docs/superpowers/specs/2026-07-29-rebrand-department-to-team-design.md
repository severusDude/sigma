# Rebrand Department/Bidang/Divisi → Team

**Issue:** [SGM-88](https://linear.app/lutfi/issue/SGM-88/f17-rebrand-departmentbidangdivisi-team)
**Priority:** High
**Sprint:** 3 (Revisions)

## Objective

Rebrand the `Department` model and all related terminology ("Bidang", "Divisi", "Departemen") to `Team` across the entire system — database, backend code, frontend UI, document templates, and seed data.

## Database Layer

### Prisma Schema Changes

- Rename model `Department` → `Team`
- Rename FK `departmentId` → `teamId` in `InternProfile` and `Issue`
- Change `SupervisorProfile.field: String` → `SupervisorProfile.teamId: String?` (FK to Team)
- Update `@@map("department")` → `@@map("team")`

```prisma
model Team {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  issues      Issue[]
  interns     InternProfile[]
  supervisors SupervisorProfile[]
  @@map("team")
}

model InternProfile {
  // ...
  teamId   String?
  team     Team?  @relation(fields: [teamId], references: [id])
  // ...
}

model Issue {
  // ...
  teamId   String?
  team     Team?  @relation(fields: [teamId], references: [id])
  // ...
}

model SupervisorProfile {
  // ...
  teamId String?
  team   Team?  @relation(fields: [teamId], references: [id])
  // ...
}
```

### Migration Strategy

1. `prisma migrate dev --name rebrand_department_to_team` auto-generates SQL for table rename + column renames
2. Custom migration steps: insert UMUM team, update supervisor_profile.teamId = UMUM's id, drop `field` column
3. `prisma generate` updates relation-map and soft-delete config automatically

### Generated Code Updates

- `generated/relation-map/index.ts` — auto-updated via `prisma generate`
- `lib/prisma-soft-delete.ts:4` — `"Department"` → `"Team"`

## Backend Code

### Types

| File | Change |
|---|---|
| `features/hr/types/supervisor-types.ts` | `departmentName` → `teamName` |
| `features/hr/types/dashboard-types.ts` | `DeptDistribution` → `TeamDistribution`, `department` → `team` |
| `features/hr/types/document-types.ts` | `department: true` → `team: true` |
| `features/supervisor/types/issue-types.ts` | `department` → `team` |
| `features/supervisor/types/dashboard-types.ts` | `department` → `team` |
| `features/supervisor/types/assessment-types.ts` | `divisionName` → `teamName` |
| `features/intern/types/dashboard-types.ts` | `departmentName` → `teamName` |

### Zod Schemas

| File | Change |
|---|---|
| `features/hr/schemas/intern-schemas.ts` | `departmentId` → `teamId` |
| `features/hr/schemas/supervisor-schemas.ts` | Remove `field`, add `teamId: z.string()` |

### Server Actions

| File | Change |
|---|---|
| `features/hr/actions/intern-actions.ts` | `departmentId` → `teamId` in create & update |
| `features/hr/actions/document-actions.tsx` | Label "Bidang penempatan" → "Team" |

### Data Layer

Rename all Prisma includes/selects in 7 data files:
- `department: true` → `team: true`
- `department: { select: { name } }` → `team: { select: { name } }`
- `i.department?.name` → `i.team?.name`
- `groupBy departmentId` → `groupBy teamId`
- Returned objects: `departmentName` → `teamName`

Files: `features/hr/data/supervisor-data.ts`, `features/hr/data/dashboard-data.ts`, `features/hr/data/variable-info.ts`, `features/supervisor/data/assessment-data.ts`, `features/supervisor/data/dashboard-data.ts`, `features/supervisor/data/assessment-form-data.ts`, `features/intern/data/dashboard-data.ts`

### PDF Certificate

`lib/pdf-certificate.ts:55` — `"bidang"` → `"team"` variable name

## Document Template System

Rename template variable key `"bidang"` → `"team"` across all 5 document types:
- `features/hr/data/variable-info.ts` — 5 occurrences
- `features/hr/actions/template-actions.ts` — 5 occurrences

Built-in templates in `/templates/hr/` already updated by the user.

## Frontend UI

### Label Changes

| File | Old Text | New Text |
|---|---|---|
| `features/hr/components/intern/form-fields.tsx` | "Departemen" / "Pilih departemen" | "Team" / "Pilih team" |
| `features/hr/components/document/columns.tsx` | "Bidang" | "Team" |
| `features/hr/components/dashboard/dept-bar-chart.tsx` | "Distribusi per Divisi" | "Distribusi per Team" |
| `features/hr/components/certificate/field-configurator.tsx` | "Bidang" | "Team" |
| `features/hr/pages/document-page.tsx` | "Bidang" | "Team" |
| `features/supervisor/pages/profile-page.tsx` | "Bidang" | "Team" |
| `features/intern/pages/profile-page.tsx` | "Bidang Penempatan" | "Team" |
| `features/intern/pages/dashboard-page.tsx` | "Divisi" | "Team" |
| `features/landing/landing-page.tsx` | "Divisi" | "Team" |

### Supervisor Components (formerly mixed Bidang concept)

| File | Change |
|---|---|
| `features/hr/components/supervisor/columns.tsx` | "Bidang" → "Team" |
| `features/hr/components/supervisor/form-fields.tsx` | "Bidang" → "Team", `field` → `teamId` |
| `features/hr/components/supervisor/detail-dialog.tsx` | "Bidang" → "Team", `departmentName` → `teamName` |
| `features/hr/components/supervisor/quick-assign-card.tsx` | `departmentName` → `teamName` |
| `features/hr/components/supervisor/assign-dialog.tsx` | `departmentName` → `teamName` |

### Page Data Fetching

| File | Change |
|---|---|
| `app/hr/intern/page.tsx` | `prisma.department.findMany()` → `prisma.team.findMany()` |
| `app/intern/profile/page.tsx` | `department: true` → `team: true` |

### Prop/Variable Renames

| File | Change |
|---|---|
| `features/hr/pages/intern-page.tsx` | `departments` → `teams`, `departmentOptions` → `teamOptions` |
| `features/hr/pages/dashboard-page.tsx` | `department.name` → `team.name` |

## Seed Data

### 12 Teams

```ts
const teams = [
  "KEJAR", "HALIS", "GADIS", "CAPUNG", "INTANT", "HUMAS",
  "SE2026", "Pengolahan", "D'Stik", "PEK", "KTIP", "UMUM"
]
```

### Seed File Changes

- `prisma/seed-development.ts` — Create 12 teams instead of 4 departments. Update InternProfile to reference `teamUmum.id`. Update SupervisorProfile to use `teamId` referencing UMUM.
- `prisma/seed-production.ts` — Also create all 12 teams. Update SupervisorProfile: remove `field`, add `teamId` pointing to UMUM.

## Migration Data

1. Create UMUM team in migration SQL
2. `UPDATE supervisor_profile SET "teamId" = (SELECT id FROM team WHERE name = 'UMUM')`
3. Drop `field` column from `supervisor_profile`

## Execution Plan

**Approach:** Hybrid — codemod-assisted bulk rename + organized commits

### Phases

1. **Prisma Schema + Migration** — rename model, update schema, run `prisma migrate dev`, `prisma generate`
2. **Backend Code** — types, schemas, actions, data layer, template system, soft-delete config
3. **Frontend UI** — components, pages, labels, prop renames
4. **Seed** — update both seed files with 12 teams
5. **Verification** — build check, lint, typecheck

## Acceptance Criteria

- [ ] Prisma migration berhasil tanpa data loss
- [ ] Semua FK dan relasi diperbarui (InternProfile.teamId, Issue.teamId, SupervisorProfile.teamId)
- [ ] Supervisor terhubung ke Team (bukan string field)
- [ ] Semua UI menampilkan "Team" bukan "Bidang"/"Divisi"/"Department"
- [ ] Seed 12 Team records sesuai daftar
- [ ] Seed files development & production kompatibel dengan model baru
- [ ] Document template variable "bidang" → "team"
