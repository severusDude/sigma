# Fase 1: Daftar Intern untuk Penilaian

## Tujuan

Supervisor dapat melihat seluruh intern bimbingannya dalam bentuk **card** lengkap dengan progress logbook, progress penilaian, status assessment, serta aksi untuk melakukan atau melihat hasil penilaian.

---

## Route

`/supervisor/penilaian`

**Protected Role**

- `supervisor`
- `admin`

---

## Data Model (Referensi)

Intern diambil dari relasi **InternSupervisor** yang masih aktif (`endedAt = null`).

---

# Halaman

## Layout

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ Penilaian & Evaluasi Intern                                                               │
│ Periode : Juli - September 2026         Deadline : 25 September 2026                      │
│                                                    [Status ▼] [Export Rekap]              │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ ⚠ Mendekati batas akhir penilaian. Mohon segera menyelesaikan seluruh penilaian.         │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                           │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐                              │
│ │ Foto            │ │ Foto            │ │ Foto            │                              │
│ │ Ahmad Fauzi     │ │ Siti Nurul      │ │ Rudi Hermawan   │                              │
│ │ UI/UX Designer  │ │ Frontend Dev    │ │ Backend Dev     │                              │
│ │                 │ │                 │ │                 │                              │
│ │                 │ │                 │ │                 │                              │
│ │ [Isi Penilaian] │ │ [Lihat/Edit]    │ │ [Lihat Hasil]   │                              │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘                              │
│                                                                                           │
│                                                    < 1 2 3 >                             │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

# Komponen Halaman

## 1. Header

Menampilkan informasi mengenai periode penilaian yang sedang berlangsung.

### Informasi

- Judul halaman
- Periode penilaian aktif
- Deadline penilaian

Contoh

```text
Penilaian & Evaluasi Intern

Periode
Juli - September 2026

Deadline
25 September 2026
```

---

## 2. Action Bar

Terletak pada sisi kanan header.

### Komponen

| Komponen | Keterangan |
|----------|------------|
| Status Filter | Dropdown untuk memfilter status assessment |
| Export Rekap | Mengunduh rekap hasil penilaian |

---

## 3. Banner Informasi

Banner digunakan sebagai pengingat apabila deadline penilaian sudah mendekat.

Contoh

```text
⚠ Mendekati Batas Akhir Penilaian

Mohon segera menyelesaikan seluruh penilaian sebelum tanggal
25 September 2026.
```

Banner hanya muncul ketika deadline telah memasuki batas tertentu (misalnya ≤ 7 hari).

---

## 4. Daftar Intern

Intern ditampilkan dalam bentuk **responsive card grid**.

### Responsive Layout

| Breakpoint | Jumlah Card |
|------------|-------------|
| Desktop | 3 kolom |
| Tablet | 2 kolom |
| Mobile | 1 kolom |

---

# Struktur Card

Setiap card terdiri dari beberapa bagian berikut.

## Informasi Intern

- Foto Profil
- Nama Intern
- Posisi / Bidang Magang
- Unit Kerja (opsional)

## Tombol Aksi

| Status Assessment | Tombol |
|-------------------|---------|
| Belum ada Assessment | **Isi Penilaian** |
| Draft | **Lihat/Edit Penilaian** |
| Submitted | **Lihat Hasil** |
| Finalized | **Lihat Hasil** |

---

## Pagination

Pagination berada di bagian bawah halaman.

Komponen:

- Previous
- Nomor halaman
- Next

---

# Filter

Dropdown status terdiri dari:

- Semua
- Belum Dinilai
- Draft
- Submitted
- Finalized

---

# Pencarian

Supervisor dapat mencari intern berdasarkan:

- Nama
- NIM

Pencarian menggunakan debounce sekitar **300ms**.

---

# Fitur

| Fitur | Keterangan |
|--------|------------|
| Card Grid | Menampilkan daftar intern dalam bentuk kartu |
| Avatar Intern | Menampilkan foto profil intern |
| Progress Logbook | Persentase penyelesaian logbook |
| Progress Penilaian | Persentase item assessment yang telah diisi |
| Filter Status | Filter berdasarkan status assessment |
| Search | Berdasarkan nama atau NIM |
| Banner Deadline | Pengingat menjelang batas akhir penilaian |
| Export Rekap | Mengunduh rekap hasil assessment |
| Pagination | Navigasi halaman |

---

# Status Penilaian

| Status | Kondisi |
|---------|----------|
| Belum Dinilai | Belum memiliki assessment |
| Draft | Assessment masih draft |
| Submitted | Assessment telah dikirim dan menunggu finalisasi HR |
| Finalized | Assessment telah difinalisasi HR |

---

# Server Action

## `getSupervisorAssessmentList()`

### Input

```ts
type Input = {
  supervisorProfileId: string;
  page?: number;
  search?: string;
  status?: AssessmentStatus | "unassessed";
};
```

### Output

```ts
type AssessmentListItem = {
  internProfileId: string;

  internName: string;

  photoUrl: string | null;

  nim: string;

  institution: string;

  divisionName: string | null;

  logbookProgress: number;

  assessmentProgress: number;

  assessmentId: string | null;

  assessmentStatus: AssessmentStatus | null;
};
```

### Query

```text
InternSupervisor (Current Assignment)
        │
        ▼
InternProfile
        │
        ▼
User
        │
        ├──────────────► Assessment (Latest)
        │
        └──────────────► Logbook Summary
```

---

# Behavior

- Supervisor hanya dapat melihat intern yang masih memiliki penugasan aktif (`endedAt = null`).
- Progress logbook dihitung berdasarkan jumlah logbook yang telah disetujui dibandingkan total logbook pada periode berjalan.
- Progress penilaian dihitung berdasarkan jumlah indikator yang telah diisi dibandingkan total indikator penilaian.
- Apabila belum terdapat assessment, tombol aksi menampilkan **Isi Penilaian**.
- Apabila assessment berstatus **Draft**, supervisor dapat melanjutkan melalui tombol **Lihat/Edit Penilaian**.
- Assessment dengan status **Submitted** maupun **Finalized** hanya dapat dilihat melalui halaman detail hasil penilaian.
- Banner pengingat deadline hanya muncul ketika batas waktu penilaian telah mendekat.
- Jika supervisor belum memiliki intern bimbingan aktif, tampilkan empty state **"Belum ada intern bimbingan aktif."**

---

# Navigasi

| Aksi | Tujuan |
|------|---------|
| Isi Penilaian | `/supervisor/penilaian/[internProfileId]` |
| Lihat/Edit Penilaian | `/supervisor/penilaian/[internProfileId]` |
| Lihat Hasil (Submitted) | `/supervisor/penilaian/[internProfileId]/view` |
| Lihat Hasil (Finalized) | `/supervisor/penilaian/[internProfileId]/view` |
