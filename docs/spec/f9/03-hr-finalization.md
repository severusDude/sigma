# Fase 3: Finalisasi & Evaluasi oleh HR/Admin

## Tujuan

HR/Admin melihat daftar assessment yang sudah disubmit supervisor, melakukan review, dan finalisasi nilai.

## Route

`/hr/penilaian` — protected untuk Role `admin` dan `hr`.

## Halaman Daftar Assessment

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Penilaian & Evaluasi                    [Cari...]       │
│                                                            │
│  [Semua] [Menunggu] [Sudah Difinalisasi]                  │
│                                                            │
│  Supervisor: [Semua Supervisor ▼]                          │
│  Periode: [Semua ▼]                                       │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Intern     │ Supervisor    │ Status      │ Aksi      │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ Ahmad F.   │ Budi Santoso  │ Submitted   │ [Detail]  │ │
│  │ Siti N.    │ Budi Santoso  │ Submitted   │ [Detail]  │ │
│  │ Rudi H.    │ Ani Rahmawati │ Finalized   │ [Lihat]   │ │
│  └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### Fitur

| Fitur | Keterangan |
|---|---|
| Filter status | Semua / Menunggu (submitted) / Sudah Difinalisasi (finalized) |
| Filter supervisor | Dropdown semua supervisor |
| Pencarian | Berdasarkan nama intern atau supervisor |
| Tombol aksi | "Detail" untuk submitted (bisa finalisasi), "Lihat" untuk finalized |

## Halaman Detail & Finalisasi

### Route

`/hr/penilaian/[assessmentId]`

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  Detail Penilaian                                         │
│                                                            │
│  Intern: Ahmad Fauzi                                      │
│  NIM: 2024XXXX · BPS Kota Tasikmalaya                    │
│  Supervisor: Budi Santoso                                 │
│  Periode: 01 Jan 2026 - 30 Jun 2026                      │
│  Status: ✅ Menunggu Finalisasi                           │
│                                                            │
│  ─── Komponen Nilai ───                                  │
│                                                            │
│  Disiplin & Kehadiran   20%    75   15.0                  │
│  Kualitas Kerja         20%    60   12.0                  │
│  Inisiatif & Proaktif   20%    80   16.0                  │
│  Kerjasama Tim          20%    70   14.0                  │
│  Penguasaan Tugas       20%    55   11.0                  │
│  ───────────────────────────────────────                  │
│  Total                          68.0 / 100                │
│                                                            │
│  Catatan Supervisor:                                       │
│  - Disiplin & Kehadiran: Hadir tepat waktu               │
│  - Kualitas Kerja: Perlu perbaikan ketelitian            │
│                                                            │
│  [ Finalisasi Nilai ]         [ ← Kembali ]               │
└──────────────────────────────────────────────────────────┘
```

### Kalkulasi Nilai Akhir

```
finalScore = Σ(score × weight/100)
```

Dengan bobot default masing-masing 20%, rumusnya:
```
finalScore = (d1×0.2) + (d2×0.2) + (d3×0.2) + (d4×0.2) + (d5×0.2)
```

### Penentuan Grade

| Rentang Nilai | Grade |
|---|---|
| 85 – 100 | A (Sangat Baik) |
| 70 – 84 | B (Baik) |
| 55 – 69 | C (Cukup) |
| 40 – 54 | D (Kurang) |
| 0 – 39 | E (Sangat Kurang) |

## Alur Finalisasi

1. HR membuka detail assessment
2. HR review nilai + catatan dari supervisor
3. HR klik "Finalisasi Nilai"
4. Muncul konfirmasi: "Setelah difinalisasi, nilai tidak bisa diubah. Lanjutkan?"
5. Sistem kalkulasi `finalScore` dan `finalGrade`
6. Status → `finalized`, `finalizedAt` diisi timestamp, `finalizedBy` diisi userId HR
7. Toast: "Nilai berhasil difinalisasi"
8. Redirect ke daftar

## Server Actions

### `getAssessmentsForHR()`
- Input: filter (status, supervisorId, search)
- Output: paginated list of assessments with intern + supervisor info
- Permission: `assessment: ["read"]`

### `getAssessmentDetail(assessmentId)`
- Output: assessment + components + intern + supervisor
- Permission: `assessment: ["read"]`

### `finalizeAssessment(assessmentId)`
- Validasi: status harus `submitted`
- Kalkulasi `finalScore` dan `finalGrade`
- Set `finalizedAt`, `finalizedBy`
- Ubah status ke `finalized`
- Permission: `assessment: ["finalize"]`
- Hanya HR/Admin yang punya akses (Supervisor tidak punya permission `finalize`)

## Edge Cases

| Kasus | Behavior |
|---|---|
| Assessment sudah `finalized` | Tombol finalisasi disabled |
| Supervisor belum submit | Tidak muncul di tab "Menunggu" |
| Bobot total ≠ 100 | Tampilkan warning "Total bobot: X% (ideal: 100%)" |
| Finalisasi ganda (double click) | Idempotent — cek status sebelum eksekusi |

## Catatan

- Finalisasi bersifat final. Tidak ada mekanisme pembatalan finalisasi di fase ini.
- Jika ada kebutuhan revisi, bisa ditambahkan di fase selanjutnya sebagai fitur terpisah.
