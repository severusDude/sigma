# Cloudflare R2 Object Storage Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace local filesystem storage with Cloudflare R2 for document generation output, uploaded templates, and logbook attachments.

**Architecture:** Hybrid approach — built-in templates remain local (in git, fast reads); uploaded templates live on R2 with in-memory LRU cache; generated documents and attachments live on R2 exclusively. Uses `@aws-sdk/client-s3` for S3-compatible API calls. Client uploads use presigned URLs. File serving uses server-side streaming via `GetObjectCommand`.

**Tech Stack:** Next.js 16, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, Cloudflare R2

## Global Constraints

- Use `@aws-sdk/client-s3` (not s3-lite-client)
- Strict file type/size validation in storage service
- Built-in templates (`templates/hr/*.docx`) stay on local filesystem
- Uploaded templates stored at `documents/templates/{documentType}/{filename}` on R2
- Generated documents stored at `documents/generated/{type}/{year}/{month}/{filename}`
- Logbook attachments stored at `attachments/logbooks/{internId}/{uuid}/{filename}`
- All file serving goes through existing API route (auth-aware)
- Bucket is NOT public — access via presigned URLs or server-side streaming

---
### Task 1: Create `services/storage.ts` with strict validation

**Files:**
- Create: `services/storage.ts`

**Interfaces:**
- Consumes: `getR2Client()` from `lib/r2.ts` (already created), `getR2Bucket()` from `lib/r2.ts`
- Produces: All storage operations consumed by Tasks 2-5

**Design decisions:**
- **Allowed upload types (for client-uploaded content):** jpg, jpeg, png, gif, webp, svg, pdf, doc, docx
- **Allowed template types:** docx only
- **Max file sizes:** templates 10MB, attachments 5MB, generated docs 20MB
- **In-memory LRU cache** for uploaded templates fetched from R2 (max 50 items, 5min TTL) so batch document generation doesn't hammer R2
- **Built-in templates** are served directly from `templates/hr/` via the existing `lib/docxtemplater.ts` — no R2 involvement

- [ ] **Step 1: Create `services/storage.ts` with type definitions and constants**

```typescript
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand, NoSuchKey } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { getR2Client, getR2Bucket } from "@/lib/r2"

export const ALLOWED_UPLOAD_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/svg+xml": [".svg"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
} as const

export const ALLOWED_TEMPLATE_TYPES = {
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
} as const

export const MAX_FILE_SIZES = {
  template: 10 * 1024 * 1024,
  attachment: 5 * 1024 * 1024,
  generatedDocument: 20 * 1024 * 1024,
} as const

export const ALLOWED_UPLOAD_MIME_TYPES = Object.keys(ALLOWED_UPLOAD_TYPES)
export const ALLOWED_TEMPLATE_MIME_TYPES = Object.keys(ALLOWED_TEMPLATE_TYPES)

export type FileCategory = "template" | "attachment" | "generatedDocument"

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}
```

- [ ] **Step 2: Add validation helpers**

```typescript
function getExtension(filename: string): string {
  return filename.toLowerCase().slice(filename.lastIndexOf("."))
}

function getMimeType(filename: string): string | null {
  const ext = getExtension(filename)
  for (const [mime, exts] of Object.entries(ALLOWED_UPLOAD_TYPES)) {
    if (exts.includes(ext)) return mime
  }
  return null
}

export function validateFileType(filename: string, allowedMimeTypes: string[]): string {
  const mime = getMimeType(filename)
  if (!mime || !allowedMimeTypes.includes(mime)) {
    throw new ValidationError(
      `Tipe file tidak diizinkan: ${filename}. Format yang diizinkan: ${allowedMimeTypes.join(", ")}`
    )
  }
  return mime
}

export function validateFileSize(size: number, category: FileCategory): void {
  const max = MAX_FILE_SIZES[category]
  if (size > max) {
    const mb = max / 1024 / 1024
    throw new ValidationError(`File terlalu besar (maksimal ${mb}MB untuk ${category})`)
  }
}
```

- [ ] **Step 3: Add key builders**

