# Cross-Role Cache Invalidation Audit & Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Setiap mutasi data langsung terlihat benar di semua role tanpa restart server, via invalidation tag yang lengkap dan teraudit.

**Architecture:** Audit matriks 15 actions × 18 cacheTag; modul baru `helpers/cache-invalidation.ts` (resolver pure `resolveInternScopeTags` + eksekutor `invalidateInternScope`, pola `safe-redirect.ts`) dipanggil tiap mutasi data intern/supervisor/assessment/logbook; cron via `revalidateTag` (pola existing). Tanpa dep baru, tanpa skema, tanpa ubah `cacheLife`.

**Tech Stack:** Next.js 16.2.10 (cacheComponents: `use cache`, `cacheTag`, `updateTag`, `revalidateTag`), Prisma 7, pnpm.

**Spec:** Desain dikunci dalam dokumen ini + riset `docs/research/cache-invalidation-audit.md`. **Gate: desain memerlukan persetujuan user sebelum implementasi dimulai.**

## Global Constraints

- `updateTag` hanya di Server Actions; route handler/cron hanya `revalidateTag`.
- Scope per-ID (`supervisor-interns-<id>`), kecuali tag memang global (`interns`, `hr-dashboard`).
- Tanpa skema/migrasi; tanpa ubah `cacheLife`; tanpa dep baru.
- Satu `cacheTag()` maks 128 tag @ 256 char — jangan bangun tag dinamis berlebih.

## Review Focus

- Mutasi baru yang lupa panggil helper → matriks + komentar helper sebagai checklist review.
- Over-invalidate → batasi global hanya bila data global berubah.
- Tag `"interns"` di `document-data.ts` — audit putuskan pertahankan/perbaiki.
- Cron `deactivate-interns` stale-while-revalidate → jeda singkat diekspektasikan, bukan bug.
- ID user-spesifik harus dari hasil query transaksi, bukan session pelaku saja.

---

## 1. Ringkasan & tujuan

Mutasi satu role basi di role lain sampai restart: `updateTag` tak mencakup tag lintas-role (bukti: `deactivateIntern` lewatkan `supervisor-interns-*`, `supervisor-dashboard-*`, `hr-dashboard`). Tujuan: audit penuh, helper terpusat, semua mutasi invalidate tag yang datanya berubah + matriks anti-regresi.

## 2. Acceptance criteria

- [ ] **AC1 — Lintas role segar.** Given mutasi di satu role, When refresh role lain yang menampilkan data itu, Then langsung benar (uji: HR→supervisor, supervisor→HR/intern, HR→intern).
- [ ] **AC2 — Matriks.** Given selesai, When baca Lampiran Matriks, Then tiap sel OK/N-A beralasan.
- [ ] **AC3 — Mutu.** Given selesai, When `npx eslint`, `npx tsc --noEmit`, `pnpm build`, Then 0 error, build sukses.

## 3. Asumsi & di luar scope

Terkonfirmasi: updateTag surgical; audit semua role; AC ganda; bebas actions/data. Asumsi: production-grade ringan (tanpa test runner baru; TDD via `tsx` sementara). Di luar scope: `cacheLife`, remote/multi-instance cache, realtime push, skema, halaman baru.

## 4. Temuan repo (ringkas)

Stack: `package.json` (next 16.2.10, pnpm; tanpa test runner). Pola: `"use cache"`+`cacheTag` di `features/*/data/*.ts` (18 tag); `updateTag` di actions; `revalidateTag` di cron `app/api/cron/deactivate-interns/route.ts:99-102`. Bukti: `hr/actions/intern-actions.ts:228-269`. 8 file actions NOL invalidation (`intern/logbook-actions`, `intern/profile-actions`, `supervisor/profile-actions`, `supervisor/issue-actions`, `shared/avatar-actions`, `hr/set-password-action`, `hr/document-actions`, + `supervisor/assessment-actions` hanya getter). Uncached wajar: `intern/data/logbook-data.ts`, `supervisor/data/issue-data.ts`; password tak ditampilkan. Konvensi: `helpers/` kebab-case; `AGENTS.md`.

## 5. Keputusan desain & alternatif yang ditolak

Terpilih A: helper terpusat + lengkapi per mutasi (lolos deletion test; resolver pure = test surface). Ditolak: B manual per-action (penyebab bug); C `revalidatePath` luas (kasar, lawan anjuran tag-based).

