"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResponse } from "@/lib/types";
import { requirePermission } from "@/lib/auth/authorize";
import type { Logbook } from "../types/logbook-types";
import { logbookInclude } from "../types/logbook-types";
import {
  createLogbookSchema,
  updateLogbookSchema,
  type CreateLogbookInput,
  type UpdateLogbookInput,
} from "../schemas/logbook-schemas";
import { fetchLogbooks } from "../data/logbook-data";

export async function getLogbooks(
  query?: Parameters<typeof fetchLogbooks>[1],
): Promise<ActionResponse<Logbook[]>> {
  try {
    const session = await requirePermission({ journal: ["read"] });

    const internProfile = await prisma.internProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!internProfile) {
      return { success: false, error: "Profil intern tidak ditemukan" };
    }

    const logbooks = await fetchLogbooks(internProfile.id, query);

    return { success: true, data: logbooks };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengambil logbook",
    };
  }
}

export async function getLogbookById(
  id: string,
): Promise<ActionResponse<Logbook>> {
  try {
    const session = await requirePermission({ journal: ["read"] });

    const internProfile = await prisma.internProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!internProfile)
      return { success: false, error: "Profil intern tidak ditemukan" };

    const logbook = await prisma.logbook.findFirst({
      where: {
        id,
        internProfileId: internProfile.id,
        deletedAt: null,
      },
      include: logbookInclude,
    });

    if (!logbook) return { success: false, error: "Logbook tidak ditemukan" };

    return { success: true, data: logbook as Logbook };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengambil logbook",
    };
  }
}

export async function createLogbook(
  input: CreateLogbookInput,
): Promise<ActionResponse<Logbook>> {
  try {
    const session = await requirePermission({ journal: ["create"] });

    const internProfile = await prisma.internProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!internProfile)
      return { success: false, error: "Profil intern tidak ditemukan" };

    const parsed = createLogbookSchema.parse(input);

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);

    if (parsed.date < threeDaysAgo) {
      return {
        success: false,
        error: "Logbook maksimal diisi untuk H-3 dari hari ini",
      };
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (parsed.date > today) {
      return {
        success: false,
        error: "Tanggal tidak boleh lebih dari hari ini",
      };
    }

    const logbook = await prisma.logbook.create({
      data: {
        internProfileId: internProfile.id,
        date: parsed.date,
        activity: parsed.activity,
        duration: parsed.duration,
        issueId: parsed.issueId || null,
        notes: parsed.notes || null,
        status: "pending_review",
      },
      include: logbookInclude,
    });

    return { success: true, data: logbook as Logbook };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat logbook",
    };
  }
}

export async function updateLogbook(
  id: string,
  input: UpdateLogbookInput,
): Promise<ActionResponse<Logbook>> {
  try {
    const session = await requirePermission({ journal: ["update"] });

    const internProfile = await prisma.internProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!internProfile)
      return { success: false, error: "Profil intern tidak ditemukan" };

    const existing = await prisma.logbook.findFirst({
      where: {
        id,
        internProfileId: internProfile.id,
        deletedAt: null,
      },
    });

    if (!existing) return { success: false, error: "Logbook tidak ditemukan" };

    if (existing.status === "approved") {
      return {
        success: false,
        error: "Logbook yang sudah disetujui tidak dapat diedit",
      };
    }

    const parsed = updateLogbookSchema.parse(input);

    const updateData: Record<string, unknown> = {};
    if (parsed.date !== undefined) updateData.date = parsed.date;
    if (parsed.activity !== undefined) updateData.activity = parsed.activity;
    if (parsed.duration !== undefined) updateData.duration = parsed.duration;
    if (parsed.issueId !== undefined)
      updateData.issueId = parsed.issueId || null;
    if (parsed.notes !== undefined) updateData.notes = parsed.notes || null;

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: "Tidak ada data yang diubah" };
    }

    if (existing.status === "revision") {
      updateData.status = "pending_review";
    }

    const logbook = await prisma.logbook.update({
      where: { id },
      data: updateData,
      include: logbookInclude,
    });

    return { success: true, data: logbook as Logbook };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal memperbarui logbook",
    };
  }
}

export async function deleteLogbook(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await requirePermission({ journal: ["delete"] });

    const internProfile = await prisma.internProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!internProfile)
      return { success: false, error: "Profil intern tidak ditemukan" };

    const existing = await prisma.logbook.findFirst({
      where: {
        id,
        internProfileId: internProfile.id,
        deletedAt: null,
      },
    });

    if (!existing) return { success: false, error: "Logbook tidak ditemukan" };

    if (existing.status !== "pending_review") {
      return {
        success: false,
        error:
          "Hanya logbook dengan status 'Menunggu Review' yang dapat dihapus",
      };
    }

    await prisma.logbook.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus logbook",
    };
  }
}
