import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getObjectBuffer } from "@/services/storage";
import {
  generateCertificatePdf,
  type TextField,
} from "@/lib/pdf-certificate";

const DUMMY_DATA: Record<string, string> = {
  nama_peserta: "Ahmad Fauzi",
  nomor_sertifikat: "CERT-TEST-001",
  nik: "3273010101010001",
  institusi: "Universitas Indonesia",
  program: "Magang Merdeka",
  bidang: "Teknologi Informasi",
  tanggal_mulai: "01 Januari 2026",
  tanggal_selesai: "31 Maret 2026",
  nama_pembimbing: "Dr. Budi Santoso, S.Kom., M.Kom.",
  nip_pembimbing: "198501012010011001",
  tanggal_sertifikat: "28 Juli 2026",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const template = await prisma.documentTemplate.findUnique({
    where: { id },
    select: { content: true },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  let fields: TextField[];
  try {
    const body = await request.json();
    fields = body.fields;
    if (!Array.isArray(fields)) {
      return NextResponse.json({ error: "Invalid fields" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const textFields: TextField[] = fields.map((cfg: TextField) => ({
    ...cfg,
    value: DUMMY_DATA[cfg.name] ?? "",
  }));

  let templatePdfBuffer: Buffer;
  try {
    templatePdfBuffer = await getObjectBuffer(template.content);
  } catch {
    return NextResponse.json(
      { error: "Gagal memuat file template" },
      { status: 500 },
    );
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await generateCertificatePdf(templatePdfBuffer, textFields);
  } catch {
    return NextResponse.json(
      { error: "Gagal generate PDF" },
      { status: 500 },
    );
  }

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="test-certificate.pdf"`,
    },
  });
}
