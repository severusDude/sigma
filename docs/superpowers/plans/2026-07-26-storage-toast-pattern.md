# Storage Toast Pattern Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardized toast notifications with retry for all UI that touches R2 storage.

**Architecture:** Add `retryable?: boolean` to `ActionResponse<T>`, propagate it from server action catch blocks, then centralize toast+retry logic in a `useStorageToast` hook. Every storage-touching UI file replaces its inline toast handling with the hook.

**Tech Stack:** sonner (toast), Next.js 16 `useRouter`, React 19, `@tanstack/react-query`.

## Global Constraints

- sonner `toast()` function imported directly from `"sonner"` (not from shadcn re-export)
- `useRouter` from `"next/navigation"`
- All server actions return `ActionResponse<T>` and never throw
- `StorageError` hierarchy in `services/storage-health.ts` has `.retryable: boolean` and `.userMessage: string`
- `ActionResponse` is at `lib/types/index.ts`
- Hook naming: `use-*.ts` in `hooks/` directory

---

### Task 1: Add `retryable` to `ActionResponse`

**Files:**
- Modify: `lib/types/index.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `ActionResponse<T>` with optional `retryable` field

- [ ] **Step 1: Add the field**

```ts
export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  retryable?: boolean;
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/types/index.ts
git commit -m "feat(types): add retryable field to ActionResponse"
```

---

### Task 2: Create `useStorageToast` hook

**Files:**
- Create: `hooks/use-storage-toast.ts`

**Interfaces:**
- Consumes: `ActionResponse<T>` from `@/lib/types`, `toast` from `"sonner"`, `useRouter` from `"next/navigation"`
- Produces: `{ execute }` — a single function that wraps action execution with toast lifecycle

- [ ] **Step 1: Write the hook**

```ts
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ActionResponse } from "@/lib/types";

function useStorageToast() {
  const router = useRouter();

  const execute = useCallback(
    async <T>(
      action: () => Promise<ActionResponse<T>>,
      options: {
        loading?: string;
        success?: string;
        fallbackError?: string;
        onSuccess?: (data: T) => void;
      },
    ): Promise<boolean> => {
      const toastId = options.loading
        ? toast.loading(options.loading)
        : undefined;

      const run = async (): Promise<boolean> => {
        let res: ActionResponse<T>;

        try {
          res = await action();
        } catch (thrown) {
          // `useMutation` callers throw the ActionResponse on failure.
          // Normal callers never throw — they return { success: false }.
          if (thrown && typeof thrown === "object" && "success" in (thrown as object)) {
            res = thrown as ActionResponse<T>;
          } else {
            const msg =
              thrown instanceof Error
                ? thrown.message
                : options.fallbackError || "Terjadi kesalahan";
            if (toastId) toast.error(msg, { id: toastId });
            else toast.error(msg);
            return false;
          }
        }

        if (!res.success) {
          if (res.retryable) {
            if (toastId) toast.dismiss(toastId);
            return new Promise<boolean>((resolve) => {
              toast.error(res.error, {
                action: {
                  label: "Coba Lagi",
                  onClick: async () => {
                    const ok = await run();
                    resolve(ok);
                  },
                },
              });
            });
          }
          if (toastId) {
            toast.error(res.error, { id: toastId });
          } else {
            toast.error(res.error || options.fallbackError || "Terjadi kesalahan");
          }
          return false;
        }
        if (options.success) {
          toast.success(options.success, { id: toastId });
        } else if (toastId) {
          toast.dismiss(toastId);
        }
        options.onSuccess?.(res.data!);
        router.refresh();
        return true;
      };

      return run();
    },
    [router],
  );

  return { execute };
}

