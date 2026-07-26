# R2 Storage Error Handling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add graceful error handling for R2 storage unavailability, with health checks, typed errors, and fail-fast integration in all server actions.

**Architecture:** A new `services/storage-health.ts` module provides a `StorageError` hierarchy, error classification, and a cached health check (HeadBucket every 60s). Each public function in `services/storage.ts` calls `assertStorageHealthy()` before touching R2. Server actions also call it at entry to fail fast before expensive DB/rendering work.

**Tech Stack:** TypeScript, Next.js Server Actions, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`

## Global Constraints

- No UI implementation — return `{ error: string, retryable: boolean }` shaped errors for UI layer
- Health cache TTL = 60_000ms
- Max 1 HeadBucket per 60s regardless of concurrency
- SDK errors from `@aws-sdk/client-s3` are subclasses of `S3ServiceException` with `.name` properties

---

### Task 1: Create `services/storage-health.ts`

**Files:**
- Create: `services/storage-health.ts`
- No other files yet

**Interfaces:**
- Consumes: `getR2Client()`, `getR2Bucket()` from `@/lib/r2`; `HeadBucketCommand`, `S3ServiceException` from `@aws-sdk/client-s3`
- Produces: `StorageError` (and subclasses) exported classes; `classifyStorageError()`, `checkStorageHealth()`, `assertStorageHealthy()`, `invalidateHealthCache()` exported functions

- [ ] **Step 1: Write the error classes**

```ts
import { S3ServiceException } from "@aws-sdk/client-s3"

export class StorageError extends Error {
  public readonly retryable: boolean
  public readonly userMessage: string

  constructor(message: string, retryable: boolean, userMessage: string) {
    super(message)
    this.name = "StorageError"
    this.retryable = retryable
    this.userMessage = userMessage
  }
}

export class StorageUnavailableError extends StorageError {
  constructor(message: string) {
    super(message, true, "Penyimpanan tidak tersedia. Coba lagi nanti.")
    this.name = "StorageUnavailableError"
  }
}

export class StorageAuthError extends StorageError {
  constructor(message: string) {
    super(message, false, "Konfigurasi penyimpanan tidak valid. Hubungi administrator.")
    this.name = "StorageAuthError"
  }
}

export class StorageNotFoundError extends StorageError {
  constructor(message: string) {
    super(message, false, "File tidak ditemukan di penyimpanan.")
    this.name = "StorageNotFoundError"
  }
}

export class StorageRateLimitError extends StorageError {
  constructor(message: string) {
    super(message, true, "Penyimpanan sedang sibuk. Coba lagi beberapa saat.")
    this.name = "StorageRateLimitError"
  }
}

export class StorageCorruptError extends StorageError {
  constructor(message: string) {
    super(message, true, "File di penyimpanan rusak atau tidak dapat dibaca.")
    this.name = "StorageCorruptError"
  }
}
```

- [ ] **Step 2: Write `classifyStorageError()`**

```ts
export function classifyStorageError(cause: unknown): StorageError {
  if (cause instanceof StorageError) return cause

  const name =
    cause instanceof S3ServiceException
      ? cause.name
      : (cause as Error)?.name ?? ""

  const message = cause instanceof Error ? cause.message : String(cause)

  switch (name) {
    case "AccessDenied":
    case "InvalidAccessKeyId":
    case "SignatureDoesNotMatch":
    case "CredentialsProviderError":
      return new StorageAuthError(message)

    case "NoSuchKey":
    case "NotFound":
      return new StorageNotFoundError(message)

    case "SlowDown":
    case "TooManyRequests":
      return new StorageRateLimitError(message)

    case "TimeoutError":
    case "NetworkingError":
    case "RequestTimeout":
      return new StorageUnavailableError(message)

    default:
      return new StorageUnavailableError(message)
  }
}
```

- [ ] **Step 3: Write health check functions**

```ts
import { HeadBucketCommand } from "@aws-sdk/client-s3"
import { getR2Client, getR2Bucket } from "@/lib/r2"

let healthCache: {
  healthy: boolean
  checkedAt: number
  healthyError: StorageError | null
} | null = null

const HEALTH_CACHE_TTL = 60_000

export async function checkStorageHealth(): Promise<{
  healthy: boolean
  error: StorageError | null
}> {
  const now = Date.now()
  if (healthCache && now - healthCache.checkedAt < HEALTH_CACHE_TTL) {
    return { healthy: healthCache.healthy, error: healthCache.healthyError }
  }

  try {
    await getR2Client().send(
      new HeadBucketCommand({ Bucket: getR2Bucket() }),
    )
    healthCache = { healthy: true, checkedAt: now, healthyError: null }
    return { healthy: true, error: null }
  } catch (e) {
    const error = classifyStorageError(e)
    healthCache = { healthy: false, checkedAt: now, healthyError: error }
    return { healthy: false, error }
  }
}

