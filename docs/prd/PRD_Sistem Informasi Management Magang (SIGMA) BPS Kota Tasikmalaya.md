# SIGMA (Sistem Informasi Management Magang) — Product Requirements Document

**Version**: 2.1
**Status**: Draft
**Author**: PRD Architect Agent
**Last Updated**: 2026-07-15
**Stakeholders**: PM, Engineering, Admin (IT Support), HR, Supervisor, Intern, Pimpinan BPS Kota Tasikmalaya

---

## 1. Executive Summary

**Problem Statement**:
Program magang di Badan Pusat Statistik (BPS) Kota Tasikmalaya masih dikelola secara manual dan tidak terstruktur. Peserta magang tidak mendapatkan informasi yang jelas sebelum dan selama menjalani magang — tidak mengetahui secara pasti apa yang harus dikerjakan, siapa supervisor yang akan mendampingi, di bagian/divisi mana mereka ditempatkan, serta aturan dan tata tertib yang berlaku. Administrasi magang seperti pencatatan kehadiran, logbook harian, penilaian, serta penerbitan sertifikat dokumen kelengkapan magang masih dilakukan secara terpisah melalui dokumen fisik atau file yang tersebar, menyulitkan HR dan Admin untuk memonitor secara menyeluruh.

**Proposed Solution**:
SIGMA (Sistem Informasi Management Magang) — platform berbasis web yang menyediakan informasi lengkap dan transparan bagi peserta magang (Intern) sejak hari pertama, pengelolaan logbook harian, presensi digital, penilaian terstruktur, serta generate dokumen kelengkapan magang (sertifikat, penilaian, absensi, surat tugas) secara otomatis. Sistem ini menghubungkan seluruh stakeholder: Admin, HR, Supervisor, dan Intern dalam satu ekosistem terpadu.

**Expected Impact**:
- 100% Intern mendapat informasi lengkap (supervisor, penempatan, tugas, aturan) di hari pertama
- 90% pengisian logbook dan presensi tepat waktu
- Zero paper untuk dokumen kelengkapan magang (sertifikat, penilaian, absensi)
- Real-time monitoring progres magang untuk Admin, HR, dan Supervisor

---

## 2. Background & Context

### 2.1 Problem Deep-Dive

BPS Kota Tasikmalaya secara rutin menerima peserta magang (Intern) dari berbagai latar belakang — baik melalui program Pemagangan Lulusan Perguruan Tinggi (kerjasama BPS Pusat dengan Kemenaker) maupun magang mandiri dari mahasiswa aktif. Berdasarkan pengamatan, ditemukan masalah-masalah berikut:

| # | Problem | Dampak |
|---|---------|--------|
| 1 | Intern tidak mendapat informasi jelas tentang tugas dan target magang | Kebingungan, produktivitas rendah di awal periode |
| 2 | Intern tidak tahu siapa Supervisor yang ditugaskan | Tidak ada arah, bimbingan tidak berjalan |
| 3 | Informasi penempatan (divisi/lokasi) tidak terdokumentasi | Intern datang tanpa tahu harus ke bagian mana |
| 4 | Logbook harian dikumpulkan secara manual (buku fisik/file terpisah) | Sulit dimonitoring, tidak real-time, rawan hilang |
| 5 | Presensi/absensi dicatat manual | Data kehadiran tidak akurat, sulit direkap |
| 6 | Penilaian Intern tidak terstandarisasi | Inkonsistensi kualitas evaluasi antar Supervisor |
| 7 | Penerbitan sertifikat dan dokumen kelengkapan dilakukan manual | Lama, rawan kesalahan, beban HR tinggi |
| 8 | Tidak ada dashboard monitoring untuk Admin dan HR | Tidak bisa melihat status magang secara agregat |

### 2.2 Why Now?

1. **Transformasi Digital SPBE**: Instansi pemerintah didorong implementasi Sistem Pemerintahan Berbasis Elektronik (SPBE) — digitalisasi manajemen magang selaras dengan arahan ini
2. **Peningkatan volume peserta**: Program magang BPS Nasional semakin besar — BPS Tasikmalaya perlu sistem yang scalable
3. **Tuntutan transparansi**: Intern berhak mendapat informasi yang jelas — sistem ini menyediakan kepastian informasi sejak hari pertama
4. **Efisiensi SDM**: HR tidak perlu lagi mengelola dokumen fisik dan rekap manual
5. **Ketersediaan teknologi**: Web-based platform sudah mature dan biaya implementasi terjangkau

### 2.3 Competitive Landscape

| System | Scope | Kelebihan | Kekurangan |
|--------|-------|-----------|------------|
| **Manual (Dokumen Fisik + Spreadsheet)** | Ad-hoc | Fleksibel, tanpa biaya sistem | Tidak terstruktur, rawan error, zero reporting, tidak transparan |
| **MagangHub (Kemnaker)** | Nasional — seluruh program pemagangan | Terintegrasi resmi pemerintah | Tidak bisa dikustomisasi untuk kebutuhan internal BPS; untuk pendaftaran saja, bukan manajemen harian |
| **Portal BPS Pusat (SI Magang)** | Internal BPS | Terintegrasi data BPS | Terbatas fungsionalitasnya; belum tersedia di semua BPS daerah; tidak mencakup logbook & penilaian |
| **Sistem Informasi Magang Kampus** | Institusi pendidikan | Fitur akademik lengkap | Tidak sesuai konteks instansi pemerintah; terlalu fokus pada konversi SKS dan SIAKAD |

> **Positioning Gap**: Belum ada sistem yang dirancang khusus untuk kebutuhan manajemen magang di **instansi pemerintah setingkat BPS Kota/Kabupaten** — yang menggabungkan **transparansi informasi Intern**, **logbook digital**, **presensi**, **penilaian**, dan **generate dokumen otomatis** dalam satu platform yang sederhana dan sesuai budaya kerja instansi pemerintah.

---

## 3. Goals & Success Metrics

### 3.1 Business Goals

- [ ] **BG-1**: Digitalisasi 100% administrasi magang — dari penempatan hingga penerbitan dokumen kelengkapan
- [ ] **BG-2**: Menyediakan informasi lengkap dan transparan kepada 100% Intern di hari pertama
- [ ] **BG-3**: Mengurangi beban kerja HR terkait pengelolaan dokumen magang sebesar 80%
- [ ] **BG-4**: Menyediakan dashboard monitoring real-time untuk Admin, HR, dan Supervisor
- [ ] **BG-5**: Mencapai 100% Intern terdaftar di sistem dalam 1 bulan sejak implementasi

### 3.2 User Goals

- [ ] **UG-1**: Intern dapat melihat informasi lengkap (supervisor, penempatan, tugas, aturan) sejak hari pertama
- [ ] **UG-2**: Intern dapat mengisi logbook dan presensi secara digital
- [ ] **UG-3**: Supervisor dapat memonitoring dan membimbing Intern secara real-time
- [ ] **UG-4**: HR dapat mengelola siklus magang dan generate dokumen secara otomatis
- [ ] **UG-5**: Admin dapat mengelola sistem, user, dan melihat semua data secara menyeluruh

### 3.3 Non-Goals (Out of Scope)

- Pendaftaran & seleksi Intern tingkat nasional — ditangani oleh MagangHub Kemnaker / rekrutmen mandiri di luar sistem
- Manajemen rekrutmen ASN/CPNS
- Pembayaran/kompensasi finansial (uang saku) — ditangani di luar sistem
- Modul pembelajaran online/LMS
- Integrasi dengan SIAKAD kampus — Intern dari berbagai institusi, tidak terbatas satu kampus

### 3.4 Success Metrics (KPI)

