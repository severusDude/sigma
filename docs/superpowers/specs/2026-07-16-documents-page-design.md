# Generate Documents Page — Design Spec

**Feature**: F10 — Generate Dokumen Otomatis
**Status**: Draft
**Date**: 2026-07-16

## Overview

HR page at `/hr/documents` for batch-generating internship completion documents (certificates, assignment letters, assessment reports, attendance reports, completion letters).

Only the **Certificate tab** is implemented in this pass. Other tabs are scaffolded but will show empty content.

## File Structure

```
app/hr/documents/page.tsx              ← server component, fetches data
features/hr/
  pages/document-page.tsx              ← client page (hero, tabs, layout)
  components/document/
    columns.tsx                        ← column defs for intern table
    action-bar.tsx                      ← selection summary + template + CTAs
  types/document-types.ts               ← row type alias
```

## Data Flow

1. `app/hr/documents/page.tsx` fetches interns via `fetchInterns()` and departments
2. Renders `<DocumentPage>` client component with interns + departments as props
3. Client page manages: active tab (`useState<DocumentType>`), row selection (DataTable internal)
4. DataTable receives columns, filter/sort options, batchActions
5. ActionBar shows below table when rows are selected

## Components

### DocumentPage (pages/document-page.tsx)
- Hero: h1 "Generate Documents" + subtitle
- Tabs (shadcn/Tabs): 5 tabs mapped to DocumentType enum (certificate tab active by default)
- TabContent: DataTable + ActionBar
- Status section placeholder (not implemented in this pass)

### Columns (components/document/columns.tsx)
- Uses `withSelectColumn` + `withActionColumn` helpers
- Columns: Nama (+NIK), Bidang/Department, Periode, Kelengkapan Data (static "Lengkap")
- Action options: Lihat Detail (no-op placeholder)

### ActionBar (components/document/action-bar.tsx)
- Visible when `selectedCount > 0`
- Shows: selected count, "Lihat Preview" button, template `<Select>`, two CTAs
- CTAs: "Generate Document" (FileText icon), "Generate & Send to TTE" (Send icon)
- All buttons are placeholder (disabled with no-op handlers)

## Data Model

Row type = `UserGetPayload<{ include: typeof internInclude }>` (reuse existing `Intern` type)

## Linear Issues

- SGM-15 (epic): In Progress
- SGM-46 (certificate template): In Progress — UI scaffold
- SGM-45 (react-pdf setup): In Progress
