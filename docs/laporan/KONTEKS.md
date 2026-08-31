# KONTEKS — Otak Pengetahuan Laporan Kerja Praktik SIGMA

> **Fungsi file ini**: memori jangka panjang untuk AI/penyusun laporan. Baca file ini terlebih dahulu sebelum melanjutkan pekerjaan apa pun terkait laporan Kerja Praktik, agar konteks percakapan dan keputusan sebelumnya tidak hilang.
> **Terakhir diperbarui**: 24 Agustus 2026.

---

## 1. Identitas Project

| Aspek | Keterangan |
|---|---|
| Nama sistem | **SIGMA** (Sistem Informasi Management Magang) |
| Institusi | BPS Kota Tasikmalaya (Badan Pusat Statistik) |
| Jenis | Platform web manajemen siklus magang end-to-end |
| Pemangku kepentingan / role | 4 role: **Admin** (super admin teknis), **HR** (pengelola administrasi), **Supervisor** (pembimbing), **Intern** (peserta) |
| Fitur utama | Informasi & transparansi magang hari pertama, penempatan & surat tugas, logbook digital terhubung rencana kegiatan (*issue*) dari supervisor, presensi digital, penilaian terstandar, dashboard monitoring, generate dokumen otomatis (sertifikat, laporan penilaian, rekap absensi, surat tugas) |
| Teknologi | Next.js (App Router), React 19, TypeScript, PostgreSQL (Neon), Prisma, Better-Auth, RBAC, TailwindCSS + shadcn/ui, TanStack Query, Zod, React Hook Form |
| Dokumen induk | `docs/prd/PRD_Sistem Informasi Management Magang (SIGMA) BPS Kota Tasikmalaya.md` (v2.1) |

---

## 2. Konteks Tugas Laporan

| Aspek | Keputusan |
|---|---|
| Jenis laporan | **Laporan Kerja Praktik** (bukan skripsi) |
| Bagian yang sedang dikerjakan | Latar belakang (BAB pendahuluan) |
| Struktur wajib | Funnel umum → khusus: transformasi digital/SPBE → pengelolaan magang → masalah di instansi lain → masalah spesifik BPS Kota Tasikmalaya → solusi SIGMA → dampak yang diharapkan |
| Panjang | ± 2–3 halaman |
| Gaya | Akademik, Bahasa Indonesia |
| Sitasi | Campuran bernomor `[n]` gaya IEEE + satu sumber berita inline `(Tirto.id, 2026)` — lihat isu terbuka §6 |

---

## 3. Riwayat Evolusi Dokumen

1. **v1** — `docs/laporan/latar-belakang.md`: referensi campuran (regulasi Perpres/UU, Kepmen PANRB, berita Tirto.id, 2 jurnal). Format sitasi APA.
2. **v2** — `docs/laporan/latar-belakang-v2.md`: semua referensi dari paper ilmiah saja (11 paper). Ditambah narasi "pengelolaan magang yang baik" dengan sitasi per komponen.
3. **FINAL (milik user)** — teks sudah difix oleh user di percakapan (belum disimpan sebagai file .md terpisah). Menggunakan sitasi bernomor `[1]`–`[13]`, menambah klaim baru *link and match* [2] dan *pengembangan kompetensi* [1] yang bersumber dari paper pilihan user sendiri, serta mengganti dasar masalah menjadi **observasi langsung selama kerja praktik** (bukan lagi klaim PRD).
4. **Bagian Tujuan Pelaksanaan Kerja Praktik** — `docs/laporan/tujuan-kerja-praktek.md` (revisi 4 final, 24 Agustus 2026). **2 tujuan**: (1) membangun SIGMA + wahana penerapan ilmu perkuliahan; (2) [gabungan eks-2+3] program magang berjalan lebih tertib-cepat-mudah dipantau → beban pengelola ringan + kejelasan informasi peserta hari pertama. **Preferensi gaya user yang tercatat: tujuan tidak menyebut nama fitur secara langsung; bahasa singkat dan mudah dipahami non-teknis.** Tanpa sitasi.
5. **Bagian Sasaran Kompetensi yang Ditargetkan** — `docs/laporan/sasaran-kompetensi.md` (revisi 2 final, 24 Agustus 2026). **Gaya diminta user: daftar a–g, tiap butir diawali "Mampu ...", satu kalimat ringkas** (meniru contoh user dari project pemetaan pelaku usaha). 7 kompetensi SIGMA: (a) analisis kebutuhan, (b) rancang basis data terintegrasi, (c) kembangkan aplikasi web, (d) RBAC/keamanan data [padanan poin SIG/geolocation di contoh — teknologi khas SIGMA], (e) integrasi frontend-backend + cloud storage & dokumen otomatis, (f) pengujian-evaluasi-penyempurnaan, (g) profesional-komunikasi-dokumentasi.