| Metric | Baseline | Target | Timeframe |
|--------|----------|--------|-----------|
| Waktu penyampaian informasi Intern (supervisor, penempatan, tugas) | Tidak terukur (manual) | < 1 jam setelah terdaftar | Month 1 |
| Logbook submission rate per minggu | ~30% (manual) | > 85% | Month 2 |
| Presensi tercatat digital | 0% | > 95% | Month 2 |
| Waktu penerbitan sertifikat per Intern | ~7 hari manual | < 1 hari | Month 3 |
| Waktu HR per siklus magang | ~3 hari kerja | < 0.5 hari | Month 2 |
| Jumlah Intern terdaftar di sistem | 0 | 100% | Month 1 |
| Admin & HR menggunakan dashboard | 0 | Minimal 1x/minggu | Month 2 |
| System uptime | N/A | >= 99.5% | Ongoing |

---

## 4. User Personas & Journey

### 4.1 Primary Persona: Intern

| Atribut | Detail |
|---------|--------|
| **Nama** | Rizky, 22 tahun |
| **Deskripsi** | Lulusan baru D3/S1 atau mahasiswa aktif yang mengikuti program magang di BPS Kota Tasikmalaya |
| **Tech Literacy** | High — daily user of smartphone, WA, Google apps |
| **Goals** | Mendapat informasi jelas tentang magang (tugas, supervisor, tempat); mencatat kegiatan harian dengan mudah; mendapatkan sertifikat dan dokumen kelengkapan tepat waktu |
| **Pain Points** | Tidak tahu harus lapor ke siapa hari pertama; bingung tugas yang harus dikerjakan; logbook manual bikin malas; tidak ada kepastian kapan sertifikat terbit |
| **Context of Use** | Akses via smartphone (utama) dan laptop; butuh notifikasi pengingat; interface sederhana |

### 4.2 Persona: Supervisor

| Atribut | Detail |
|---------|--------|
| **Nama** | Pak Dedi, 40 tahun |
| **Deskripsi** | Pegawai BPS di bidang statistik/distribusi yang ditugaskan membimbing 1-3 Intern |
| **Tech Literacy** | Medium — pakai email, aplikasi perkantoran |
| **Goals** | Bisa memberikan arahan tugas, memonitoring logbook, dan menilai Intern dengan mudah; melihat dashboard terbatas untuk Intern bimbingannya saja |
| **Pain Points** | Tidak ada waktu untuk bimbingan manual; repot merekaplogbook fisik; tidak ada format penilaian baku |
| **Context of Use** | Akses via laptop kantor; butuh dashboard ringkas per Intern bimbingan |

### 4.3 Persona: HR

| Atribut | Detail |
|---------|--------|
| **Nama** | Mbak Fitri, 30 tahun |
| **Deskripsi** | Staff kepegawaian/TU BPS yang mengelola administrasi Intern dan koordinasi dengan Supervisor |
| **Tech Literacy** | Medium — mahir Excel, aplikasi perkantoran |
| **Goals** | Mendaftarkan Intern, meng-assign Supervisor, memonitoring progres, sampai penerbitan sertifikat selesai efisien; data rapi dan traceable; dapat melihat dashboard monitoring operasional |
| **Pain Points** | Mengelola Intern dan Supervisor dengan spreadsheet dan dokumen fisik; rekap presensi manual; mengetik satu per satu sertifikat; tidak punya visibilitas real-time |
| **Context of Use** | Laptop kantor; butuh fitur manage Intern & Supervisor, generate dokumen batch, export data, dan status tracking |

### 4.4 Persona: Admin

| Atribut | Detail |
|---------|--------|
| **Nama** | Mas Adi, 28 tahun |
| **Deskripsi** | IT Support / pengembang sistem yang bertanggung jawab atas infrastruktur teknis dan konfigurasi sistem SIGMA |
| **Tech Literacy** | High — memahami database, server, dan konfigurasi teknis |
| **Goals** | Memastikan sistem berjalan stabil; mengelola akun dan hak akses seluruh pengguna (Admin, HR, Supervisor, Intern); melakukan konfigurasi sistem; melihat audit log dan semua data untuk troubleshooting |
| **Pain Points** | Tidak ada super admin yang bisa melihat semua data dan konfigurasi sistem secara terpusat; harus login dengan akun HR untuk debugging |
| **Context of Use** | Laptop/terminal; akses penuh ke semua fitur dan data; butuh audit trail dan system configuration panel |

### 4.5 Perbandingan Role & Akses

| Kemampuan | Admin | HR | Supervisor | Intern |
|-----------|-------|----|------------|--------|
| Kelola sistem & konfigurasi | ✅ Full | ❌ | ❌ | ❌ |
| Kelola semua user & role | ✅ Full | ❌ | ❌ | ❌ |
| Audit log & troubleshooting | ✅ Full | ❌ | ❌ | ❌ |
| Kelola data Intern (CRUD) | ✅ Full | ✅ Full | ❌ | ❌ |
| Kelola data Supervisor (CRUD) | ✅ Full | ✅ Full | ❌ | ❌ |
| Assignment Supervisor → Intern | ✅ Full | ✅ Full | ❌ | ❌ |
| Dashboard monitoring (semua data) | ✅ Full | ✅ Full | ⚠️ Terbatas | ❌ |
| Generate dokumen otomatis | ✅ Full | ✅ Full | ❌ | ❌ |
| Pelaporan & export | ✅ Full | ✅ Full | ❌ | ❌ |
| Review logbook Intern | ✅ Full | ❌ | ✅ Terbatas | ❌ |
| Penilaian Intern | ✅ Full | ❌ | ✅ Terbatas | ❌ |
| Bimbingan Intern | ❌ | ❌ | ✅ Terbatas | ❌ |
| Isi logbook | ❌ | ❌ | ❌ | ✅ |
| Presensi check-in/out | ❌ | ❌ | ❌ | ✅ |
| Lihat informasi magang | ❌ | ❌ | ❌ | ✅ |
| Download dokumen | ❌ | ❌ | ❌ | ✅ |

### 4.6 User Journey — End-to-End Flow

```
Intern                         HR                          Supervisor                     Admin
  |                             |                             |                             |
  |---[1. Mendaftar]----------->|                             |                             |
  |                             |---[2. Verifikasi]---------->|                             |
  |<--[3. Info Lengkap]--------|  (Supervisor, Divisi,       |                             |
  |    (Dashboard Personal)     |   Tugas, Aturan)            |                             |
  |                             |                             |                             |
  |---[4. Isi Logbook]---------|                             |                             |
  |---[5. Presensi Check-in]---|                             |                             |
  |                             |                             |---[6. Monitoring]---------->|
  |                             |                             |---[7. Bimbingan]----------->|
  |                             |                             |                             |
  |                             |                             |---[8. Penilaian]----------->|
  |                             |                             |                             |
  |                             |---[9. Generate Dokumen]---->|                             |
  |                             |   (Sertifikat, Absensi,     |                             |
  |<--[10. Dokumen Siap]-------|    Penilaian, Surat Tugas)  |                             |
  |                             |                             |              [11. Dashboard Overview (full data)]--|
  |                             |                             |                             |
  |                             | [12. Dashboard HR]          |                             |
  |                             | (Monitoring operasional)    |                             |
  |                             |                             |  [13. Admin: Konfigurasi Sistem, Kelola User, Audit Log]--|
```

---

## 5. Features & Requirements

### 5.1 Feature Overview

| ID | Feature | Priority | Complexity | Sprint Target |
|----|---------|----------|------------|---------------|
| F1 | Sistem Autentikasi & Manajemen Role | P0 | Low | Sprint 1 |
| F2 | Manajemen Data Intern | P0 | Medium | Sprint 1 |
| F3 | Informasi & Panduan Magang | P0 | Low | Sprint 1 |
| F4 | Penempatan & Surat Tugas Digital | P0 | Medium | Sprint 1 |
| F5 | Manajemen Supervisor | P0 | Medium | Sprint 2 |
| F6 | Logbook & Jurnal Harian | P0 | High | Sprint 2 |
| F7 | Bimbingan & Konsultasi | P0 | Medium | Sprint 2 |
| F8 | Presensi / Absensi Digital | P0 | High | Sprint 2 |
| F9 | Penilaian & Evaluasi | P0 | High | Sprint 3 |
| F10 | Generate Dokumen Otomatis | P0 | High | Sprint 3 |
| F11 | Dashboard & Monitoring | P1 | High | Sprint 3 |
| F12 | Notifikasi & Pengingat | P1 | Low | Sprint 4 |
| F13 | Pelaporan & Export (PDF/Excel) | P1 | Medium | Sprint 4 |
| F14 | Tanda Tangan Digital & Verifikasi Dokumen | P1 | High | Sprint 4 |
| F15 | Manajemen Sistem & Konfigurasi (Admin Only) | P1 | Medium | Sprint 4 |