export async function assertStorageHealthy(): Promise<void> {
  const { healthy, error } = await checkStorageHealth()
  if (!healthy && error) throw error
}

export function invalidateHealthCache(): void {
  healthCache = null
}
```

- [ ] **Step 4: Run tsc to verify compilation**

```bash
npx tsc --noEmit --pretty
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add services/storage-health.ts
git commit -m "feat: add storage error types and health check service"
```

---

### Task 2: Guard `services/storage.ts` functions

**Files:**
- Modify: `services/storage.ts`

**Interfaces:**
- Consumes: `assertStorageHealthy()` from `@/services/storage-health`
- No API changes — same exported signatures

- [ ] **Step 1: Add import at top of `services/storage.ts`**

Add after line 8 (existing imports):
```ts
import { assertStorageHealthy } from "@/services/storage-health"
```

- [ ] **Step 2: Add guard to every public function**

Add `await assertStorageHealthy()` as the first line (after existing validation) in these functions:

**`uploadFromBuffer`** — after `validateFileSize`:
```ts
export async function uploadFromBuffer(
  key: string,
  buffer: Buffer,
  contentType: string,
  category: FileCategory = "generatedDocument",
): Promise<void> {
  validateFileSize(buffer.length, category)
  await assertStorageHealthy()

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )
}
```

**`getObjectStream`** — first line:
```ts
export async function getObjectStream(key: string) {
  await assertStorageHealthy()
  const { Body, ContentType } = await getR2Client().send(
```

**`getObjectBuffer`** — first line:
```ts
export async function getObjectBuffer(key: string): Promise<Buffer> {
  await assertStorageHealthy()
  const { Body } = await getR2Client().send(
```

**`getSignedDownloadUrl`** — first line:
```ts
export async function getSignedDownloadUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  await assertStorageHealthy()
  return getSignedUrl(
```

**`getSignedUploadUrl`** — first line:
```ts
export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 900,
): Promise<string> {
  await assertStorageHealthy()
  return getSignedUrl(
```

**`deleteObject`** — first line:
```ts
export async function deleteObject(key: string): Promise<void> {
  await assertStorageHealthy()
  await getR2Client().send(
```

**`objectExists`** — first line (after opening `try`):
```ts
export async function objectExists(key: string): Promise<boolean> {
  await assertStorageHealthy()
  try {
```

**`getObjectMetadata`** — first line:
```ts
export async function getObjectMetadata(key: string) {
  await assertStorageHealthy()
  const { ContentLength, ContentType } = await getR2Client().send(
```

Note: `fetchTemplateFromR2` delegates to `getObjectBuffer` on cache miss, so no separate guard needed.

- [ ] **Step 3: Run tsc to verify compilation**

```bash
npx tsc --noEmit --pretty
```
Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add services/storage.ts
git commit -m "feat: add health check guard to all storage functions"
```

---

### Task 3: Guard HR document actions

**Files:**
- Modify: `features/hr/actions/document-actions.tsx`

**Interfaces:**
- Consumes: `assertStorageHealthy()` from `@/services/storage-health`
- No API changes — `GenerateDocResult` already has `error?: string`

- [ ] **Step 1: Add import**

Replace the existing `import { uploadFromBuffer, ... }` from `@/services/storage` with same plus new import:
```ts
import {
  uploadFromBuffer,
  buildDocumentKey,
  fetchTemplateFromR2,
  buildTemplateKey,
} from "@/services/storage"
import { assertStorageHealthy, StorageError } from "@/services/storage-health"
```

- [ ] **Step 2: Add health check at start of each generator's outer try block**

Five generators: `generateCertificates`, `generateAssignmentLetter`, `generateAssessmentReport`, `generateAttendanceReport`, `generateCompletionLetter`.

After `await requirePermission(...)` in each outer try, add:
```ts
    await assertStorageHealthy()
```

For example, `generateCertificates` line 196:
```ts
    await requirePermission({ document: ["create"] });
    await assertStorageHealthy()
```

Apply same pattern to the other 4 generators.

- [ ] **Step 3: Improve error messages in inner catch blocks**

In each generator's inner `catch (e)` block, check for `StorageError`. For example, in `generateCertificates` line 258:

Replace:
```ts
          error: e instanceof Error ? e.message : "Unknown error",
```
With:
```ts
          error: e instanceof StorageError
            ? e.userMessage
            : e instanceof Error
              ? e.message
              : "Unknown error",
```

Apply to all 5 generators' inner catch blocks (lines 271, 370, 475, 599, 693).

- [ ] **Step 4: Run tsc to verify compilation**

```bash
npx tsc --noEmit --pretty
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add features/hr/actions/document-actions.tsx
git commit -m "feat: add storage health check to HR document generators"
```

---

### Task 4: Guard template actions

**Files:**
- Modify: `features/hr/actions/template-actions.ts`

**Interfaces:**
- Consumes: `assertStorageHealthy()`, `StorageError` from `@/services/storage-health`
- No API changes

- [ ] **Step 1: Add import**

```ts
import { assertStorageHealthy, StorageError } from "@/services/storage-health"
```

- [ ] **Step 2: Guard `uploadTemplate`**

After `validateFileSize(buffer.length, "template")` (line 87), add:
```ts
    await assertStorageHealthy()
```

- [ ] **Step 3: Improve error message in `uploadTemplate` catch**

Replace line 132:
```ts
        error instanceof Error
          ? error.message
          : "Gagal mengunggah template",
```
With:
```ts
        error instanceof StorageError
          ? error.userMessage
          : error instanceof Error
            ? error.message
            : "Gagal mengunggah template",
```

- [ ] **Step 4: Guard `deleteTemplate`**

At the start of the try block (after `await requirePermission(...)` on line 172), add:
```ts
    await assertStorageHealthy()
```

- [ ] **Step 5: Improve error message in `deleteTemplate` catch**

Replace line 195:
```ts
        error instanceof Error ? error.message : "Gagal menghapus template",
```
With:
```ts
        error instanceof StorageError
          ? error.userMessage
          : error instanceof Error
            ? error.message
            : "Gagal menghapus template",
```

- [ ] **Step 6: Run tsc to verify compilation**

```bash
npx tsc --noEmit --pretty
```
Expected: No errors.

- [ ] **Step 7: Commit**

```bash
git add features/hr/actions/template-actions.ts
git commit -m "feat: add storage health check to template actions"
```

---

### Task 5: Guard logbook creation

**Files:**
- Modify: `features/intern/actions/logbook-actions.ts`

**Interfaces:**
- Consumes: `assertStorageHealthy()`, `StorageError` from `@/services/storage-health`
- No API changes

- [ ] **Step 1: Add import**

```ts
import { assertStorageHealthy, StorageError } from "@/services/storage-health"
```

- [ ] **Step 2: Guard `createLogbook`**

After the date validation block (line 104), add:
```ts
    await assertStorageHealthy()
```

- [ ] **Step 3: Improve error message in `createLogbook` catch**

Replace line 145:
```ts
      error: error instanceof Error ? error.message : "Gagal membuat logbook",
```
With:
```ts
      error: error instanceof StorageError
        ? error.userMessage
        : error instanceof Error
          ? error.message
          : "Gagal membuat logbook",
```

- [ ] **Step 4: Run tsc to verify compilation**

```bash
npx tsc --noEmit --pretty
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add features/intern/actions/logbook-actions.ts
git commit -m "feat: add storage health check to logbook creation"
```

---

### Task 6: Guard presigned upload API

**Files:**
- Modify: `app/api/uploads/sign/route.ts`

**Interfaces:**
- Consumes: `assertStorageHealthy()`, `StorageError` from `@/services/storage-health`
- No API changes

- [ ] **Step 1: Add import**

```ts
import { assertStorageHealthy, StorageError } from "@/services/storage-health"
```

- [ ] **Step 2: Add health check before presigned URL generation**

In the `try` block (line 28), after validation, before `getSignedUploadUrl`:
```ts
    await assertStorageHealthy()
```

- [ ] **Step 3: Improve error response in catch**

Replace lines 37-38:
```ts
    const message = e instanceof Error ? e.message : "Validation failed"
    return NextResponse.json({ error: message }, { status: 400 })
```
With:
```ts
    const message = e instanceof StorageError
      ? e.userMessage
      : e instanceof Error
        ? e.message
        : "Validation failed"
    const status = e instanceof StorageError ? 503 : 400
    return NextResponse.json({ error: message }, { status })
```

- [ ] **Step 4: Run tsc to verify compilation**

```bash
npx tsc --noEmit --pretty
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/uploads/sign/route.ts
git commit -m "feat: add storage health check to presigned upload API"
```

---

### Task 7: Guard document file streaming API

**Files:**
- Modify: `app/api/documents/[id]/file/route.ts`

**Interfaces:**
- Consumes: `assertStorageHealthy()`, `StorageError` from `@/services/storage-health`
- No API changes

- [ ] **Step 1: Add import**

```ts
import { assertStorageHealthy, StorageError } from "@/services/storage-health"
```

- [ ] **Step 2: Add health check before streaming**

After the document lookup succeeds (after line 23), add:
```ts
    await assertStorageHealthy()
```

- [ ] **Step 3: Improve error response in catch**

Replace lines 35-37:
```ts
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
```
With:
```ts
  } catch (e) {
    if (e instanceof StorageError) {
      return NextResponse.json({ error: e.userMessage }, { status: 503 });
    }
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
```

- [ ] **Step 4: Run tsc to verify compilation**

```bash
npx tsc --noEmit --pretty
```
Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/documents/\[id\]/file/route.ts
git commit -m "feat: add storage health check to document file API"
```
