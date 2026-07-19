# Intern Logbook UI — Design Spec

**Date**: 2026-07-19
**Issue**: SGM-35 (CRUD Logbook entry)
**Based on Stitch design**: "Logbook Harian (Updated) - SIGMA BPS Desktop"

## Layout

Timeline/card layout (no DataTable). Single-column list grouped by ISO week, rendered inside the existing intern sidebar layout.

## Page Sections

### 1. Header
- Title "Logbook Harian" + breadcrumb
- "Tambah Logbook" button (opens create dialog)

### 2. AlertBanner
- Conditional: shown when logbook not filled for ≥2 consecutive days
- Warning variant: icon + message + optional CTA

### 3. StatsRow (4 cards using StatBlock)
- **Periode Magang**: `periodStart` → `periodEnd` from InternProfile
- **Status Hari**: "Aktif X/Y hari" — elapsed days / total period days
- **Presensi**: Placeholder "—" (attendance feature not built)
- **Logbook Diterima**: Count of `approved` entries

### 4. Tabs (Riwayat | Statistik)
- **Riwayat**: Timeline view (default)
- **Statistik**: Placeholder (future)

### 5. Logbook Timeline
- Days grouped by ISO week with "Minggu Ini", "Minggu Lalu", "DD MMM YYYY" headers
- Each entry as a LogbookCard

### 6. Floating Action Button (FAB)
- Fixed bottom-right button to add new entry (mobile-friendly)

## LogbookCard

| Section | Content |
|---------|---------|
| Date/time | Formatted date + time range (from duration) |
| Status badge | `pending_review` → "MENUNGGU REVIEW" (warning), `approved` → "DISETUJUI" (success), `revision` → "REVISI" (destructive) |
| Title | `issue?.title` or first line of activity |
| Description | `activity` text |
| Supervisor notes | Shown when `notes` present (revision feedback) |
| Actions | Dropdown menu: Detail, Edit (if `pending_review`/`revision`), Delete (if `pending_review`) |

## Dialogs (same pattern as HR intern CRUD)

| Dialog | Trigger | Content |
|--------|---------|---------|
| Create | "Tambah Logbook" button / FAB | Form: date picker, activity textarea, duration input, issue select, notes |
| Update | Edit action on card | Same form, prefilled |
| Detail | View action on card | Read-only: all fields + status + supervisor notes |
| Delete | Delete action on card | Confirm dialog: "Hapus entri logbook?" |

## Components

| Component | File | Responsibility |
|-----------|------|----------------|
| LogbookPage | `features/intern/pages/logbook-page.tsx` | State, data fetching, layout orchestration |
| LogbookCard | `features/intern/components/logbook/logbook-card.tsx` | Single entry display |
| WeekGroup | `features/intern/components/logbook/week-group.tsx` | Week header + children |
| AlertBanner | `features/intern/components/logbook/alert-banner.tsx` | Warning banner |
| FormFields | `features/intern/components/logbook/form-fields.tsx` | Shared form (date, activity, duration, issue, notes) |
| CreateForm | `features/intern/components/logbook/create-form.tsx` | Create dialog form |
| UpdateForm | `features/intern/components/logbook/update-form.tsx` | Update dialog form |
| DetailDialog | `features/intern/components/logbook/detail-dialog.tsx` | Read-only detail |
| DeleteDialog | `features/intern/components/logbook/delete-dialog.tsx` | Delete confirmation |

## Data Flow

```
app/intern/logbook/page.tsx (server, already exists — passes nothing, just renders)
  └── LogbookPage (client)
       ├── useQuery(['logbooks']) → getLogbooks()
       ├── useQuery(['intern-profile']) → getInternProfile()
       ├── Computes: stats, week groups, consecutive-day check
       ├── Renders: header, alert, stats row, tabs, timeline
       └── Mutations: createLogbook, updateLogbook, deleteLogbook
            └── invalidateQueries(['logbooks'])
```

## Status Badge Mapping

| LogbookStatus | Badge variant | Label |
|---------------|---------------|-------|
| `pending_review` | `warning` (or a custom orange) | MENUNGGU REVIEW |
| `approved` | `success` (or `default`) | DISETUJUI |
| `revision` | `destructive` | REVISI |

## Existing Assets (no new shadcn components needed)

- `StatBlock` + `StatHeader` + `StatIcon` + `StatTitle` + `StatDescription` + `StatContent` + `StatMain` + `StatValue` + `StatSubValue` — from `@/components/shared/stat-block`
- `Badge` — from `@/components/ui/badge`
- `Button` — from `@/components/ui/button`
- `Dialog` + `DialogContent` + `DialogHeader` + `DialogTitle` + `DialogDescription` — from `@/components/ui/dialog`
- `AlertDialog` + variants — from `@/components/ui/alert-dialog`
- `ScrollArea` — from `@/components/ui/scroll-area`
- `Card`, `CardHeader`, `CardContent` — from `@/components/ui/card`
- `Tabs` — from `@/components/ui/tabs`
- `Avatar`, `AvatarFallback` — from `@/components/ui/avatar`
