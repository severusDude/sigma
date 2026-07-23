# Certificate Batch Generation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate PDF certificates for selected interns via batch action on Document Page

**Architecture:** Single server action `generateCertificates` iterates over intern IDs, fetches intern+supervisor data, maps to `InternshipCertificate` props, renders PDF via `renderToFile`, saves to `generated/certificates/`, and creates `Document` DB records.

**Tech Stack:** Next.js 16, `@react-pdf/renderer` v4.5.1, `tsx`, Prisma, Zod, `sonner` toasts

## Global Constraints

- All PDFs saved outside `public/` at `generated/certificates/`
- Document number format: `CERT/YYYY/MM/NNN` (padded 3-digit sequential per month)
- Signer info sourced from intern's current supervisor assignment
- Each intern is isolated in try/catch — one failure doesn't stop batch
- Permission check: `{ document: ["create"] }` (use existing `requirePermission`)

---

### Task 1: Document number utility

**Files:**
- Create: `features/hr/utils/document-number.ts`

**Interfaces:**
- Produces: `generateDocumentNumber(): Promise<string>` — returns `"CERT/2026/07/001"`

- [ ] **Create `features/hr/utils/document-number.ts`**

```ts
import { prisma } from "@/lib/prisma";

export async function generateDocumentNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const prefix = `CERT/${year}/${month}/`;

  const lastDoc = await prisma.document.findFirst({
    where: { documentNumber: { startsWith: prefix } },
    orderBy: { documentNumber: "desc" },
    select: { documentNumber: true },
  });

  const nextSeq = lastDoc
    ? String(Number(lastDoc.documentNumber.split("/").pop()) + 1).padStart(3, "0")
    : "001";

  return `${prefix}${nextSeq}`;
}
```

- [ ] **Commit**

```bash
git add features/hr/utils/document-number.ts
git commit -m "feat: add document number generator for certificates"
```

---

### Task 2: Server action — `generateCertificates`

**Files:**
- Create: `features/hr/actions/document-actions.ts`
- Ensure: `generated/certificates/` directory exists

**Interfaces:**
- Consumes: `generateDocumentNumber()` from Task 1
- Consumes: `InternshipCertificate` from `features/hr/components/document/templates/certificates`
- Produces: `generateCertificates(internIds: string[]): Promise<ActionResponse<GenerateCertResult[]>>`

- [ ] **Create `features/hr/actions/document-actions.ts`**

```ts
"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { renderToFile } from "@react-pdf/renderer";
import { generateDocumentNumber } from "../utils/document-number";
import { InternshipCertificate } from "../components/document/templates/certificates";
import type { ActionResponse } from "@/lib/types";
import path from "path";
import fs from "fs";

export type GenerateCertResult = {
  internId: string;
  internName: string;
  docNumber: string | null;
  filePath: string | null;
  error?: string;
};

export async function generateCertificates(
  internIds: string[],
): Promise<ActionResponse<GenerateCertResult[]>> {
  try {
    await requirePermission({ document: ["create"] });

    const results: GenerateCertResult[] = [];

    for (const internId of internIds) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: internId },
          include: {
            internProfile: {
              include: {
                department: true,
                supervisorAssignments: {
                  where: { endedAt: null },
                  include: {
                    supervisorProfile: {
                      include: { user: true },
                    },
                  },
                },
              },
            },
          },
        });

        if (!user?.internProfile) {
          results.push({ internId, internName: user?.name ?? "Unknown", docNumber: null, filePath: null, error: "Intern profile not found" });
          continue;
        }

        const intern = user.internProfile;
        const supervisor = intern.supervisorAssignments[0]?.supervisorProfile;

        const docNumber = await generateDocumentNumber();

        const formatDate = (d: Date) =>
          new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d));

        const outputDir = path.join(process.cwd(), "generated", "certificates");
        fs.mkdirSync(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, `${docNumber}.pdf`);

        await renderToFile(
          <InternshipCertificate
            recipientName={user.name}
            organization={intern.institution}
            dateRange={`${formatDate(intern.periodStart)} — ${formatDate(intern.periodEnd)}`}
            signerTitle={supervisor ? [supervisor.field] : ["Kepala Badan Pusat Statistik", "Provinsi Jawa Timur"]}
            signerName={supervisor?.user?.name ?? "Dr. Ir. Zulkipli, M.Si."}
          />,
          outputPath,
        );

        await prisma.document.create({
          data: {
            internProfileId: intern.id,
            documentType: "certificate",
            documentNumber: docNumber,
            title: "Sertifikat Magang",
            fileUrl: outputPath,
            status: "draft",
            metadata: { generatedAt: new Date().toISOString() },
          },
        });

        results.push({
          internId,
          internName: user.name,
          docNumber,
          filePath: outputPath,
        });
      } catch (e) {
        const name = (await prisma.user.findUnique({ where: { id: internId }, select: { name: true } }))?.name ?? "Unknown";
        results.push({
          internId,
          internName: name,
          docNumber: null,
          filePath: null,
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate certificates",
    };
  }
}
```

- [ ] **Commit**

```bash
git add features/hr/actions/document-actions.ts
git commit -m "feat: add generateCertificates server action"
```

---

### Task 3: Wire batch action in DocumentPage

**Files:**
- Modify: `features/hr/pages/document-page.tsx`

**Consumes:**
- `generateCertificates`, `GenerateCertResult` from Task 2
- `sonner` toast (`toast`)

- [ ] **Update `features/hr/pages/document-page.tsx`** — replace placeholder batch action and add toast

```tsx
// Add imports
import { toast } from "sonner";
import { generateCertificates } from "../actions/document-actions";
import { useRouter } from "next/navigation";

// Inside DocumentPage component, add:
const router = useRouter();

// Replace batchActions:
const batchActions = [
  {
    label: "Generate Document",
    icon: <FileText className="size-4" />,
    onClick: async (rows: DocumentRow[]) => {
      const internIds = rows.map((r) => r.id);
      const result = await generateCertificates(internIds);

      if (!result.success) {
        toast.error(result.error || "Gagal generate sertifikat");
        return;
      }

      const success = result.data.filter((r) => !r.error);
      const failed = result.data.filter((r) => r.error);

      if (failed.length === 0) {
        toast.success(`Berhasil membuat ${success.length} sertifikat`);
      } else {
        toast.warning(`${success.length} berhasil, ${failed.length} gagal`);
        failed.forEach((f) =>
          console.warn(`[cert-gen] ${f.internName}: ${f.error}`),
        );
      }

      router.refresh();
    },
  },
];
```

Also add `"use client"` (already present) — verify the page has the import of `useRouter` and `toast`.

- [ ] **Commit**

```bash
git add features/hr/pages/document-page.tsx
git commit -m "feat: wire certificate generation batch action in DocumentPage"
```

---

### Task 4: Add `.gitignore` entry

- [ ] **Add `generated/certificates/` to `.gitignore`** — verify the `generated/` directory already exists, add entry if not present

```gitignore
# Generated PDFs
generated/certificates/
```

- [ ] **Commit**

```bash
git add .gitignore
git commit -m "chore: ignore generated certificate PDFs"
```
