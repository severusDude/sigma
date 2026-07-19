# Certificate Preview — Design

## Overview

Create a PDF preview system for certificates: an API route to serve saved PDFs, a shared `DocumentPreview` component with Suspense/skeleton loading, a modal dialog wired to the data-table row action, a static `/certificates/[id]` page, and an ActionCard template thumbnail.

## Architecture

```
                   ┌─────────────────────────────┐
                   │   /api/documents/[id]/file   │
                   │   /api/templates/certificate │
                   │        /preview              │
                   └──────────┬──────────────────┘
                              │ stream PDF
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
  ┌──────────────┐   ┌───────────────┐   ┌──────────────────┐
  │ PreviewDialog │   │ ActionCard    │   │ /certificates/   │
  │ (modal)      │   │ (thumbnail)   │   │ [id] (full page) │
  └──────────────┘   └───────────────┘   └──────────────────┘
         │                    │                    │
         └────────────────────┴────────────────────┘
                      ┌──────────────────┐
                      │ DocumentPreview  │
                      │ (shared comp)    │
                      │ Suspense +       │
                      │ TanStack Query   │
                      └──────────────────┘
```

## API Routes

### `GET /api/documents/[id]/file`
- Fetches `Document` by ID from Prisma
- Reads file from `document.fileUrl` path
- Streams as `application/pdf` with proper headers
- Returns 404 if doc not found or file missing

### `GET /api/templates/certificate/preview`
- Renders `InternshipCertificate` with default props via `renderToBuffer`
- Returns the buffer as `application/pdf`
- No DB dependency — pure template preview

## Components

### `DocumentPreview`
- **Props:** `{ docId?: string; templateType?: DocumentType; size: 'full' | 'modal' | 'thumbnail' }`
- If `docId` → iframe src = `/api/documents/${docId}/file`
- If `templateType` (no docId) → iframe src = `/api/templates/${templateType}/preview`
- Wrapped in `<Suspense fallback={<PreviewSkeleton size={size} />}>`
- Skeleton uses shadcn `<Skeleton>` matching the size dimensions

### `PreviewSkeleton`
- Renders a `<Skeleton className={...} />` matching the iframe dimensions for each size variant

### `PreviewDialog`
- Dialog shell triggered by the `onView` row action
- Receives `docId`, renders `<DocumentPreview size="modal" docId={docId} />`

## Pages

### `/certificates/[id]`
- Server component that fetches `Document` + intern data
- Renders metadata header (recipient name, doc number, date) + `<DocumentPreview size="full" />`
- Uses TanStack Query for client-side interactivity (copy link button)

## Data Wiring

- `document-page.tsx`: `createColumns({ onView: (row) => setPreviewDocId(row.id) })` + state + `<PreviewDialog />`
- `action-card.tsx`: replace placeholder with `<DocumentPreview size="thumbnail" />` (no docId → template preview)
- All `DocumentPreview` instances use TanStack Query's `useQuery` to fetch the iframe URL (handles loading/error states)

## Files

| File | Action |
|------|--------|
| `app/api/documents/[id]/file/route.ts` | CREATE |
| `app/api/templates/certificate/preview/route.ts` | CREATE |
| `components/shared/document/document-preview.tsx` | CREATE |
| `components/shared/document/preview-skeleton.tsx` | CREATE |
| `components/shared/document/preview-dialog.tsx` | CREATE |
| `features/hr/pages/document-page.tsx` | MODIFY — wire dialog state |
| `features/hr/components/document/action-card.tsx` | MODIFY — thumbnail |
| `features/hr/components/document/columns.tsx` | MODIFY — wire onView |
| `app/(main)/certificates/[id]/page.tsx` | CREATE |