export { useStorageToast };
```

Key design decisions:
- `loading` and `success` are optional — when omitted, no loading/success toast is shown. This supports components that manage their own loading state (e.g. `document-page.tsx` has `setGenerating(true/false)`).
- On retry success: `onSuccess` fires, `router.refresh()` runs, the promise resolves `true`.
- On retry failure: toast shows error message (no second retry button). The promise resolves `false`.
- `toastId` is shared between the loading toast and the success/error toast, so sonner replaces the loading spinner with the result in-place.
- Handles both normal callers (return `ActionResponse` directly) and `useMutation` callers (throw `ActionResponse` on failure).

- [ ] **Step 2: Commit**

```bash
git add hooks/use-storage-toast.ts
git commit -m "feat(hooks): create useStorageToast hook with retry action"
```

---

### Task 3: Propagate `retryable` from server action catch blocks

**Files:**
- Modify: `features/hr/actions/document-actions.tsx` (5 catch blocks)
- Modify: `features/hr/actions/template-actions.ts` (2 catch blocks)
- Modify: `features/intern/actions/logbook-actions.ts` (1 catch block)

**Interfaces:**
- Consumes: `ActionResponse.retryable` from Task 1, `StorageError.retryable` from existing `services/storage-health.ts`
- Produces: `ActionResponse` with `retryable` set for `StorageError` catches

Each catch block follows the existing pattern:
```ts
} catch (error) {
  return {
    success: false,
    error:
      error instanceof StorageError
        ? error.userMessage
        : error instanceof Error
          ? error.message
          : "<fallback>",
    // NEW: propagate retryable when it's a StorageError
    retryable: error instanceof StorageError ? error.retryable : undefined,
  };
}
```

- [ ] **Step 1: Edit `document-actions.tsx` — 5 catch blocks**

Each catch block in this file (around lines 288, 395, 508, 641, 744) gets `retryable:` added. The catch block #2 (around line 389) also has an extra `console.log("ini error", error)` — leave it as-is, only add `retryable:`.

For each, add the line `retryable: error instanceof StorageError ? error.retryable : undefined,` after the `error:` field.

- [ ] **Step 2: Edit `template-actions.ts` — 2 catch blocks**

Same change for the catch blocks around lines 134 and 202.

- [ ] **Step 3: Edit `logbook-actions.ts` — 1 catch block**

Same change for the catch block around line 149.

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
```
Expected: no errors. No test file exists for these actions — build-time correctness is sufficient.

- [ ] **Step 5: Commit**

```bash
git add features/hr/actions/document-actions.tsx features/hr/actions/template-actions.ts features/intern/actions/logbook-actions.ts
git commit -m "feat: propagate retryable from StorageError catches in server actions"
```

---

### Task 4: Update `document-page.tsx` — use `useStorageToast`

**Files:**
- Modify: `features/hr/pages/document-page.tsx`

**Interfaces:**
- Consumes: `useStorageToast` from Task 2, updated `ActionResponse` from Task 3
- Produces: Consistent toast behavior for document generation

The `handleGenerate` function currently shows manual `toast.error` and `toast.success`. We replace the error + success toasts with `execute()`. Since this component manages its own `setGenerating` loading state, we skip loading/success messages and use `execute` purely for the error + retry path.

- [ ] **Step 1: Edit `handleGenerate` — replace toast.error + toast.success**

Delete the `toast` import from `"sonner"` (keep it only if it was the only usage).

Add `import { useStorageToast } from "@/hooks/use-storage-toast"` at the top.

Inside the component, add: `const { execute } = useStorageToast();`

Replace lines 127-152 (from `setGenerating(true)` to the end of `handleGenerate`):

```tsx
setGenerating(true);
const result = await generateFn(internIds);
setGenerating(false);

if (!result.success) {
  await execute(
    () => generateFn(internIds),
    { fallbackError: `Gagal generate ${label}` },
  );
  return;
}

const genData = result.data!;
const templateMsg = checkTemplateError(genData);
if (templateMsg) {
  setTemplateAlert({ open: true, message: templateMsg });
  return;
}

const docSuccess = genData.filter((r) => !r.error);
if (docSuccess.length > 0) {
  toast.success(`${docSuccess.length} ${label} berhasil dibuat`);
}
router.refresh();
```

