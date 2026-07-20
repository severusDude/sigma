# Fase 4: Tampilan Hasil Penilaian (Intern & Supervisor)

## Tujuan

Intern dan Supervisor melihat detail hasil penilaian yang sudah difinalisasi oleh HR.

## Route

- Intern: `/intern/penilaian` atau bagian dari dashboard intern
- Supervisor: `/supervisor/penilaian/[internProfileId]/view`

## Hak Akses

| Role | Akses |
|---|---|
| Intern | Hanya miliknya sendiri, hanya jika status `finalized` |
| Supervisor | Intern bimbingannya, semua status |
| HR/Admin | Semua, semua status (dari halaman Fase 3) |

## Layout

```
┌──────────────────────────────────────────────────────────┐
│  Hasil Penilaian                                           │
│                                                            │
│  Intern: Ahmad Fauzi                                      │
│  NIM: 2024XXXX · BPS Kota Tasikmalaya                    │
│  Supervisor: Budi Santoso                                 │
│  Periode Penilaian: 01 Jan 2026 - 30 Jun 2026            │
│  Status: ✅ Sudah Difinalisasi                            │
│                                                            │
│  ─── Komponen Nilai ───                                  │
│                                                            │
│  Disiplin & Kehadiran   20%    75    ★★★★☆               │
│  Kualitas Kerja         20%    60    ★★★☆☆               │
│  Inisiatif & Proaktif   20%    80    ★★★★☆               │
│  Kerjasama Tim          20%    70    ★★★★☆               │
│  Penguasaan Tugas       20%    55    ★★★☆☆               │
│                                                            │
│  ───────────────────────────────────────                  │
│  Nilai Akhir: 68.0                          C (Cukup)     │
│  ───────────────────────────────────────                  │
│                                                            │
│  Catatan Supervisor:                                       │
│  - Disiplin & Kehadiran: Hadir tepat waktu               │
│  - Kualitas Kerja: Perlu perbaikan dalam ketelitian      │
│  - Inisiatif & Proaktif: Aktif bertanya                  │
│  - Kerjasama Tim: Cukup komunikatif dengan tim           │
│  - Penguasaan Tugas: Perlu lebih banyak praktik          │
│                                                            │
│  Difinalisasi oleh: Lutfi Fajar Salladin                  │
│  Tanggal Finalisasi: 20 Jul 2026                          │
│                                                            │
│  [ ← Kembali ]                                            │
└──────────────────────────────────────────────────────────┘
```

### Representasi Visual

Setiap komponen menampilkan:
- Nama komponen
- Bobot (read-only)
- Score numerik
- Representasi visual: progress bar atau bintang (1-5)
  - 0–20: ★☆☆☆☆
  - 21–40: ★★☆☆☆
  - 41–60: ★★★☆☆
  - 61–80: ★★★★☆
  - 81–100: ★★★★★

## Behavior per Status

| Status | Yang Ditampilkan |
|---|---|
| `draft` | Hanya supervisor bisa lihat (form edit) |
| `submitted` | Supervisor & HR bisa lihat (read-only untuk supervisor, detail+finalisasi untuk HR) |
| `finalized` | Semua role: Intern, Supervisor, HR bisa lihat |

## Server Action

### `getAssessmentForView(assessmentId)`
- Input: `assessmentId`
- Output: assessment + components + intern + supervisor info
- Permission check:
  - Intern: hanya miliknya sendiri, hanya jika `finalized`
  - Supervisor: hanya intern bimbingannya
  - HR/Admin: semua

### `getInternAssessments(internProfileId)`
- Untuk halaman intern: daftar assessment milik intern tersebut
- Output: list assessment dengan status

## Empty State

- Intern belum punya assessment: "Belum ada penilaian. Hubungi supervisor untuk informasi lebih lanjut."
- Supervisor: lihat Fase 1.

## Catatan

- Intern hanya bisa melihat nilai yang sudah difinalisasi.
- Tidak ada fitur banding/respons di fase ini (bisa ditambahkan kemudian).
- Informasi yang ditampilkan bersifat read-only.
