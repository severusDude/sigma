# Auth Redirect Loop Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development (recommended) or executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** User yang sudah login dan membuka `/sign-in` mendarat di dashboard sesuai role (bukan `/`); login menghormati `?redirect=` yang valid; role invalid ditolak dengan pesan; tanpa loop.

**Architecture:** Redirect role-aware dipindah ke server component (`app/(auth)/sign-in/page.tsx` async + `auth.api.getSession`, pola `helpers/guard.ts`); proxy hanya meloloskan (`next()`) untuk `/sign-in` ber-session; helper sanitasi pure baru `helpers/safe-redirect.ts` (anti open-redirect); fallback `getRoleHome` menjadi `/`; form meneruskan `redirect` via prop server (tanpa `useSearchParams`, tanpa risiko CSR-bailout).

**Tech Stack:** Next.js 16.2.10 App Router, better-auth 1.6.x, React 19, pnpm. Tanpa dependency baru.

**Spec:** Riset `docs/research/auth-redirect-loop.md`. **Gate: desain memerlukan persetujuan user sebelum implementasi.**

## Global Constraints

- `/` tetap landing publik (tidak diubah).
- `proxy.ts` matcher tidak berubah; tetap presence-check untuk protected routes.
- Redirect target hanya relative same-origin (helper sanitasi); fallback aman `/`.
- reduced-motion/CSP di luar scope; tanpa secret; tanpa ubah skema/auth config.

## Review Focus

- `?redirect=https://evil` / `//evil` / `/\evil` / `javascript:` harus jatuh ke dashboard, bukan keluar domain.
- Role berubah/dihapus mid-session: `requireAuth` tiap halaman tetap menendang ke role home (lapis kedua).
- `signOut` setelah tolak role invalid tidak error saat session baru.
- Tidak ada flash form sebelum redirect server (redirect throw sebelum render).

---

## 1. Ringkasan & tujuan

Lihat Goal di atas. Akar masalah: proxy tak tahu role + fallback loop + form abaikan `?redirect=`.

## 2. Acceptance criteria

- [ ] **AC1.** Given login sebagai tiap role (admin/hr/supervisor/intern), When buka `/sign-in`, Then mendarat di `/admin`, `/hr`, `/supervisor`, `/intern` (tanpa loop, chain ≤2).
- [ ] **AC2.** Given tak-login buka halaman proteksi (mis. `/hr`), When login sukses, Then kembali ke halaman semula; bila `?redirect=` jahat → dashboard role.
- [ ] **AC3.** Given login sukses tapi role null/unknown, When submit, Then toast error jelas + tidak pindah halaman + session dibersihkan.
- [ ] **AC4.** `npx eslint`, `npx tsc --noEmit`, `pnpm build` → 0 error, build sukses.

## 3. Asumsi & di luar scope

Terkonfirmasi: `/` tetap landing; hormati redirect; tolak role invalid; AC ganda. Asumsi wajar: production-grade ringan (tanpa test runner baru; TDD via script `tsx` sementara). Di luar scope: ganti massal `useRouter`; halaman access-denied baru; ubah skema/auth config; Next upgrade.

## 4. Temuan repo (ringkas)

Stack: `package.json` (next 16.2.10, react 19.2.4, better-auth ^1.6.23, pnpm; tanpa test runner). Struktur: `app/(auth)/`, `features/auth/`, `helpers/` (kebab-case), `providers/`, alias `@/*`. `proxy.ts:1-33` (presence-check + `?redirect=` writer). `helpers/guard.ts` (`requireAuth` di 19 halaman; `redirectToRoleHome` tak terpakai — seam reuse). `helpers/role-home.ts` (fallback `/sign-in` = sumber loop). `sign-in-form.tsx:82` (abaikan redirect). `lib/auth.ts:27-32` (cookieCache 5 mnt). Konvensi: `AGENTS.md` (baca `node_modules/next/dist/docs/`).

## 5. Keputusan desain & alternatif yang ditolak

Terpilih A (server-component redirect + helper sanitasi + fallback `/` + tolak role di form). Alasan: konsisten guard.ts, tanpa DB di middleware, sanitasi single-source testable. Ditolak: B getSession di proxy (DB tiap request + runtime change); C getCookieCache (isi belum terverifikasi); D status quo (bug). `useLinkStatus`/topik UI tak relevan (logika murni). Revisi saat eksekusi: prop server gantikan `useSearchParams` (hindari CSR-bailout).

## 6. Reuse Decision Table & File Placement Map

