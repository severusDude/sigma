# Certificate Preview — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add PDF preview modal dialog, template thumbnail, and static certificate page

**Architecture:** Two API routes serve PDFs (one from disk by doc ID, one generated on-the-fly for template preview). Shared `DocumentPreview` component renders an `<iframe>` with Suspense/skeleton, used in modal dialog, sidebar thumbnail, and full-page route.

**Tech Stack:** Next.js 16 (`cacheComponents: true`, `use cache`), `@react-pdf/renderer`, shadcn `Dialog`/`Skeleton`, TanStack Query, Prisma

## Global Constraints

- Use shadcn `Dialog` component for modal (consistent with existing project)
- `DocumentPreview` uses `<Suspense>` with shadcn `<Skeleton>` fallback
- Use TanStack Query where data fetching is needed client-side
- `GET /api/templates/certificate/preview` uses `renderToBuffer` from `@react-pdf/renderer`
- PDF files stored outside `public/` at `generated/certificates/...` — served via API route
- `/certificates/[id]` page uses `'use cache'` with `cacheLife('days')` for caching

---

### Task 1: API route — serve saved PDF by document ID

**Files:**
- Create: `app/api/documents/[id]/file/route.ts`

**Interfaces:**
- Consumes: Prisma `Document` model with `fileUrl` field
- Produces: `GET /api/documents/[id]/file` → `Response` with `application/pdf` stream

- [ ] **Create `app/api/documents/[id]/file/route.ts`**

```ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import fs from "fs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: { id },
    select: { fileUrl: true },
  });

  if (!document?.fileUrl) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  try {
    const fileBuffer = fs.readFileSync(document.fileUrl);
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${id}.pdf"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }
}
```

- [ ] **Commit**

```bash
git add app/api/documents/[id]/file/route.ts
git commit -m "feat: add API route to serve saved PDF by document ID"
```

---

### Task 2: API route — template preview (on-the-fly PDF)

**Files:**
- Create: `app/api/templates/certificate/preview/route.ts`

**Interfaces:**
- Consumes: `InternshipCertificate` from `features/hr/components/document/templates/certificates`
- Consumes: `renderToBuffer` from `@react-pdf/renderer`
- Produces: `GET /api/templates/certificate/preview` → `Response` with `application/pdf` buffer

- [ ] **Create `app/api/templates/certificate/preview/route.ts`**

```ts
import { renderToBuffer } from "@react-pdf/renderer";
import { InternshipCertificate } from "@/features/hr/components/document/templates/certificates";

export async function GET() {
  const buffer = await renderToBuffer(
    <InternshipCertificate
      recipientName="Nama Peserta Magang"
      organization="Badan Pusat Statistik Provinsi Jawa Timur"
      dateRange="1 Januari — 31 Desember 2026"
      signerTitle={["Kepala Badan Pusat Statistik", "Provinsi Jawa Timur"]}
      signerName="Dr. Ir. Zulkipli, M.Si."
    />,
  );

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=\"template-preview.pdf\"",
    },
  });
}
```

- [ ] **Commit**

```bash
git add app/api/templates/certificate/preview/route.ts
git commit -m "feat: add API route for certificate template preview PDF"
```

---

### Task 3: Shared components — DocumentPreview, PreviewSkeleton, PreviewDialog

**Files:**
- Create: `components/shared/document/document-preview.tsx`
- Create: `components/shared/document/preview-skeleton.tsx`
- Create: `components/shared/document/preview-dialog.tsx`
- Create: `components/shared/document/index.ts`

- [ ] **Create `components/shared/document/preview-skeleton.tsx`**

```tsx
import { Skeleton } from "@/components/ui/skeleton";

const sizeMap = {
  thumbnail: { h: "h-60" },
  modal: { h: "h-[80vh]" },
  full: { h: "h-[calc(100vh-12rem)]" },
} as const;

export function PreviewSkeleton({ size = "modal" }: { size?: keyof typeof sizeMap }) {
  return (
    <div className={`w-full ${sizeMap[size].h} flex items-center justify-center bg-muted/20 rounded-md`}>
      <Skeleton className="w-full h-full" />
    </div>
  );
}
```

- [ ] **Check that `@/components/ui/skeleton` exists**

```bash
if not exist "components\ui\skeleton.tsx" echo "Create skeleton component first"
```

- [ ] **Create `components/shared/document/document-preview.tsx`**