## 6. Reuse Decision Table & File Placement Map

| Kebutuhan | Keputusan | Aset/Path | Alasan |
|---|---|---|---|
| Pola helper pure+test | **Reuse (pola)** | `helpers/safe-redirect.ts` | Pure, tsx-testable |
| Pola updateTag per-ID | **Reuse** | `intern-actions.ts:266-269`, `assessment-form-actions.ts:70-72` | Loop affected IDs existing |
| Pola cron | **Reuse** | `deactivate-interns/route.ts:99-102` | Handler tak bisa updateTag |
| Resolver+eksekutor | **Create** | `helpers/cache-invalidation.ts` | Seam tunggal, tak ada padanan |
| Pelengkapan | **Extend** | 15 actions + cron (1–3 baris/titik) | Lubang tersebar |

## 7. Task berurutan

### Task 1: Audit matriks mutasi × tag

- [ ] **Tujuan:** Daftar pasti tiap sel bocor.
- [ ] **File:** baca 15 actions + cron + 18 tag; tulis hasil ke Lampiran Matriks dokumen ini (edit plan).
- [ ] **Langkah:** 1) tiap fungsi mutasi: catat entitas diubah + tag di-update → OK/BOCOR/N-A beralasan. 2) verdict `document-data "interns"`. 3) verifikasi klaim "issue/logbook-data uncached".
- [ ] **Verifikasi:** matriks 15+ baris lengkap; diff hanya dokumen plan.
- [ ] **Commit:** `docs: add cache invalidation audit matrix`.

### Task 2: Helper invalidation + TDD

- [ ] **Tujuan:** Satu seam untuk invalidation scope intern.
- [ ] **File:** buat `helpers/cache-invalidation.ts`.
- [ ] **Interface:** `export function resolveInternScopeTags(input: { supervisorIds?: string[]; internProfileId?: string; userId?: string }): string[]` (selalu sertakan `interns`, `hr-dashboard`, `hr-assessments`; per supervisorId: `supervisor-interns-<id>`, `supervisor-dashboard-<id>`, `assessment-list-<id>`, `assessment-period-<id>`; per internProfileId: `assessment-form-<id>`, `assessment-view-<id>`; per userId: `intern-dashboard-<userId>`, `intern-assessment-<userId>`, `supervisor-profile-<userId>`; dedup, abaikan kosong) + `export function invalidateInternScope(input: Same): void` (updateTag per tag). Daftar final ikut matriks Task 1.
- [ ] **Test dulu:** script `tsx` sementara (input contoh → daftar eksak; kosong → hanya global; dedup). MERAH → HIJAU; hapus script.
- [ ] **Verifikasi:** `tsc` 0; `eslint` 0.
- [ ] **Commit:** `feat(cache): add intern-scope invalidation helper`.

### Task 3: Mutasi HR (intern + supervisor)

- [ ] **Tujuan:** Mutasi HR invalidate lintas-role.
- [ ] **File:** `hr/actions/intern-actions.ts` (create/update/deactivate/delete), `hr/actions/supervisor-actions.ts` (assign/reassign/unassign + CRUD): kumpulkan ID terdampak (pola existing) → `invalidateInternScope(...)` usai sukses; hapus `updateTag` duplikat, pertahankan spesifik (`supervisors`, `hr-assessment-<id>`).
- [ ] **Verifikasi:** `tsc`, `eslint` 0; manual: HR nonaktifkan → supervisor refresh benar (AC1 utama).
- [ ] **Commit:** `fix(cache): invalidate cross-role tags on HR mutations`.

### Task 4: Mutasi supervisor + intern + dokumen + cron

- [ ] **Tujuan:** Sisa domain ter-cover.
- [ ] **File:** `supervisor/actions/*` (review, assessment-form, issue bila matriks menuntut, profile/status), `intern/actions/*` (logbook, profile, avatar via shared), `hr/actions/document-actions.tsx` + template/certificate/set-password bila matriks menuntut (set-password diprediksi N-A), `app/api/cron/deactivate-interns/route.ts` (inline `revalidateTag` 1–3 baris, bukan helper).
- [ ] **Verifikasi:** `tsc`, `eslint` 0; manual tiap domain.
- [ ] **Commit:** `fix(cache): invalidate cross-role tags on remaining mutations` (boleh pecah per domain).

