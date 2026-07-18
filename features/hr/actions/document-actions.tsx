"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/authorize";
import { renderToFile } from "@react-pdf/renderer";
import { generateDocumentNumber } from "../utils/document-number";
import { InternshipCertificate } from "../components/document/templates/certificates";
import type { ActionResponse } from "@/lib/types";
import path from "path";
import fs from "fs";

export type GenerateCertResult = {
  internId: string;
  internName: string;
  docNumber: string | null;
  filePath: string | null;
  error?: string;
};

export async function generateCertificates(
  internIds: string[],
): Promise<ActionResponse<GenerateCertResult[]>> {
  try {
    await requirePermission({ document: ["create"] });

    const results: GenerateCertResult[] = [];

    for (const internId of internIds) {
      try {
        const user = await prisma.user.findUnique({
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
              },
            },
          },
        });

        if (!user?.internProfile) {
          results.push({ internId, internName: user?.name ?? "Unknown", docNumber: null, filePath: null, error: "Intern profile not found" });
          continue;
        }

        const intern = user.internProfile;
        const supervisor = intern.supervisorAssignments[0]?.supervisorProfile;

        const docNumber = await generateDocumentNumber();

        const formatDate = (d: Date) =>
          new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d));

        const outputDir = path.join(process.cwd(), "generated", "certificates");
        fs.mkdirSync(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, `${docNumber}.pdf`);

        await renderToFile(
          <InternshipCertificate
            recipientName={user.name}
            organization={intern.institution}
            dateRange={`${formatDate(intern.periodStart)} — ${formatDate(intern.periodEnd)}`}
            signerTitle={supervisor ? [supervisor.field] : ["Kepala Badan Pusat Statistik", "Provinsi Jawa Timur"]}
            signerName={supervisor?.user?.name ?? "Dr. Ir. Zulkipli, M.Si."}
          />,
          outputPath,
        );

        await prisma.document.create({
          data: {
            internProfileId: intern.id,
            documentType: "certificate",
            documentNumber: docNumber,
            title: "Sertifikat Magang",
            fileUrl: outputPath,
            status: "draft",
            metadata: { generatedAt: new Date().toISOString() },
          },
        });

        results.push({
          internId,
          internName: user.name,
          docNumber,
          filePath: outputPath,
        });
      } catch (e) {
        const name = (await prisma.user.findUnique({ where: { id: internId }, select: { name: true } }))?.name ?? "Unknown";
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
      error: error instanceof Error ? error.message : "Failed to generate certificates",
    };
  }
}
