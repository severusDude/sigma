# Navigation Top Loader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Setiap perpindahan halaman menampilkan top progress bar yang terisi selama navigasi dan hilang saat halaman tujuan render.

**Architecture:** Tambah dependensi `@bprogress/next` (penerus resmi `next-nprogress-bar` yang sudah unmaintained); satu modul provider client baru `providers/progress-provider.tsx` yang membungkus `children` dengan `ProgressProvider`, dipasang di `app/layout.tsx` mengikuti pola `ReactQueryProvider`. Tanpa mengubah root layout menjadi client, tanpa menyentuh fitur mana pun.

**Tech Stack:** Next.js 16.2.10 (App Router), React 19.2.4, `@bprogress/next` v3.x (`ProgressProvider` dari `@bprogress/next/app`), Tailwind v4, pnpm.

**Spec:** Desain dikunci dalam dokumen ini (Fase 3 pra-prompt) + riset `docs/research/navigation-top-loader.md`. **Gate: desain di bawah memerlukan persetujuan user sebelum implementasi dimulai.**

## Global Constraints

- Root layout `app/layout.tsx` tetap server component (mengekspor `metadata`) — bar dipasang via wrapper `"use client"` terpisah.
- Warna bar mengikuti token tema (`--primary`), adaptif dark mode; tanpa spinner NProgress (`showSpinner: false`).
- Cakupan: seluruh app otomatis (semua `<Link>` + navigasi programmatic bila terpicu provider).
- Tanpa mengubah perilaku kode di luar scope; tanpa secret; satu peringatan: AGENTS.md mewajibkan membaca panduan di `node_modules/next/dist/docs/` sebelum menulis kode App Router.
- reduced-motion: di luar scope (tidak dipilih user) — dicatat di Asumsi.

## Review Focus

- Navigasi programmatic (`router.push` dari `next/navigation`, 12 file) yang ternyata tidak memicu bar — ekspektasi wajar: bar tetap muncul; bila tidak, ganti ke `useRouter` lib sebagai task lanjutan (diputuskan dari smoke test Task 3).
- Navigasi gagal/error (route error, network abort) membuat bar macet — ekspektasi: bar selalu selesai/hilang, tidak stuck.
- Bar menutupi elemen fixed lain (sidebar/sheet/dialog/sonner) — ekspektasi: bar tipis di puncak viewport, tidak menggeser layout, tidak menutupi toast.
- Navigasi sangat cepat menyebabkan flicker — ekspektasi: tidak ada kedip; tuning `delay` bila perlu.
- Dark mode: bar tetap terlihat di kedua tema — ekspektasi: kontras cukup di light dan dark.

---

## 1. Ringkasan & tujuan

Pengguna tidak mendapat feedback saat pindah halaman. Tujuan: top bar (gaya hot-loader) muncul setiap navigasi dimulai, terisi secara trickle, dan selesai tepat saat halaman tujuan render — di seluruh app, mengikuti warna tema, tanpa layout shift.

## 2. Acceptance criteria

- [ ] **AC1 — Bar muncul tiap navigasi.** Given user di halaman mana pun, When klik `<Link>` ke halaman lain, Then bar 3px muncul di puncak viewport dalam <300ms.
- [ ] **AC2 — Bar selesai tepat.** Given bar berjalan, When halaman tujuan selesai render, Then bar mencapai 100% dan hilang tanpa sisa elemen di DOM (tidak stuck).
- [ ] **AC3 — Tidak flicker / tidak salah picu.** Given klik URL yang sama dengan halaman aktif atau navigasi < delay, When selesai, Then bar tidak muncul atau tidak berkedip.
- [ ] **AC4 — Tema & responsif.** Given light/dark mode dan viewport mobile (360px) + desktop (1440px), When bar tampil, Then warna = `--primary`, terlihat jelas, tidak menggeser konten.
- [ ] **AC5 — Mutu.** Given perubahan selesai, When `npx eslint`, `npx tsc --noEmit`, `pnpm build` dijalankan, Then 0 error dan build sukses.

## 3. Asumsi & di luar scope

**Terkonfirmasi (jawaban user Fase 0):** dependensi kategori progress-bar disetujui (paket berubah menjadi `@bprogress/next` karena `next-nprogress-bar` unmaintained → **perlu konfirmasi ulang di gate**); cakupan seluruh app otomatis; AC utama = bar terlihat + selesai tepat; warna mengikuti tema. **Asumsi (wajar, dinyatakan):** production-grade ringan (verifikasi smoke + lint/typecheck/build, tanpa test runner baru karena repo tidak memilikinya); reduced-motion di luar scope; `nonce`/CSP tidak perlu (repo tanpa CSP nonce).