**Priority Legend**: P0 = Must Have (MVP), P1 = Should Have, P2 = Nice to Have

---

### 5.2 Detailed Requirements

#### F1: Sistem Autentikasi & Manajemen Role

**User Story**:
> Sebagai Admin, saya ingin mengelola akun dan role pengguna, sehingga setiap stakeholder memiliki akses yang sesuai dengan tanggung jawabnya.

**Acceptance Criteria**:
- [ ] Given pengguna belum login, When mengakses halaman mana pun, Then diarahkan ke halaman login
- [ ] Given Admin membuat akun baru, When mengisi form registrasi dengan data valid, Then akun tersimpan dengan role yang ditentukan (Admin, HR, Supervisor, Intern)
- [ ] Given sistem memiliki 4 role (Admin, HR, Supervisor, Intern), When pengguna login, Then hanya melihat menu sesuai role-nya
- [ ] Given HR membuat akun Intern atau Supervisor baru, When mengisi form dengan data valid, Then akun tersimpan — namun HR tidak bisa membuat akun Admin
- [ ] Given Admin ingin mengubah role user, When mengubah di halaman manajemen user, Then perubahan berlaku tanpa perlu re-login
- [ ] Given password pengguna di-reset, When Admin/HR melakukan reset password, Then pengguna menerima link reset via email
- [ ] Given sesi tidak aktif > 30 menit, When pengguna kembali berinteraksi, Then sistem meminta login ulang

**Edge Cases**:
- Email sudah terdaftar — tampilkan error "Email sudah digunakan"
- Intern dapat didaftarkan dengan NIK/NIM untuk akun
- Supervisor bisa membimbing lebih dari 1 Intern
- Admin tidak bisa dihapus — minimal harus ada 1 Admin aktif

**Dependencies**: Better-Auth (existing), NextAuth.js

---

#### F2: Manajemen Data Intern

**User Story**:
> Sebagai HR, saya ingin mendaftarkan dan mengelola data Intern, sehingga data peserta terpusat dan mudah diakses. Admin juga dapat mengelola data Intern jika diperlukan.

**Acceptance Criteria**:
- [ ] Given HR/Admin membuka halaman Intern, When melihat daftar, Then menampilkan: nama, asal institusi, bidang penempatan, supervisor, status, periode magang
- [ ] Given HR mendaftarkan Intern baru, When mengisi form (nama, NIK, asal institusi, no. HP, email, bidang minat, periode magang), Then data tersimpan
- [ ] Given HR melakukan registrasi batch, When mengupload file Excel berisi data Intern, Then sistem memvalidasi dan mengimport data valid
- [ ] Given HR/Admin mencari Intern, When mencari berdasarkan nama/NIK/institusi, Then hasil muncul dalam < 2 detik
- [ ] Given Intern login pertama kali, When mengakses dashboard, Then melihat informasi personal dan status magang

**Edge Cases**:
- NIK duplikat — sistem harus menolak dan memberi tahu
- Upload file > 5MB — ditolak dengan pesan
- Data Intern dari batch berbeda (angkatan) — dikelompokkan per periode

**Dependencies**: F1

---

#### F3: Informasi & Panduan Magang

**User Story**:
> Sebagai Intern, saya ingin melihat informasi lengkap tentang magang saya, sehingga saya tahu apa yang harus dilakukan dari hari pertama.

**Acceptance Criteria**:
- [ ] Given Intern login dan membuka dashboard, When halaman dimuat, Then menampilkan informasi: (1) Nama dan kontak Supervisor, (2) Bidang/divisi penempatan, (3) Lokasi/ruangan kerja, (4) Jadwal dan jam kerja, (5) Aturan dan tata tertib magang
- [ ] Given HR/Admin memperbarui panduan magang, When mengubah konten di halaman manajemen panduan, Then perubahan langsung terlihat oleh semua Intern
- [ ] Given Intern melihat panduan, When membuka halaman panduan, Then menampilkan dokumen panduan magang BPS yang dapat didownload
- [ ] Given ada pengumuman baru, When HR/Admin mempublikasikan, Then notifikasi muncul di dashboard Intern
- [ ] Given Intern ingin melihat status tugas/milestone, When membuka halaman progres, Then melihat daftar tugas, deadline, dan status penyelesaian

**Edge Cases**:
- Panduan dalam format PDF — dapat diupload dan ditampilkan embedded
- Informasi kontak Supervisor bisa berubah — HR dapat update kapan saja
- Intern dapat menghubungi Supervisor langsung dari sistem (link WA/email)

**Dependencies**: F2

---

#### F4: Penempatan & Surat Tugas Digital

**User Story**:
> Sebagai HR, saya ingin menempatkan Intern ke bidang tertentu dan menerbitkan surat tugas digital, sehingga penempatan terdokumentasi dengan jelas.

**Acceptance Criteria**:
- [ ] Given HR menentukan penempatan, When memilih Intern dan bidang/bidang tujuan, Then data penempatan tersimpan dan tercatat
- [ ] Given penempatan sudah ditentukan, When HR menekan "Generate Surat Tugas", Then sistem menghasilkan dokumen surat tugas digital dengan: nama Intern, bidang, supervisor, periode, lokasi
- [ ] Given Intern membuka halaman surat tugas, When surat tugas sudah terbit, Then Intern dapat melihat dan mendownload surat tugas dalam format PDF
- [ ] Given HR/Admin ingin mengubah penempatan, When mengupdate data penempatan, Then perubahan tercatat dengan riwayat
- [ ] Given Admin/HR melihat laporan penempatan, When membuka dashboard, Then melihat distribusi Intern per bidang

**Edge Cases**:
- Perubahan penempatan di tengah periode — surat tugas revisi diterbitkan
- Satu bidang bisa memiliki banyak Intern
- Surat tugas memiliki nomor dokumen yang unik dan terurut

**Dependencies**: F2, F3

---

#### F5: Manajemen Supervisor

**User Story**:
> Sebagai HR, saya ingin mengelola data Supervisor dan assignment-nya ke Intern, sehingga setiap Intern memiliki Supervisor yang jelas.

**Acceptance Criteria**:
- [ ] Given HR/Admin membuka halaman Supervisor, When melihat daftar, Then menampilkan: nama, NIP, bidang, jumlah Intern bimbingan, status aktif
- [ ] Given HR menambahkan Supervisor baru, When mengisi form (nama, NIP, bidang, kontak), Then data tersimpan
- [ ] Given HR meng-assign Supervisor ke Intern, When memilih Supervisor + Intern, Then assignment tersimpan dan Intern mendapat notifikasi
- [ ] Given Supervisor membuat **Issue** (Rencana Kegiatan), When mengisi form (judul, deskripsi, tenggat, assignee Intern), Then Issue tersimpan dan Intern dapat mengisi logbook yang terhubung
- [ ] Given satu Supervisor memiliki maksimal Intern, When jumlah melebihi batas (misal 5), Then sistem memberi peringatan
- [ ] Given Intern melihat dashboard, When informasi Supervisor ditampilkan, Then dapat langsung menghubungi via tombol kontak

**Edge Cases**:
- Supervisor berhalangan — HR dapat reassign Intern ke Supervisor lain
- Riwayat assignment tersimpan untuk tracking
- Supervisor dapat non-aktif sementara
- Issue (Rencana Kegiatan) dapat dijadwalkan ulang tanpa kehilangan logbook terkait

