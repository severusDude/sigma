import PizZip from "pizzip"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TEMPLATE_DIR = path.join(__dirname, "..", "templates", "hr")

const TEMPLATES = {
  "assignment-letter": {
    name: "Surat Tugas Magang",
    contentXML: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>SURAT TUGAS</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>Nomor: {nomor_surat}</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:r><w:t>Yang bertanda tangan di bawah ini, Kepala Badan Pusat Statistik Kota Tasikmalaya, menerangkan bahwa:</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Nama</w:t></w:r>
      <w:r><w:t xml:space="preserve">          : {nama_peserta}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>NIK</w:t></w:r>
      <w:r><w:t xml:space="preserve">            : {nik}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Institusi</w:t></w:r>
      <w:r><w:t xml:space="preserve">      : {institusi}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Program</w:t></w:r>
      <w:r><w:t xml:space="preserve">        : {program}</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:r><w:t>Untuk melaksanakan kegiatan magang di </w:t></w:r>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Bidang {bidang}</w:t></w:r>
      <w:r><w:t> pada Badan Pusat Statistik Kota Tasikmalaya, terhitung mulai tanggal </w:t></w:r>
      <w:r><w:rPr><w:b/></w:rPr><w:t>{tanggal_mulai}</w:t></w:r>
      <w:r><w:t> sampai dengan </w:t></w:r>
      <w:r><w:rPr><w:b/></w:rPr><w:t>{tanggal_selesai}</w:t></w:r>
      <w:r><w:t>.</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:r><w:t>Pembimbing magang ditugaskan kepada:</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Pembimbing</w:t></w:r>
      <w:r><w:t xml:space="preserve">   : {nama_pembimbing}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>NIP</w:t></w:r>
      <w:r><w:t xml:space="preserve">            : {nip_pembimbing}</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:r><w:t>Demikian surat tugas ini dibuat untuk dilaksanakan dengan penuh tanggung jawab.</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:t>Tasikmalaya, {tanggal_surat}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:t>Kepala BPS Kota Tasikmalaya</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:rPr><w:b/><w:u w:val="single"/></w:rPr><w:t>{ttd_nama}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:t>{ttd_nip}</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`,
  },

  "assessment-report": {
    name: "Laporan Penilaian Magang",
    contentXML: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>LAPORAN PENILAIAN MAGANG</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Nama Peserta</w:t></w:r>
      <w:r><w:t xml:space="preserve">  : {nama_peserta}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>NIK</w:t></w:r>
      <w:r><w:t xml:space="preserve">                : {nik}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Institusi</w:t></w:r>
      <w:r><w:t xml:space="preserve">          : {institusi}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Bidang</w:t></w:r>
      <w:r><w:t xml:space="preserve">              : {bidang}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Periode Penilaian</w:t></w:r>
      <w:r><w:t xml:space="preserve"> : {periode_penilaian}</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Komponen Penilaian:</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/>
          <w:left w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/>
          <w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="2000" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Komponen</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/><w:jc w:val="center"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Bobot (%)</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/><w:jc w:val="center"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Nilai</w:t></w:r></w:p></w:tc>
      </w:tr>
      {#komponen}
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="2000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>{nama_komponen}</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/><w:jc w:val="center"/></w:tcPr><w:p><w:r><w:t>{bobot}</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/><w:jc w:val="center"/></w:tcPr><w:p><w:r><w:t>{nilai}</w:t></w:r></w:p></w:tc>
      </w:tr>
      {/komponen}
    </w:tbl>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Skor Akhir</w:t></w:r>
      <w:r><w:t xml:space="preserve">          : {skor_akhir}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Nilai Huruf</w:t></w:r>
      <w:r><w:t xml:space="preserve">         : {nilai_huruf}</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Catatan:</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:t>{catatan}</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:t>Tasikmalaya, {tanggal_surat}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:t>Pembimbing Magang</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:rPr><w:b/><w:u w:val="single"/></w:rPr><w:t>{nama_pembimbing}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:t>NIP. {nip_pembimbing}</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`,
  },

  "attendance-report": {
    name: "Rekap Absensi Magang",
    contentXML: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>REKAP ABSENSI MAGANG</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Nama Peserta</w:t></w:r>
      <w:r><w:t xml:space="preserve">  : {nama_peserta}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>NIK</w:t></w:r>
      <w:r><w:t xml:space="preserve">                : {nik}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Bidang</w:t></w:r>
      <w:r><w:t xml:space="preserve">              : {bidang}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Periode</w:t></w:r>
      <w:r><w:t xml:space="preserve">              : {periode}</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Rekapitulasi Kehadiran:</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/>
          <w:left w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/>
          <w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/>
        </w:tblBorders>
      </w:tblPr>
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Tanggal</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/><w:jc w:val="center"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Masuk</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/><w:jc w:val="center"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Pulang</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/><w:jc w:val="center"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Status</w:t></w:r></w:p></w:tc>
      </w:tr>
      {#absensi}
      <w:tr>
        <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>{tanggal}</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/><w:jc w:val="center"/></w:tcPr><w:p><w:r><w:t>{masuk}</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/><w:jc w:val="center"/></w:tcPr><w:p><w:r><w:t>{pulang}</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:tcW w:w="1500" w:type="dxa"/><w:jc w:val="center"/></w:tcPr><w:p><w:r><w:t>{status}</w:t></w:r></w:p></w:tc>
      </w:tr>
      {/absensi}
    </w:tbl>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Total Hadir</w:t></w:r>
      <w:r><w:t xml:space="preserve">     : {total_hadir} hari</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Total Izin</w:t></w:r>
      <w:r><w:t xml:space="preserve">      : {total_izin} hari</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Total Tanpa Keterangan</w:t></w:r>
      <w:r><w:t xml:space="preserve"> : {total_alpha} hari</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:t>Tasikmalaya, {tanggal_surat}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:t>Kepala BPS Kota Tasikmalaya</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:rPr><w:b/><w:u w:val="single"/></w:rPr><w:t>{ttd_nama}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:t>{ttd_nip}</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`,
  },

  "completion-letter": {
    name: "Surat Keterangan Selesai Magang",
    contentXML: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>SURAT KETERANGAN SELESAI MAGANG</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>Nomor: {nomor_surat}</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:r><w:t>Yang bertanda tangan di bawah ini, Kepala Badan Pusat Statistik Kota Tasikmalaya, menerangkan dengan sesungguhnya bahwa:</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Nama</w:t></w:r>
      <w:r><w:t xml:space="preserve">          : {nama_peserta}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>NIK</w:t></w:r>
      <w:r><w:t xml:space="preserve">            : {nik}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Institusi</w:t></w:r>
      <w:r><w:t xml:space="preserve">      : {institusi}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Program</w:t></w:r>
      <w:r><w:t xml:space="preserve">        : {program}</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Bidang</w:t></w:r>
      <w:r><w:t xml:space="preserve">          : {bidang}</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:r><w:t>Telah melaksanakan kegiatan magang di </w:t></w:r>
      <w:r><w:rPr><w:b/></w:rPr><w:t>Bidang {bidang}</w:t></w:r>
      <w:r><w:t> Badan Pusat Statistik Kota Tasikmalaya, terhitung mulai tanggal </w:t></w:r>
      <w:r><w:rPr><w:b/></w:rPr><w:t>{tanggal_mulai}</w:t></w:r>
      <w:r><w:t> sampai dengan </w:t></w:r>
      <w:r><w:rPr><w:b/></w:rPr><w:t>{tanggal_selesai}</w:t></w:r>
      <w:r><w:t>.</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:r><w:t>Selama melaksanakan magang, yang bersangkutan telah menunjukkan kinerja yang baik dan menyelesaikan tugas-tugas yang diberikan.</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:r><w:t>Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:t>Tasikmalaya, {tanggal_surat}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:t>Kepala BPS Kota Tasikmalaya</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p><w:r><w:t xml:space="preserve"> </w:t></w:r></w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:rPr><w:b/><w:u w:val="single"/></w:rPr><w:t>{ttd_nama}</w:t></w:r>
    </w:p>
    <w:p>
      <w:pPr><w:jc w:val="right"/></w:pPr>
      <w:r><w:t>{ttd_nip}</w:t></w:r>
    </w:p>
  </w:body>
</w:document>`,
  },
}

function createDOCX(contentXML) {
  const Content_Types = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

  const _rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

  const stylesXML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr><w:sz w:val="22"/><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/></w:rPr>
  </w:style>
</w:styles>`

  const zip = new PizZip()
  zip.file("[Content_Types].xml", Content_Types)
  zip.file("_rels/.rels", _rels)
  zip.file("word/_rels/document.xml.rels", wordRels)
  zip.file("word/document.xml", contentXML)
  zip.file("word/styles.xml", stylesXML)

  return zip.generate({ type: "nodebuffer" })
}

if (!fs.existsSync(TEMPLATE_DIR)) {
  fs.mkdirSync(TEMPLATE_DIR, { recursive: true })
}

for (const [name, template] of Object.entries(TEMPLATES)) {
  const outputPath = path.join(TEMPLATE_DIR, `${name}.docx`)
  const buf = createDOCX(template.contentXML)
  fs.writeFileSync(outputPath, buf)
  console.log(`[OK] ${outputPath} — ${template.name}`)
}

console.log(`\nAll ${Object.keys(TEMPLATES).length} templates generated successfully.`)