### Task 5: Verifikasi akhir (gate merge)

- [ ] **Tujuan:** AC1–AC3 hijau. Matriks final vs kode; manual 2 akun; `eslint`, `tsc`, `build`; `git status` hanya file placement map.
- [ ] **Titik commit:** tidak ada kode.

## 8. Verifikasi per AC — Task 5 (manual 2 akun + eslint/tsc/build; tanpa test runner sesuai tooling repo).

## 9. Risiko & mitigasi

Over-invalidate → scope per-ID; mutasi baru lupa → komentar + matriks; batas 128 tag jauh; cron SWR diekspektasikan; ID dari query transaksi (pola existing).

## 10. Referensi

Riset `docs/research/cache-invalidation-audit.md`; context7 `/vercel/next.js`; exa (nextjs.org, vercel KB); repo: `intern-actions.ts:200-269`, `supervisor/data/intern-data.ts:69-70`, cron `:99-102`, `AGENTS.md`.

## Lampiran Matriks (diisi Task 1 — audit 2026-10-07)

Legenda: OK = sudah invalidate benar · BOCOR = data berubah tapi tag tak di-update · N-A = tag tak menampilkan data ini (beralasan).
Kolom sesuai §Lampiran: Mutasi | interns | supervisors | hr-dashboard | hr-assessments | hr-assessment-* | supervisor-options | supervisor-profile-* | assessment-list-* | assessment-period-* | assessment-form-* | assessment-view-* | supervisor-dashboard-* | supervisor-interns-* | intern-dashboard-* | intern-assessment-* | document-templates | Catatan.

