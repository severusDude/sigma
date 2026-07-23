"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { renderToFile } from "@react-pdf/renderer";
import { generateDocumentNumber } from "../utils/document-number";
import { InternshipCertificate } from "../components/document/templates/certificates";
import { generateFromTemplate } from "@/lib/docxtemplater";
import type { ActionResponse } from "@/lib/types";
import { DocumentType } from "@/generated/prisma/client";
import path from "path";
import fs from "fs";

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

function buildOutputPath(docNumber: string, subDir: string): string {
  const fullPath = path.join(process.cwd(), "generated", subDir, `${docNumber}.docx`);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  return fullPath;
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

export async function generateCertificates(
  internIds: string[],
): Promise<ActionResponse<GenerateDocResult[]>> {
  try {
    await requirePermission({ document: ["create"] });

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

        const outputPath = path.join(
          process.cwd(),
          "generated",
          "certificates",
          `${docNumber}.pdf`,
        );
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });

        await renderToFile(
          <InternshipCertificate
            recipientName={user.name}
            organization="Badan Pusat Statistik Kota Tasikmalaya"
            dateRange={`${formatDate(intern.periodStart)} — ${formatDate(intern.periodEnd)}`}
            signerTitle={
              supervisor
                ? [supervisor.field]
                : ["Kepala Badan Pusat Statistik", "Kota Tasikmalaya"]
            }
            signerName={supervisor?.user?.name ?? "Dr. Ir. Zulkipli, M.Si."}
          />,
          outputPath,
        );

        await saveDocumentRecord(
          intern.id,
          "certificate",
          docNumber,
          "Sertifikat Magang",
          outputPath,
        );

        results.push({
          internId,
          internName: user.name,
          docNumber,
          filePath: outputPath,
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
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate certificates",
    };
  }
}

export async function generateAssignmentLetter(
  internIds: string[],
): Promise<ActionResponse<GenerateDocResult[]>> {
  try {
    await requirePermission({ document: ["create"] });

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
        const outputPath = buildOutputPath(docNumber, "assignment-letters");
        fs.writeFileSync(outputPath, buf);

        await saveDocumentRecord(
          intern.id,
          "assignment_letter",
          docNumber,
          "Surat Tugas Magang",
          outputPath,
        );

        results.push({
          internId,
          internName: user.name,
          docNumber,
          filePath: outputPath,
        });
      } catch (e) {
        console.log("ini error bang", e)
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
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    return { success: true, data: results };
  } catch (error) {
    console.log("ini error", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate letters",
    };
  }
}

export async function generateAssessmentReport(
  internIds: string[],
): Promise<ActionResponse<GenerateDocResult[]>> {
  try {
    await requirePermission({ document: ["create"] });

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
        const outputPath = buildOutputPath(docNumber, "assessment-reports");
        fs.writeFileSync(outputPath, buf);

        await saveDocumentRecord(
          intern.id,
          "assessment_report",
          docNumber,
          "Laporan Penilaian Magang",
          outputPath,
        );

        results.push({
          internId,
          internName: user.name,
          docNumber,
          filePath: outputPath,
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
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate reports",
    };
  }
}

export async function generateAttendanceReport(
  internIds: string[],
): Promise<ActionResponse<GenerateDocResult[]>> {
  try {
    await requirePermission({ document: ["create"] });

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
        const outputPath = buildOutputPath(docNumber, "attendance-reports");
        fs.writeFileSync(outputPath, buf);

        await saveDocumentRecord(
          intern.id,
          "attendance_report",
          docNumber,
          "Rekap Absensi Magang",
          outputPath,
        );

        results.push({
          internId,
          internName: user.name,
          docNumber,
          filePath: outputPath,
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
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate reports",
    };
  }
}

export async function generateCompletionLetter(
  internIds: string[],
): Promise<ActionResponse<GenerateDocResult[]>> {
  try {
    await requirePermission({ document: ["create"] });

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
        const outputPath = buildOutputPath(docNumber, "completion-letters");
        fs.writeFileSync(outputPath, buf);

        await saveDocumentRecord(
          intern.id,
          "completion_letter",
          docNumber,
          "Surat Keterangan Selesai Magang",
          outputPath,
        );

        results.push({
          internId,
          internName: user.name,
          docNumber,
          filePath: outputPath,
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
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }

    return { success: true, data: results };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate letters",
    };
  }
}

const DOCUMENT_LABELS: Record<string, string> = {
  assignment_letter: "Surat Tugas",
  assessment_report: "Laporan Penilaian",
  attendance_report: "Rekap Absensi",
  completion_letter: "Surat Keterangan Selesai",
};

async function getActiveTemplate(documentType: string): Promise<Buffer> {
  const active = await prisma.documentTemplate.findFirst({
    where: { documentType: documentType as DocumentType, isActive: true },
    select: { content: true },
  });

  if (!active) {
    const label = DOCUMENT_LABELS[documentType] ?? "Dokumen";
    throw new Error(`TEMPLATE_NOT_FOUND:Template ${label} belum tersedia. Silahkan upload template terlebih dahulu di menu Kelola Template.`);
  }

  const uploadedPath = path.resolve(active.content);
  if (!fs.existsSync(uploadedPath)) {
    const label = DOCUMENT_LABELS[documentType] ?? "Dokumen";
    throw new Error(
      `TEMPLATE_NOT_FOUND:File template ${label} tidak ditemukan di "${uploadedPath}". ` +
      `Path di database: "${active.content}". ` +
      `Silahkan upload ulang template di menu Kelola Template.`
    );
  }

  return fs.readFileSync(uploadedPath);
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