Key points:
- The first `generateFn` call runs outside `execute` so we get `result.data` for `checkTemplateError` and counting successes.
- If it fails, `execute()` re-runs `generateFn(internIds)` on retry. The retry is a fresh call — it shows `.loading` (it IS provided) toast for the retry, and if it succeeds, `execute()` shows success toast + `router.refresh()`. If it fails again, error toast with no second retry.
- `toast.success` for individual counts still uses direct `toast` import (keep `import { toast } from "sonner"` if it's still needed).

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add features/hr/pages/document-page.tsx
git commit -m "fix: add retryable toast to document generation"
```

---

### Task 5: Update `template-page.tsx` — use `useStorageToast` for upload and delete

**Files:**
- Modify: `features/hr/pages/template-page.tsx`

**Interfaces:**
- Consumes: `useStorageToast` from Task 2, updated `ActionResponse` from Task 3

Two operations in this file:
1. **Upload** — currently uses `useActionState` + `useEffect` for toast
2. **Delete** — currently uses direct async + manual `toast.error/toast.success`

Both get replaced with `useStorageToast`.

- [ ] **Step 1: Upload handler — replace `useActionState`**

Remove: `useActionState`, `useEffect`, `useTransition` imports from React.
Add: `useRef` import.
Remove: `useActionState` call, `useEffect` watcher, `useTransition` call.

Add `const { execute } = useStorageToast()` and `const formRef = useRef<HTMLFormElement>(null)`.

Replace `<form action={formAction}>` with `<form ref={formRef} onSubmit={handleUpload}>`.

Replace `const handleDelete` handler (step 2 below).

```tsx
import { useState, useRef } from "react";

// Inside component:
const [uploadPending, setUploadPending] = useState(false);
const { execute } = useStorageToast();
const formRef = useRef<HTMLFormElement>(null);

const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  setUploadPending(true);
  await execute(
    () => uploadTemplate(formData),
    {
      loading: "Mengupload template...",
      success: "Template berhasil diunggah",
      onSuccess: (data) => {
        formRef.current?.reset();
        setTemplates((prev) => [data, ...prev]);
      },
    },
  );
  setUploadPending(false);
};
```

Change the button to use `uploadPending` instead of `pending`:
```tsx
<Button type="submit" disabled={uploadPending} className="gap-2">
  <Upload className="size-4" />
  {uploadPending ? "Mengupload..." : "Upload Template"}
</Button>
```

- [ ] **Step 2: Delete handler — replace manual toast**

```tsx
const handleDelete = async (id: string) => {
  await execute(
    () => deleteTemplate(id),
    {
      loading: "Menghapus template...",
      success: "Template berhasil dihapus",
      onSuccess: () => {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      },
    },
  );
};
```

- [ ] **Step 3: Clean up unused imports**

Remove `useActionState`, `useEffect`, `useTransition` from the React import.
Keep `toast` import only if used elsewhere in the file (it's not — all toasts go through `execute` now). Remove it.

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add features/hr/pages/template-page.tsx
git commit -m "fix: add retryable toast to template upload and delete"
```

---

### Task 6: Update `create-form.tsx` — use `useStorageToast` for logbook creation

**Files:**
- Modify: `features/intern/components/logbook/create-form.tsx`

**Interfaces:**
- Consumes: `useStorageToast` from Task 2, updated `ActionResponse` from Task 3

The current pattern uses `useMutation` + `toast.promise`. We replace `toast.promise` with `execute()`, while keeping `useMutation` for cache management.

- [ ] **Step 1: Edit mutation and submit handler**

Add `import { useStorageToast } from "@/hooks/use-storage-toast"`.

Add `const { execute } = useStorageToast()` inside the component.

Replace `onSubmit`:

```tsx
async function onSubmit() {
  const values = form.getValues();
  await execute(
    () => mutateAsync(values),
    {
      loading: "Menyimpan logbook...",
      success: "Logbook berhasil ditambahkan",
      onSuccess: () => onSuccess(),
    },
  );
}
```

The mutation's `onSuccess` still handles `queryClient` cache updates. `execute` calls `mutateAsync(values)`, which triggers the mutation function → server action → onSuccess → cache update. If the server action returns `!res.success`, `mutateAsync` throws the response with `res.error` and `res.retryable`. Wait — currently the mutation function throws `new Error(res.error)`, which loses `retryable`.

We need to change the mutation function to throw the full `ActionResponse`:

```tsx
mutationFn: async (values: LogbookFormInput) => {
  const [sh, sm] = values.startTime.split(":").map(Number);
  const [eh, em] = values.endTime.split(":").map(Number);
  const duration = eh * 60 + em - (sh * 60 + sm);
  const res = await createLogbook({ ...values, duration });
  if (!res.success) throw res;       // <— throw the full ActionResponse
  return res.data!;
},
```

Then `mutateAsync` rejects with the full `ActionResponse`. The `catch` in `execute` gets `res.error` and `res.retryable`.

Remove the old `toast.promise(...)` block and the `try/catch` around `mutationPromise`.

Remove the `import { toast } from "sonner"` line (no longer used).

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add features/intern/components/logbook/create-form.tsx
git commit -m "fix: add retryable toast to logbook creation"
```

---

### Spec Coverage Check

| Spec requirement | Task |
|---|---|
| Add `retryable?: boolean` to `ActionResponse` | Task 1 |
| Propagate `retryable` from server action `StorageError` catches | Task 3 |
| Create `useStorageToast` hook | Task 2 |
| Integrate in `document-page.tsx` | Task 4 |
| Integrate in `template-page.tsx` (upload + delete) | Task 5 |
| Integrate in `create-form.tsx` | Task 6 |

All spec requirements covered. No gaps.