**Di luar scope:** mengganti 12 import `useRouter` sekaligus (hanya bila smoke test Task 3 membuktikan perlu); skeleton/`loading.tsx` per-route baru; perubahan toast/spinner/skeleton existing; upgrade Next/React.

## 4. Temuan repo (ringkas)

- **Stack:** `package.json:20-60` — `next 16.2.10`, `react/react-dom 19.2.4`, `tailwindcss ^4`, `next-themes ^0.4.6`, `sonner ^2.0.7`; package manager pnpm (`pnpm-lock.yaml`, `pnpm-workspace.yaml`); scripts `lint` (`eslint`), `build` (`next build`); **tidak ada test runner** (tanpa vitest/jest/`*.test.*`).
- **Struktur:** `app/` routes App Router; `components/ui/` (shadcn, kebab-case); `features/<domain>/{actions,components,data,pages}/`; `hooks/`; `lib/`; `providers/` (satu file: `react-query-provider.tsx`); alias `@/*` (`tsconfig.json`).
- **Root layout:** `app/layout.tsx:79-123` — server component + `metadata` export; komposisi provider `ReactQueryProvider > ThemeProvider (default dark) > TooltipProvider + Toaster`.
- **Pola loading existing (bukan navigasi):** `components/ui/spinner.tsx` (`Loader2Icon`, `role="status"`), `components/ui/skeleton.tsx`, `app/supervisor/issues/loading.tsx` + `[id]/loading.tsx` (skeleton per-route) — tidak ada padanan top bar global, jadi modul baru dibenarkan.
- **Navigasi programmatic:** 12 file memakai `useRouter` dari `next/navigation` (mis. `features/auth/components/sign-in-form.tsx:32`, `hooks/use-storage-toast.ts:7`, `features/supervisor/pages/issue-view.tsx:170`).
- **Token warna:** `app/globals.css:14` (`--primary` light) & `:80` (dark, nilai sama) — dasar `color="var(--primary)"`.
- **Konvensi:** `AGENTS.md` (baca `node_modules/next/dist/docs/` sebelum kode Next — breaking changes v16); `eslint.config.mjs`; `docs/superpowers/plans/` + `docs/research/` untuk catatan.

## 5. Keputusan desain & alternatif yang ditolak

**Terpilih: A — `@bprogress/next` `ProgressProvider` + wrapper `providers/progress-provider.tsx`.** Alasan: penerus resmi yang dimaintain (peer `next>=13`/`react>=18`), API terverifikasi via migration guide resmi, otomatis untuk `<Link>`, seam bersih di `providers/` sejajar pola existing, interface kecil (children + konstanta config), tanpa menyentuh fitur. `useLinkStatus` resmi Next hanya inline per-Link (pending diskip bila prefetch) — bukan pengganti bar global.

**Ditolak:** B `next-nprogress-bar` v2 — unmaintained sejak Feb 2025 (bukti: npm + README "no longer be maintained"), risiko Next 16/React 19 tanpa fix. C komponen tanpa dep — invasif (patch 12 file router + duplikasi trickle/stop) dan gagal uji kedalaman (interface sebesar implementasi). D hanya `loading.tsx` per-route — bukan bar global yang diminta. E root layout `"use client"` — merusak `metadata` + mem-client-kan seluruh layout.

## 6. Reuse Decision Table & File Placement Map

| Kebutuhan | Keputusan | Aset/Path | Alasan |
|---|---|---|---|
| Komposisi provider client | **Reuse (pola)** | `providers/react-query-provider.tsx` | Pola `"use client"` + `children` yang sudah ada; provider baru menirunya |
| Spinner/skeleton/toast | **Reuse (tidak diubah)** | `components/ui/spinner.tsx`, `skeleton.tsx`, `sonner.tsx` | Untuk konten, bukan navigasi; tetap sebagai feedback tekstual/area |
| `loading.tsx` supervisor/issues | **Reuse (tidak diubah)** | `app/supervisor/issues/loading.tsx` | Tetap tampil bersama bar; tidak diduplikasi |
| Token warna bar | **Reuse** | `app/globals.css` `--primary` | Warna tema + dark adaptif tanpa nilai hardcode |
| Modul progress navigasi | **Create** | `providers/progress-provider.tsx` | Tidak ada padanan; seam di `providers/` |
| Pemasangan global | **Extend** | `app/layout.tsx` (1 baris import + 1 bungkus) | Titik pemasangan tunggal; tidak ubah struktur lain |

