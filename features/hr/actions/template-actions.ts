"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { updateTag } from "next/cache";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import type { ActionResponse } from "@/lib/types";
import {
  uploadFromBuffer,
  deleteObject,
  buildTemplateKey,
  validateFileType,
  validateFileSize,
  ALLOWED_TEMPLATE_MIME_TYPES,
} from "@/services/storage";
import { assertStorageHealthy, StorageError } from "@/services/storage-health";

export type TemplateRow = {
  id: string;
  documentType: string;
  name: string;
  filePath: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function uploadTemplate(
  prevState: ActionResponse<TemplateRow> | null,
  formData: FormData,
): Promise<ActionResponse<TemplateRow>> {
  try {
    await requirePermission({ document: ["create"] });

    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;
    const name = formData.get("name") as string;

    if (!file || !documentType || !name) {
      return {
        success: false,
        error: "File, tipe dokumen, dan nama template harus diisi",
      };
    }

    if (!file.name.endsWith(".docx")) {
      return {
        success: false,
        error: "File harus berformat .docx",
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      const zip = new PizZip(buffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });
      doc.render({});
    } catch {
      return {
        success: false,
        error:
          "Template tidak valid. Pastikan semua tag Docxtemplater ditulis dengan benar (contoh: {nama})",
      };
    }

    const existing = await prisma.documentTemplate.findFirst({
      where: { documentType: documentType as "assignment_letter" | "assessment_report" | "attendance_report" | "completion_letter" },
      select: { name: true, id: true },
    });

    if (existing) {
      return {
        success: false,
        error: `Template untuk kategori ini sudah ada ("${existing.name}"). Hapus template yang ada terlebih dahulu jika ingin menggantinya.`,
      };
    }

    const fileName = `${documentType}-${Date.now()}.docx`

    validateFileType(fileName, ALLOWED_TEMPLATE_MIME_TYPES)
    validateFileSize(buffer.length, "template")
    await assertStorageHealthy()

    const r2Key = buildTemplateKey(documentType, fileName)

    await prisma.documentTemplate.updateMany({
      where: { documentType: documentType as "assignment_letter" | "assessment_report" | "attendance_report" | "completion_letter", isActive: true },
      data: { isActive: false },
    });

    const template = await prisma.documentTemplate.create({
      data: {
        documentType: documentType as "assignment_letter" | "assessment_report" | "attendance_report" | "completion_letter",
        name,
        content: r2Key,
        variables: getVariablesForType(documentType),
        isActive: true,
      },
    });

    await uploadFromBuffer(
      r2Key,
      buffer,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "template",
    )

    updateTag("document-templates");

    return {
      success: true,
      data: {
        id: template.id,
        documentType: template.documentType,
        name: template.name,
        filePath: template.content,
        variables: template.variables as string[],
        isActive: template.isActive,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof StorageError
          ? error.userMessage
          : error instanceof Error
            ? error.message
            : "Gagal mengunggah template",
      retryable: error instanceof StorageError ? error.retryable : undefined,
    };
  }
}

export async function listTemplates(): Promise<
  ActionResponse<TemplateRow[]>
> {
  try {
    await requirePermission({ document: ["read"] });

    const templates = await prisma.documentTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: templates.map((t) => ({
        id: t.id,
        documentType: t.documentType,
        name: t.name,
        filePath: t.content,
        variables: t.variables as string[],
        isActive: t.isActive,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal memuat template",
    };
  }
}

export async function deleteTemplate(id: string): Promise<ActionResponse<void>> {
  try {
    await requirePermission({ document: ["delete"] });
    await assertStorageHealthy();

    const template = await prisma.documentTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return { success: false, error: "Template tidak ditemukan" };
    }

    await prisma.documentTemplate.delete({ where: { id } });
    updateTag("document-templates");

    if (template.content) {
      await deleteObject(template.content).catch(() => {
        // ignore — stale R2 orphan acceptable
      })
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof StorageError
          ? error.userMessage
          : error instanceof Error
            ? error.message
            : "Gagal menghapus template",
      retryable: error instanceof StorageError ? error.retryable : undefined,
    };
  }
}

export async function setActiveTemplate(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission({ document: ["create"] });

    const target = await prisma.documentTemplate.findUnique({
      where: { id },
    });

    if (!target) {
      return { success: false, error: "Template tidak ditemukan" };
    }

    await prisma.documentTemplate.updateMany({
      where: {
        documentType: target.documentType,
        isActive: true,
      },
      data: { isActive: false },
    });

    await prisma.documentTemplate.update({
      where: { id },
      data: { isActive: true },
    });

    updateTag("document-templates");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal mengaktifkan template",
    };
  }
}

function getVariablesForType(documentType: string): string[] {
  switch (documentType) {
    case "assignment_letter":
      return [
        "nomor_surat",
        "nama_peserta",
        "nik",
        "institusi",
        "program",
        "bidang",
        "tanggal_mulai",
        "tanggal_selesai",
        "nama_pembimbing",
        "nip_pembimbing",
        "tanggal_surat",
        "ttd_nama",
        "ttd_nip",
      ];
    case "assessment_report":
      return [
        "nama_peserta",
        "nik",
        "institusi",
        "bidang",
        "periode_penilaian",
        "komponen",
        "skor_akhir",
        "nilai_huruf",
        "catatan",
        "nama_pembimbing",
        "nip_pembimbing",
        "tanggal_surat",
      ];
    case "attendance_report":
      return [
        "nama_peserta",
        "nik",
        "bidang",
        "periode",
        "absensi",
        "total_hadir",
        "total_izin",
        "total_alpha",
        "ttd_nama",
        "ttd_nip",
        "tanggal_surat",
      ];
    case "completion_letter":
      return [
        "nomor_surat",
        "nama_peserta",
        "nik",
        "institusi",
        "program",
        "bidang",
        "tanggal_mulai",
        "tanggal_selesai",
        "tanggal_surat",
        "ttd_nama",
        "ttd_nip",
      ];
    default:
      return [];
  }
}


