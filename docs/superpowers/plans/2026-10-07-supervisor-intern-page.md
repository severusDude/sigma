# Supervisor Intern Bimbingan (`/supervisor/intern`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengisi slot sidebar "Intern Bimbingan" yang mati dengan halaman daftar intern scoped ke supervisor login (aktif + riwayat), berisi ringkasan progres, tabel terfilter, dan dialog detail read-only dengan navigasi ke penilaian.

**Architecture:** Route server `app/supervisor/intern/page.tsx` (guard + fetch scoped via `InternSupervisor`, pola `app/supervisor/penilaian/page.tsx`) memasok `{ active, history }` ke page client `features/supervisor/pages/intern-page.tsx` (StatBlock + Tabs + `DataTable` + dialog detail read-only). Query agregat dalam satu `include` (pola `dashboard-data.ts`) agar tanpa N+1. Tanpa dep baru, tanpa route baru selain halaman ini, tanpa aksi mutasi.

**Tech Stack:** Next.js 16.2.10 App Router, React 19, Prisma 7 + `@prisma/adapter-pg`, TanStack Table 8 (via `DataTable`), Tailwind v4, pnpm.

**Spec:** Desain dikunci dalam dokumen ini + riset `docs/research/supervisor-intern-page.md`. **Gate: desain memerlukan persetujuan user sebelum implementasi dimulai.**

## Global Constraints

- `requireAuth([Role.admin, Role.supervisor])` di route; data SELALU di-scope `supervisorProfileId` dari session (pola `fetchSupervisorProfileId`), jangan percaya input client.
- Read-only: tidak ada create/update/delete/deactivate di halaman ini (itu wewenang HR).
- Warna/tipe mengikuti design system (token Tailwind, badge map seperti `assessment-card`, dark adaptif); teks Indonesia konsisten pola supervisor.
- Definisi kolom tabel stabil (factory, bukan inline) — gotcha remount TanStack.
- reduced-motion: hormati bila menambah animasi (tidak ada animasi kustom direncanakan).
- AGENTS.md: baca panduan `node_modules/next/dist/docs/` yang relevan sebelum kode Next.

## Review Focus

- Admin membuka halaman ini (punya akses route tapi tanpa `SupervisorProfile`) melihat empty state yang jelas, bukan error dan bukan data orang lain.
- Supervisor dengan assignment ke intern yang ter-soft-delete (`deletedAt`) tidak melihat baris hantu.
- Tab Riwayat kosong menampilkan empty state berbeda dari tab Aktif kosong.
- Klik baris intern tanpa `assessment` (null) tetap membuka dialog (tombol penilaian berlabel "Isi Penilaian", bukan crash).
- Navigasi dari dialog ke `/supervisor/penilaian/[internProfileId]` hanya untuk assignment aktif (riwayat: tombol disembunyikan/dinonaktifkan dengan alasan).

---

## 1. Ringkasan & tujuan

Slot navigasi "Intern Bimbingan" (`/supervisor/intern`) sudah ada di sidebar tapi halamannya belum ada (404). Tujuan: halaman read-only tempat supervisor melihat intern bimbingannya (aktif + riwayat) beserta progres logbook/presensi/penilaian, dengan search/filter/sort, ringkasan statistik, dan jalan menuju penilaian — tanpa bisa mengubah data akun.

## 2. Acceptance criteria

- [ ] **AC1 — Data benar per supervisor.** Given login sebagai supervisor A (punya N aktif + M riwayat) dan supervisor B (tanpa intern), When buka `/supervisor/intern`, Then A melihat tepat N+M baris miliknya (tab terpisah) dan B melihat empty state "Belum ada intern bimbingan".
- [ ] **AC2 — Tabel + progres.** Given data ada, When gunakan search/filter status/sort, Then baris memuat nama, institusi, tim, periode, status, progres logbook (disetujui/total), presensi, status penilaian — tanpa error.
- [ ] **AC3 — Navigasi lancar.** Given klik baris, When dialog detail terbuka, Then tampil ringkasan + tombol ke `/supervisor/penilaian/[id]` (aktif) dan info jelas untuk riwayat; klik tidak crash untuk intern tanpa assessment.
- [ ] **AC4 — Mutu + responsif.** Given selesai, When `npx eslint`, `npx tsc --noEmit`, `pnpm build`, Then 0 error dan build sukses; render dicek di 360px + 1440px, light + dark.

## 3. Asumsi & di luar scope

**Terkonfirmasi:** aktif + riwayat; read-only + navigasi; tabel + kartu ringkas; AC ganda. **Asumsi (wajar, dinyatakan):** production-grade ringan (tanpa test runner baru; TDD via script `tsx` sementara untuk agregat/logika murni); tab memakai shadcn `tabs` existing; admin tanpa profil → empty state jelas (bukan semua data). **Di luar scope:** aksi akhiri-bimbingan; route detail `/supervisor/intern/[id]`; ubah skema; ubah sidebar; notifikasi/export PDF.