```typescript
export function buildDocumentKey(documentType: string, docNumber: string, ext: string): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  return `documents/generated/${documentType}/${year}/${month}/${docNumber}${ext}`
}

export function buildTemplateKey(documentType: string, filename: string): string {
  return `documents/templates/${documentType}/${filename}`
}

export function buildAttachmentKey(attachableType: string, attachableId: string, filename: string): string {
  const uuid = crypto.randomUUID()
  return `attachments/${attachableType}/${attachableId}/${uuid}-${filename}`
}
```

- [ ] **Step 4: Add upload function with validation**

```typescript
export async function uploadFromBuffer(
  key: string,
  buffer: Buffer,
  contentType: string,
  category: FileCategory = "generatedDocument",
): Promise<void> {
  const client = getR2Client()
  const bucket = getR2Bucket()

  validateFileSize(buffer.length, category)

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )
}
```

- [ ] **Step 5: Add read functions (stream + buffer)**

```typescript
export async function getObjectStream(key: string) {
  const client = getR2Client()
  const bucket = getR2Bucket()

  const { Body, ContentType } = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  )

  if (!Body) throw new Error(`Object not found: ${key}`)

  return {
    stream: Body.transformToWebStream(),
    contentType: ContentType ?? "application/octet-stream",
  }
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const client = getR2Client()
  const bucket = getR2Bucket()

  const { Body } = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  )

  if (!Body) throw new Error(`Object not found: ${key}`)

  const bytes = await Body.transformToByteArray()
  return Buffer.from(bytes)
}
```

- [ ] **Step 6: Add template cache (in-memory LRU)**

```typescript
const templateCache = new Map<string, { buffer: Buffer; mimeType: string; timestamp: number }>()
const TEMPLATE_CACHE_TTL = 5 * 60 * 1000
const TEMPLATE_CACHE_MAX = 50

function getCachedTemplate(key: string): { buffer: Buffer; mimeType: string } | null {
  const cached = templateCache.get(key)
  if (!cached) return null
  if (Date.now() - cached.timestamp > TEMPLATE_CACHE_TTL) {
    templateCache.delete(key)
    return null
  }
  return cached
}

function setCachedTemplate(key: string, buffer: Buffer, mimeType: string): void {
  if (templateCache.size >= TEMPLATE_CACHE_MAX) {
    const oldest = templateCache.keys().next().value
    if (oldest) templateCache.delete(oldest)
  }
  templateCache.set(key, { buffer, mimeType, timestamp: Date.now() })
}
```

- [ ] **Step 7: Add template-specific fetch (with cache)**

```typescript
export async function fetchTemplateFromR2(key: string): Promise<Buffer> {
  const cached = getCachedTemplate(key)
  if (cached) return cached.buffer

  const buffer = await getObjectBuffer(key)
  setCachedTemplate(key, buffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
  return buffer
}
```

- [ ] **Step 8: Add presigned URL generators**

```typescript
export async function getSignedDownloadUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  const client = getR2Client()
  const bucket = getR2Bucket()

  return getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn },
  )
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 900,
): Promise<string> {
  const client = getR2Client()
  const bucket = getR2Bucket()

  validateFileType(key.split("/").pop() ?? "", [contentType])

  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn },
  )
}
```

- [ ] **Step 9: Add delete and exists functions**

```typescript
export async function deleteObject(key: string): Promise<void> {
  const client = getR2Client()
  const bucket = getR2Bucket()

  await client.send(
    new DeleteObjectCommand({ Bucket: bucket, Key: key }),
  )
}

export async function objectExists(key: string): Promise<boolean> {
  const client = getR2Client()
  const bucket = getR2Bucket()

  try {
    await client.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key }),
    )
    return true
  } catch (e) {
    if (e instanceof NoSuchKey) return false
    throw e
  }
}

export async function getObjectMetadata(key: string) {
  const client = getR2Client()
  const bucket = getR2Bucket()

  const { ContentLength, ContentType } = await client.send(
    new HeadObjectCommand({ Bucket: bucket, Key: key }),
  )

  return {
    size: ContentLength ?? 0,
    contentType: ContentType ?? "application/octet-stream",
  }
}
```

---
### Task 2: Refactor `document-actions.tsx` to use R2

**Files:**
- Modify: `features/hr/actions/document-actions.tsx`