6. **Bab 3 — Prosedur Pelaksanaan Kerja Praktik** — `docs/laporan/bab3-prosedur-pelaksanaan.md` (final, 24 Agustus 2026). 4 tahap independen (tanpa kalimat penghubung antartahap, tanpa diksi "langkah"):
   - *Tahap Persiapan*: kontrak mata kuliah → surat pengantar jurusan → serah ke BPS → surat penerimaan magang → SK Kerja Praktik (penetapan tempat + penunjukan dosen pembimbing).
   - *Tahap Orientasi*: kedatangan pertama → diarahkan ke tempat kerja & penyesuaian kenyamanan → perkenalan staf & Kepala BPS → informasi pembimbing lapangan.
   - *Tahap Pelaksanaan*: observasi lingkungan/alur/struktur → kegiatan utama pengembangan SIGMA (narasi proses: pematangan kebutuhan–perancangan–implementasi–penyempurnaan + diskusi berkala dengan pembimbing lapangan; fitur tidak dienumerasi eksplisit sesuai preferensi revisi terakhir) → latar observasi manual sebagai landasan SIGMA → kegiatan operasional lain (KCDA Mangkubumi, cover Hortikultura, rangkum PPL, audit laporan, video publikasi, web crawling + analisis sentimen Sensus Ekonomi dengan elaborasi pengumpulan & klasifikasi).
   - *Tahap Penutupan*: presentasi SIGMA ke pembimbing lapangan → pengurusan berkas tanda tangan → penilaian kinerja (template universitas) → prakata Kepala BPS → penyerahan sertifikat & foto bersama. Tahap Monitoring/Bimbingan di-skip sesuai instruksi.
   **Preferensi gaya yang berlaku**: tiap sub-tahap independen; hindari "Langkah"; narasi halus akademik; Tahap Pelaksanaan versi final = fokus pada proses pengerjaan + diskusi, bukan daftar fitur.

---

## 4. Pustaka Sumber Terverifikasi (metadata lengkap)

Semua metadata telah diverifikasi langsung dari halaman jurnal/sumber. Jangan mengubah tanpa verifikasi ulang.

