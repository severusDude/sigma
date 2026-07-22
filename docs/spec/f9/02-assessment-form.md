# Fase 2: Form Penilaian Supervisor

## Tujuan

Supervisor mengisi nilai 5 komponen penilaian untuk seorang intern bimbingan.

## Route

`/supervisor/penilaian/[internProfileId]` — form create/update assessment.

Juga diakses dari dialog modal di halaman daftar (Fase 1) jika prefer menggunakan modal.

## Alur

```
[Fase 1] Klik "Nilai" → [Fase 2] Form Penilaian → Submit → Kembali ke [Fase 1]
                                    ↓
                              Simpan Draft (opsional)
```

## Komponen Penilaian (Default)

| No | Komponen | Bobot |
|---|---|---|
| 1 | Disiplin & Kehadiran | 20% |
| 2 | Kualitas Kerja | 20% |
| 3 | Inisiatif & Proaktif | 20% |
| 4 | Kerjasama Tim | 20% |
| 5 | Penguasaan Tugas | 20% |

Bobot bisa berubah jika Admin mengustomisasi (Fase 3+). Supervisor hanya mengisi score.

## Layout Form

```
┌──────────────────────────────────────────────────────┐
│  Penilaian: Ahmad Fauzi                               │
│  NIM: 2024XXXX · BPS Kota Tasikmalaya                │
│  Periode Penilaian: 01 Jan 2026 - 30 Jun 2026        │
│                                                        │
│  ─── Komponen Penilaian ───                           │
│                                                        │
│  Disiplin & Kehadiran                        20%      │
│  ┌──────────────────────────────────────────┐         │
│  │ [═══════════════════════○────────]  75   │         │
│  └──────────────────────────────────────────┘         │
│  Catatan (opsional):                                  │
│  ┌──────────────────────────────────────────┐         │
│  │ Hadir tepat waktu, jarang izin           │         │
│  └──────────────────────────────────────────┘         │
│                                                        │
│  Kualitas Kerja                              20%      │
│  ┌──────────────────────────────────────────┐         │
│  │ [═══════════════○─────────────────]  60   │         │
│  └──────────────────────────────────────────┘         │
│  Catatan (opsional):                                  │
│  ┌──────────────────────────────────────────┐         │
│  │ Perlu perbaikan dalam ketelitian         │         │
│  └──────────────────────────────────────────┘         │
│                                                        │
│  ... (3 komponen sisanya)                              │
│                                                        │
│  ─────────────────────────────────────────────         │
│  Total: 68 / 100                                       │
│                                                        │
│  [ Simpan Draft ]           [ Submit Nilai ]           │
└──────────────────────────────────────────────────────┘
```

### Input Score

- Tipe: `range` slider 0–100 + input number
- Wajib diisi jika submit (boleh kosong jika draft)
- Nilai desimal tidak diperbolehkan (integer 0–100)

### Catatan (Notes)

- Opsional per komponen
- Textarea, maksimal 500 karakter

## Tombol Aksi

### Simpan Draft
- Simpan assessment dengan status `draft`
- Supervisor bisa kembali dan melanjutkan nanti
- Tidak ada validasi ketat (score boleh kosong)
- Toast: "Draft tersimpan"

### Submit Nilai
- Semua komponen wajib diisi score
- Validasi: setiap score 0–100
- Status berubah ke `submitted`
- Setelah submit, supervisor tidak bisa mengubah (read-only) kecuali HR mengembalikan ke draft
- Konfirmasi: "Apakah Anda yakin ingin submit? Nilai tidak bisa diubah setelah disubmit."
- Toast: "Nilai berhasil disubmit"

## Server Actions

### `createOrUpdateAssessment()`
- Input: `internProfileId`, `components: [{name, weight, score, notes}]`
- Jika assessment `draft` sudah ada → update
- Jika belum ada → create baru
- Auto-set `supervisorProfileId` dari session user

### `submitAssessment(assessmentId)`
- Validasi: semua component harus punya score
- Ubah status ke `submitted`

## Edge Cases

| Kasus | Behavior |
|---|---|
| Intern sudah punya assessment `submitted` | Tidak bisa diakses dari daftar (tombol "Lihat" bukan "Nilai") |
| Intern sudah punya assessment `finalized` | Read-only view (Fase 4) |
| Supervisor bukan pemilik assessment | Forbidden (permission check via `supervisorProfileId`) |
| Koneksi terputus saat submit | Retry 1x, kalau gagal kasih opsi "Simpan Draft" dulu |
