# Rencana Implementasi: Hilangkan Warning `pg-connection-string` SSL mode (pertahankan `verify-full`)

> **Untuk agentic worker:** REQUIRED SUB-SKILL: gunakan subagent-driven-development (direkomendasikan) atau executing-plans untuk implementasi task-per-task. Step memakai sintaks checkbox (`- [ ]`).

**Goal:** Setiap query tidak lagi memunculkan `Warning: SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'...`, koneksi tetap terverifikasi penuh (`verify-full`), siap untuk `pg-connection-string v3 / pg v9`, dan `.env.example` + panduan env terdokumentasi per environment.

**Architecture:** Kombinasi env-fix + normalisasi kode tipis. (A) `DATABASE_URL` produksi/staging eksplisit `sslmode=verify-full`; lokal non-SSL tanpa `verify-full`. (B) Satu helper di `lib/prisma.ts` yang menormalisasi `sslmode` usang → `verify-full` (defense-in-depth untuk `.env` lama) + split config dev vs prod. Tanpa dependency baru, tanpa `uselibpqcompat`, tanpa `sslrootcert=system`.

**Tech Stack:** Next.js 16.2.10, React 19.2.4, Prisma 7.8.0 + `@prisma/adapter-pg` 7.9.0, `pg` 8.22.0 + `pg-connection-string` 2.14.0, Node 24, pnpm.

## 1. Ringkasan & tujuan

Warning berasal dari `pg-connection-string` (transitif `pg`), bukan bug query: `.env.example` memakai `sslmode=require` yang hari ini diam-diam berarti `verify-full`, tapi di v3/v9 akan melemah menjadi enkripsi-tanpa-verifikasi. Tujuan: eksplisitkan `verify-full` (perilaku aman yang sudah berjalan di Supabase/Neon), normalisasi di satu titik (`lib/prisma.ts`) agar dev dengan `.env` lama ikut bersih, dan pisahkan konfigurasi lokal non-SSL agar tidak pecah. Output: log bersih di runtime **dan** CLI Prisma, koneksi terverifikasi, docs env updated.

## 2. Acceptance criteria

- [ ] **AC1 — Log bersih runtime.** Given app berjalan (`pnpm dev` / `next start`), When setiap query Prisma dieksekusi, Then tidak ada baris `SECURITY WARNING` terkait `sslmode` di stderr/log (dicek dengan `node --trace-warnings`).
- [ ] **AC2 — Koneksi tetap OK + terverifikasi.** Given `DATABASE_URL` staging/prod (Supabase/Neon), When smoke query `SELECT 1` / `prisma.user.count()` via `lib/prisma.ts`, Then berhasil tanpa `SELF_SIGNED_CERT_IN_CHAIN` / TLS error, dan URL efektif mengandung `sslmode=verify-full` (bukan `require/prefer/verify-ca`, bukan `uselibpqcompat`).
- [ ] **AC3 — CLI bersih.** Given `DATABASE_URL` sudah `verify-full`, When `npx prisma validate` dan `npx prisma migrate status` dijalankan, Then tidak ada warning `sslmode`.
- [ ] **AC4 — Lokal tidak pecah.** Given Postgres lokal tanpa SSL, When dev memakai URL lokal (tanpa `verify-full`), Then koneksi berhasil (via `sslmode=disable` / tanpa sslmode sesuai panduan).
- [ ] **AC5 — Docs.** Given fresh clone, When baca `.env.example` + panduan singkat, Then jelas: prod `verify-full`, lokal `disable`/tanpa-ssl, dan escape hatch self-signed (`sslrootcert=/path/to/ca.crt`).

## 3. Asumsi & di luar scope

**Asumsi (dari jawaban user Fase 0):**
- Prod = Supabase/Neon (sertifikat publik, cocok dengan system CA Node) + lokal non-SSL.
- Target = pertahankan `verify-full` (bukan `uselibpqcompat`).
- Boleh ubah `lib/prisma.ts`, `prisma.config.ts` (bila perlu), `.env.example`, docs. Tidak utak-atik infra/server DB.
- Tanpa dependency baru (perlu konfirmasi bila ternyata dibutuhkan — saat ini tidak dibutuhkan).

**Di luar scope:**
- Rotasi sertifikat / setup CA privat / perubahan setting di dashboard Supabase/Neon.
- Upgrade ke `pg v9` / `pg-connection-string v3` (belum rilis stabil saat rencana ini; hanya future-proof).
- Menambah test runner baru (repo tidak punya vitest/jest — verifikasi via script smoke + CLI, bukan framework test).
- Mengubah secret produksi langsung (hanya instruksi + `.env.example`).