**Dependencies**: F2, F3

---

#### F6: Logbook & Jurnal Harian

**User Story**:
> Sebagai Intern, saya ingin mencatat kegiatan harian magang yang terhubung ke Rencana Kegiatan (Issue) yang dibuat Supervisor, sehingga progres pekerjaan terstruktur dan termonitor.

**Acceptance Criteria**:
- [ ] Supervisor membuat **Issue** (Rencana Kegiatan) — misal "Publikasi Hasil Industri 2026 Kota Tasikmalaya" — sebagai payung kegiatan yang akan diisi logbook oleh Intern bimbingan
- [ ] Given Intern mengisi logbook, When memilih Issue terkait dan submit dengan data (tanggal, kegiatan, durasi, dokumentasi), Then logbook tersimpan dengan timestamp dan status "Menunggu Review"
- [ ] Given Intern ingin mengisi logbook hari sebelumnya, When memilih tanggal, Then diperbolehkan (maksimal H-3 dari hari ini)
- [ ] Given Supervisor membuka logbook Intern bimbingan, When melihat list logbook, Then melihat semua entry dengan Issue, status, dan tanggal
- [ ] Given Supervisor mereview logbook, When memberikan komentar dan status "Disetujui" / "Revisi", Then Intern mendapat notifikasi
- [ ] Given logbook berstatus "Revisi", When Intern mengedit dan submit ulang, Then status kembali ke "Menunggu Review"
- [ ] Given sistem mengecek pengisian logbook, When Intern tidak mengisi > 3 hari berturut-turut, Then notifikasi pengingat otomatis dikirim ke Intern dan Supervisor
- [ ] Given Admin/HR ingin melihat statistik logbook, When membuka dashboard, Then menampilkan rata-rata pengisian logbook per periode, breakdown per Issue

**Edge Cases**:
- Satu logbook entry dapat di-link ke satu Issue (Rencana Kegiatan)
- Issue dapat di-assign ke satu Intern atau ke semua Intern bimbingan Supervisor tersebut
- Hari libur nasional — tidak wajib diisi, sistem mendeteksi otomatis sesuai kalender
- Intern bertugas di luar kantor (survei lapangan) — tetap bisa mengisi
- Multiple entry per hari — diperbolehkan
- Upload foto dokumentasi — maksimal 3 foto per entry, format JPG/PNG maks 2MB

**Dependencies**: F2, F4, F5

---

#### F7: Bimbingan & Konsultasi

**User Story**:
> Sebagai Intern, saya ingin melakukan bimbingan dengan Supervisor dan mencatat hasilnya, sehingga ada rekam jejak bimbingan yang jelas.

**Acceptance Criteria**:
- [ ] Given Intern mengajukan bimbingan, When mengisi form (topik, deskripsi, jadwal yang diusulkan), Then permintaan masuk ke dashboard Supervisor
- [ ] Given Supervisor menerima permintaan bimbingan, When menyetujui jadwal, Then sistem mengirimkan konfirmasi ke Intern
- [ ] Given sesi bimbingan selesai, When Supervisor mencatat hasil bimbingan (catatan, tindak lanjut), Then entry tersimpan sebagai riwayat bimbingan
- [ ] Given Intern/Supervisor ingin melihat riwayat bimbingan, When membuka halaman bimbingan, Then melihat timeline bimbingan secara kronologis
- [ ] Given bimbingan dilakukan secara online, When menggunakan link video conference, Then link tersimpan di entry bimbingan

**Edge Cases**:
- Bimbingan dijadwalkan ulang — dicatat sebagai reschedule dengan alasan
- Intern tidak hadir tanpa konfirmasi — Supervisor menandai sebagai "Tidak Hadir"
- Frekuensi bimbingan minimal — sistem mengingatkan jika > 2 minggu tanpa bimbingan

**Dependencies**: F5, F6

---

#### F8: Presensi / Absensi Digital

**User Story**:
> Sebagai Intern, saya ingin melakukan presensi kehadiran secara digital, sehingga absensi tercatat akurat dan otomatis.

**Acceptance Criteria**:
- [ ] Given Intern melakukan check-in, When berada di lokasi BPS Tasikmalaya (geofence) atau memindai QR code, Then presensi tercatat dengan timestamp, lokasi, dan foto
- [ ] Given Intern melakukan check-out, When check-out via tombol atau scan QR, Then durasi kerja terhitung otomatis
- [ ] Given Intern terlambat, When check-in > jam mulai (08:00), Then tercatat sebagai "Terlambat" dengan selisih waktu
- [ ] Given Intern izin tidak hadir, When mengajukan izin melalui sistem (sakit/keperluan), Then status presensi tercatat "Izin" dengan alasan
- [ ] Given Supervisor melihat rekap absensi Intern bimbingan, When membuka halaman presensi, Then melihat tabel kehadiran per Intern per tanggal
- [ ] Given HR/Admin ingin generate laporan absensi, When memilih periode, Then sistem menghasilkan dokumen rekap absensi dalam format PDF

**Edge Cases**:
- GPS tidak akurat (di dalam gedung) — fallback ke QR code
- Intern lupa check-in/out — dapat diisi manual oleh Supervisor (dengan approval)
- Hari libur nasional — sistem mendeteksi otomatis dan exempt presensi
- Intern sedang survei lapangan — status "Dinas Luar" dapat diatur

**Dependencies**: F2, F4

---

#### F9: Penilaian & Evaluasi

**User Story**:
> Sebagai Supervisor, saya ingin menilai Intern secara terstruktur, sehingga evaluasi bersifat objektif dan terdokumentasi.

**Acceptance Criteria**:
- [ ] Given periode penilaian dimulai, When Supervisor membuka form penilaian, Then melihat komponen penilaian: (1) Disiplin & Kehadiran, (2) Kualitas Kerja, (3) Inisiatif & Proaktif, (4) Kerjasama Tim, (5) Penguasaan Tugas
- [ ] Given Supervisor mengisi nilai, When mengirim penilaian, Then nilai tersimpan dan status berubah "Sudah Dinilai"
- [ ] Given HR/Admin ingin memfinalisasi nilai, When semua komponen sudah diisi, Then nilai akhir terkalkulasi otomatis
- [ ] Given nilai sudah difinalisasi, When HR/Admin menekan "Finalisasi", Then nilai tidak dapat diubah dan siap untuk generate dokumen penilaian
- [ ] Given Intern melihat hasil penilaian, When nilai sudah difinalisasi, Then Intern dapat melihat detail komponen penilaian

**Edge Cases**:
- Supervisor belum menilai hingga batas akhir — sistem mengirim reminder otomatis H-7, H-3, H-1
- Bobot penilaian dapat dikustomisasi per periode (dikonfigurasi oleh Admin)
- Nilai dapat diexport untuk arsip

**Dependencies**: F2, F5, F6

---

#### F10: Generate Dokumen Otomatis

**User Story**:
> Sebagai HR, saya ingin menghasilkan dokumen kelengkapan magang secara otomatis, sehingga tidak perlu menyusun manual satu per satu.

**Acceptance Criteria**:
- [ ] Given HR/Admin memilih Intern yang akan diselesaikan magangnya, When menekan "Generate Sertifikat", Then sistem menghasilkan sertifikat digital dengan: nama Intern, bidang, periode, nomor sertifikat unik, QR code verifikasi
- [ ] Given HR/Admin memilih generate dokumen penilaian, When menekan "Generate Laporan Penilaian", Then sistem menghasilkan dokumen penilaian yang berisi: komponen nilai, nilai akhir, predikat, ditandatangani oleh Supervisor dan Kepala BPS
- [ ] Given HR/Admin memilih generate rekap absensi, When menekan "Generate Rekap Absensi", Then sistem menghasilkan dokumen yang berisi: daftar hadir per periode, total kehadiran, persentase, keterangan
- [ ] Given HR/Admin memilih generate surat selesai magang, When menekan "Generate Surat Keterangan", Then sistem menghasilkan dokumen keterangan selesai magang
- [ ] Given HR/Admin ingin generate batch untuk banyak Intern, When memilih multiple Intern dan jenis dokumen, Then sistem memproses semua dokumen secara paralel
- [ ] Given semua dokumen punya QR code verifikasi, When pihak ketiga memindai QR code, Then diarahkan ke halaman verifikasi yang menampilkan data asli

