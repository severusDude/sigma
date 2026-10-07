// Seam tunggal untuk invalidasi cache scope intern.
// Checklist review mutasi baru (lihat matriks di
// docs/superpowers/plans/2026-10-07-cache-invalidation-audit.md):
// - Mutasi data intern/supervisor/assessment/logbook/avatar WAJIB panggil
//   `invalidateInternScope` dengan ID dari hasil query transaksi
//   (bukan session pelaku saja).
// - Tag global (`interns`, `hr-dashboard`, `hr-assessments`) selalu ikut;
//   tag per-ID membatasi over-invalidate.
// - Tag SPESIFIK tetap di call-site (jangan masuk helper):
//   `supervisors`, `supervisor-options`, `hr-assessment-<id>`,
//   `document-templates`.
// - Route handler/cron TIDAK boleh pakai helper ini — gunakan inline
//   `revalidateTag` (updateTag hanya di Server Actions).
// Diverifikasi via context7: /vercel/next.js — updateTag.mdx, revalidateTag.mdx.
import { updateTag } from "next/cache";

export type InternScopeInput = {
  supervisorIds?: string[];
  internProfileId?: string;
  internProfileIds?: string[];
  userId?: string;
  userIds?: string[];
};

const GLOBAL_TAGS = ["interns", "hr-dashboard", "hr-assessments"] as const;

function cleanId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// Pure + testable (pola helpers/safe-redirect.ts): tanpa I/O, tanpa cache.
export function resolveInternScopeTags(input: InternScopeInput): string[] {
  const tags = new Set<string>(GLOBAL_TAGS);

  const supervisorIds = Array.isArray(input.supervisorIds)
    ? input.supervisorIds
    : [];
  for (const raw of supervisorIds) {
    const id = cleanId(raw);
    if (!id) continue;
    tags.add(`supervisor-interns-${id}`);
    tags.add(`supervisor-dashboard-${id}`);
    tags.add(`assessment-list-${id}`);
    tags.add(`assessment-period-${id}`);
  }

  const internProfileIds = [
    ...(Array.isArray(input.internProfileIds) ? input.internProfileIds : []),
    input.internProfileId,
  ];
  for (const raw of internProfileIds) {
    const id = cleanId(raw);
    if (!id) continue;
    tags.add(`assessment-form-${id}`);
    tags.add(`assessment-view-${id}`);
  }

  const userIds = [
    ...(Array.isArray(input.userIds) ? input.userIds : []),
    input.userId,
  ];
  for (const raw of userIds) {
    const id = cleanId(raw);
    if (!id) continue;
    tags.add(`intern-dashboard-${id}`);
    tags.add(`intern-assessment-${id}`);
    tags.add(`supervisor-profile-${id}`);
  }

  return [...tags];
}

// Hanya panggil dari Server Actions. Untuk route handler/cron gunakan
// `revalidateTag` inline.
export function invalidateInternScope(input: InternScopeInput): void {
  for (const tag of resolveInternScopeTags(input)) {
    updateTag(tag);
  }
}
