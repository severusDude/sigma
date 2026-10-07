# Layout Overflow + Scrollbar Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tabel lebar scroll horizontal di dalam card-nya sendiri tanpa merusak sidebar, dan scrollbar area konten memakai bawaan browser — di semua halaman terdampak.

**Architecture:** Tiga lapisan satu rantai: (1) `min-w-0` di `SidebarInset` + div konten `sidebar-layout` (fix upstream shadcn #11146, tanpa `overflow-x-hidden` agar dropdown tak terpotong); (2) wrapper `overflow-x-auto max-w-full` pada tabel di `DataTable` (satu titik, semua tabel ikut); (3) ganti `ScrollArea` custom page-level (6 file) menjadi `div overflow-y-auto` native; dialog tetap custom. Tanpa dep baru, tanpa perubahan visual selain perilaku scroll.

**Tech Stack:** Next.js 16.2.10, React 19, Tailwind v4, shadcn sidebar, Base-UI ScrollArea 1.6.0, TanStack Table 8, pnpm.

**Spec:** Desain dikunci dalam dokumen ini + riset `docs/research/layout-overflow-scrollbar.md`. **Gate: desain memerlukan persetujuan user sebelum implementasi dimulai.**

## Global Constraints

- Dilarang `overflow-x-hidden`/`overflow-hidden` pada ancestor dropdown/tooltip (clipping); gunakan `min-w-0`.
- Tidak ada perubahan estetika: token, tipe, spasi, radius, badge sama; hanya perilaku scroll.
- `whitespace-nowrap` sel tabel dipertahankan (pemicu scroll dalam yang bermakna).
- Nilai `max-h` tiap halaman dipertahankan apa adanya (jangan diseragamkan).
- Tanpa dependency baru; tanpa ubah skema/auth/API.

## Review Focus

- Dropdown/Select/Tooltip di tepi kanan inset tetap tampil penuh (tidak terpotong) — uji tiap halaman tabel yang punya dropdown aksi/filter.
- Tabel sempit (lebih kecil dari viewport) tampil identik seperti sebelum fix (no-op visual).
- Dialog dengan `ScrollArea` custom tidak ikut berubah perilakunya.
- Halaman tanpa tabel (landing, profil, form) tidak terpengaruh.
- Mode mobile (sidebar offcanvas) dan collapse-icon tidak regresi.

---

## 1. Ringkasan & tujuan

Tabel lebar mendorong seluruh halaman (flex `min-width:auto` di tiap lapis) sehingga konten bergeser di bawah sidebar `fixed` + scrollbar custom terlihat rusak. Tujuan: kunci lebar di tiap lapis (`min-w-0`), scroll horizontal hanya di dalam card tabel, scrollbar konten native — global via komponen shared.

## 2. Acceptance criteria

- [ ] **AC1 — Sidebar utuh.** Given tabel terlebar, When scroll kanan penuh di tiap halaman tabel, Then sidebar utuh tak tertimpa dan tak ada scroll horizontal tingkat halaman.
- [ ] **AC2 — Scroll terkunci tabel.** Given tabel melebihi viewport, When geser, Then yang bergerak hanya isi card tabel (header + pagination + sidebar diam).
- [ ] **AC3 — Scrollbar native.** Given area konten halaman, When scroll vertikal, Then terlihat scrollbar bawaan browser (tanpa fade/delay custom).
- [ ] **AC4 — Mutu + regresi.** Given selesai, When `npx eslint`, `npx tsc --noEmit`, `pnpm build`, Then 0 error dan build sukses; cek visual 360px/1440px, light/dark, dropdown tepi.

## 3. Asumsi & di luar scope

**Terkonfirmasi:** scroll di dalam tabel; scrollbar native; AC tiga item; bebas sentuh shared. **Asumsi (wajar):** production-grade ringan (tanpa test runner baru; verifikasi visual manual + lint/type/build); dialog tetap custom. **Di luar scope:** sembunyikan kolom di mobile; sticky header/kolom; ubah `scroll-area.tsx` global; halaman `/supervisor/bimbingan` (belum ada); refactor sidebar lain.

## 4. Temuan repo (ringkas)

Stack: `package.json` (next 16.2.10, tailwind v4, `@base-ui/react ^1.6.0`, pnpm; tanpa test runner). Struktur: `components/ui|shared|layout`, `features/<domain>/pages`. Rantai bocor: `sidebar.tsx:310` (`SidebarInset` tanpa `min-w-0`; sidebar `fixed` di `:233`) → `sidebar-layout.tsx:50` (div flex tanpa `min-w-0`) → `ScrollArea w-full` → `data-table.tsx:242-294` (tabel `whitespace-nowrap` tanpa wrapper scroll). Scrollbar custom: `scroll-area.tsx` (Base-UI, thumb `bg-border`, fade delay-300). Page-level terdampak (6): `supervisor/pages/dashboard-page.tsx:47`, `supervisor/pages/intern-page.tsx:93`, `hr/pages/dashboard-page.tsx:42`, `intern/pages/dashboard-page.tsx:43`, `supervisor/pages/issue-view.tsx:298` (`max-w-[100vw]`), `intern/pages/logbook-page.tsx:218` (`max-w-[100vw]`). Dialog (`-mr-6 pr-6`, overlay) tidak diubah.

## 5. Keputusan desain & alternatif yang ditolak

Terpilih A (min-w-0 rantai + overflow-x-auto tabel + native div konten). Alasan: fix upstream resmi (#11146), tak clipping popover, satu titik per lapisan, sesuai pilihan user. Ditolak: B `overflow-x-hidden` (clipping, ditolak upstream); C per-halaman saja (tak tuntas); D rombak `scroll-area.tsx` global (komponen ini memang custom; dialog tak dikeluhkan).

## 6. Reuse Decision Table & File Placement Map

| Kebutuhan | Keputusan | Aset/Path | Alasan |
|---|---|---|---|
| Batas susut inset | **Extend** | `components/ui/sidebar.tsx:310` (+`min-w-0`) | Fix upstream #11146; tanpa ubah API/props |
| Batas susut konten | **Extend** | `components/layout/sidebar-layout.tsx:50` (+`min-w-0`) | Link rantai yang hilang |
| Scroll dalam tabel | **Extend** | `components/shared/data-table/data-table.tsx:242` (wrapper `overflow-x-auto max-w-full`) | Satu titik semua tabel |
| Scroll konten native | **Extend** | 6 file page (ScrollArea→div, `max-h` sama) | Pilihan user; dialog tak disentuh |
| Audit `max-w-[100vw]` | cek saat kerja | `issue-view.tsx:298`, `logbook-page.tsx:218` | Ganti `max-w-full` bila duplikasi lebar sidebar |

## 7. Task berurutan

### Task 1: Kunci rantai flex (akar)

- [ ] **Tujuan satu kalimat:** Inset dan konten boleh menyusut di bawah min-content tanpa clipping popover.
- [ ] **File:** Ubah `components/ui/sidebar.tsx:310` (+`min-w-0` di `SidebarInset`), `components/layout/sidebar-layout.tsx:50` (+`min-w-0` di div konten).
- [ ] **Langkah:** 1) tambah kelas (tanpa ubah lain). 2) `npx tsc --noEmit` → 0 (class string, tak ada risiko tipe).
- [ ] **Verifikasi:** `git diff` hanya 2 baris kelas; `pnpm build` → sukses (final di Task 4).
- [ ] **Commit:** `fix(layout): allow inset content to shrink below min-content`.