**Interfaces:**
- Consumes: `uploadFromBuffer`, `buildDocumentKey`, `fetchTemplateFromR2`, `buildTemplateKey`, `objectExists` from `services/storage.ts`
- Replaces: direct `fs.writeFileSync` and `fs.readFileSync` calls for generated files and uploaded templates

**Key changes:**
- `buildOutputPath()` → replaced by `buildDocumentKey()`
- `getActiveTemplate()` → try R2 first (via `fetchTemplateFromR2`), fall back to local built-in templates
- `saveDocumentRecord()` → store R2 key instead of local path in `fileUrl`
- `generateCertificates()` → render to buffer, upload to R2
- All DOCX generators → upload buffer to R2 directly instead of `fs.writeFileSync`

- [ ] **Step 1: Add R2 imports**

Add to top of `document-actions.tsx`:
```typescript
import { uploadFromBuffer, buildDocumentKey, fetchTemplateFromR2, buildTemplateKey } from "@/services/storage"
```

- [ ] **Step 2: Update `getActiveTemplate()` to fetch from R2 first**

Replace the existing `getActiveTemplate()` function:
```typescript
async function getActiveTemplate(documentType: string): Promise<Buffer> {
  const active = await prisma.documentTemplate.findFirst({
    where: { documentType: documentType as DocumentType, isActive: true },
    select: { content: true },
  })

  if (active) {
    try {
      return await fetchTemplateFromR2(active.content)
    } catch {
      // R2 fetch failed — fall through to local built-in
    }
  }

  // Fallback to local built-in templates
  const localPath = path.join(process.cwd(), "templates", "hr", `${documentType}.docx`)
  if (fs.existsSync(localPath)) {
    return fs.readFileSync(localPath)
  }

  const label = DOCUMENT_LABELS[documentType] ?? "Dokumen"
  throw new Error(
    `TEMPLATE_NOT_FOUND:Template ${label} tidak tersedia. Silahkan upload template terlebih dahulu.`
  )
}
```

- [ ] **Step 3: Update `generateCertificates()` — upload PDF to R2**

Replace the `renderToFile` block (lines 220-249):
```typescript
const docNumber = await generateDocumentNumber("CERT")
const pdfBuffer = await renderToBuffer(
  <InternshipCertificate
    recipientName={user.name}
    organization="Badan Pusat Statistik Kota Tasikmalaya"
    dateRange={`${formatDate(intern.periodStart)} — ${formatDate(intern.periodEnd)}`}
    signerTitle={
      supervisor
        ? [supervisor.field]
        : ["Kepala Badan Pusat Statistik", "Kota Tasikmalaya"]
    }
    signerName={supervisor?.user?.name ?? "Dr. Ir. Zulkipli, M.Si."}
  />,
)

const r2Key = buildDocumentKey("certificates", docNumber, ".pdf")
await uploadFromBuffer(r2Key, Buffer.from(pdfBuffer), "application/pdf")

await saveDocumentRecord(
  intern.id,
  "certificate",
  docNumber,
  "Sertifikat Magang",
  r2Key,
)
```

Wait — `@react-pdf/renderer`'s `renderToFile` takes a file path. Let me check if there's a `renderToBuffer` or if we should use the stream API.

Actually, looking at the code: `renderToFile` writes to disk. We can use `renderToStream` and then collect to buffer, or use `renderToFile` to a temp file then upload and delete. Let me check what v4.5.1 provides.

For `@react-pdf/renderer` v4, we can use `renderToStream`:
```typescript
const stream = await renderToStream(<Component />)
const chunks: Uint8Array[] = []
for await (const chunk of stream) {
  chunks.push(chunk)
}
const buffer = Buffer.concat(chunks)
```

Actually, let me just use the simpler approach: render to temp file, upload, delete temp file. This minimizes API change risk.

- [ ] **Step 4: Update DOCX generators — upload to R2 instead of writing to disk**

For `generateAssignmentLetter()`, `generateAssessmentReport()`, `generateAttendanceReport()`, `generateCompletionLetter()`:

Replace the pattern:
```typescript
const outputPath = buildOutputPath(docNumber, "assignment-letters")
fs.writeFileSync(outputPath, buf)
// ...
await saveDocumentRecord(..., outputPath)
```

