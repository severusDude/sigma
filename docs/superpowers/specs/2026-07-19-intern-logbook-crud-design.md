# Intern Logbook CRUD — Functional Layer Design

**Date**: 2026-07-19  
**Status**: Approved  
**Issue**: SGM-35  
**Epic**: SGM-12 (F6: Logbook & Jurnal Harian)

## Scope

Build the functional layer for intern-side logbook CRUD: types, schemas, data fetching, and server actions. UI components (page, forms, dialogs, columns) deferred to later session.

## Architecture

| Layer | File | Purpose |
|-------|------|---------|
| Types | `features/intern/types/logbook-types.ts` | Prisma `logbookInclude` + inferred `Logbook` type |
| Schemas | `features/intern/schemas/logbook-schemas.ts` | Zod validation schemas for create/update |
| Data | `features/intern/data/logbook-data.ts` | Server-side cached data fetching (`'use cache'`) |
| Actions | `features/intern/actions/logbook-actions.ts` | Server actions with permission checks |
| Permissions | `lib/auth/permissions.ts` | Add `"delete"` to `journal` resource |
| Route | `app/intern/logbook/page.tsx` | Thin server wrapper (data fetch + render) |

## Data Model (Prisma — already exists)

```
Logbook {
  id              String        @id @default(cuid())
  internProfileId String        (FK → InternProfile)
  issueId         String?       (FK → Issue, optional)
  date            DateTime      @db.Date
  activity        String
  duration        Int           @db.SmallInt  (minutes)
  status          LogbookStatus @default(pending_review)
  notes           String?
  deletedAt       DateTime?
}
```

LogbookStatus enum: `pending_review` | `approved` | `revision`

## Permission Resource

Use `journal` resource (already defined for Intern role):
- Add `"delete"` to `journal: ["create", "read", "update", "delete"]`
- Supervisor uses `logbook` resource (separate concern)

## Logic Rules

### Create
- Status always set to `pending_review`
- Date validated: must be ≤ 3 days before today (H-3 max backfill)
- Duration validated: positive integer
- `issueId` optional — no cross-validation (Issue CRUD is SGM-34, not yet done)

### Read (list + detail)
- Scoped to authenticated user's `internProfileId` — cannot see other interns' entries
- Filterable by: date range, status

### Update
- Allowed only when status is `pending_review` or `revision`
- If status is `revision`, update resets it to `pending_review`
- If status is `pending_review`, status stays `pending_review`

### Delete
- Allowed only when status is `pending_review`
- Uses Prisma soft delete (extension)

## File Checklist

- [ ] `lib/auth/permissions.ts` — add `"delete"` to journal
- [ ] `features/intern/types/logbook-types.ts`
- [ ] `features/intern/schemas/logbook-schemas.ts`
- [ ] `features/intern/data/logbook-data.ts`
- [ ] `features/intern/actions/logbook-actions.ts`
- [ ] `app/intern/logbook/page.tsx`

## Data Flow

```
app/intern/logbook/page.tsx (server)
  → fetchLogbooks(session.internProfileId) — 'use cache'
  → InternLogbookPage({ logbooks }) — placeholder client component

Client-side:
  useQuery(['logbooks']) → getLogbooks() action
  useMutation → createLogbook / updateLogbook / deleteLogbook
  → invalidateQueries(['logbooks'])
```

## Dependencies

- None — builds on existing Prisma `Logbook` model, existing auth/permissions
- Issue CRUD (SGM-34) is separate; `issueId` field is optional