### Task 2: Scroll dalam card tabel

- [ ] **Tujuan satu kalimat:** Tabel lebar scroll di dalam border card-nya.
- [ ] **File:** Ubah `components/shared/data-table/data-table.tsx:242` — bungkus `<Table>` dengan `<div className="w-full max-w-full overflow-x-auto">` (border tetap di luar atau pindah ke wrapper — putuskan sekali: border di wrapper agar scroll di dalam border; catat pilihan).
- [ ] **Langkah:** 1) tambah wrapper. 2) cek `components/ui/table.tsx` tak punya wrapper overflow sendiri (baca dulu; bila ada, jangan ganda).
- [ ] **Verifikasi:** `npx eslint` + `tsc` → 0; visual satu halaman (HR intern): scroll kanan, sidebar utuh.
- [ ] **Commit:** `fix(table): contain horizontal scroll inside card`.

### Task 3: Scrollbar konten native (6 halaman)

- [ ] **Tujuan satu kalimat:** Area konten pakai scrollbar browser dengan tinggi area sama.
- [ ] **File:** `supervisor/pages/dashboard-page.tsx:47`, `supervisor/pages/intern-page.tsx:93`, `hr/pages/dashboard-page.tsx:42`, `intern/pages/dashboard-page.tsx:43`, `supervisor/pages/issue-view.tsx:298`, `intern/pages/logbook-page.tsx:218` — `ScrollArea`→`div`, pertahankan `max-h`/`h` + spacing (`space-y-*`, `pr-2` dievaluasi: hapus bila hanya untuk thumb custom), hapus import ScrollArea yang tak terpakai; `max-w-[100vw]`→`max-w-full` bila audit membuktikan duplikasi sidebar.
- [ ] **Langkah per file:** 1) ganti tag + import. 2) `eslint` file itu → 0 (tanpa unused import).
- [ ] **Verifikasi:** `tsc` → 0; tiap halaman: scrollbar native terlihat, tinggi area sama, dropdown tepi tak terpotong.
- [ ] **Commit:** `fix(layout): native scrollbars for page content areas` (boleh pecah per halaman bila reviewer minta).