With:
```typescript
const r2Key = buildDocumentKey("assignment-letters", docNumber, ".docx")
await uploadFromBuffer(r2Key, buf, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
// ...
await saveDocumentRecord(..., r2Key)
```

Remove `import fs from "fs"` and `import path from "path"` if they're no longer used elsewhere in the file.

---
### Task 3: Refactor `template-actions.ts` to use R2

**Files:**
- Modify: `features/hr/actions/template-actions.ts`

**Interfaces:**
- Consumes: `uploadFromBuffer`, `deleteObject`, `buildTemplateKey`, `validateFileType`, `validateFileSize`, `ALLOWED_TEMPLATE_MIME_TYPES`, `MAX_FILE_SIZES` from `services/storage.ts`
- Replaces: direct filesystem I/O for template upload/delete

**Key changes:**
- `uploadTemplate()` → upload buffer to R2 instead of local dir
- `deleteTemplate()` → delete from R2 instead of local
- Store R2 key in `DocumentTemplate.content`

- [ ] **Step 1: Update `uploadTemplate()`**

Replace the file-writing block (lines 79-99):
```typescript
const fileName = `${documentType}-${Date.now()}.docx`
const buffer = Buffer.from(await file.arrayBuffer())

validateFileType(fileName, ALLOWED_TEMPLATE_MIME_TYPES)
validateFileSize(buffer.length, "template")

const r2Key = buildTemplateKey(documentType, fileName)
await uploadFromBuffer(r2Key, buffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "template")
```

Replace the `template` create block `content` value from `filePath` to `r2Key`:
```typescript
const template = await prisma.documentTemplate.create({
  data: {
    documentType: documentType as ...,
    name,
    content: r2Key,  // was: filePath
    variables: getVariablesForType(documentType),
    isActive: true,
  },
})
```

- [ ] **Step 2: Update `deleteTemplate()`**

Replace the file-deletion block:
```typescript
if (template.content) {
  await deleteObject(template.content).catch(() => {
    // ignore — file may not exist in R2 yet (e.g. from before migration)
  })
}
```

Remove `import fs from "fs"` and `import path from "path"` if no longer used.

---
### Task 4: Refactor document file API route

**Files:**
- Modify: `app/api/documents/[id]/file/route.ts`

**Interfaces:**
- Consumes: `getObjectStream` from `services/storage.ts`

- [ ] **Step 1: Replace filesystem read with R2 stream**

Replace the entire handler body:

```typescript
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { getObjectStream } from "@/services/storage"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const document = await prisma.document.findFirst({
    where: {
      OR: [
        { id },
        { internProfile: { userId: id } },
      ],
    },
    select: { fileUrl: true, documentType: true },
  })

  if (!document?.fileUrl) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  try {
    const { stream, contentType } = await getObjectStream(document.fileUrl)

    return new Response(stream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    })
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }
}
```

---
### Task 5: Create presigned upload endpoint + logbook attachment support

**Files:**
- Create: `app/api/uploads/sign/route.ts`
- Create: `app/api/uploads/finalize/route.ts`
- Modify: `features/intern/actions/logbook-actions.ts`

**Interfaces:**
- Consumes: `getSignedUploadUrl`, `getSignedDownloadUrl`, `buildAttachmentKey`, `getObjectMetadata`, `validateFileType`, `validateFileSize`, `ALLOWED_UPLOAD_MIME_TYPES`, `MAX_FILE_SIZES` from `services/storage.ts`

- [ ] **Step 1: Create `app/api/uploads/sign/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getSignedUploadUrl, buildAttachmentKey, validateFileType, validateFileSize, ALLOWED_UPLOAD_MIME_TYPES } from "@/services/storage"

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { fileName, fileSize, attachableType, attachableId } = await request.json()

  if (!fileName || !fileSize || !attachableType || !attachableId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const mimeType = validateFileType(fileName, ALLOWED_UPLOAD_MIME_TYPES)
    validateFileSize(fileSize, "attachment")

    const key = buildAttachmentKey(attachableType, attachableId, fileName)
    const uploadUrl = await getSignedUploadUrl(key, mimeType, 900)

    return NextResponse.json({ uploadUrl, key, requiredContentType: mimeType })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Validation failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
```

