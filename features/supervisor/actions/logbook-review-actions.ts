"use server";

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import type { ActionResponse } from "@/lib/types";
import { requirePermission } from "@/lib/auth/authorize";
import { LogbookStatus } from "@/generated/prisma/enums";

export async function approveLogbook(
  logbookId: string,
): Promise<ActionResponse<void>> {
  try {
    const session = await requirePermission({ logbook: ["review"] });

    const supervisorProfile = await prisma.supervisorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!supervisorProfile) {
      return { success: false, error: "Profil supervisor tidak ditemukan" };
    }

    const logbook = await prisma.logbook.findFirst({
      where: {
        id: logbookId,
        deletedAt: null,
        issue: {
          supervisorProfileId: supervisorProfile.id,
          deletedAt: null,
        },
      },
    });

    if (!logbook) {
      return { success: false, error: "Logbook tidak ditemukan" };
    }

    if (logbook.status !== LogbookStatus.pending_review) {
      return {
        success: false,
        error:
          "Hanya logbook dengan status 'Menunggu Review' yang dapat disetujui",
      };
    }

    await prisma.logbook.update({
      where: { id: logbookId },
      data: { status: LogbookStatus.approved },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal menyetujui logbook",
    };
  }
}

const revisionSchema = z.object({
  notes: z.string().min(1, "Catatan revisi wajib diisi"),
});

export async function requestRevision(
  logbookId: string,
  notes: string,
): Promise<ActionResponse<void>> {
  try {
    const session = await requirePermission({ logbook: ["review"] });

    const supervisorProfile = await prisma.supervisorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!supervisorProfile) {
      return { success: false, error: "Profil supervisor tidak ditemukan" };
    }

    const parsed = revisionSchema.parse({ notes });

    const logbook = await prisma.logbook.findFirst({
      where: {
        id: logbookId,
        deletedAt: null,
        issue: {
          supervisorProfileId: supervisorProfile.id,
          deletedAt: null,
        },
      },
    });

    if (!logbook) {
      return { success: false, error: "Logbook tidak ditemukan" };
    }

    if (logbook.status !== LogbookStatus.pending_review) {
      return {
        success: false,
        error:
          "Hanya logbook dengan status 'Menunggu Review' yang dapat direvisi",
      };
    }

    await prisma.logbook.update({
      where: { id: logbookId },
      data: {
        status: LogbookStatus.revision,
        notes: parsed.notes,
      },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal meminta revisi logbook",
    };
  }
}