## 4. Temuan repo (ringkas, dengan bukti)

- **Stack terpasang:** `package.json:20-60` — `next 16.2.10`, `react 19.2.4`, `@prisma/client ^7.8.0`, `@prisma/adapter-pg ^7.8.0` (terinstal 7.9.0), `pg ^8.22.0` (terinstal 8.22.0), `prisma ^7.8.0`; `pnpm-lock.yaml:3964,8656` — `pg-connection-string@2.14.0`. Tooling: `eslint` (`eslint.config.mjs:1-18`), `tsc` strict (`tsconfig.json:7`), scripts `lint/build/db:generate` (`package.json:6-19`).
- **Satu-satunya Pool:** `lib/prisma.ts:10-18` — `new Pool({ connectionString, max:5, connectionTimeoutMillis:5000 })` → `new PrismaPg(pool)` → `new PrismaClient({ adapter })` + soft-delete ext (`lib/prisma-soft-delete.ts`). Semua 60+ pemakai via `import { prisma } from "@/lib/prisma"` (mis. `lib/auth.ts:3`, `features/hr/data/*`, `app/api/*`).
- **Dua konsumen env:** runtime (`lib/prisma.ts:10`) dan CLI (`prisma.config.ts:6-14` — `datasource.url = process.env.DATABASE_URL`). Fix hanya di kode tidak membersihkan CLI → env harus diperbaiki.
- **Pemicu:** `.env.example:4` — `DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"`. `grep ssl` hanya mengenai file ini + lockfile — tidak ada penanganan SSL lain di repo.
- **Struktur & konvensi:** alias `@/*` (`tsconfig.json:22-24`); rencana di `docs/superpowers/plans/` (contoh `2026-07-29-rebrand-department-to-team.md`); tidak ada `docs/research/` sebelumnya (dibuat untuk riset ini), tidak ada test runner / `*.test.*` colocation untuk lib.

## 5. Keputusan desain & alternatif yang ditolak

**Desain terpilih: A (env-fix) + B (normalisasi tipis di `lib/prisma.ts`).**
Alasan: A satu-satunya cara membersihkan CLI; B melindungi dev dengan `.env` lama + menangani split lokal-non-SSL vs prod-SSL di satu titik yang dipakai semua fitur; keduanya tanpa dependency baru dan konsisten dengan pola "satu Pool factory" repo. `verify-full` dipilih karena = perilaku yang **sudah** berjalan hari ini (tidak ada perubahan keamanan), cocok dengan public CA Supabase/Neon, dan sesuai saran warning itu sendiri.

**Alternatif yang ditolak:**
- `uselibpqcompat=true&sslmode=require` — menghilangkan warning tapi menurunkan ke enkripsi-tanpa-verifikasi (atau `verify-ca` tanpa hostname bila ada `sslrootcert`); flag JS-only, ditolak `psql` (`invalid URI query parameter`) dan fatal di `pgx` (`FATAL: unsupported startup parameter`). Bertentangan dengan pilihan user.
- `--no-warnings` / suppress — menyembunyikan, bukan memperbaiki; gagal AC future-proof v9.
- `sslrootcert=system` — saran umum untuk `psql` ≥16, tapi **fatal di Node**: `pg-connection-string` melakukan `readFileSync('system')` → `ENOENT` sebelum konek.
- Objek `ssl` terpisah + biarkan URL `require` — ditolak karena gotcha node-postgres: param URL menimpa objek `ssl`; dua sumber kebenaran = bug laten.

## 6. Reuse Decision Table & File Placement Map

### Reuse Decision Table

| Kebutuhan | Keputusan | Aset/Path | Alasan |
|---|---|---|---|
| Pool + Prisma client singleton | **Reuse** | `lib/prisma.ts` | Satu-satunya factory; semua fitur impor dari sini — ubah di sini, semua ikut |
| Soft-delete extension | **Reuse** | `lib/prisma-soft-delete.ts` | Tidak terkait SSL; jangan sentuh |
| Env template | **Extend** | `.env.example` | Ubah `sslmode=require` → `verify-full` + komentar per-env; tidak merusak pemakai lama selain menghilangkan warning |
| Normalisasi `sslmode` | **Create** (fungsi kecil di file existing, bukan file baru) | `lib/prisma.ts` (helper `normalizeSslmode`/`getConnectionString`, tidak diekspor kecuali perlu dites) | Tidak ada padanan; ikuti pola file kecil repo; hindari file/util baru (YAGNI) |
| Panduan env | **Extend** | `.env.example` komentar + (opsional) `README.md` bagian Database 3–5 baris | Repo belum punya panduan SSL; taruh di tempat dev pertama lihat |