**Edge Cases**:
- Generate dokumen untuk Intern yang belum lengkap datanya — sistem menampilkan warning data apa yang kurang
- Template dokumen dapat dikustomisasi oleh Admin (logo BPS, format kop surat, dll)
- Nomor dokumen (sertifikat, surat, dll) memiliki format yang dapat dikonfigurasi oleh Admin
- Dokumen yang sudah ditandatangani TTE tidak bisa diedit — jika perlu revisi, buat versi baru dan TTE ulang

**Dependencies**: F6 (logbook), F8 (presensi), F9 (penilaian), F14 (TTE) untuk dokumen yang perlu tandatangan digital

---

#### F11: Dashboard & Monitoring

**User Story**:
> Sebagai HR, saya ingin melihat dashboard monitoring real-time, sehingga saya bisa memantau program magang secara operasional.

**Acceptance Criteria**:
- [ ] Given HR membuka dashboard, When halaman diload, Then menampilkan: (1) Total Intern aktif, (2) Total Supervisor aktif, (3) Rata-rata pengisian logbook, (4) Rata-rata kehadiran, (5) Distribusi Intern per bidang
- [ ] Given Admin membuka dashboard, When halaman diload, Then menampilkan semua data yang sama seperti HR plus: (6) Status sistem, (7) Log aktivitas terkini, (8) Statistik penggunaan sistem
- [ ] Given Supervisor membuka dashboard, When halaman diload, Then menampilkan data terbatas: (1) Daftar Intern bimbingan, (2) Status logbook per Intern, (3) Status presensi per Intern, (4) Pengingat penilaian
- [ ] Given HR/Admin memilih filter, When memfilter berdasarkan periode/status, Then dashboard merespon dalam < 3 detik
- [ ] Given ada Intern dengan logbook < 50%, When dashboard dirender, Then menampilkan alert atau highlight khusus
- [ ] Given HR/Admin ingin melihat detail, When mengklik salah satu metrik, Then menampilkan breakdown lebih detail
- [ ] Given HR/Admin ingin export dashboard, When menekan export, Then file PDF ringkasan terunduh

**Edge Cases**:
- Data kosong untuk periode baru — dashboard tetap berfungsi dengan state "Belum ada data"
- Dashboard harus real-time (max delay 1 menit)
- Mobile responsive untuk akses via smartphone

**Dependencies**: F6, F8, F9

---

#### F12: Notifikasi & Pengingat

**User Story**:
> Sebagai Intern, saya ingin mendapatkan notifikasi pengingat, sehingga saya tidak melewatkan kewajiban magang.

**Acceptance Criteria**:
- [ ] Given sistem mendeteksi logbook belum diisi, When > 2 hari berturut-turut, Then notifikasi otomatis ke Intern (in-app + email)
- [ ] Given Intern lupa check-in, When > 1 jam dari jam masuk, Then notifikasi pengingat check-in
- [ ] Given Supervisor memberikan komentar/feedback di logbook, When komentar disimpan, Then notifikasi real-time ke Intern
- [ ] Given batas akhir penilaian mendekati, When H-7, H-3, H-1, Then notifikasi ke Supervisor yang belum menilai
- [ ] Given HR perlu melakukan generate dokumen, When periode magang akan berakhir H-7, Then notifikasi ke HR
- [ ] Given semua notifikasi, When di halaman notifikasi, Then terkelompok: "Belum Dibaca" dan "Semua"
- [ ] Given notifikasi banyak, When user masuk, Then badge jumlah notifikasi belum dibaca tampil di navbar

**Edge Cases**:
- User dapat mengatur preferensi notifikasi (email only, in-app only, both)
- Push notification via browser — fallback ke email jika tidak didukung

**Dependencies**: F6, F8, F9

---

#### F13: Pelaporan & Export (PDF/Excel)

**User Story**:
> Sebagai HR, saya ingin menghasilkan laporan magang secara otomatis, sehingga tidak perlu menyusun manual dari berbagai sumber.

**Acceptance Criteria**:
- [ ] Given HR/Admin memilih template laporan, When memilih "Laporan Rekap Magang Periode X", Then sistem generate report dalam format PDF/Excel
- [ ] Given HR/Admin ingin export data logbook, When memilih filter periode + Intern, Then file Excel dengan sheet data logbook
- [ ] Given HR/Admin export data presensi, When memilih filter periode, Then file Excel dengan rekap kehadiran per Intern
- [ ] Given HR/Admin export data penilaian, When memilih filter periode, Then file Excel dengan nilai per Intern
- [ ] Given data besar (> 1000 entries), When export diproses, Then sistem memproses async dengan notifikasi setelah selesai

**Edge Cases**:
- Template laporan dapat dikustomisasi oleh Admin
- Gunakan library PDF generation yang ada

**Dependencies**: F6, F8, F9

---

#### F14: Tanda Tangan Digital & Verifikasi Dokumen

**User Story**:
> Sebagai HR, saya ingin dokumen kelengkapan magang ditandatangani secara digital (TTE), sehingga dokumen sah secara hukum tanpa perlu tanda tangan basah.

**Acceptance Criteria**:
- [ ] Given dokumen (sertifikat, penilaian, absensi, surat tugas) selesai digenerate, When HR/Admin meminta tanda tangan digital, Then sistem mengirimkan dokumen ke antrian TTE untuk ditandatangani oleh pejabat yang berwenang (Kepala BPS / Kabag)
- [ ] Given pejabat menerima permintaan TTE, When membuka dashboard TTE dan menekan "Tanda Tangan", Then sistem membubuhkan TTE pada dokumen dengan: (1) Sertifikat elektronik terdaftar di BSrE, (2) Visual signature berupa gambar tanda tangan + nama + NIP + timestamp, (3) Hash dokumen tercatat untuk verifikasi keaslian
- [ ] Given dokumen sudah ditandatangani, When pihak ketiga membuka dokumen atau memindai QR code, Then menampilkan status "Tervalidasi" dengan metadata tanda tangan (penanda tangan, waktu, hash dokumen)
- [ ] Given pejabat ingin menolak permintaan TTE, When menekan "Tolak" dengan alasan, Then dokumen kembali ke HR/Admin dengan catatan revisi
- [ ] Given HR/Admin ingin mengecek status tanda tangan, When membuka dashboard status dokumen, Then menampilkan: (1) Menunggu TTE, (2) Sudah TTE, (3) Ditolak, (4) Gagal (error teknis)
- [ ] Given dokumen sudah TTE, When ada perubahan data, Then dokumen lama diarsipkan dan dokumen baru harus melalui proses TTE ulang

**Edge Cases**:
- TTE membutuhkan koneksi internet ke BSrE atau penyedia TTE — jika offline, antre dan retry otomatis saat online
- Masa berlaku sertifikat elektronik habis — sistem memberi peringatan ke Admin H-30
- Pejabat berhalangan (cuti/pindah) — Admin dapat mengalihkan wewenang TTE ke pejabat lain yang ditunjuk
- Multi-level TTE: dokumen tertentu mungkin需要 tanda tangan lebih dari 1 pejabat (bertingkat)
- Visual signature harus sesuai dengan template BPS (posisi, ukuran, format)

**Dependencies**: F10 (Generate Dokumen), BSrE / Penyedia TTE tersertifikasi

---

#### F15: Manajemen Sistem & Konfigurasi (Admin Only)

**User Story**:
> Sebagai Admin, saya ingin mengelola konfigurasi sistem dan memantau kesehatan infrastruktur, sehingga sistem SIGMA berjalan dengan optimal.