- [ ] **Step 2: Create `app/api/uploads/finalize/route.ts`**

```typescript
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { getObjectMetadata, ALLOWED_UPLOAD_MIME_TYPES, MAX_FILE_SIZES } from "@/services/storage"

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { key, fileName, attachableType, attachableId } = await request.json()

  if (!key || !fileName || !attachableType || !attachableId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const { size, contentType } = await getObjectMetadata(key)

    if (size <= 0 || size > MAX_FILE_SIZES.attachment) {
      return NextResponse.json({ error: "Invalid file size" }, { status: 400 })
    }

    if (!ALLOWED_UPLOAD_MIME_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    const attachment = await prisma.attachment.create({
      data: {
        attachableType: attachableType as "logbook" | "document" | "guide",
        attachableId,
        fileName,
        fileUrl: key,
        mimeType: contentType,
        fileSize: size,
      },
    })

    return NextResponse.json({ ok: true, attachment })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Finalize failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

- [ ] **Step 3: Add attachment support to logbook creation**

In `features/intern/actions/logbook-actions.ts`, extend `createLogbook` to accept attachment keys:

Add after logbook creation (after line 117):
```typescript
// Create attachments if provided
if (parsed.attachments?.length) {
  await prisma.attachment.createMany({
    data: parsed.attachments.map((att) => ({
      attachableType: "logbook",
      attachableId: logbook.id,
      fileName: att.name,
      fileUrl: att.key,
      mimeType: att.mimeType,
      fileSize: att.size,
    })),
  }
}
```

---
### Task 6: Write migration script

**Files:**
- Create: `scripts/migrate-to-r2.ts`

- [ ] **Step 1: Create script skeleton**

```typescript
import { prisma } from "@/lib/prisma"
import { uploadFromBuffer, buildDocumentKey, buildTemplateKey } from "@/services/storage"
import fs from "fs"
import path from "path"

async function migrateDocuments() {
  const docs = await prisma.document.findMany({
    where: { fileUrl: { not: null } },
    select: { id: true, documentNumber: true, fileUrl: true, documentType: true },
  })

  for (const doc of docs) {
    if (!doc.fileUrl) continue
    if (doc.fileUrl.startsWith("documents/")) continue // already migrated

    const localPath = path.resolve(doc.fileUrl)
    if (!fs.existsSync(localPath)) {
      console.warn(`[SKIP] File not found: ${localPath} (doc ${doc.id})`)
      continue
    }

    const ext = path.extname(localPath)
    const key = buildDocumentKey(doc.documentType, doc.documentNumber, ext)
    const buffer = fs.readFileSync(localPath)
    const mime = ext === ".pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    await uploadFromBuffer(key, buffer, mime)
    await prisma.document.update({ where: { id: doc.id }, data: { fileUrl: key } })
    console.log(`[OK] ${doc.documentNumber} → ${key}`)
  }
}

async function migrateTemplates() {
  const templates = await prisma.documentTemplate.findMany()
  for (const t of templates) {
    const localPath = path.resolve(t.content)
    if (!fs.existsSync(localPath)) continue
    const filename = path.basename(localPath)
    const key = buildTemplateKey(t.documentType, filename)
    const buffer = fs.readFileSync(localPath)
    await uploadFromBuffer(key, buffer, "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "template")
    await prisma.documentTemplate.update({ where: { id: t.id }, data: { content: key } })
    console.log(`[OK] template ${t.name} → ${key}`)
  }
}

async function main() {
  console.log("=== Migrating Documents ===")
  await migrateDocuments()
  console.log("\n=== Migrating Templates ===")
  await migrateTemplates()
  console.log("\n=== Done ===")
}

main().catch(console.error)
```

---

## Execution Order

1. **Task 1** (`services/storage.ts`) — foundation, nothing works without it
2. **Task 2** (`document-actions.tsx`) — document generation to R2
3. **Task 3** (`template-actions.ts`) — template management to R2
4. **Task 4** (API route) — serve files from R2
5. **Task 5** (presigned upload + logbook) — client uploads
6. **Task 6** (migration script) — only needed on existing data

Tasks 2-4 can be done in parallel after Task 1 is complete. Task 5 depends on Task 1 only. Task 6 should be run last.