### File Placement Map

- Ubah: `lib/prisma.ts` — tambah normalisasi `sslmode` + bangun `Pool` dari string ternormalisasi; satu baris tujuan: satu titik enforce `verify-full` untuk runtime.
- Ubah: `.env.example` — `sslmode=verify-full` + komentar lokal (`disable`/tanpa-ssl) & self-signed escape hatch; tujuan: template benar untuk clone baru + memperbaiki CLI.
- Buat (sudah dibuat di prompt ini): `docs/research/pg-sslmode-warning.md` — bukti riset + sumber primer.
- Buat (file ini): `docs/superpowers/plans/2026-10-07-pg-sslmode-warning.md` — rencana implementasi.
- Tidak diubah: `prisma.config.ts`, `prisma/schema.prisma`, migrasi, `lib/prisma-soft-delete.ts`, fitur/UI mana pun.

## 7. Task berurutan

> Aturan: kecil (2–5 menit), independen, terverifikasi sendiri. DRY/YAGNI/TDD, commit sering. Dilarang placeholder.

### Task 1: Reproduksi warning + kunci versi terpasang

- [ ] **Tujuan satu kalimat:** Buktikan warning berasal dari `sslmode=require` via `pg-connection-string` dan catat versi eksak.
- [ ] **File:** tidak ada (read-only; catat hasil untuk Task 2–4).
- [ ] **Interface:** n/a.
- [ ] **Test dulu & gagal yang diharapkan:** jalankan `node --trace-warnings ./node_modules/.bin/prisma --version 2>&1 | Select-String "SECURITY WARNING"` dengan `DATABASE_URL` berisi `sslmode=require` → diharapkan warning **muncul** + stack menunjuk `pg-connection-string`. (Bila tidak muncul, cek `pnpm-lock.yaml` masih `2.14.0`.)
- [ ] **Langkah minimal:**
  1. `node -p "require('./node_modules/pg/package.json').version"` → catat (ekspektasi `8.22.0`).
  2. `Select-String -Path pnpm-lock.yaml -Pattern "pg-connection-string@"` → catat `2.14.0`.
  3. `Copy-Item .env.example .env.local.check -Force` (jangan commit) lalu set `DATABASE_URL` sementara berisi `sslmode=require`, jalankan perintah trace di atas.
- [ ] **Verifikasi & hasil diharapkan:** `node --trace-warnings ...` menampilkan blok `SECURITY WARNING ... sslmode=verify-full ... uselibpqcompat=true...` + path `pg-connection-string`; versi tercatat di catatan commit.
- [ ] **Titik commit:** tidak commit (investigasi saja; atau commit kosong dilarang — lanjut Task 2).

### Task 2: Tambah normalisasi `sslmode` di `lib/prisma.ts` (TDD: script assert dulu)

- [ ] **Tujuan satu kalimat:** `Pool` selalu dibangun dari connection string dengan `sslmode=verify-full` bila mode usang terdeteksi, tanpa mengubah semantik lain.
- [ ] **File dibuat/diubah:** Ubah `lib/prisma.ts` saja (tambah ±15 baris helper + pakai hasilnya di `new Pool`).
- [ ] **Interface yang disepakati (contoh, bukan kode final):**
  ```ts
  // lib/prisma.ts — hanyahelper murni, tanpa I/O selain process.env
  function normalizePostgresSslmode(raw: string): string; // prefer|require|verify-ca -> verify-full; verify-full/disable/no-verify/tanpa-sslmode tidak diubah; preservasi param lain & encoding
  // perilaku: bila rewrite terjadi, console.warn sekali "[db] sslmode '<x>' dinormalisasi ke 'verify-full' (pg v9 future-proof)" — bukan throw
  ```
  Edge yang ditangani: URL tanpa `sslmode` (lokal) → tidak diubah; `sslmode=disable`/`no-verify` eksplisit → tidak diubah (keputusan sadar pemilik env); `uselibpqcompat` yang sudah ada → tidak ditambah/dihapus oleh helper (docs melarang menambahkannya).