**Acceptance Criteria**:
- [ ] Given Admin membuka panel konfigurasi, When mengubah pengaturan sistem (nama instansi, logo, format nomor dokumen, dll), Then perubahan tersimpan dan berlaku di seluruh sistem
- [ ] Given Admin ingin mengelola semua akun pengguna, When membuka manajemen user, Then dapat melihat, membuat, mengedit, dan menonaktifkan akun semua role (Admin, HR, Supervisor, Intern)
- [ ] Given Admin membuka audit log, When melihat log aktivitas, Then menampilkan: timestamp, user, aksi, target, detail perubahan — tidak bisa diedit (append-only)
- [ ] Given Admin perlu memonitor sistem, When membuka halaman status sistem, Then menampilkan: (1) Status koneksi database, (2) Status layanan email, (3) Status penyimpanan file, (4) Log error terkini
- [ ] Given Admin ingin melakukan backup data, When menekan "Backup", Then sistem melakukan backup database dan file ke penyimpanan yang ditentukan
- [ ] Given Admin membuka semua data magang, When mengakses data Intern, Supervisor, logbook, presensi, penilaian, Then dapat melihat semua data tanpa filter — untuk keperluan troubleshooting dan audit

**Edge Cases**:
- Hanya Admin yang bisa mengakses fitur ini — role lain tidak melihat menu ini sama sekali
- Konfigurasi yang salah dapat di-revert ke pengaturan sebelumnya
- Audit log harus tahan tamper — disimpan di tabel terpisah dengan akses read-only

**Dependencies**: F1

---

## 6. Technical Considerations

### 6.1 Architecture Notes

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Next.js App (Web App)                        │   │
│  │         Responsive — Mobile-first (PWA)                   │   │
│  └──────────────────────┬───────────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Layer (Next.js API)                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Auth API     │  │ Internship   │  │ Notification API    │   │
│  │ (Better-Auth)│  │ Module API   │  │ (WebSocket/SSE)     │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘   │
└─────────┼─────────────────┼──────────────────────┼─────────────┘
          │                 │                      │
          ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Service Layer                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ Auth     │ │ Magang   │ │ Document │ │ Reporting        │   │
│  │ Service  │ │ Service  │ │ Service  │ │ Service          │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │                 │                      │
          ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Data Layer                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              PostgreSQL (Neon)                            │   │
│  │    ┌────────────┐  ┌────────────┐  ┌──────────────┐     │   │
│  │    │ Users &     │  │ Internship │  │ Notifications │     │   │
│  │    │ Roles       │  │ Module DB  │  │ Table        │     │   │
│  │    └────────────┘  └────────────┘  └──────────────┘     │   │
│  │    ┌────────────┐  ┌────────────┐                       │   │
│  │    │ Audit Log   │  │ System     │                       │   │
│  │    │ (Read-only) │  │ Config     │                       │   │
│  │    └────────────┘  └────────────┘                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Cloudinary (File Storage)                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Role-Based Access Control (RBAC)

| Role | Level | Scope | Dibuat oleh |
|------|-------|-------|-------------|
| **Admin** | 4 (Tertinggi) | Seluruh sistem — konfigurasi, audit, semua data | Admin existing |
| **HR** | 3 | Manajemen Intern & Supervisor, dokumen, dashboard monitoring | Admin |
| **Supervisor** | 2 | Intern bimbingan saja — logbook, penilaian, dashboard terbatas | Admin / HR |
| **Intern** | 1 (Terendah) | Data diri sendiri — logbook, presensi, informasi, dokumen | Admin / HR |

**Aturan RBAC**:
- Higher-level role dapat mengakses data lower-level role
- Admin dapat melihat dan melakukan semua aksi di semua level
- HR dapat mengelola data Intern dan Supervisor, tetapi tidak bisa mengubah konfigurasi sistem atau melihat audit log
- Supervisor hanya bisa melihat Intern yang menjadi bimbingannya
- Intern hanya bisa melihat data miliknya sendiri

### 6.3 Technical Constraints

- **Tech Stack**: Next.js 16 (App Router) + React 19 + TypeScript (strict)
- **Database**: PostgreSQL via Neon (serverless)
- **ORM**: Prisma 7
- **Auth**: Better-Auth
- **File Storage**: Cloudinary
- **PDF Generation**: @react-pdf/renderer
- **UI Components**: shadcn/ui (Radix-based) + TailwindCSS v4
- **Data Fetching**: TanStack React Query v5
- **Validation**: Zod v4
- **Package Manager**: pnpm
- **Form**: React Hook Form v7
- **Geolocation**: OpenCage API atau layanan geolokasi untuk presensi geofence
- **Deployment**: VPS / Server instansi (sesuai ketentuan SPBE)
- **PWA**: Progressive Web App untuk akses via smartphone

### 6.4 Database Design

Full database design documentation: `docs/superpowers/specs/2026-07-15-database-design.md`

**Naming Conventions**:
- All columns use **camelCase** (e.g., `periodStart`, `documentType`)
- All tables use **snake_case** via Prisma `@@map` (e.g., `intern_profile`, `assessment_component`)
- Enum values use **snake_case** (e.g., `pending_review`, `field_duty`)

**Key Patterns**:
- `createdAt` and `updatedAt` on all models
- **Soft delete** via `deletedAt DateTime?` on business models, enforced by Prisma middleware
- **Polymorphic attachments** via single `Attachment` table with `attachableType` + `attachableId`
- **UUID primary keys** (cuid) for all new models

**Models by Domain**:

| Domain | Models |
|--------|--------|
| Core (Better-Auth) | User, Session, Account, Verification |
| Audit | AuditLog |
| Masters | Department, InternProfile, SupervisorProfile, InternSupervisor |
| Operations | Issue (Rencana Kegiatan), Logbook, Attendance, GuidanceSession, Assessment, AssessmentComponent |
| Documents | Document, DocumentTemplate, Guide |
| System | Notification, SystemConfig |
| Cross-cutting | Attachment (polymorphic) |

**Issue & Logbook Flow**:
```
Supervisor creates Issue (Rencana Kegiatan)
    └── e.g., "Publikasi Hasil Industri 2026 Kota Tasikmalaya"
         └── Intern creates Logbook entries linked to that Issue
              └── Supervisor reviews → approves or requests revision
```

### 6.5 APIs & Integrations

| Service/API | Purpose | Status |
|-------------|---------|--------|
| Better-Auth | Autentikasi, role management, session | Existing |
| Cloudinary | Upload dokumen, foto logbook | Existing |
| Email SMTP | Notifikasi, reset password, reminders | Existing (via Better-Auth) |
| OpenCage/Google Maps | Geofencing untuk presensi | TBD |
| QR Code library | Verifikasi dokumen & presensi | TBD |
| BSrE / Penyedia TTE | Tanda Tangan Elektronik tersertifikasi untuk dokumen resmi | TBD (registrasi BSrE) |
| TTE SDK/API (contoh: VIDA, Privy, Digisign, atau BSrE) | Integrasi pembubuhan TTE pada dokumen PDF | TBD |

### 6.6 Performance Requirements

- **Page load time (First Contentful Paint)**: < 2 detik
- **API response time (p95)**: < 500ms untuk read, < 2s untuk write
- **Concurrent users**: Support > 100 concurrent users (skala BPS Kota)
- **Search performance**: < 2 detik untuk pencarian di 1.000 records
- **Generate PDF dokumen**: < 5 detik per dokumen
- **Batch generate dokumen**: < 30 detik untuk 50 dokumen
- **Data retention**: Data magang diarsipkan minimal 5 tahun
- **Uptime**: 99.5% availability
- **Database backup**: Otomatis setiap hari

### 6.7 Security & Privacy