| # | Sumber | Klaim yang Didukung | Status |
|---|--------|---------------------|--------|
| A | Satispi, E., Ilham, A. M. A., Nursyifa, D., Kencana, F. D., Sulistia, N. A., & Sari, Z. P. (2025). Implementasi Kebijakan SPBE dalam Pelayanan Publik di Kota Depok. *Arus Jurnal Sosial dan Humaniora, 5*(3), 4647–4654. DOI: 10.57250/ajsh.v5i3.1963 | e-government → efisiensi, transparansi, kualitas layanan | ✅ terverifikasi → dipakai sebagai **[5]** |
| B | Bahagia, S. I., Amirulloh, M. R., & Mulyadi, A. (2025). Evaluating the implementation of an electronic-based government system: A lesson from Sukabumi District. *Publisia: Jurnal Ilmu Administrasi Publik, 10*(1), 10–22. DOI: 10.26905/pjiap.v10i1.13824 | Indeks SPBE daerah meningkat signifikan (1,56→3,08) | ✅ terverifikasi → dipakai sebagai **[6]** |
| C | Ninu, A. R., Fanggidae, R. P. C., Dhae, Y. K. I. D. D., & Fanggidae, R. E. (2026). Pengaruh Pengalaman Magang dan Motivasi Siap Kerja terhadap Kesiapan Kerja Mahasiswa (MBKM FEB Undana). *GLORY: Jurnal Ekonomi dan Ilmu Sosial, 7*(1). DOI: 10.70581/glory.v7i1.22805 | Pengalaman magang & motivasi → kesiapan kerja (positif signifikan) | ✅ terverifikasi → kandidat **[3]** |
| D | Darlia, R., Marsofiyati, & Fauzi, A. (2025). Pengaruh pengalaman magang, soft skill, dan motivasi kerja terhadap kesiapan kerja mahasiswa Ekonomi dan Administrasi FEB UNJ. *Neraca: Jurnal Ekonomi, Manajemen dan Akuntansi, 3*(7), 383–393. | Semakin tinggi pengalaman magang → semakin tinggi kesiapan kerja (R² = 0,74) | ✅ terverifikasi → kandidat **[4]** |
| E | Hamda, A. Y., & Susantiningrum, S. (2025). The role of internship mentors in office administration practicum: A qualitative analysis. *JIKAP UNS, 9*(6). https://jurnal.uns.ac.id/JIKAP/article/view/105726 | Peran mentor: bimbingan, pemantauan, dukungan laporan, penilaian kinerja | ✅ terverifikasi → dipakai sebagai **[8]** |
| F | Rahmat, F., Al Haritsi, S., Anjasmara, R. M., & Susilo, E. (2025). Perancangan Aplikasi Pengelolaan Logbook Magang Berbasis Web di BPS Provinsi Riau. *Journal of Accounting Law Communication and Technology, 2*(2). DOI: 10.57235/jalakotek.v2i2.6349 | Logbook tanpa standar baku → pencatatan tidak tertib, disiplin rendah, monitoring sulit; sistem web meningkatkan akuntabilitas | ✅ terverifikasi → dipakai sebagai **[9]** |
| G | Nerita, S., Ambiyar, & Aziz, I. (2022). Evaluasi Program Magang Mahasiswa Kependidikan dengan Model CIPP. *Bioconcetta, 8*(2), 78–87. | Evaluasi berkala program magang sebagai umpan balik perbaikan | ✅ terverifikasi → kandidat **[10]** |
| H | Indriyani, W., Kencono, T. C. A., & Widodo, P. P. (2023). Sistem Informasi Absensi Mahasiswa Magang PHP+MySQL Web di STMIK AMIK Dumai. *JOSTECH, 3*(2), 122–132. DOI: 10.15548/jostech.v3i2.5743 | Presensi QR, pelaporan kegiatan, penilaian, **surat selesai magang** | ✅ terverifikasi → kandidat **[11]** |
| I | Krisna, C. (2026). Sistem Informasi Monitoring Kegiatan Peserta Magang pada Dinas Sosial Kota Batu (Waterfall). *JIPI*. https://jurnal.stkippgritulungagung.ac.id/index.php/jipi/article/view/8074 | Pencatatan manual menyulitkan dokumentasi, evaluasi, rekapitulasi | ✅ terverifikasi → dipakai sebagai **[12]** |
| J | Triadi, A., & Akhdan, M. A. (2026). Perancangan SIMAGANG di Balai Bahasa Provinsi Jambi Berbasis Website. *Jurnal Kreativitas Teknologi dan Komputer*. https://oaj.jurnalhst.com/index.php/jktk/article/view/23122 | Pengelolaan konvensional → absensi tidak efisien, logbook tak terintegrasi, monitoring terbatas | ✅ terverifikasi → dipakai sebagai **[13]** |
| K | Wardana, G. B., & Sopiah, N. (2026). Sistem Informasi Pengelolaan Magang Berbasis Web PT Sampoerna Agro Tbk. *Jurnal Pendidikan Tambusai, 10*(1), 2146–2159. DOI: 10.31004/jptam.v10i1.36379 | Magang manual → keterlambatan olah data, risiko hilang dokumen, minim transparansi | ✅ terverifikasi → belum terpakai di versi final |
| L | Tirto.id — Agustin, S. R. (2026, 17 Juli). Link Daftar Magang Nasional 2026 BPS, Syarat, Jadwal, & Posisi. https://tirto.id/link-pendaftaran-magang-nasional-2026-bps-syarat-jadwal-posisi-kuota-hzQ7 | Kuota Magang Nasional BPS 2026: 5.000 peserta (188 pusat + 4.812 daerah), kerjasama BPS–Kemnaker via MagangHub, 14 posisi, periode 6 bulan | ✅ terverifikasi → dikutip inline `(Tirto.id, 2026)` |

