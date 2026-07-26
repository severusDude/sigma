# Storage Toast Pattern

## Problem

Server actions that touch R2 storage (`assertStorageHealthy()` → `HeadBucketCommand`,
`uploadFromBuffer`, `deleteObject`, etc.) can fail with transient errors (timeout,
network, rate-limit) or permanent errors (auth misconfig, not-found).

The UI currently handles these inconsistently:
- `document-page.tsx` — shows `toast.error(result.error)` with no retry
- `template-page.tsx` upload — `useActionState` + `useEffect` with plain `toast.error`
- `template-page.tsx` delete — same as document-page
- `create-form.tsx` — `useMutation` + `toast.promise` error callback

Transient errors should offer a "Coba Lagi" action that retries the operation and
refreshes page state on success. We need one standard pattern all components follow.

## Design

### Layer 1 — `ActionResponse` field

Add `retryable?: boolean` to the existing `ActionResponse<T>` type.

```ts
// lib/types/index.ts
export type ActionResponse<T> = {
  success: boolean
  data?: T
  error?: string
  retryable?: boolean
}
```

### Layer 2 — Server action changes

Every server action that catches `StorageError` propagates `e.retryable` to the
response. Three-character change per catch block.

```ts
// Inside catch (e) { ... }
if (e instanceof StorageError) {
  return { success: false, error: e.userMessage, retryable: e.retryable }
}
```

Files touched: `document-actions.tsx` (2 generators), `template-actions.ts` (upload
+ delete), `logbook-actions.ts` (create).

### Layer 3 — `useStorageToast` hook

A single hook at `hooks/use-storage-toast.ts` that wraps action execution and
manages the full toast lifecycle:

- **Loading** — shows `toast.loading(loadingMessage)` while executing
- **Success** — dismisses loading, shows success toast, calls `onSuccess(data)`,
  calls `router.refresh()`
- **Retryable error** — dismisses loading, shows error toast with "Coba Lagi"
  action. On click: re-runs the action. If retry succeeds: success toast +
  `onSuccess` + `router.refresh()`. If retry fails: error toast (no second retry
  to prevent infinite loops).
- **Non-retryable error** — dismisses loading, shows error toast. No action.

```ts
function useStorageToast() {
  const router = useRouter()

  const execute = async <T>(
    action: () => Promise<ActionResponse<T>>,
    options: {
      loading: string
      success: string
      fallbackError?: string
      onSuccess?: (data: T) => void
    },
  ): Promise<boolean> => {
    const toastId = toast.loading(options.loading)

    const run = async (): Promise<boolean> => {
      const res = await action()
      if (!res.success) {
        if (res.retryable) {
          toast.dismiss(toastId)
          return new Promise<boolean>((resolve) => {
            toast.error(res.error, {
              action: {
                label: "Coba Lagi",
                onClick: async () => {
                  const ok = await run()
                  resolve(ok)
                },
              },
            })
          })
        }
        toast.error(res.error, { id: toastId })
        return false
      }
      toast.success(options.success, { id: toastId })
      options.onSuccess?.(res.data!)
      router.refresh()
      return true
    }

    return run()
  }

  return { execute }
}
```

#### Behaviour of `run()`

- Returns `true` when the action ultimately succeeds (possibly after a retry)
- Returns `false` when the action definitively fails (non-retryable error, or
  retry attempt also failed)
- On retryable error: the initial call returns a `Promise<boolean>` that resolves
  after the user clicks "Coba Lagi" and the retry completes
- This `boolean` return exists so callers can branch after the action (e.g. close
  a dialog) but are not required to use it — all side-effects (toast, refresh,
  local state) happen inside `execute`.

### Layer 4 — Component integration

All three UI files use the same surface API:

```tsx
const { execute } = useStorageToast()

async function handleAction(args) {
  await execute(
    () => someAction(args),
    { loading: "Memproses...", success: "Berhasil" },
  )
}
```

| File | Existing pattern | Integration |
|------|-----------------|-------------|
| `document-page.tsx` | Direct async + manual toast | Replace with `execute(() => generateFn(...), { loading: "Membuat {label}...", success: "{n} {label} berhasil dibuat" })` |
| `template-page.tsx` upload | `useActionState` + `useEffect` toast | Keep `useActionState` for form binding. Replace the form action function to call `execute()` internally. The submit handler returns `null` so `useActionState` state stays inert. **Remove the `useEffect` toast watcher** — `execute()` owns the entire toast lifecycle. |
| `template-page.tsx` delete | Direct async + manual toast | Replace with `execute(() => deleteTemplate(id), { loading: "Menghapus template...", success: "Template berhasil dihapus" })` |
| `create-form.tsx` | `useMutation` + `toast.promise` | Replace `toast.promise` with `execute(() => mutateAsync(values), { loading, success })`. Mutation `onSuccess` still handles `queryClient` cache updates. |

### Layer 5 — Error-to-toast mapping

| `StorageError` subclass | `retryable` | Toast text | Action |
|------------------------|-------------|------------|--------|
| `StorageUnavailableError` | `true` | "Penyimpanan tidak tersedia. Coba lagi nanti." | "Coba Lagi" |
| `StorageRateLimitError` | `true` | "Penyimpanan sedang sibuk. Coba lagi beberapa saat." | "Coba Lagi" |
| `StorageCorruptError` | `true` | "File di penyimpanan rusak atau tidak dapat dibaca." | "Coba Lagi" |
| `StorageAuthError` | `false` | "Konfigurasi penyimpanan tidak valid. Hubungi administrator." | — |
| `StorageNotFoundError` | `false` | "File tidak ditemukan di penyimpanan." | — |
| Non-`StorageError` | — | `fallbackError` or "Terjadi kesalahan" | — |

No `StorageError` references leak into client components. The UI only sees the
`retryable` boolean and the string message.

## Files touched

| File | Change type |
|------|-------------|
| `lib/types/index.ts` | Add `retryable?: boolean` |
| `hooks/use-storage-toast.ts` | Create |
| `features/hr/actions/document-actions.tsx` | Add `retryable` to `StorageError` catches + update callers |
| `features/hr/actions/template-actions.ts` | Add `retryable` to `StorageError` catches + update callers |
| `features/intern/actions/logbook-actions.ts` | Add `retryable` to `StorageError` catches |
| `features/hr/pages/document-page.tsx` | Use `useStorageToast` |
| `features/hr/pages/template-page.tsx` | Use `useStorageToast` |
| `features/intern/components/logbook/create-form.tsx` | Use `useStorageToast` |

## Out of scope

- Toast for API routes (`/api/documents/[id]/file`, `/api/uploads/sign`) — these
  are not UI-driven operations and return HTTP 503 on storage error.
- Toast for `setActiveTemplate` — touches DB only, not storage.
- Toast for `updateLogbook` / `deleteLogbook` — touch DB only, not storage.