- **Autentikasi**: Better-Auth dengan credential
- **Authorisasi**: Role-based access control (RBAC) — 4 role distinct dengan hierarki
- **Data sensitivity**:
  - **Tinggi**: NIK, dokumen pribadi — akses terbatas ke Admin dan HR
  - **Sedang**: Logbook, penilaian, presensi — akses ke pihak terkait (Supervisor untuk Intern bimbingannya)
  - **Rendah**: Nama, bidang — publik internal
- **Compliance**:
  - UU PDP (Perlindungan Data Pribadi) No. 27 Tahun 2022
  - Amanat SPBE (Sistem Pemerintahan Berbasis Elektronik) — Perpres No. 95 Tahun 2018
  - **TTE**: UU ITE No. 11 Tahun 2008 & PP No. 71 Tahun 2019 — TTE memiliki kekuatan hukum yang setara dengan tanda tangan basah
  - **BSrE**: TTE harus menggunakan sertifikat elektronik dari Balai Sertifikasi Elektronik (BSrE) atau penyedia TTE yang terdaftar di Kominfo
- **Encryption**: Semua traffic via HTTPS; data at-rest terenkripsi
- **Session**: Timeout 30 menit inactivity
- **Audit log**: Semua perubahan status kritis (penempatan, finalisasi nilai, generate dokumen) tercatat dengan user + timestamp — hanya Admin yang bisa mengakses
- **Hosting**: Prioritas server dalam negeri (sesuai ketentuan PDN/Pusat Data Nasional)

---

## 7. Design Requirements

### 7.1 Design Principles

1. **Mobile-first** — Intern mayoritas akses via smartphone
2. **Sederhana & Fokus** — hindari kompleksitas yang tidak perlu
3. **Progressive disclosure** — tampilkan informasi bertahap
4. **Feedback-rich** — setiap aksi memberikan feedback visual (toast, loading state, error state)
5. **Professional look** — sesuai dengan citra instansi pemerintah BPS
6. **Accessibility** — minimal AA WCAG 2.1

### 7.2 Key Screens / States

**Intern Flow**:
- Dashboard Personal (informasi lengkap: supervisor, penempatan, tugas, aturan)
- Informasi & Panduan Magang
- Logbook Harian (form + riwayat)
- Presensi (check-in/check-out + riwayat)
- Bimbingan (ajukan + riwayat)
- Penilaian (hasil akhir)
- Dokumen (sertifikat, surat tugas, dll)

**Supervisor Flow**:
- Dashboard Supervisor (daftar Intern bimbingan + ringkasan status)
- Manage Issue / Rencana Kegiatan (CRUD untuk Intern bimbingan)
- Detail Intern (logbook, presensi, penilaian)
- Review Logbook (setujui/revisi + komentar)
- Bimbingan (jadwal + catatan)
- Form Penilaian

**HR Flow**:
- Dashboard HR (monitoring operasional — statistik Intern, Supervisor, logbook, presensi)
- Manajemen Intern (CRUD + import)
- Manajemen Supervisor (CRUD + assignment)
- Manajemen Panduan & Informasi
- Generate Dokumen (sertifikat, penilaian, absensi, surat tugas)
- Pelaporan & Export

**Admin Flow**:
- Dashboard Admin (semua data + status sistem + log aktivitas)
- Semua fitur HR (Admin juga bisa melakukannya)
- Manajemen User & Role (semua role termasuk Admin lain)
- Panel Konfigurasi Sistem
- Audit Log
- Backup & Maintenance

**Key States to Design**:
- **Empty state**: "Belum ada data" dengan ilustrasi dan CTA
- **Loading state**: Skeleton loader
- **Error state**: Alert dengan opsi retry
- **Success state**: Konfirmasi visual
- **Edge case state**: "Periode magang belum dimulai", "Magang selesai", "Dokumen tersedia"

### 7.3 Accessibility

- Semua form memiliki label eksplisit (bukan placeholder-only)
- Color contrast ratio minimal 4.5:1 untuk text normal
- Semua tombol dapat diakses via keyboard (tab navigation)
- Image memiliki alt text deskriptif
- Error message terkait dengan input field secara semantik

---

## 8. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Adopsi rendah dari Supervisor** | Medium | High | Buat interface sangat sederhana; onboarding < 5 menit; highlight benefit (dashboard monitoring Intern) |
| **Intern tidak konsisten isi logbook** | High | Medium | Notifikasi otomatis; Supervisor dapat melihat dashboard kelalaian; integrasi presensi sebagai pengingat |
| **Koneksi internet tidak stabil di lokasi BPS** | Medium | High | PWA dengan offline capability untuk logbook & presensi; fallback mode |
| **Keamanan data pribadi (NIK, dll)** | Low | Critical | RBAC ketat; audit log; enkripsi data; hanya simpan data esensial |
| **Perubahan kebijakan magang BPS Pusat** | Medium | Medium | Desain modular; konfigurasi berbasis parameter; mudah diadaptasi |
| **Resistensi terhadap digitalisasi** | High | Medium | Sosialisasi bertahap; tunjukkan manfaat langsung; champion dari internal |
| **Keterbatasan infrastruktur server** | Low | High | Gunakan cloud/reliable hosting; backup plan ke server cadangan |
| **Scope creep** | Medium | Medium | Non-goals yang jelas; prioritaskan P0 di MVP |
| **Konflik wewenang Admin vs HR** | Low | Medium | Boundary role yang jelas di RBAC; dokumentasi tanggung jawab |
| **Admin (IT Support) turnover** | Low | High | Dokumentasi konfigurasi; minimal 2 Admin untuk redundancy |

---

## 9. Launch Plan

### 9.1 Phases

| Phase | Scope | Target User | Timeline |
|-------|-------|-------------|----------|
| **Alpha** | F1-F7 (MVP Core) — Manajemen data, Logbook, Presensi, Bimbingan | 1 batch Intern (max 20) + HR + Supervisor | Sprint 1-3 (~6 minggu) |
| **Beta** | F8-F11 — Penilaian, Generate Dokumen, Dashboard, Notifikasi | Semua Intern aktif di BPS Tasikmalaya | Sprint 4-5 (~4 minggu) |
| **GA v1.0** | F12-F13, F15 — Export, Pelaporan, Konfigurasi Admin, refinement | All users | Sprint 6 (~3 minggu) |
| **v1.1** | F14 — Tanda Tangan Digital & integrasi BSrE/TTE | All users (khusus dokumen resmi) | Sprint 7-8 (~4 minggu) |
| **v2.0** | PWA native, offline mode, analytics | All users | Post-GA |

### 9.2 Rollout Strategy

1. **Feature flags** untuk setiap modul besar — bisa diaktifkan bertahap
2. **Pilot batch** dengan 1 periode magang — dapatkan feedback cepat
3. **Sosialisasi** ke seluruh stakeholder (Intern, Supervisor, HR, Admin)
4. **Parallel run** — sistem baru berjalan paralel dengan sistem lama selama 1 periode
5. **Full cutover** — setelah validated, gunakan SIGMA sebagai sistem resmi

### 9.3 Go-to-Market Notes

- **Internal champion**: Rekrut 1 HR dan 1 Supervisor sebagai power user
- **Workshop onboarding**: 1 sesi per role (Intern, Supervisor, HR, Admin) — masing-masing < 30 menit
- **Dokumentasi**: Video tutorial pendek (< 2 menit) untuk setiap flow utama
- **Buku panduan cetak**: 1 halaman A4 tips cepat untuk setiap role
- **Feedback loop**: Form feedback in-app + sesi evaluasi di akhir periode pilot

---

## 10. Open Questions