- [ ] **Test ditulis lebih dulu & gagal yang diharapkan:** buat sementara `scripts/check-sslmode.mjs` (hapus setelah hijau, atau pertahankan bila repo setuju — default: hapus) yang assert: `require→verify-full`, `prefer→verify-full`, `verify-ca→verify-full`, `verify-full→tetap`, `disable→tetap`, `tanpa-sslmode→tetap`, param lain (`connect_timeout`, password encoded) preservasi. Harapkan **MERAH** sebelum helper ada (`normalizePostgresSslmode is not defined` / assert gagal).
- [ ] **Langkah minimal:**
  1. Tulis script assert (import helper via `tsx` atau duplikasi logika parsing `URL` + `searchParams` — pilih `URL` standar, tanpa dep baru).
  2. Implement helper di `lib/prisma.ts`: parse dengan `new URL(connectionString)`, cek `searchParams.get("sslmode")`, rewrite hanya 3 nilai usang, `pool = new Pool({ connectionString: normalized, ... })`.
  3. Jangan set objek `ssl` terpisah (hindari gotcha overwrite); jangan baca file sertifikat.
- [ ] **Verifikasi & hasil diharapkan:** `npx tsx scripts/check-sslmode.mjs` → semua assert hijau; `npx tsc --noEmit` → 0 error; `npx eslint lib/prisma.ts` → 0 error/warning.
- [ ] **Titik commit:** `git commit -m "fix(db): normalize legacy sslmode to verify-full in prisma pool"` (hanya `lib/prisma.ts` + script sementara bila dipertahankan; bila script sementara, hapus sebelum commit dan sebut di pesan).

### Task 3: Update `.env.example` + panduan per-environment

- [ ] **Tujuan satu kalimat:** Template env baru benar untuk prod (`verify-full`) dan jelas untuk lokal/self-signed.
- [ ] **File dibuat/diubah:** Ubah `.env.example` (baris 4 + komentar); opsional tambah 3–5 baris "Database SSL" di `README.md` (bila user setuju — default: sertakan karena AC5).
- [ ] **Interface:** n/a (config).
- [ ] **Test dulu & gagal yang diharapkan:** `Select-String -Path .env.example -Pattern "sslmode=require"` → diharapkan **tidak ada** hasil setelah fix (sebelum fix ada 1 di baris 4 — jadikan gate manual).
- [ ] **Langkah minimal:**
  1. Ganti contoh prod menjadi `DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=verify-full"`.
  2. Tambah komentar: lokal tanpa SSL → hilangkan `?sslmode=...` atau pakai `?sslmode=disable`; self-signed/CA privat → `?sslmode=verify-full&sslrootcert=/path/to/ca.crt`; larangan `uselibpqcompat` dan `sslrootcert=system` di Node (dengan alasan 1 baris tiap larangan).
  3. Instruksi: update secret `DATABASE_URL` di Vercel/vault ke `verify-full` (tanpa commit secret).
- [ ] **Verifikasi & hasil diharapkan:** `Select-String sslmode .env.example` hanya mengenai `verify-full` (+ `disable` di komentar); `git diff --stat` hanya menyentuh `.env.example` (+ `README.md` bila dipilih).
- [ ] **Titik commit:** `git commit -m "docs(env): set sslmode=verify-full template and per-env guidance"`.

### Task 4: Verifikasi akhir runtime + CLI + build (gate merge)

- [ ] **Tujuan satu kalimat:** Buktikan AC1–AC4 hijau dengan tooling repo, tanpa test runner baru.
- [ ] **File:** tidak ada (verifikasi saja).
- [ ] **Interface:** n/a.
- [ ] **Test dulu:** n/a (ini task verifikasi; kegagalan di sini = kembali ke Task 2/3, bukan tambah kode).
- [ ] **Langkah minimal:**
  1. Runtime: `$env:DATABASE_URL="<staging verify-full>"; node --trace-warnings -e "import('./lib/prisma.ts')"`? — karena TS, gunakan `npx tsx -e "import { prisma } from './lib/prisma'; await prisma.\$queryRaw\`SELECT 1\`; console.log('ok'); await prisma.\$disconnect()"` dengan `--trace-warnings` → harapkan `ok` tanpa `SECURITY WARNING`.
  2. CLI: `npx prisma validate` dan `npx prisma migrate status` dengan URL `verify-full` → harapkan tanpa warning.
  3. Lokal: ulangi smoke dengan URL lokal non-SSL → harapkan konek (bukti AC4).
  4. Mutu: `npx eslint lib/prisma.ts`, `npx tsc --noEmit`, `pnpm build` (atau `next build`) → harapkan 0 error.
