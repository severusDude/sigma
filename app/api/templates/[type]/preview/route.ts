import { renderToBuffer } from "@react-pdf/renderer";
import { NextRequest } from "next/server";
import type { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { generateFromTemplate } from "@/lib/docxtemplater";
import path from "path";
import fs from "fs";
import mammoth from "mammoth";
import { InternshipCertificate } from "@/features/hr/components/document/templates/certificates";
import { DocumentType } from "@/generated/prisma/client";

const SAMPLE_DATA: Record<string, Record<string, unknown>> = {
  assignment_letter: {
    nomor_surat: "ST/2026/07/999",
    nama_peserta: "Nama Peserta Magang",
    nik: "3578XXXXXXXXXXXX",
    institusi: "Universitas Contoh",
    program: "Magang",
    bidang: "Statistik Sosial",
    tanggal_mulai: "1 Juli 2026",
    tanggal_selesai: "31 Desember 2026",
    nama_pembimbing: "Dr. Pembimbing Magang",
    nip_pembimbing: "198001012010011001",
    tanggal_surat: "22 Juli 2026",
    ttd_nama: "Kepala BPS Provinsi Jawa Timur",
    ttd_nip: "196512311990031001",
  },
  assessment_report: {
    nama_peserta: "Nama Peserta Magang",
    nik: "3578XXXXXXXXXXXX",
    institusi: "Universitas Contoh",
    bidang: "Statistik Sosial",
    periode_penilaian: "1 Juli — 31 Desember 2026",
    komponen: [
      { nama_komponen: "Kedisiplinan", bobot: "25", nilai: "90.00" },
      { nama_komponen: "Kualitas Kerja", bobot: "35", nilai: "85.00" },
      { nama_komponen: "Kerjasama Tim", bobot: "25", nilai: "88.00" },
      { nama_komponen: "Inisiatif", bobot: "15", nilai: "82.00" },
    ],
    skor_akhir: "86.50",
    nilai_huruf: "A",
    catatan: "Peserta menunjukkan kinerja yang sangat baik selama periode magang.",
    nama_pembimbing: "Dr. Pembimbing Magang",
    nip_pembimbing: "198001012010011001",
    tanggal_surat: "22 Juli 2026",
    ttd_nama: "Kepala BPS Provinsi Jawa Timur",
    ttd_nip: "196512311990031001",
  },
  attendance_report: {
    nama_peserta: "Nama Peserta Magang",
    nik: "3578XXXXXXXXXXXX",
    bidang: "Statistik Sosial",
    periode: "1 Juli — 31 Desember 2026",
    absensi: [
      { tanggal: "1 Juli 2026", masuk: "08:00", pulang: "16:00", status: "Hadir" },
      { tanggal: "2 Juli 2026", masuk: "08:15", pulang: "16:00", status: "Hadir" },
      { tanggal: "3 Juli 2026", masuk: "-", pulang: "-", status: "Izin" },
      { tanggal: "4 Juli 2026", masuk: "08:00", pulang: "16:00", status: "Hadir" },
      { tanggal: "5 Juli 2026", masuk: "-", pulang: "-", status: "Alpha" },
    ],
    total_hadir: "3",
    total_izin: "1",
    total_alpha: "1",
    ttd_nama: "Kepala BPS Provinsi Jawa Timur",
    ttd_nip: "196512311990031001",
    tanggal_surat: "22 Juli 2026",
  },
  completion_letter: {
    nomor_surat: "SK/2026/07/999",
    nama_peserta: "Nama Peserta Magang",
    nik: "3578XXXXXXXXXXXX",
    institusi: "Universitas Contoh",
    program: "Magang",
    bidang: "Statistik Sosial",
    tanggal_mulai: "1 Juli 2026",
    tanggal_selesai: "31 Desember 2026",
    tanggal_surat: "22 Juli 2026",
    ttd_nama: "Kepala BPS Provinsi Jawa Timur",
    ttd_nip: "196512311990031001",
  },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;

  if (type === "certificate") {
    const element = InternshipCertificate({
      recipientName: "Nama Peserta Magang",
      organization: "Badan Pusat Statistik Provinsi Jawa Timur",
      dateRange: "1 Januari — 31 Desember 2026",
      signerTitle: ["Kepala Badan Pusat Statistik", "Provinsi Jawa Timur"],
      signerName: "Dr. Ir. Zulkipli, M.Si.",
    }) as ReactElement<DocumentProps>;

    const buffer = await renderToBuffer(element);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
      },
    });
  }

  const docType = type as DocumentType;
  const active = await prisma.documentTemplate.findFirst({
    where: { documentType: docType, isActive: true },
    select: { content: true },
  });

  if (!active) {
    return new Response("Template tidak ditemukan", { status: 404 });
  }

  const uploadedPath = path.resolve(active.content);
  if (!fs.existsSync(uploadedPath)) {
    return new Response("File template tidak ditemukan", { status: 404 });
  }

  const templateBuffer = fs.readFileSync(uploadedPath);
  const data = SAMPLE_DATA[type];

  if (!data) {
    return new Response("Tipe dokumen tidak dikenal", { status: 400 });
  }

  const docxBuf = generateFromTemplate(templateBuffer, data);

  const { value: html } = await mammoth.convertToHtml({
    buffer: docxBuf,
  });

  const styled = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Preview Template</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 12pt;
    line-height: 1.6;
    color: #1a1a1a;
    padding: 40px;
    background: #fff;
    max-width: 800px;
    margin: 0 auto;
  }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  td, th { border: 1px solid #ccc; padding: 6px 8px; font-size: 11pt; }
  p { margin-bottom: 6px; }
  img { max-width: 100%; height: auto; }
  .preview-badge {
    position: fixed;
    top: 12px; right: 12px;
    background: #f0f0f0;
    color: #666;
    font-family: system-ui, sans-serif;
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 4px;
    border: 1px solid #ddd;
  }
</style>
</head>
<body>
<div class="preview-badge">PREVIEW</div>
${html}
</body>
</html>`;

  return new Response(styled, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