**File Placement Map:**
- Tambah dep: `package.json` (+ lockfile) — `@bprogress/next` versi terbaru saat eksekusi; satu-satunya dep baru (kategori disetujui, nama paket menunggu gate).
- Buat: `providers/progress-provider.tsx` — `"use client"`; bungkus `children` dengan `ProgressProvider` dari `@bprogress/next/app`; config: `height="3px"`, `color="var(--primary)"`, `options={{ showSpinner: false }}`, `shallowRouting` default.
- Ubah: `app/layout.tsx` — import + bungkus `{children}` (atau selipkan sejajar `ReactQueryProvider`; keputusan final saat implementasi mengikuti hasil baca README terinstal).
- Tidak diubah: fitur, `loading.tsx`, theme, toast, `useRouter` existing (kecuali Task 3 membuktikan perlu).

## 7. Task berurutan

### Task 1: Install `@bprogress/next` + verifikasi API terinstal

- [ ] **Tujuan satu kalimat:** Dependensi penerus resmi terpasang dan API-nya terkonfirmasi dari sumber terinstal, bukan memori.
- [ ] **File:** Ubah `package.json` + lockfile via `pnpm add @bprogress/next` (catat versi terinstal, mis. `3.2.x`).
- [ ] **Interface yang disepakati:** `import { ProgressProvider } from '@bprogress/next/app'` (dari migration guide); konfirmasi ulang dari `node_modules/@bprogress/next/README.md` setelah install: path import, nama props (`height/color/options/shallowRouting/delay/disableSameURL/stopDelay`), path `useRouter` wrapper + signature-nya, dukungan `color: "var(--primary)"` (atau fallback bila docs menolak).
- [ ] **Test dulu & gagal yang diharapkan:** `pnpm ls @bprogress/next` sebelum install → diharapkan **gagal/tidak ditemukan** (dependensi belum ada); baca `node_modules/@bprogress/next/package.json` `peerDependencies` → harapkan mencakup `next`/`react` repo (bila tidak, STOP dan lapor).
- [ ] **Langkah minimal:** 1) `pnpm add @bprogress/next`. 2) Baca README + `package.json` terinstal, catat versi + import path + props ke catatan commit. 3) Baca panduan `node_modules/next/dist/docs/` yang relevan (App Router layout/providers) sesuai AGENTS.md.
- [ ] **Verifikasi & hasil diharapkan:** `pnpm ls @bprogress/next` menampilkan versi; tidak ada peer-warning error; `git diff --stat` hanya `package.json` + lockfile.
- [ ] **Titik commit:** `git commit -m "chore(deps): add @bprogress/next for navigation progress"`.

### Task 2: Buat provider + pasang di root layout

- [ ] **Tujuan satu kalimat:** Bar aktif global tanpa mengubah root layout menjadi client.
- [ ] **File:** Buat `providers/progress-provider.tsx`; ubah `app/layout.tsx` (import + bungkus children).
- [ ] **Interface yang disepakati (contoh):**
  ```tsx
  // providers/progress-provider.tsx — "use client"; interface: { children: React.ReactNode }
  <ProgressProvider height="3px" color="var(--primary)" options={{ showSpinner: false }}>
    {children}
  </ProgressProvider>
  ```
  (`shallowRouting`/default lain mengikuti hasil Task 1; `delay`/`stopDelay` hanya bila Task 3 menuntut.)
- [ ] **Test dulu & gagal yang diharapkan:** Repo tanpa test runner → "test" = smoke manual `pnpm dev` + cek: sebelum pasang, pindah halaman → **tidak ada** bar (baseline gagal yang diharapkan); setelah pasang → bar muncul (Task 3).
- [ ] **Langkah minimal:** 1) Tulis provider meniru gaya `providers/react-query-provider.tsx`. 2) Pasang di `app/layout.tsx` dalam komposisi existing. 3) `npx eslint providers/progress-provider.tsx app/layout.tsx` → 0. 4) `npx tsc --noEmit` → 0.
- [ ] **Verifikasi & hasil diharapkan:** eslint 0, tsc 0; `pnpm dev` boot tanpa error client (`use client` benar, metadata tetap valid).
- [ ] **Titik commit:** `git commit -m "feat(nav): add global top navigation progress bar"`.

### Task 3: Smoke test navigasi + keputusan lanjutan (useRouter/delay/warna)