- [ ] **Verifikasi & hasil diharapkan:** empat perintah di atas hijau; output `trace-warnings` tidak mengandung `SECURITY WARNING`; `build` sukses (abaikan warning Next yang tidak terkait bila ada, catat).
- [ ] **Titik commit:** tidak ada kode; bila semua hijau, tandai plan selesai dan minta review untuk merge.

## 8. Rencana verifikasi per acceptance criteria

| AC | Perintah (tooling repo, bukan karangan) | Hasil diharapkan |
|---|---|---|
| AC1 log bersih runtime | `node --trace-warnings` + smoke `tsx` query via `lib/prisma.ts` | `ok`, stderr tanpa `SECURITY WARNING` |
| AC2 konek + terverifikasi | smoke yang sama ke URL staging/prod-replica `verify-full`; cek `new URL(env).searchParams.get("sslmode") === "verify-full"` | sukses tanpa TLS error; param = `verify-full` |
| AC3 CLI bersih | `npx prisma validate`; `npx prisma migrate status` | sukses, tanpa warning |
| AC4 lokal tidak pecah | smoke dengan URL lokal (`disable`/tanpa sslmode) | sukses |
| AC5 docs | baca `.env.example`; `Select-String sslmode .env.example` | hanya `verify-full` (+ `disable` di komentar) + panduan jelas |
| Mutu | `npx eslint lib/prisma.ts`; `npx tsc --noEmit`; `pnpm build` | 0 error; build sukses |

## 9. Risiko & mitigasi

- **Lokal pecah bila dipaksa `verify-full` ke server tanpa SSL** → mitigasi: helper tidak menambah `sslmode` bila tidak ada; panduan lokal `disable`/tanpa-ssl; AC4 mengunci.
- **Pooler/custom-domain tanpa SAN cocok → `verify-full` gagal padahal `require` (lama) "bisa"** (karena dulu pun sebenarnya verify-full, jadi seharusnya sudah gagal — tapi tetap) → mitigasi: smoke ke URL pooler persis sebelum merge; fallback terdokumentasi `sslrootcert` eksplisit, bukan `uselibpqcompat`.
- **Dev dengan `.env` lama masih `require`** → mitigasi: normalisasi kode (Task 2) + warn sekali; CLI tetap warning sampai env diupdate — komunikasikan di PR.
- **Prisma-engine vs adapter nuance** (riset §3) → mitigasi: tidak mengandalkan `sslmode` untuk engine klasik; repo memakai `PrismaPg(pool)` sehingga fix valid; smoke assert koneksi nyata.
- **`sslrootcert=system` / `uselibpqcompat` tergoda dipakai** → mitigasi: larangan eksplisit di `.env.example` + review checklist (tolak kedua pola itu di review).

## 10. Referensi

- Riset: `docs/research/pg-sslmode-warning.md` (sumber primer + trade-off A/B/C).
- `context7`: `/brianc/node-postgres` (versi docs `ssl.mdx`, `upgrading.md` — Pool `ssl` vs `connectionString` overwrite); `/prisma/orm` (pola `PrismaPg(pool)` / `PrismaPg({ connectionString })`).
- Repo: `lib/prisma.ts:10-18`, `prisma.config.ts:6-14`, `.env.example:4`, `package.json:6-19,27-28,48`, `pnpm-lock.yaml:3964,8656`, `lib/prisma-soft-delete.ts`, `tsconfig.json:22-24`, `eslint.config.mjs:1-18`.
- Eksternal primer: `pg-connection-string` README + PR #3473 (`c8fb1e9`) + PR #2709; PostgreSQL `libpq-ssl.html`; `prisma/web#7463`; Layerbase 2026-08-13 & 2026-08-06 (matriks 8 klien).
- Status verifikasi: versi terpasang terverifikasi (`pg 8.22.0`, `pg-connection-string 2.14.0`, `@prisma/adapter-pg 7.9.0`, Node 24); klaim perilaku Supabase/Neon + `verify-full` **perlu smoke test** (tandai belum terverifikasi sampai Task 4); tidak ada API yang dikarang — semua opsi (`sslmode`, `sslnegotiation`, objek `ssl`) dari docs di atas.