## 4. Temuan repo (ringkas)

Stack: `package.json` (next 16.2.10, react 19.2.4, TanStack Table ^8.21.3, tailwind v4, pnpm; tanpa test runner). Struktur: `app/<role>/` route + `features/<domain>/{pages,data,components,types,actions}/`; kebab-case file, PascalCase komponen. Slot mati: `app/supervisor/layout.tsx:40-44` (link `/supervisor/intern` tanpa route; juga `/supervisor/bimbingan` di luar scope). Pola acuan: `app/supervisor/penilaian/page.tsx` (guard + `fetchSupervisorProfileId` + empty profil), `app/hr/intern/page.tsx` + `features/hr/pages/intern-page.tsx` (DataTable + `createColumns` + dialog), `features/supervisor/data/dashboard-data.ts` (scoped include + agregat + `"use cache"`), `features/supervisor/components/assessment-card.tsx` (badge map + Link penilaian), `components/shared/data-table/data-table.tsx` (search/filter/sort/pagination + mobile), `components/shared/stat-block.tsx`, `components/ui/tabs.tsx`. Tujuan navigasi existing: `/supervisor/penilaian/[internProfileId]`; review logbook lewat `issue-view.tsx` (tak ada route logbook khusus — jangan buat).

## 5. Keputusan desain & alternatif yang ditolak

Terpilih A: fetch scoped + StatBlock + Tabs + DataTable + dialog read-only. Alasan: konsisten pola HR/supervisor, scope aman, N+1 dihindari, AC terpenuhi semua. Ditolak: B reuse mentah halaman HR (bocor data + aksi HR terlarang); C kartu saja (gagal AC filter/sort); D route detail `[id]` (YAGNI — dialog + link existing cukup); E ubah root layout/sidebar (di luar scope).

## 6. Reuse Decision Table & File Placement Map

| Kebutuhan | Keputusan | Aset/Path | Alasan |
|---|---|---|---|
| Guard + profil id | **Reuse** | `helpers/guard.ts`, `fetchSupervisorProfileId` (`assessment-data.ts`) | Pola penilaian persis |
| Tabel + filter/sort | **Reuse** | `components/shared/data-table/data-table.tsx`, `hooks/use-filter-state`, `use-sort-state`, tipe `lib/types/*` | Generik, mobile-aware |
| Kartu statistik | **Reuse** | `components/shared/stat-block.tsx` | Sama seperti dashboard |
| Tabs | **Reuse** | `components/ui/tabs.tsx` | Sudah ada |
| Badge/dot status | **Reuse (pola)** | peta di `assessment-card.tsx:12-30` | Konsistensi label/varian |
| Skeleton loading | **Reuse (pola)** | `app/supervisor/issues/loading.tsx` | Bentuk skeleton generik |
| Query agregat | **Extend (pola)** | `dashboard-data.ts:18-46` | Tambah query scoped baru, bukan ubah existing |
| Tipe baris + kolom + dialog | **Create** | `features/supervisor/types/intern-types.ts`, `components/intern/columns.tsx`, `components/intern/detail-dialog.tsx` | Tak ada padanan read-only supervisor |
| Fetch scoped | **Create** | `features/supervisor/data/intern-data.ts` | Tak ada padanan (dashboard campur agregat chart) |
| Page client | **Create** | `features/supervisor/pages/intern-page.tsx` | Tak ada padanan |
| Route + loading | **Create** | `app/supervisor/intern/page.tsx`, `loading.tsx` | Slot mati diisi |

## 7. Task berurutan

### Task 1: Tipe + fetch scoped (`intern-data.ts`)

- [ ] **Tujuan:** Satu query scoped mengembalikan `{ active, history }` siap render.
- [ ] **File:** Buat `features/supervisor/types/intern-types.ts`, `features/supervisor/data/intern-data.ts`.
- [ ] **Interface:** `export async function fetchSupervisorInterns(supervisorProfileId: string): Promise<{ active: SupervisedIntern[]; history: SupervisedIntern[] }>`; `SupervisedIntern = { internProfileId, name, image, institution, team, periodStart, periodEnd, internStatus, assignmentEndedAt, approvedLogbooks, totalLogbooks, pendingLogbooks, presentDays, totalAttendance, assessmentStatus: "draft"|"submitted"|"finalized"|null }`. Query: `internSupervisor.findMany({ where: { supervisorProfileId, internProfile: { deletedAt: null } }, include: { user, team, logbooks(status,date,deletedAt), attendanceRecords, assessments(latest) } })`, split aktif (`endedAt: null`) vs riwayat di kode; `"use cache"` + `cacheTag('supervisor-interns-<id>')` mengikuti `dashboard-data.ts`.
- [ ] **Test dulu:** script `tsx` sementara assert agregat dari fixture object (bukan DB): pending count, split aktif/riwayat, assessment null. Harapkan MERAH (modul belum ada) lalu HIJAU; hapus script.
- [ ] **Langkah:** 1) tulis tipe. 2) tulis fetch (select eksplisit, tanpa password/banned). 3) script assert → hijau → hapus.
- [ ] **Verifikasi:** `npx tsc --noEmit` 0; `npx eslint features/supervisor/data/intern-data.ts features/supervisor/types/intern-types.ts` 0.
- [ ] **Commit:** `feat(supervisor): add scoped intern fetch for bimbingan list`.

