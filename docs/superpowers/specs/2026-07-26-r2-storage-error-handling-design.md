# R2 Storage Error Handling Design

**Date:** 2026-07-26
**Status:** Approved
**Epic:** SGM-71 — Integrate Cloudflare R2 Object Storage

## 1. Overview

Add graceful error handling for R2 storage unavailability (timeout, incorrect credentials, service down, throttling). Server actions check storage health before R2 operations to prevent application errors and surface intuitive error information to the UI layer.

## 2. Error Type Hierarchy

Defined in `services/storage-health.ts`:

```
StorageError (base extends Error)
├── StorageUnavailableError    — R2 unreachable, timeout, DNS failure
├── StorageAuthError           — wrong keys, invalid credentials, forbidden
├── StorageNotFoundError       — requested object does not exist
├── StorageRateLimitError      — R2 throughput / request rate throttling
└── StorageCorruptError        — SDK returned null Body when content expected
```

Each subclass carries:
- `userMessage: string` — Indonesian message suitable for UI display
- `retryable: boolean` — whether the operation can be retried safely

A `classifyStorageError(cause: unknown): StorageError` function maps SDK errors:
- `TimeoutError` / `ConnectionError` → `StorageUnavailableError`
- `CredentialsProviderError` / `403` → `StorageAuthError`
- `NoSuchKey` / `NotFound` → `StorageNotFoundError`
- `TooManyRequests` / `SlowDown` → `StorageRateLimitError`
- Null `Body` in `GetObjectCommand` response → `StorageCorruptError`
- Everything else → `StorageUnavailableError` (safe fallback)

## 3. Health Check Service

Same file (`services/storage-health.ts`).

### Cache
```ts
let healthCache: {
  healthy: boolean
  checkedAt: number
  details: { status: string; error: StorageError | null }
} | null = null
const HEALTH_CACHE_TTL = 60_000 // 1 minute
```

### Functions
- **`checkStorageHealth()`** — Sends `HeadBucket` to R2. Caches result for 60s. Returns `{ healthy: boolean; error: StorageError | null }`.
- **`assertStorageHealthy()`** — Calls `checkStorageHealth()`. Throws the cached `StorageError` if unhealthy.
- **`invalidateHealthCache()`** — Clears cached state. Called after a successful operation following a failure to force a fresh check.

### R2 Cost
Max 1 `HeadBucket` (Class B op) per 60s regardless of concurrency → ~43K/month, well within 10M free tier.

## 4. Integration

### `services/storage.ts` functions
Every public function (`uploadFromBuffer`, `getObjectStream`, `getObjectBuffer`, `deleteObject`, `objectExists`, `getObjectMetadata`, `getSignedDownloadUrl`, `getSignedUploadUrl`, `fetchTemplateFromR2`) calls `assertStorageHealthy()` as its first operation.

### Server actions
Actions that touch storage call `assertStorageHealthy()` at the start, then wrap R2 operations in try/catch:

```ts
try {
  await assertStorageHealthy()
  // existing logic
} catch (e) {
  if (e instanceof StorageError) {
    return { error: e.userMessage, retryable: e.retryable }
  }
  throw e
}
```

### Files to modify
- **`services/storage.ts`** — Add `assertStorageHealthy()` call at top of each public function
- **`features/hr/actions/document-actions.tsx`** — Wrap generate actions with health check + error catch
- **`features/hr/actions/template-actions.ts`** — Wrap upload/delete actions with health check + error catch
- **`features/intern/actions/logbook-actions.ts`** — Wrap attachment upload action with health check + error catch
- **`app/api/uploads/sign/route.ts`** — Add health check before generating presigned URL
- **`app/api/documents/[id]/file/route.ts`** — Add health check before streaming from R2

### New file
- **`services/storage-health.ts`** — Error classes, `classifyStorageError()`, health check functions

## 5. Non-Goals (out of scope)

- No UI implementation (banners, toasts, disabled buttons)
- No migration script changes
- No built-in template storage changes (those stay local)