| Mutasi (file:fungsi) | interns | supervisors | hr-dashboard | hr-assessments | hr-assessment-* | supervisor-options | supervisor-profile-* | assessment-list-* | assessment-period-* | assessment-form-* | assessment-view-* | supervisor-dashboard-* | supervisor-interns-* | intern-dashboard-* | intern-assessment-* | document-templates | Catatan |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| HR `intern-actions.ts:createIntern` (updateTag: `interns`) | OK | N-A | BOCOR — daftar HR + warning/list bertambah | N-A — belum ada assessment | N-A | N-A | N-A | N-A — belum ada assignment | N-A | N-A | N-A | N-A | N-A — belum ada assignment | N-A | N-A | N-A | Tambah `hr-dashboard` via helper |
| HR `intern-actions.ts:updateIntern` (updateTag: `interns`, `hr-assessments`) | OK | N-A | BOCOR — nama/institusi/status/team tampil di dashboard | OK | N-A — detail per-ID tak berubah oleh edit profil | N-A | N-A | BOCOR bila periode berubah (derivasi fallback period) | BOCOR bila periode berubah | N-A | N-A | BOCOR — nama/institusi/team tampil di dashboard SPV | BOCOR — daftar bimbingan tampilkan nama/institusi | BOCOR — nama/team/supervisor tampil | N-A — hanya finalized, edit profil tak ubah nilai | N-A | Helper dengan supervisorIds+userId bila diketahui |
| HR `intern-actions.ts:deactivateIntern` (updateTag: `interns`, `hr-assessments`, `assessment-list/period-<sid>`) | OK | N-A | BOCOR — count aktif/completed + warning hilang | OK | N-A | N-A | N-A | OK | OK | N-A — form per internProfileId tetap, assignment ended | BOCOR — view per intern tak lagi ter-assign | BOCOR — daftar + agregat SPV basi | BOCOR — KASUS UTAMA laporan (SPV refresh basi) | BOCOR — status/period intern berubah | BOCOR — daftar finalized berubah bila ada | N-A | Fix utama Task 3 via `invalidateInternScope` |
| HR `intern-actions.ts:deleteIntern` (updateTag: `interns`) | OK | N-A | BOCOR — sama spt deactivate | BOCOR — row assessment hilang | N-A — record ikut terhapus, tak ada detail | N-A | N-A | BOCOR — assignment ikut hilang | BOCOR | BOCOR — form orphan | BOCOR — view orphan | BOCOR | BOCOR | BOCOR | BOCOR bila ada finalized | N-A | Kumpulkan supervisorIds+userId SEBELUM delete (pola existing) |
| HR `supervisor-actions.ts:createSupervisor` (updateTag: `supervisors`) | N-A | OK | BOCOR — count supervisor aktif bertambah | N-A | N-A | BOCOR — opsi SPV aktif untuk filter HR | BOCOR — profil baru belum ter-cache | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | Tambah `supervisor-options` spesifik + `hr-dashboard` via helper? helper global saja (tanpa ID) |
| HR `supervisor-actions.ts:updateSupervisor` (updateTag: `supervisors`) | N-A | OK | N-A — dashboard HR tak tampilkan nama SPV | N-A | N-A | BOCOR bila isActive/maxInterns berubah | BOCOR — nama/NIP/team berubah | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | Tambah `supervisor-options` + `supervisor-profile-<userId>` bila nama berubah |
| HR `supervisor-actions.ts:deleteSupervisor` (updateTag: `supervisors`) | N-A | OK | BOCOR bila SPV aktif dihapus (count) | N-A | N-A | BOCOR — opsi hilang | BOCOR — profil orphan | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | Sama spt update + `hr-dashboard` |
| HR `supervisor-actions.ts:assignSupervisor / assignMultipleInterns` (updateTag: `supervisors`, `interns`, `assessment-list/period-<sid>`) | OK | OK | BOCOR — warning/afiliasi team berubah | N-A — assignment bukan assessment | N-A | N-A | N-A | OK | OK | N-A | N-A | BOCOR — totalInterns + daftar berubah | BOCOR — active/history berubah | BOCOR — supervisorName berubah | N-A | N-A | Tambah scope supervisor-dashboard/interns via helper |
| HR `supervisor-actions.ts:reassignIntern / reassignAllInterns` (updateTag: hanya `<newSid>` untuk list/period) | OK | OK | BOCOR | N-A | N-A | N-A | N-A | BOCOR (sisi lama) — tag `<oldSid>` tak di-update | BOCOR (sisi lama) | N-A | N-A | BOCOR (kedua sisi) | BOCOR (kedua sisi) | BOCOR | N-A | N-A | WAJIB invalidate KEDUA sisi: `oldSupervisorId` dari `currentAssignment` + `newSupervisorProfileId` |
| HR `assessment-actions.ts:finalizeAssessment` (updateTag: `hr-assessments`, `hr-assessment-<id>`) | N-A | N-A | BOCOR — warning/fill-rate tak langsung berubah? (kecil, tapi status finalized tampil di HR list) | OK | OK | N-A | N-A | BOCOR — progress/assessmentStatus di list SPV | N-A | N-A | BOCOR — view SPV tampilkan skor final | BOCOR — assessmentProgress count | BOCOR — assessmentStatus badge | N-A — intern hanya lihat finalized: SEHARUSNYA BOCOR | BOCOR — intern-assessment tampil setelah finalize | N-A | Tambah `invalidateInternScope({supervisorIds, internProfileId, userId})`; pertahankan spesifik `hr-assessment-<id>` |
| HR `template-actions.ts:*` + `certificate-template-actions.ts:*` (updateTag: `document-templates`) | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | OK | Template hanya dibaca `fetchTemplates` — sudah OK, tak perlu helper |
| HR `set-password-action.ts:setPassword` | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A — password tak ditampilkan di view mana pun |
| HR `document-actions.tsx:generate*` (NOL invalidation) | N-A — `fetchInternsForDocuments` tak query tabel Document | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A — tak ada cached document-list; dokumen dibaca via `getInternDocuments` (tanpa cache) + R2 |
| SPV `assessment-form-actions.ts:createOrUpdateAssessment / submitAssessment` (updateTag: `assessment-form-<iid>`, `assessment-list-<sid>`, `supervisor-interns-<sid>`) | N-A | N-A | BOCOR — HR list tak segar (status draft→submitted) | BOCOR — HR list tak segar | N-A — HR detail per-ID tak berubah sebelum finalize | N-A | N-A | OK | N-A | OK | BOCOR — view tampilkan skor parsial setelah save | BOCOR — pendingAssessmentCount berubah | OK | N-A — intern hanya lihat finalized | N-A (kecuali submit→finalize flow) | N-A | Tambah `hr-assessments`, `hr-dashboard`, `supervisor-dashboard-<sid>`, `assessment-view-<iid>` |
| SPV `logbook-review-actions.ts:approveLogbook / requestRevision` (updateTag: `supervisor-interns-<sid>`) | N-A | N-A | BOCOR — fill-rate/warning berubah | N-A | N-A | N-A | N-A | BOCOR — logbookProgress berubah | N-A | N-A | N-A | BOCOR — pendingReview + compliance berubah | OK | BOCOR — recentActivity/status berubah | N-A | N-A | Tambah `supervisor-dashboard-<sid>`, `assessment-list-<sid>`, `hr-dashboard`, `intern-dashboard-<uid>` (uid dari logbook.internProfile.userId) |
| SPV `issue-actions.ts:create/update/deleteIssue` (NOL) | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A TERKONFIRMASI — `issue-data.ts` tanpa `"use cache"`/`cacheTag`; agregat cached (logbook count) key by status bukan issueId |
| SPV `profile-actions.ts:toggleSupervisorStatus` (NOL) | N-A | BOCOR — daftar HR basi | BOCOR — count SPV aktif | N-A | N-A | BOCOR — opsi filter HR | BOCOR — profil SPV | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | Tambah `supervisors`, `supervisor-options`, `supervisor-profile-<uid>`, `hr-dashboard` |
| SPV `profile-actions.ts:changePassword` + intern `profile-actions.ts:changePassword` | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A — password tak ditampilkan |
| SPV `assessment-actions.ts:get*` (getter saja) | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A | N-A — tanpa mutasi |
| Intern `logbook-actions.ts:create/update/deleteLogbook` (NOL) | N-A | N-A | BOCOR — fill-rate/warning | N-A | N-A | N-A | N-A | BOCOR — logbookProgress | N-A | N-A | N-A | BOCOR — pendingReview/compliance | BOCOR — approved/total/pending counts | BOCOR — weekly/recent | N-A | N-A | Tambah `invalidateInternScope` (supervisorIds dari assignment aktif + userId session); `logbook-data.ts` uncached TERKONFIRMASI tapi agregat cached tetap basi |
| Shared `avatar-actions.ts:updateAvatar` (NOL) | BOCOR — HR intern list tampilkan image | BOCOR — HR SPV list tampilkan image | N-A — dashboard HR tanpa image | N-A | N-A | N-A | N-A | BOCOR — `photoUrl` | N-A | BOCOR — `avatarUrl` | BOCOR — `avatarUrl` | BOCOR — intern `image` | BOCOR — `image` | N-A | N-A | N-A | Tambah `interns`+`supervisors` spesifik + `invalidateInternScope` (image dibaca di banyak view) |
| Cron `app/api/cron/deactivate-interns/route.ts` (revalidateTag: `assessment-list/period-<sid>`, `hr-assessments`) | BOCOR — `interns` + picker dokumen | N-A | BOCOR — `hr-dashboard` | OK | N-A | N-A | N-A | OK | OK | N-A | N-A | BOCOR — `supervisor-dashboard-<sid>` | BOCOR — `supervisor-interns-<sid>` | BOCOR — `intern-dashboard-<uid>` per userIds batch | BOCOR — `intern-assessment-<uid>` | N-A | Lengkapi inline `revalidateTag` (bukan helper — route handler tak bisa `updateTag`, terverifikasi context7 `/vercel/next.js` updateTag.mdx); SWR jeda singkat diekspektasikan |

Verdict `document-data.ts` tag `"interns"`: **PERTAHANKAN**. `fetchInternsForDocuments` mengembalikan populasi identik dengan `fetchInterns` (users dengan `internProfile` non-deleted) sehingga berbagi tag `interns` membuat tiap mutasi intern otomatis menyegarkan picker dokumen tanpa invalidation ganda. Tag terpisah hanya menambah call-site tanpa manfaat dan berisiko lupa. Tidak ada over-invalidate material (populasi sama).

Verifikasi klaim uncached: **TERKONFIRMASI** — `features/intern/data/logbook-data.ts` (31 baris, tanpa `"use cache"`/`cacheTag`) dan `features/supervisor/data/issue-data.ts` (34 baris, tanpa `"use cache"`/`cacheTag`); N-A untuk keduanya wajar, tetapi agregat cached yang menghitung logbook (supervisor-interns/dashboard, assessment-list, hr-dashboard, intern-dashboard) tetap BOCOR dan wajib di-invalidate.