- [ ] **Tujuan satu kalimat:** Buktikan AC1–AC4 di browser nyata dan kunci keputusan terbuka berbasis bukti.
- [ ] **File:** Tidak ada (kecuali keputusan menuntut perubahan → dijadikan Task 3b terpisah, mis. ganti import `useRouter` di file terbukti perlu, atau tambah `delay`/hex fallback).
- [ ] **Checklist smoke (catat lolos/gagal tiap baris):** 1) Klik `<Link>` antar dashboard → bar muncul <300ms, selesai + hilang (AC1–AC2). 2) `router.push` dari sign-in form → bar muncul? (bila tidak → Task 3b: `useRouter` wrapper). 3) Klik URL sama → tidak memicu (AC3, `disableSameURL` default true). 4) Navigasi cepat → tidak flicker (bila flicker → Task 3b: `delay`). 5) Light + dark + 360px + 1440px → warna `--primary` terlihat, tanpa layout shift (AC4; bila var ditolak lib → Task 3b: hex fallback). 6) Navigasi ke route error → bar tidak stuck.
- [ ] **Verifikasi & hasil diharapkan:** Tabel smoke terisi; setiap Task 3b yang muncul punya file + nilai persis sebelum dikerjakan.
- [ ] **Titik commit:** `git commit -m "fix(nav): <hasil Task 3b>"` per perubahan, atau tanpa commit bila nihil.

### Task 4: Verifikasi mutu akhir (gate merge)

- [ ] **Tujuan satu kalimat:** Buktikan AC5 dengan tooling repo.
- [ ] **File:** Tidak ada.
- [ ] **Langkah:** `npx eslint providers/progress-provider.tsx app/layout.tsx` → 0; `npx tsc --noEmit` → 0; `pnpm build` → sukses (abaikan warning Next tak terkait, catat).
- [ ] **Verifikasi & hasil diharapkan:** Ketiga perintah hijau; `git status` hanya berisi file dari File Placement Map (+ Task 3b bila ada).
- [ ] **Titik commit:** Tidak ada kode; tandai plan selesai, minta review merge.

## 8. Rencana verifikasi per AC

| AC | Cara (tooling repo + browser, bukan karangan) | Hasil diharapkan |
|---|---|---|
| AC1 muncul | `pnpm dev`, klik Link, amati + `node --trace-warnings` bersih | bar <300ms |
| AC2 selesai | Navigasi ke halaman berat (mis. supervisor/issues) | 100% lalu hilang, DOM bersih |
| AC3 no-flicker | Klik URL sama; navigasi cepat | tidak muncul/berkedip |
| AC4 tema/responsif | Toggle dark, viewport 360px/1440px (DevTools) | `--primary`, no layout shift |
| AC5 mutu | `npx eslint`, `npx tsc --noEmit`, `pnpm build` | 0 error, build sukses |

## 9. Risiko & mitigasi

- **Next 16 runtime incompat** (peer longgar tapi perilaku belum teruji) → mitigasi: smoke Task 3 + `pnpm build`; fallback = pendekatan C (tanpa dep) sebagai rencana cadangan.
- **`color="var(--primary)"` ditolak lib** → mitigasi: verifikasi visual Task 3; fallback hex token light/dark via `style`/CSS `.bprogress` (bukan karangan: selector `.bprogress` dari migration guide).
- **`router.push` programmatic tak terpicu** → mitigasi: Task 3b ganti import hanya di file terbukti perlu (daftar 12 file di §4).
- **Bar stuck saat error** → mitigasi: uji route error di Task 3; andalkan `done()` internal lib + `stopDelay` bila perlu.
- **Z-index vs sidebar/dialog/toast** → mitigasi: cek visual; NProgress default fixed-top; ubah hanya berbasis bukti.

## 10. Referensi

- Riset: `docs/research/navigation-top-loader.md` (sumber primer + trade-off A/B/C).
- `context7`: `/rstacruz/nprogress` (start/done/configure API); `/vercel/next.js` canary (`use-link-status`, `use-router` — App Router tanpa router events).
- Paket: npm `next-nprogress-bar` (v2.4.7 unmaintained 2025-02-18) & `@bprogress/next` (v3.2.x, peer next>=13/react>=18); README 2.3.14 via jsdelivr (props, Providers pattern, `useRouter` wrapper, data attributes); migration guide bprogress.vercel.app (ProgressProvider, `RouterProgressOptions`, `data-disable-progress`, `.bprogress`).
- Repo: `app/layout.tsx:45,97-123`, `providers/react-query-provider.tsx`, `app/globals.css:14,80`, `components/ui/spinner.tsx`, `app/supervisor/issues/loading.tsx`, `package.json:6-19,44,50-51`, `AGENTS.md`.
- Status verifikasi: versi repo terverifikasi; API `@bprogress/next` dari migration guide + npm metadata (halaman `/docs/next` gagal fetch — verifikasi ulang via README terinstal di Task 1); perilaku runtime (programmatic trigger, CSS var color, Next 16) **belum terverifikasi** — dimiliki Task 1/3.
