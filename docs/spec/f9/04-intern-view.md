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
│  Budi Pratama                    [🔒 DIFINALISASI-TERKUNCI]│
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │ 🔒 Penilaian ini sudah difinalisasi oleh HR/Admin   │  │
│  │    dan tidak dapat diubah lagi.    [⬇ Download PDF] │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
│         ╭─────────╮                                       │
│        │  88.5    │        PREDIKAT KINERJA               │
│        │ SKOR AKHIR│       Sangat Baik                    │
│         ╰─────────╯                                       │
│                       [TERVALIDASI HR] [DOKUMEN TERSEDIA] │
│                                                            │
│  ── KOMPONEN PENILAIAN (READ-ONLY) ──────── BOBOT & SKOR ─│
│                                                            │
│  Disiplin & Kehadiran                                     │
│  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬░░  92/100     │
│  "Budi sangat disiplin, hampir tidak pernah terlambat     │
│   selama masa magang."                                    │
│                                                            │
│  Kualitas Hasil Kerja                                     │
│  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬░░░░░░  85/100      │
│  "Input data sangat rapi, hanya sedikit kesalahan minor    │
│   pada entri awal."                                        │
│                                                            │
│  ( ... komponen lain mengikuti pola yang sama ... )        │
│                                                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │ ✅ Difinalisasi oleh: HR Admin BPS, 25 Sep 2026      │  │
│  │ ✅ Dokumen Penilaian: Tersedia untuk pengarsipan     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                            │
│  [ ← Kembali ]                                             │
└──────────────────────────────────────────────────────────┘
```

### Elemen Baru vs Desain Sebelumnya

| Elemen | Deskripsi |
|---|---|
| Badge status header | Menampilkan status finalisasi + ikon gembok di sebelah nama intern (mis. "DIFINALISASI · TERKUNCI") |
| Banner terkunci | Kotak peringatan bahwa data sudah final dan tidak bisa diubah, dilengkapi tombol **Download PDF** |
| Gauge skor melingkar | Nilai Akhir ditampilkan sebagai skor lingkaran (circular progress), bukan angka polos |
| Predikat Kinerja | Label kualitatif besar (mis. "Sangat Baik") mendampingi skor akhir, menggantikan huruf grade (C/B/A) pada desain lama |
| Badge validasi | "Tervalidasi HR" dan "Dokumen Tersedia" sebagai indikator status tambahan |
| Progress bar per komponen | Menggantikan representasi bintang (★), skor ditampilkan sebagai pecahan `X/100` di ujung bar |
| Catatan per komponen | Catatan supervisor kini melekat langsung di bawah progress bar masing-masing komponen (italic/quote style), **bukan** daftar "Catatan Supervisor" terpisah di akhir halaman seperti desain sebelumnya |
| Footer info finalisasi | Menggabungkan info "Difinalisasi oleh + tanggal" dan status ketersediaan dokumen dalam satu kotak info di bagian bawah |

### Representasi Visual Komponen

Setiap komponen menampilkan:
- Nama komponen
- Progress bar horizontal (panjang bar proporsional terhadap skor, skala 0–100)
- Skor numerik dalam format `X/100` di ujung kanan bar
- Catatan/komentar supervisor untuk komponen tsb (italic, di bawah bar) — opsional, tampil jika ada catatan
- Bobot komponen tetap disimpan di data model dan ditampilkan pada header kolom ("Bobot & Skor"); tampilkan bobot per baris (mis. superscript/tooltip kecil di samping nama komponen) agar tetap terlihat *read-only* tanpa mengganggu visual bar

> Catatan: representasi bintang (★) pada desain lama **dihapus** dan digantikan progress bar + skor pecahan.

### Predikat Kinerja (asumsi mapping — mohon konfirmasi)

| Rentang Nilai Akhir | Predikat |
|---|---|
| 81 – 100 | Sangat Baik |
| 61 – 80 | Baik |
| 41 – 60 | Cukup |
| 21 – 40 | Kurang |
| 0 – 20 | Sangat Kurang |

## Behavior per Status

| Status | Yang Ditampilkan |
|---|---|
| `draft` | Hanya supervisor bisa lihat (form edit) |
| `submitted` | Supervisor & HR bisa lihat (read-only untuk supervisor, detail+finalisasi untuk HR) |
| `finalized` | Semua role: Intern, Supervisor, HR bisa lihat. Tampilkan banner terkunci + tombol Download PDF (lihat di atas) |

## Server Action

### `getAssessmentForView(assessmentId)`
- Input: `assessmentId`
- Output: assessment + components (termasuk catatan per komponen) + intern + supervisor info + predikat kinerja (dihitung dari Nilai Akhir)
- Permission check:
  - Intern: hanya miliknya sendiri, hanya jika `finalized`
  - Supervisor: hanya intern bimbingannya
  - HR/Admin: semua

### `getInternAssessments(internProfileId)`
- Untuk halaman intern: daftar assessment milik intern tersebut
- Output: list assessment dengan status

### `generateAssessmentPDF(assessmentId)` *(baru)*
- Dipicu oleh tombol "Download PDF" pada banner terkunci
- Hanya aktif jika status `finalized`
- Permission check: sama seperti `getAssessmentForView`
- Output: file PDF berisi ringkasan penilaian (skor akhir, predikat, komponen, catatan, info finalisasi)

## Empty State

- Intern belum punya assessment: "Belum ada penilaian. Hubungi supervisor untuk informasi lebih lanjut."
- Supervisor: lihat Fase 1.

## Catatan

- Intern hanya bisa melihat nilai yang sudah difinalisasi.
- Tidak ada fitur banding/respons di fase ini (bisa ditambahkan kemudian).
- Informasi yang ditampilkan bersifat read-only.
- Fitur Download PDF adalah penambahan baru dari desain ini; perlu didefinisikan lebih lanjut format/template PDF-nya pada iterasi berikutnya.