| Kebutuhan | Keputusan | Aset/Path | Alasan |
|---|---|---|---|
| Cek session + redirect server | **Reuse** | `helpers/guard.ts` | Pola mapan; perluasan kecil dukung redirect |
| Peta role→home | **Extend** | `helpers/role-home.ts` (fallback → `/`) | Anti-loop satu baris |
| Sanitasi redirect | **Create** | `helpers/safe-redirect.ts` | Tak ada padanan; pure + testable |
| Loloskan /sign-in ber-session | **Extend** | `proxy.ts` | Syarat inti (server yang memutuskan) |
| Redirect bila sudah login | **Extend** | `app/(auth)/sign-in/page.tsx` (async) | Seam server |
| Hormati redirect + tolak role | **Extend** | `features/auth/.../sign-in-form.tsx` (+ `sign-in-page.tsx` teruskan prop) | Tanpa ubah schema/toast pattern |

Buat: `helpers/safe-redirect.ts`. Ubah: `helpers/role-home.ts`, `proxy.ts`, `app/(auth)/sign-in/page.tsx`, `features/auth/pages/sign-in-page.tsx` (prop opsional), `features/auth/components/sign-in-form.tsx`. Tidak diubah: skema, auth config, fitur lain.

## 7. Task berurutan

### Task 1: Baca + reproduksi logika
- [ ] Tujuan: pastikan `sign-in-page.tsx` server-compatible + simulasikan loop `getRoleHome("")` → `/sign-in`.
- [ ] File: baca saja. Verifikasi: catat. Commit: tidak ada.

### Task 2: Helper sanitasi + TDD
- [ ] Tujuan: `getSafeRedirectPath(raw, fallback)` hanya loloskan relative same-origin.
- [ ] File: buat `helpers/safe-redirect.ts`.
- [ ] Interface: `export function getSafeRedirectPath(raw: string | null | undefined, fallback: string): string` (pure; `new URL(raw, "https://placeholder.invalid")`, tolak bila origin berubah, kembalikan `pathname+search+hash`).
- [ ] Test dulu (script `tsx` sementara, hapus sesudahnya): `/hr` lolos; `//evil.com`, `https://evil.com`, `/\evil.com`, `javascript:alert(1)`, `""`, `null` → fallback; `/hr?tab=1#x` preservasi. Harapkan MERAH lalu HIJAU.
- [ ] Verifikasi: `npx tsc --noEmit`, `npx eslint helpers/safe-redirect.ts` → 0.
- [ ] Commit: `fix(auth): add safe redirect sanitizer`.

### Task 3: Fallback anti-loop
- [ ] Tujuan: role unknown tak pernah mengarah ke `/sign-in`.
- [ ] File: `helpers/role-home.ts:9` → `?? "/"`. Verifikasi: grep 3 pemakai typecheck OK. Commit: `fix(auth): safe fallback for unknown roles`.

### Task 4: Proxy loloskan + sign-in page/form
- [ ] Tujuan: server component memutuskan redirect role-aware.
- [ ] File: `proxy.ts` (blok auth→`next()`); `page.tsx` async (session → redirect sanitized-`redirect` ?? role home; tak ada session → render); `sign-in-page.tsx` + form terima prop `redirectTo?` opsional; form: prioritas redirect-valid > role home; role invalid → toast error + `authClient.signOut()`, tanpa push.
- [ ] Verifikasi: `tsc`, `eslint`, `pnpm build` sukses; matriks manual 4 role × langsung/?redirect= valid/jahat × tanpa session.
- [ ] Commit: `feat(auth): role-aware post-login redirects` (boleh 2 commit: proxy, page/form).

### Task 5: Verifikasi AC
- [ ] Chain redirect ≤2, evil → dashboard, lint/tsc/build hijau. Laporkan jujur.

## 8. Verifikasi per AC — lihat Task 5 + matriks Task 4 (lint → typecheck → build; tanpa test runner sesuai tooling repo).

## 9. Risiko & mitigasi

Flash form (tidak terjadi: redirect throw sebelum render); redirect ke route terlarang role (lapis `requireAuth` menendang); session tanpa role menggantung (signOut di form + fallback `/` di server); cookieCache 5 mnt (konsisten pola repo).

## 10. Referensi

`docs/research/auth-redirect-loop.md`; context7 `/better-auth/better-auth` v1.6.23; exa (GHSA-F9WG-5F46-CJMW, SecureStartKit, guardlayer.io, tomodahinata); repo: `proxy.ts`, `helpers/guard.ts`, `helpers/role-home.ts`, `sign-in-form.tsx:82`, `app/(auth)/sign-in/page.tsx`, `lib/auth.ts:27-32`.
