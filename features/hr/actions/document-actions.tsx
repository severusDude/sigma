"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { generateDocumentNumber } from "../utils/document-number";
import { generateFromTemplate } from "@/lib/docxtemplater";
import { generateCertificatePdf, type TextField } from "@/lib/pdf-certificate";
import type { ActionResponse } from "@/lib/types";
import { DocumentType } from "@/generated/prisma/client";
import path from "path";
import fs from "fs";
import {
  uploadFromBuffer,
  buildDocumentKey,
  fetchTemplateFromR2,
  buildTemplateKey,
} from "@/services/storage"
import { assertStorageHealthy, StorageError } from "@/services/storage-health"

export type GenerateDocResult = {
  internId: string;
  internName: string;
  docNumber: string | null;
  filePath: string | null;
  error?: string;
};

export type CompletenessError = {
  internName: string;
  missingFields: string[];
};

export async function validateInternsCompleteness(
  internIds: string[],
  documentType: DocumentType,
): Promise<CompletenessError[]> {
  if (internIds.length === 0) return [];

  const users = await prisma.user.findMany({
    where: { id: { in: internIds } },
    include: {
      internProfile: {
        include: {
          department: { select: { name: true } },
          supervisorAssignments: {
            where: { endedAt: null },
            take: 1,
            include: {
              supervisorProfile: {
                select: {
                  nip: true,
                  user: { select: { name: true } },
                },
              },
            },
          },
          assessments: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  const errors: CompletenessError[] = [];

  for (const user of users) {
    const intern = user.internProfile;
    const missingFields: string[] = [];

    if (!intern) {
      errors.push({
        internName: user.name,
        missingFields: ["Profil intern tidak ditemukan"],
      });
      continue;
    }

    const supervisor = intern.supervisorAssignments[0]?.supervisorProfile;

    if (!user.name) missingFields.push("Nama peserta");
    if (!intern.nik) missingFields.push("NIK");
    if (!intern.institution) missingFields.push("Institusi");
    if (!intern.department?.name) missingFields.push("Bidang penempatan");
    if (!intern.periodStart) missingFields.push("Tanggal mulai");
    if (!intern.periodEnd) missingFields.push("Tanggal selesai");

    switch (documentType) {
      case DocumentType.certificate:
      case DocumentType.assignment_letter:
      case DocumentType.completion_letter:
        if (!supervisor) {
          missingFields.push("Pembimbing lapangan belum ditetapkan");
        } else {
          if (!supervisor.user?.name) missingFields.push("Nama pembimbing");
          if (!supervisor.nip) missingFields.push("NIP pembimbing");
        }
        break;

      case DocumentType.assessment_report:
        if (!supervisor) {
          missingFields.push("Pembimbing lapangan belum ditetapkan");
        } else {
          if (!supervisor.user?.name) missingFields.push("Nama pembimbing");
          if (!supervisor.nip) missingFields.push("NIP pembimbing");
        }
        if (!intern.assessments?.[0]) {
          missingFields.push("Data penilaian (nilai akhir, nilai huruf) belum diisi oleh pembimbing");
        } else {
          if (intern.assessments[0].finalScore == null) missingFields.push("Skor akhir penilaian");
          if (!intern.assessments[0].finalGrade) missingFields.push("Nilai huruf akhir");
        }
        break;

      case DocumentType.attendance_report:
        break;
    }

    if (missingFields.length > 0) {
      errors.push({ internName: user.name, missingFields });
    }
  }

  return errors;
}

async function getInternData(internId: string) {
  return prisma.user.findUnique({
    where: { id: internId },
    include: {
      internProfile: {
        include: {
          department: true,
          supervisorAssignments: {
            where: { endedAt: null },
            include: {
              supervisorProfile: {
                include: { user: true },
              },
            },
          },
          assessments: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              components: true,
            },
          },
        },
      },
    },
  });
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(d));
}

function formatDateShort(d: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

async function saveDocumentRecord(
  internProfileId: string,
  documentType: string,
  docNumber: string,
  title: string,
  fileUrl: string,
) {
  return prisma.document.create({
    data: {
      internProfileId,
      documentType: documentType as DocumentType,
      documentNumber: docNumber,
      title,
      fileUrl,
      status: "draft",
      metadata: { generatedAt: new Date().toISOString() },
    },
  });
}

export async function getInternDocuments(internProfileId: string) {
  return prisma.document.findMany({
    where: { internProfileId },
    select: {
      id: true,
      documentType: true,
      fileUrl: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

export type ExistingDocInfo = {
  internId: string
  internName: string
  docNumber: string
  status: string
}

export async function filterExistingDocuments(
  internIds: string[],
  documentType: DocumentType,
) {
  if (internIds.length === 0) return { duplicates: [], cleanIds: [] as string[] }

  const users = await prisma.user.findMany({
    where: { id: { in: internIds } },
    select: { id: true, name: true, internProfile: { select: { id: true } } },
  })

  const profileMap = users
    .filter((u) => u.internProfile)
    .map((u) => ({ userId: u.id, name: u.name, internProfileId: u.internProfile!.id }))

  const existing = await prisma.document.findMany({
    where: {
      internProfileId: { in: profileMap.map((i) => i.internProfileId) },
      documentType,
    },
    select: { internProfileId: true, documentNumber: true, status: true },
  })

  const existingMap = new Map(existing.map((e) => [e.internProfileId, e]))

  const duplicates: ExistingDocInfo[] = []
  const cleanIds: string[] = []

  for (const u of profileMap) {
    const det = existingMap.get(u.internProfileId)
    if (det) {
      duplicates.push({ internId: u.userId, internName: u.name, docNumber: det.documentNumber, status: det.status })
    } else {
      cleanIds.push(u.userId)
    }
  }

  return { duplicates, cleanIds }
}

export async function generateCertificates(
  internIds: string[],
): Promise<ActionResponse<GenerateDocResult[]>> {
  try {
    await requirePermission({ document: ["create"] });
    await assertStorageHealthy();

    const activeTemplate = await prisma.documentTemplate.findFirst({
      where: { documentType: "certificate", isActive: true },
      select: { content: true, variables: true },
    });

    if (!activeTemplate) {
      throw new Error(
        "TEMPLATE_NOT_FOUND:Template sertifikat belum tersedia. Silahkan upload template terlebih dahulu di menu Kelola Template.",
      );
    }

    const fieldConfigs = JSON.parse(JSON.stringify(activeTemplate.variables)) as TextField[];

    let templatePdfBuffer: Buffer | null = null;
    try {
      templatePdfBuffer = await fetchTemplateFromR2(activeTemplate.content);
    } catch {
      throw new Error("Gagal memuat template sertifikat dari penyimpanan.");
    }

    const results: GenerateDocResult[] = [];

    for (const internId of internIds) {
      try {
        const user = await getInternData(internId);

        if (!user?.internProfile) {
          results.push({
            internId,
            internName: user?.name ?? "Unknown",
            docNumber: null,
            filePath: null,
            error: "Intern profile not found",
          });
          continue;
        }

        const intern = user.internProfile;
        const supervisor = intern.supervisorAssignments[0]?.supervisorProfile;

        const docNumber = await generateDocumentNumber("CERT");

        const fieldValues: Record<string, string> = {
          nama_peserta: user.name,
          nomor_sertifikat: docNumber,
          nik: intern.nik ?? "",
          institusi: intern.institution ?? "",
          program: "Magang",
          bidang: intern.department?.name ?? "",
          tanggal_mulai: formatDate(intern.periodStart),
          tanggal_selesai: formatDate(intern.periodEnd),
          nama_pembimbing: supervisor?.user?.name ?? "",
          nip_pembimbing: supervisor?.nip ?? "",
          tanggal_sertifikat: formatDate(new Date()),
        };

        const textFields: TextField[] = fieldConfigs.map((cfg) => ({
          name: cfg.name,
          value: fieldValues[cfg.name] ?? "",
          x: cfg.x,
          y: cfg.y,
          size: cfg.size,
          font: cfg.font ?? "Inter",
          align: cfg.align ?? "left",
          color: cfg.color,
        }));

        const pdfBuffer = await generateCertificatePdf(
          templatePdfBuffer,
          textFields,
        );

        const r2Key = buildDocumentKey("certificates", docNumber, ".pdf");

        await saveDocumentRecord(
          intern.id,
          "certificate",
          docNumber,
          "Sertifikat Magang",
          r2Key,
        );

        await uploadFromBuffer(r2Key, pdfBuffer, "application/pdf");

        results.push({
          internId,
          internName: user.name,
          docNumber,
          filePath: r2Key,
        });
      } catch (e) {
        const name =
          (
            await prisma.user.findUnique({
              where: { id: internId },
              select: { name: true },
            })
          )?.name ?? "Unknown";
        results.push({
          internId,
          internName: name,
          docNumber: null,
          filePath: null,
          error: e instanceof StorageError
            ? e.userMessage
            : e instanceof Error
              ? e.message
              : "Unknown error",
        });
      }
    }

    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof StorageError
          ? error.userMessage
          : error instanceof Error
            ? error.message
            : "Failed to generate certificates",
      retryable: error instanceof StorageError ? error.retryable : undefined,
    };
  }
}

export async function generateAssignmentLetter(
  internIds: string[],
): Promise<ActionResponse<GenerateDocResult[]>> {
  try {
    await requirePermission({ document: ["create"] });
    await assertStorageHealthy()

    const results: GenerateDocResult[] = [];

    for (const internId of internIds) {
      try {
        const user = await getInternData(internId);

        if (!user?.internProfile) {
          results.push({
            internId,
            internName: user?.name ?? "Unknown",
            docNumber: null,
            filePath: null,
            error: "Intern profile not found",
          });
          continue;
        }

        const intern = user.internProfile;
        const supervisor = intern.supervisorAssignments[0]?.supervisorProfile;
        const docNumber = await generateDocumentNumber("ST");

        const templateBuffer = await getActiveTemplate("assignment_letter");

        const data = {
          nomor_surat: docNumber,
          nama_peserta: user.name,
          nik: intern.nik,
          institusi: intern.institution,
          program: "Magang",
          bidang: intern.department?.name ?? "-",
          tanggal_mulai: formatDate(intern.periodStart),
          tanggal_selesai: formatDate(intern.periodEnd),
          nama_pembimbing: supervisor?.user?.name ?? "-",
          nip_pembimbing: supervisor?.nip ?? "-",
          tanggal_surat: formatDate(new Date()),
          ttd_nama: "",
          ttd_nip: "",
        };

        const buf = generateFromTemplate(templateBuffer, data);
        const r2Key = buildDocumentKey("assignment-letters", docNumber, ".docx");

        await saveDocumentRecord(
          intern.id,
          "assignment_letter",
          docNumber,
          "Surat Tugas Magang",
          r2Key,
        );

        await uploadFromBuffer(
          r2Key,
          buf,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        );

        results.push({
          internId,
          internName: user.name,
          docNumber,
          filePath: r2Key,
        });
      } catch (e) {
        const name =
          (
            await prisma.user.findUnique({
              where: { id: internId },
              select: { name: true },
            })
          )?.name ?? "Unknown";
        results.push({
          internId,
          internName: name,
          docNumber: null,
          filePath: null,
          error: e instanceof StorageError
            ? e.userMessage
            : e instanceof Error
              ? e.message
              : "Unknown error",
        });
      }
    }

    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof StorageError
          ? error.userMessage
          : error instanceof Error
            ? error.message
            : "Failed to generate letters",
      retryable: error instanceof StorageError ? error.retryable : undefined,
    };
  }
}

export async function generateAssessmentReport(
  internIds: string[],
): Promise<ActionResponse<GenerateDocResult[]>> {
  try {
    await requirePermission({ document: ["create"] });
    await assertStorageHealthy()

    const results: GenerateDocResult[] = [];

    for (const internId of internIds) {
      try {
        const user = await getInternData(internId);

        if (!user?.internProfile) {
          results.push({
            internId,
            internName: user?.name ?? "Unknown",
            docNumber: null,
            filePath: null,
            error: "Intern profile not found",
          });
          continue;
        }

        const intern = user.internProfile;
        const supervisor = intern.supervisorAssignments[0]?.supervisorProfile;
        const assessment = intern.assessments[0];
        const docNumber = await generateDocumentNumber("NILAI");

        const templateBuffer = await getActiveTemplate("assessment_report");

        const data = {
          nama_peserta: user.name,
          nik: intern.nik,
          institusi: intern.institution,
          bidang: intern.department?.name ?? "-",
          periode_penilaian: assessment
            ? `${formatDateShort(assessment.periodStart)} — ${formatDateShort(assessment.periodEnd)}`
            : "-",
          komponen: assessment?.components?.length
            ? assessment.components.map((c) => ({
                nama_komponen: c.name,
                bobot: String(c.weight),
                nilai: c.score?.toFixed(2) ?? "-",
              }))
            : [],
          skor_akhir: assessment?.finalScore?.toFixed(2) ?? "-",
          nilai_huruf: assessment?.finalGrade ?? "-",
          catatan: "Dengan ini dinyatakan telah memenuhi standar penilaian magang.",
          nama_pembimbing: supervisor?.user?.name ?? "-",
          nip_pembimbing: supervisor?.nip ?? "-",
          tanggal_surat: formatDate(new Date()),
        };

        const buf = generateFromTemplate(templateBuffer, data);
        const r2Key = buildDocumentKey("assessment-reports", docNumber, ".docx");

        await saveDocumentRecord(
          intern.id,
          "assessment_report",
          docNumber,
          "Laporan Penilaian Magang",
          r2Key,
        );

        await uploadFromBuffer(
          r2Key,
          buf,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        );

        results.push({
          internId,
          internName: user.name,
          docNumber,
          filePath: r2Key,
        });
      } catch (e) {
        const name =
          (
            await prisma.user.findUnique({
              where: { id: internId },
              select: { name: true },
            })
          )?.name ?? "Unknown";
        results.push({
          internId,
          internName: name,
          docNumber: null,
          filePath: null,
          error: e instanceof StorageError
            ? e.userMessage
            : e instanceof Error
              ? e.message
              : "Unknown error",
        });
      }
    }

    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof StorageError
          ? error.userMessage
          : error instanceof Error
            ? error.message
            : "Failed to generate reports",
      retryable: error instanceof StorageError ? error.retryable : undefined,
    };
  }
}

export async function generateAttendanceReport(
  internIds: string[],
): Promise<ActionResponse<GenerateDocResult[]>> {
  try {
    await requirePermission({ document: ["create"] });
    await assertStorageHealthy()

    const results: GenerateDocResult[] = [];

    for (const internId of internIds) {
      try {
        const user = await getInternData(internId);

        if (!user?.internProfile) {
          results.push({
            internId,
            internName: user?.name ?? "Unknown",
            docNumber: null,
            filePath: null,
            error: "Intern profile not found",
          });
          continue;
        }

        const intern = user.internProfile;
        const supervisor = intern.supervisorAssignments[0]?.supervisorProfile;
        const docNumber = await generateDocumentNumber("ABSEN");

        const attendanceRecords = await prisma.attendance.findMany({
          where: { internProfileId: intern.id },
          orderBy: { date: "asc" },
        });

        const templateBuffer = await getActiveTemplate("attendance_report");

        const totalHadir = attendanceRecords.filter(
          (a) => a.status === "present",
        ).length;
        const totalIzin = attendanceRecords.filter(
          (a) => a.status === "permission",
        ).length;
        const totalAlpha = attendanceRecords.filter(
          (a) => a.status === "absent",
        ).length;

        const data = {
          nama_peserta: user.name,
          nik: intern.nik,
          bidang: intern.department?.name ?? "-",
          periode: `${formatDateShort(intern.periodStart)} — ${formatDateShort(intern.periodEnd)}`,
          absensi: attendanceRecords.map((a) => ({
            tanggal: formatDateShort(a.date),
            masuk: a.checkIn
              ? new Date(a.checkIn).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-",
            pulang: a.checkOut
              ? new Date(a.checkOut).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "-",
            status: attendanceStatusLabel(a.status),
          })),
          total_hadir: String(totalHadir),
          total_izin: String(totalIzin),
          total_alpha: String(totalAlpha),
          ttd_nama: "",
          ttd_nip: "",
          tanggal_surat: formatDate(new Date()),
        };

        const buf = generateFromTemplate(templateBuffer, data);
        const r2Key = buildDocumentKey("attendance-reports", docNumber, ".docx");

        await saveDocumentRecord(
          intern.id,
          "attendance_report",
          docNumber,
          "Rekap Absensi Magang",
          r2Key,
        );

        await uploadFromBuffer(
          r2Key,
          buf,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        );

        results.push({
          internId,
          internName: user.name,
          docNumber,
          filePath: r2Key,
        });
      } catch (e) {
        const name =
          (
            await prisma.user.findUnique({
              where: { id: internId },
              select: { name: true },
            })
          )?.name ?? "Unknown";
        results.push({
          internId,
          internName: name,
          docNumber: null,
          filePath: null,
          error: e instanceof StorageError
            ? e.userMessage
            : e instanceof Error
              ? e.message
              : "Unknown error",
        });
      }
    }

    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof StorageError
          ? error.userMessage
          : error instanceof Error
            ? error.message
            : "Failed to generate reports",
      retryable: error instanceof StorageError ? error.retryable : undefined,
    };
  }
}

export async function generateCompletionLetter(
  internIds: string[],
): Promise<ActionResponse<GenerateDocResult[]>> {
  try {
    await requirePermission({ document: ["create"] });
    await assertStorageHealthy()

    const results: GenerateDocResult[] = [];

    for (const internId of internIds) {
      try {
        const user = await getInternData(internId);

        if (!user?.internProfile) {
          results.push({
            internId,
            internName: user?.name ?? "Unknown",
            docNumber: null,
            filePath: null,
            error: "Intern profile not found",
          });
          continue;
        }

        const intern = user.internProfile;
        const supervisor = intern.supervisorAssignments[0]?.supervisorProfile;
        const docNumber = await generateDocumentNumber("SK");

        const templateBuffer = await getActiveTemplate("completion_letter");

        const data = {
          nomor_surat: docNumber,
          nama_peserta: user.name,
          nik: intern.nik,
          institusi: intern.institution,
          program: "Magang",
          bidang: intern.department?.name ?? "-",
          tanggal_mulai: formatDate(intern.periodStart),
          tanggal_selesai: formatDate(intern.periodEnd),
          tanggal_surat: formatDate(new Date()),
          ttd_nama: "",
          ttd_nip: "",
        };

        const buf = generateFromTemplate(templateBuffer, data);
        const r2Key = buildDocumentKey("completion-letters", docNumber, ".docx");

        await saveDocumentRecord(
          intern.id,
          "completion_letter",
          docNumber,
          "Surat Keterangan Selesai Magang",
          r2Key,
        );

        await uploadFromBuffer(
          r2Key,
          buf,
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        );

        results.push({
          internId,
          internName: user.name,
          docNumber,
          filePath: r2Key,
        });
      } catch (e) {
        const name =
          (
            await prisma.user.findUnique({
              where: { id: internId },
              select: { name: true },
            })
          )?.name ?? "Unknown";
        results.push({
          internId,
          internName: name,
          docNumber: null,
          filePath: null,
          error: e instanceof StorageError
            ? e.userMessage
            : e instanceof Error
              ? e.message
              : "Unknown error",
        });
      }
    }

    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof StorageError
          ? error.userMessage
          : error instanceof Error
            ? error.message
            : "Failed to generate letters",
      retryable: error instanceof StorageError ? error.retryable : undefined,
    };
  }
}

const DOCUMENT_LABELS: Record<string, string> = {
  certificate: "Sertifikat",
  assignment_letter: "Surat Tugas",
  assessment_report: "Laporan Penilaian",
  attendance_report: "Rekap Absensi",
  completion_letter: "Surat Keterangan Selesai",
};

async function getActiveTemplate(documentType: string): Promise<Buffer> {
  const active = await prisma.documentTemplate.findFirst({
    where: { documentType: documentType as DocumentType, isActive: true },
    select: { content: true },
  })

  if (active) {
    try {
      return await fetchTemplateFromR2(active.content)
    } catch {
      // R2 unavailable — fall through to local built-in
    }
  }

  const localPath = path.join(process.cwd(), "templates", "hr", `${documentType}.docx`)
  if (fs.existsSync(localPath)) {
    return fs.readFileSync(localPath)
  }

  const label = DOCUMENT_LABELS[documentType] ?? "Dokumen"
  throw new Error(
    `TEMPLATE_NOT_FOUND:Template ${label} belum tersedia. Silahkan upload template terlebih dahulu di menu Kelola Template.`,
  )
}

function attendanceStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    present: "Hadir",
    late: "Terlambat",
    absent: "Alpha",
    permission: "Izin",
    field_duty: "Dinas Luar",
  };
  return labels[status] ?? status;
}
