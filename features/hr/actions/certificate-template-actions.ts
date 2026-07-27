"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { updateTag } from "next/cache";
import type { ActionResponse } from "@/lib/types";
import {
  uploadFromBuffer,
  buildTemplateKey,
  validateFileType,
  validateFileSize,
  ALLOWED_TEMPLATE_MIME_TYPES,
} from "@/services/storage";
import { assertStorageHealthy, StorageError } from "@/services/storage-health";
import { getDefaultCertificateFields, type TextField } from "@/lib/pdf-certificate";

export type CertificateTemplateInfo = {
  id: string;
  name: string;
  content: string;
  variables: TextField[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export async function uploadCertificateTemplate(
  prevState: ActionResponse<CertificateTemplateInfo> | null,
  formData: FormData,
): Promise<ActionResponse<CertificateTemplateInfo>> {
  try {
    await requirePermission({ document: ["create"] });

    const file = formData.get("file") as File;
    const name = formData.get("name") as string;

    if (!file || !name) {
      return {
        success: false,
        error: "File dan nama template harus diisi",
      };
    }

    if (!file.name.endsWith(".pdf")) {
      return {
        success: false,
        error: "File harus berformat .pdf (export dari Canva)",
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const fileName = `certificate-${Date.now()}.pdf`;

    validateFileType(fileName, ALLOWED_TEMPLATE_MIME_TYPES);
    validateFileSize(buffer.length, "template");
    await assertStorageHealthy();

    const r2Key = buildTemplateKey("certificate", fileName);

    const defaultFields = getDefaultCertificateFields();

    const template = await prisma.documentTemplate.create({
      data: {
        documentType: "certificate",
        name,
        content: r2Key,
        variables: JSON.parse(JSON.stringify(defaultFields)),
        isActive: false,
      },
    });

    await uploadFromBuffer(
      r2Key,
      buffer,
      "application/pdf",
      "template",
    );

    updateTag("document-templates");

    return {
      success: true,
      data: {
        id: template.id,
        name: template.name,
        content: template.content,
        variables: template.variables as TextField[],
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
            : "Gagal mengunggah template sertifikat",
      retryable: error instanceof StorageError ? error.retryable : undefined,
    };
  }
}

export async function saveCertificateFieldConfig(
  templateId: string,
  fields: TextField[],
): Promise<ActionResponse<CertificateTemplateInfo>> {
  try {
    await requirePermission({ document: ["create"] });

    const template = await prisma.documentTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return { success: false, error: "Template tidak ditemukan" };
    }

    if (template.documentType !== "certificate") {
      return { success: false, error: "Template ini bukan template sertifikat" };
    }

    const validated = fields.map((f) => ({
      name: f.name,
      value: f.value ?? "",
      x: Math.round(f.x),
      y: Math.round(f.y),
      size: Math.round(f.size),
      font: f.font ?? "Inter",
      align: f.align ?? "left",
      color: f.color ?? { r: 0, g: 0, b: 0 },
    }));

    await prisma.documentTemplate.updateMany({
      where: { documentType: "certificate", isActive: true },
      data: { isActive: false },
    });

    const updated = await prisma.documentTemplate.update({
      where: { id: templateId },
      data: {
        variables: JSON.parse(JSON.stringify(validated)),
        isActive: true,
      },
    });

    updateTag("document-templates");

    return {
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        content: updated.content,
        variables: updated.variables as TextField[],
        isActive: updated.isActive,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal menyimpan konfigurasi",
    };
  }
}

export async function listCertificateTemplates(): Promise<
  ActionResponse<CertificateTemplateInfo[]>
> {
  try {
    await requirePermission({ document: ["read"] });

    const templates = await prisma.documentTemplate.findMany({
      where: { documentType: "certificate" },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: templates.map((t) => ({
        id: t.id,
        name: t.name,
        content: t.content,
        variables: t.variables as TextField[],
        isActive: t.isActive,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal memuat template sertifikat",
    };
  }
}

export async function deleteCertificateTemplate(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission({ document: ["delete"] });
    await assertStorageHealthy();

    const template = await prisma.documentTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return { success: false, error: "Template tidak ditemukan" };
    }

    if (template.documentType !== "certificate") {
      return { success: false, error: "Template ini bukan template sertifikat" };
    }

    await prisma.documentTemplate.delete({ where: { id } });
    updateTag("document-templates");

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