| # | Pertanyaan | Owner | Due Date | Status |
|---|-----------|-------|----------|--------|
| 1 | Apakah SIGMA akan di-host di server lokal BPS Tasikmalaya atau cloud? (kaitannya dengan ketentuan PDN) | Admin / Tim IT | Sprint 0 | Open |
| 2 | Format nomor dokumen (sertifikat, surat tugas, dll) — apakah ada format baku dari BPS Pusat? | HR / Admin | Sprint 1 | Open |
| 3 | Berapa estimasi jumlah Intern per periode di BPS Tasikmalaya? | HR | Sprint 0 | Open |
| 4 | Apakah ada template dokumen resmi BPS (kop surat, format sertifikat) yang sudah baku? | HR / Admin | Sprint 1 | Open |
| 5 | Apakah presensi perlu fitur foto selfie untuk verifikasi? | HR / Admin | Sprint 1 | Open |
| 6 | Apakah data Intern perlu diintegrasikan dengan sistem kepegawaian BPS? | Admin | Sprint 3 | Open |
| 7 | Siapa yang akan menjadi Admin (Super Admin Teknis) pertama? Minimal perlu 2 orang untuk redundancy | PM / Pimpinan | Sprint 0 | Open |
| 8 | Apakah role Admin perlu dibedakan untuk development vs production environment? | Admin / Tim IT | Sprint 0 | Open |

---

## 11. Appendix

### A. Research References

- **Program Magang Nasional BPS** — Kerjasama BPS dengan Kemenaker RI (maganghub.kemnaker.go.id)
- **Peraturan Presiden No. 95 Tahun 2018** — Sistem Pemerintahan Berbasis Elektronik (SPBE)
- **Undang-Undang No. 27 Tahun 2022** — Perlindungan Data Pribadi (PDP)
- **Praktik magang BPS Kabupaten Bekasi, BPS Provinsi Riau** — studi kasus pelaksanaan magang di BPS daerah

### B. Glossary

| Istilah | Definisi |
|---------|----------|
| **BPS** | Badan Pusat Statistik — Lembaga Pemerintah Non-Kementerian penyedia data statistik |
| **SIGMA** | **SI**stem Informasi **M**anagement **M**agang — nama sistem |
| **Intern** | Peserta magang (sebelumnya: Peserta Magang) — individu yang mengikuti program magang di BPS |
| **Supervisor** | Pembimbing lapangan (sebelumnya: Pembimbing Lapangan) — pegawai BPS yang membimbing Intern |
| **HR** | Human Resources (sebelumnya: Admin BPS) — staff kepegawaian/TU yang mengelola Intern dan Supervisor |
| **Admin** | Super Admin Teknis — IT Support / pengembang yang memiliki akses penuh ke sistem (ROLE BARU) |
| **Logbook** | Catatan harian kegiatan magang |
| **Surat Tugas** | Dokumen resmi penempatan Intern |
| **Geofence** | Batasan geografis virtual untuk presensi berbasis lokasi |
| **SPBE** | Sistem Pemerintahan Berbasis Elektronik |
| **TTE** | Tanda Tangan Elektronik — tanda tangan digital yang sah secara hukum (UU ITE) |
| **BSrE** | Balai Sertifikasi Elektronik — penyedia sertifikat elektronik resmi pemerintah |
| **RBAC** | Role-Based Access Control — sistem kontrol akses berbasis peran |

### C. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-07-14 | PRD Architect Agent | Initial draft — konteks BPS Kota Tasikmalaya |
| 1.1 | 2026-07-14 | PRD Architect Agent | Added F14: Tanda Tangan Digital & Verifikasi Dokumen |
| **2.0** | **2026-07-14** | **PRD Architect Agent** | **Revisi role & penamaan: Intern, Supervisor, HR, Admin + F15: Manajemen Sistem & Konfigurasi** |

---

## 12. Nama Sistem

**Nama Resmi**: SIGMA — **SI**stem Informasi **M**anagement **M**agang

| Aspek | Keterangan |
|-------|------------|
| **Makna** | Sistem Informasi Management Magang — deskriptif dan jelas |
| **Pronunciation** | /sigˈma/ — mudah diucapkan |
| **Kelebihan** | Singkat (5 huruf), mudah diingat, branding kuat |
| **Domain** | sigma-bpstasikmalaya.id / tersedia |

---

## 📋 Agent Summary

**Input yang diterima**: Revisi role & penamaan — dari 4 role lama (Admin BPS, Pembimbing Lapangan, Peserta Magang, Pimpinan) menjadi 4 role baru (Admin, HR, Supervisor, Intern).

### Ringkasan Perubahan Role

| Role Lama | Role Baru | Perubahan |
|-----------|-----------|-----------|
| Admin BPS | **HR** | Scope dipersempit: fokus manage Intern & Supervisor. Tidak lagi punya akses konfigurasi sistem. |
| Pembimbing Lapangan | **Supervisor** | Penamaan diubah. Dashboard monitoring terbatas hanya untuk Intern bimbingannya. |
| Peserta Magang | **Intern** | Penamaan diubah. |
| Pimpinan BPS | ❌ Dihapus | Fungsinya dialihkan: (1) Monitoring penuh → Admin, (2) Monitoring operasional → HR, (3) Dashboard terbatas → Supervisor untuk data bimbingan saja. |
| **(BARU)** | **Admin** | Super Admin Teknis — akses penuh ke seluruh sistem, konfigurasi, audit log, manajemen semua user & role. Diperuntukkan untuk IT Support / pengembang sistem. |

### Asumsi utama yang dibuat:

- Admin adalah role Super Admin Teknis (IT Support / developer) — bukan pejabat struktural
- Pimpinan BPS tidak perlu role terpisah — monitoring sudah diakomodasi oleh Admin (full), HR (operasional), dan Supervisor (terbatas per bimbingan)
- HR tidak bisa membuat akun Admin — hanya Admin yang bisa membuat Admin lain
- Supervisor hanya dapat melihat data Intern yang menjadi bimbingannya (data isolation)

### Area yang direkomendasikan untuk review manusia:

- **Boundary Admin vs HR**: Pastikan pemisahan wewenang sudah tepat — Admin tidak perlu terlibat di operasional harian, HR tidak perlu akses konfigurasi sistem
- **Kebutuhan role Pimpinan**: Jika di kemudian hari Pimpinan BPS merasa perlu akses langsung (tanpa melalui Admin/HR), role ini bisa ditambahkan kembali sebagai role read-only
- **Open Questions (Section 10)**: Krusial untuk dijawab sebelum Sprint 0 — terutama siapa yang akan menjadi Admin pertama
- **F15 (Manajemen Sistem)**: Kebutuhan fitur ini perlu divalidasi dengan tim IT/developer yang akan menjadi Admin

### Perubahan dari versi 1.1 ke 2.0:

- **Section 1**: Update problem statement & solution — referensi role baru
- **Section 4**: Persona diubah total — Intern, Supervisor, HR, Admin. Ditambahkan tabel perbandingan akses antar role.
- **Section 4.5**: User Journey diupdate — flow Admin dan HR dibedakan
- **Section 5 (F1)**: Role matrix berubah dari 4 role lama ke 4 role baru. AC diupdate.
- **Section 5 (F2-F14)**: Semua referensi "Admin BPS" → dipisah ke Admin atau HR sesuai scope. "Pembimbing Lapangan" → Supervisor. "Peserta Magang" → Intern. "Pimpinan" → Admin/HR.
- **Section 5 (F15)**: Fitur baru: Manajemen Sistem & Konfigurasi (Admin Only)
- **Section 6.2**: RBAC diupdate lengkap dengan hierarki 4 role
- **Section 7**: Key screens diupdate — 4 flow berbeda untuk 4 role
- **Section 8**: Ditambahkan risiko konflik Admin vs HR dan Admin turnover
- **Section 11**: Glossary diupdate — definisi baru untuk Intern, Supervisor, HR, Admin

**Langkah selanjutnya yang disarankan**:
1. Review dokumen ini dengan Admin (IT Support) dan HR BPS Tasikmalaya
2. Validasi boundary wewenang Admin vs HR
3. Jawab Open Questions di Section 10 sebelum Sprint 0
4. Implementasi RBAC di database schema dengan enum role: `INTERN | SUPERVISOR | HR | ADMIN`
5. Siapkan data master: daftar bidang/divisi, daftar Supervisor, template dokumen
6. Lanjut ke technical specification dan database schema design