### Task 2: Kolom tabel + dialog detail read-only

- [ ] **Tujuan:** Kolom stabil + dialog detail tanpa aksi mutasi.
- [ ] **File:** Buat `features/supervisor/components/intern/columns.tsx` (`export function createColumns(opts: { onView: (id: string) => void }): ColumnDef<SupervisedIntern>[]`), `features/supervisor/components/intern/detail-dialog.tsx` (`{ internId: string | null; interns: SupervisedIntern[]; onClose: () => void }`, tombol Link penilaian bila aktif, info bila riwayat).
- [ ] **Langkah:** 1) kolom: nama (avatar+nama), institusi/tim, periode, status badge, progres logbook `approved/total`, presensi, status penilaian badge, aksi Lihat. 2) dialog: ringkasan + tombol `Lihat/Penilaian` (`/supervisor/penilaian/[id]`) hanya bila `assignmentEndedAt == null`; riwayat tampilkan teks "Periode bimbingan berakhir".
- [ ] **Verifikasi:** `tsc` 0; `eslint` 0 pada kedua file.
- [ ] **Commit:** `feat(supervisor): add intern table columns and read-only detail dialog`.

### Task 3: Page client + route + loading

- [ ] **Tujuan:** `/supervisor/intern` render: header + StatBlock (aktif, pending review, rata-rata kepatuhan) + Tabs Aktif/Riwayat + DataTable + dialog + empty states.
- [ ] **File:** Buat `features/supervisor/pages/intern-page.tsx` (`{ active, history }`), `app/supervisor/intern/page.tsx` (guard `requireAuth([admin, supervisor])` + `fetchSupervisorProfileId` + empty profil + fetch + teruskan data; metadata title "Intern Bimbingan", robots noindex), `app/supervisor/intern/loading.tsx` (skeleton generik pola issues).
- [ ] **Langkah:** 1) page client (filter status + search via DataTable bawaan; tab terpisah per dataset). 2) route + loading. 3) cek manual `pnpm dev`: supervisor ber-intern, tanpa intern, admin tanpa profil.
- [ ] **Verifikasi:** `tsc` 0; `eslint` 0; render 360px/1440px + light/dark dicek visual.
- [ ] **Commit:** `feat(supervisor): add intern bimbingan page`.

### Task 4: Verifikasi mutu akhir

- [ ] **Tujuan:** AC4 hijau. Langkah: `npx eslint <file-file Task 1-3>` → 0; `npx tsc --noEmit` → 0; `pnpm build` → sukses; `git status` hanya file File Placement Map. Titik commit: tidak ada kode.

## 8. Rencana verifikasi per AC

| AC | Cara | Harapan |
|---|---|---|
| AC1 data benar | dev + 2 akun (ber-intern, kosong) + admin | baris tepat; empty state jelas |
| AC2 tabel | search/filter/sort manual | kolom progres benar |
| AC3 navigasi | klik → dialog → link penilaian | tanpa crash termasuk assessment null/riwayat |
| AC4 mutu/responsif | eslint, tsc, build; DevTools 360/1440 + toggle tema | 0 error; build sukses |

## 9. Risiko & mitigasi

- Scope bocor (lihat intern orang lain) → query SELALU filter `supervisorProfileId`; review: grep query tanpa filter.
- N+1 → agregat di include tunggal; verifikasi jumlah query via log Prisma dev bila ragu.
- Kolom inline → remount → wajib factory stabil (review grep `createColumns(` dipanggil sekali).
- `cacheTag` basi usai review → cek `revalidateTag` di actions saat implementasi; bila pola tak ditemukan, catat sebagai lanjutan (jangan karang API).
- Admin tanpa profil → empty state, bukan semua data (keputusan terkunci §3).

## 10. Referensi

Riset `docs/research/supervisor-intern-page.md`; context7 `/tanstack/table` (cells, flex-render, memo kolom); exa (intern-ops, INTERNSHIP-SYSTEM-DESIGN, MenteeBook, mentor dashboard); repo: `app/supervisor/layout.tsx:40-44`, `app/supervisor/penilaian/page.tsx`, `dashboard-data.ts`, `hr/pages/intern-page.tsx`, `data-table.tsx`, `assessment-card.tsx`, `stat-block.tsx`, `package.json`, `AGENTS.md`.