### Task 4: Verifikasi mutu + regresi visual (gate merge)

- [ ] **Tujuan satu kalimat:** AC1–AC4 hijau. Langkah: `npx eslint` (file Task 1–3) → 0; `npx tsc --noEmit` → 0; `pnpm build` → sukses; checklist visual: tiap halaman tabel (scroll kanan ekstrem), dialog (custom utuh), dropdown tepi, 360px/1440px, light/dark, sidebar collapse-icon + offcanvas mobile.
- [ ] **Titik commit:** tidak ada kode.

## 8. Rencana verifikasi per AC

| AC | Cara | Harapan |
|---|---|---|
| AC1 sidebar | Scroll kanan penuh tiap halaman tabel | Sidebar utuh, no page-x-scroll |
| AC2 terkunci | Geser tabel lebar | Hanya isi card bergerak |
| AC3 native | Scroll vertikal konten | Scrollbar browser, tanpa fade |
| AC4 mutu | eslint, tsc, build + cek visual | 0 error; build sukses |

## 9. Risiko & mitigasi

- Dropdown terpotong → dicegah via min-w-0 (bukan clip) + uji tiap dropdown tepi; rollback per file bila terjadi.
- Tabel sempit berubah → min-w-0/max-w-full no-op; verifikasi satu tabel sempit.
- `Table` shadcn sudah ber-wrapper → cek Task 2, jangan ganda.
- Dialog ikut terasa berubah → tak disentuh; verifikasi eksplisit.

## 10. Referensi

Riset `docs/research/layout-overflow-scrollbar.md`; context7 `/mui/base-ui` v1.6.0 (ScrollArea anatomy, Viewport `overflow:scroll`); exa (shadcn #10549 + PR #11146/#10746; visivo analysis + 9c19971; SO #51338182; epicenter); repo: `sidebar.tsx:233,310`, `sidebar-layout.tsx:40-51`, `scroll-area.tsx`, `data-table.tsx:242-294`, 6 file page, `package.json:23`, `AGENTS.md`.