```tsx
"use client";

import { Suspense } from "react";
import { PreviewSkeleton } from "./preview-skeleton";

type PreviewSize = "full" | "modal" | "thumbnail";

interface DocumentPreviewProps {
  docId?: string;
  templateType?: string;
  size?: PreviewSize;
}

const sizeClasses: Record<PreviewSize, string> = {
  full: "w-full h-[calc(100vh-12rem)]",
  modal: "w-full h-[80vh]",
  thumbnail: "w-full h-60",
};

function PreviewIframe({ src }: { src: string }) {
  return (
    <iframe
      src={src}
      className="w-full h-full rounded-md border"
      title="PDF Preview"
    />
  );
}

export function DocumentPreview({ docId, templateType = "certificate", size = "modal" }: DocumentPreviewProps) {
  const src = docId
    ? `/api/documents/${docId}/file`
    : `/api/templates/${templateType}/preview`;

  return (
    <Suspense fallback={<PreviewSkeleton size={size} />}>
      <div className={sizeClasses[size]}>
        <PreviewIframe src={src} />
      </div>
    </Suspense>
  );
}
```

- [ ] **Create `components/shared/document/preview-dialog.tsx`**

```tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentPreview } from "./document-preview";

interface PreviewDialogProps {
  docId: string | null;
  onClose: () => void;
}

export function PreviewDialog({ docId, onClose }: PreviewDialogProps) {
  return (
    <Dialog open={!!docId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[90vh]">
        <DialogTitle className="sr-only">Preview Sertifikat</DialogTitle>
        {docId && <DocumentPreview docId={docId} size="modal" />}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Create `components/shared/document/index.ts`**

```ts
export { DocumentPreview } from "./document-preview";
export type { DocumentPreviewProps } from "./document-preview";
export { PreviewSkeleton } from "./preview-skeleton";
export { PreviewDialog } from "./preview-dialog";
```

- [ ] **Commit**

```bash
git add components/shared/document/
git commit -m "feat: add DocumentPreview, PreviewSkeleton, PreviewDialog components"
```

---

### Task 4: Wire DocumentPage — modal + ActionCard thumbnail

**Files:**
- Modify: `features/hr/pages/document-page.tsx`
- Modify: `features/hr/components/document/columns.tsx`
- Modify: `features/hr/components/document/action-card.tsx`

- [ ] **Update `features/hr/components/document/columns.tsx`** — wire `onView` to open preview dialog

```tsx
export function createColumns(actions: {
  onView: (row: DocumentRow) => void;
}) {
  // ... existing code, already has onView wired to "Lihat Detail"
}
```

No change needed — the `onView` is already wired in the columns. The page just needs to handle the dialog state.

- [ ] **Update `features/hr/pages/document-page.tsx`** — add preview dialog state and import

Add state and dialog:
```tsx
// Add import
import { PreviewDialog } from "@/components/shared/document";

// Inside component, add state:
const [previewDocId, setPreviewDocId] = useState<string | null>(null);

// Wire to columns:
const columns = createColumns({
  onView: (row) => setPreviewDocId(row.id),
});

// Add dialog before closing </div>:
<PreviewDialog docId={previewDocId} onClose={() => setPreviewDocId(null)} />
```

- [ ] **Update `features/hr/components/document/action-card.tsx`** — replace placeholder preview

```tsx
// Add import
import { DocumentPreview } from "@/components/shared/document";

// Replace the placeholder div (line 43-45):
<DocumentPreview size="thumbnail" />
```

- [ ] **Commit**

```bash
git add features/hr/pages/document-page.tsx features/hr/components/document/action-card.tsx
git commit -m "feat: wire preview dialog and update ActionCard thumbnail"
```

---

### Task 5: Static page — `/certificates/[id]`

**Files:**
- Create: `app/(main)/certificates/[id]/page.tsx`

**Interfaces:**
- Consumes: `DocumentPreview` from `components/shared/document`
- Consumes: Prisma `Document` + `InternProfile` + `User` data

- [ ] **Create `app/(main)/certificates/[id]/page.tsx`**

```tsx
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentPreview } from "@/components/shared/document";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  "use cache";
  cacheLife("days");

  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: { id, documentType: "certificate" },
    include: {
      internProfile: {
        include: { user: true },
      },
    },
  });

  if (!document || document.deletedAt) notFound();

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{document.title}</h1>
          <p className="text-sm text-muted-foreground">
            {document.internProfile.user.name} — {document.documentNumber}
          </p>
        </div>
      </div>
      <DocumentPreview docId={document.id} size="full" />
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add app/\(main\)/certificates/\[id\]/page.tsx
git commit -m "feat: add static certificate preview page at /certificates/[id]"
```