---

## 5. Pemetaan Sitasi Narasi Final

Pemetaan nomor `[n]` pada teks final user terhadap tabel §4:

- **[5]** → A (Satispi dkk., 2025)
- **[6]** → B (Bahagia dkk., 2025)
- **[3]** → C (Ninu dkk., 2026) — *perlu konfirmasi user*
- **[4]** → D (Darlia dkk., 2025) — *perlu konfirmasi user*
- **[8]** → E (Hamda & Susantiningrum, 2025)
- **[9]** → F (Rahmat dkk., 2025)
- **[10]** → G (Nerita dkk., 2022) — *perlu konfirmasi user*
- **[11]** → H (Indriyani dkk., 2023) — *perlu konfirmasi user*
- **[12]** → I (Krisna, 2026)
- **[13]** → J (Triadi & Akhdan, 2026)

⚠️ **Belum terpetakan (user belum memberi sumbernya):**
- **[1]** — klaim "magang sebagai bentuk pengembangan kompetensi melalui pembelajaran dari institusi pendidikan". Kandidat kuat dari riset sebelumnya: Ufia, S., Nugroho, A. D., & Wahjoedi, T. (2024). *Meningkatkan kompetensi mahasiswa melalui program magang sebagai upaya peningkatan hard skill dan soft skill*. Journal of Knowledge and Collaboration, 1(2). DOI: 10.59613/97dmmj73 (ditemukan di daftar rujukan paper E — perlu verifikasi mandiri).
- **[2]** — klaim "link and match perguruan tinggi dengan dunia industri". Belum ada sumber di koleksi.
- **Nomor [7]** — tidak dipakai dalam narasi final (loncat dari [6] ke [8]).

---

## 6. Isu Terbuka / To-Do

1. ☐ Konfirmasi pemetaan [1], [2], [3], [4], [7], [10], [11] dengan user; minta referensi asli untuk [1] dan [2].
2. ☐ Konsistenkan gaya sitasi: saat ini campuran `[n]` (IEEE) dan `(Tirto.id, 2026)` (APA). Rekomendasi: ubah Tirto.id menjadi nomor juga, atau semua ke APA.
3. ☐ Susun **Daftar Referensi/Pustaka** final sesuai nomor urut kutipan (urutan kemunculan pertama jika IEEE).
4. ☐ Perbaiki typo pada teks final: "pengembang kompetensi" → "pengembangan kompetensi"; "pembalajaran" → "pembelajaran"; "menunjukan" → "menunjukkan"; spasi ganda sebelum titik akhir paragraf ("... instansi pemerintah. .").
5. ☐ Simpan teks final user ke file (mis. `docs/laporan/latar-belakang-final.md`) setelah pemetaan sitasi beres.
6. ☐ Catatan substansi: presensi digital *check-in/out* tidak lagi disebut eksplisit di fitur SIGMA versi final (hanya muncul sebagai dokumen "rekap absensi") — pastikan konsisten dengan bab-bab lain.

---

## 7. Konvensi Kerja

- Bahasa Indonesia formal akademik untuk isi laporan; istilah teknis boleh italic bahasa Inggris (*work readiness*, *role-based access control*).
- Penyimpanan dokumen laporan: folder `docs/laporan/`.
- Setiap klaim faktual harus punya sumber; metadata sumber WAJIB diverifikasi dari halaman jurnal aslinya sebelum dikutip.
- Struktur funnel umum→khusus adalah struktur yang disepakati user untuk latar belakang.
