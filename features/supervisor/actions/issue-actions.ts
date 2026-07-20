"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResponse } from "@/lib/types";
import { requirePermission } from "@/lib/auth/authorize";

import { fetchIssues } from "../data/issue-data";
import type { Issue } from "../types/issue-types";
import { issueInclude } from "../types/issue-types";
import {
  createIssueSchema,
  type CreateIssueInput,
  type UpdateIssueInput,
  updateIssueSchema,
} from "../schemas/issue-schemas";

export async function getIssues(
  query?: Parameters<typeof fetchIssues>[1],
): Promise<ActionResponse<Issue[]>> {
  try {
    const session = await requirePermission({ logbook: ["read"] });

    const supervisorProfile = await prisma.supervisorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!supervisorProfile) {
      return { success: false, error: "Profil supervisor tidak ditemukan" };
    }

    const issues = await fetchIssues(supervisorProfile.id, query);

    return { success: true, data: issues };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengambil issues",
    };
  }
}

export async function getIssueById(id: string): Promise<ActionResponse<Issue>> {
  try {
    const session = await requirePermission({ logbook: ["read"] });

    const supervisorProfile = await prisma.supervisorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!supervisorProfile) {
      return { success: false, error: "Profil supervisor tidak ditemukan" };
    }

    const issue = await prisma.issue.findFirst({
      where: {
        id,
        supervisorProfileId: supervisorProfile.id,
        deletedAt: null,
      },
      include: issueInclude,
    });

    if (!issue) return { success: false, error: "Issue tidak ditemukan" };

    return { success: true, data: issue as Issue };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengambil issue",
    };
  }
}

export async function createIssue(
  input: CreateIssueInput,
): Promise<ActionResponse<Issue>> {
  try {
    const session = await requirePermission({ logbook: ["review"] });

    const supervisorProfile = await prisma.supervisorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!supervisorProfile) {
      return { success: false, error: "Profil supervisor tidak ditemukan" };
    }

    const parsed = createIssueSchema.parse(input);

    const issue = await prisma.issue.create({
      data: {
        supervisorProfileId: supervisorProfile.id,
        title: parsed.title,
        description: parsed.description || null,
        internProfileId: parsed.internProfileId || null,
        startDate: parsed.startDate || null,
        endDate: parsed.endDate || null,
      },
      include: issueInclude,
    });

    return { success: true, data: issue as Issue };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat issue",
    };
  }
}

export async function updateIssue(
  id: string,
  input: UpdateIssueInput,
): Promise<ActionResponse<Issue>> {
  try {
    const session = await requirePermission({ logbook: ["review"] });

    const supervisorProfile = await prisma.supervisorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!supervisorProfile) {
      return { success: false, error: "Profil supervisor tidak ditemukan" };
    }

    const existing = await prisma.issue.findFirst({
      where: {
        id,
        supervisorProfileId: supervisorProfile.id,
        deletedAt: null,
      },
    });

    if (!existing) return { success: false, error: "Issue tidak ditemukan" };

    const parsed = updateIssueSchema.parse(input);

    const updateData: Record<string, unknown> = {};
    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.description !== undefined)
      updateData.description = parsed.description || null;
    if (parsed.internProfileId !== undefined)
      updateData.internProfileId = parsed.internProfileId || null;
    if (parsed.startDate !== undefined)
      updateData.startDate = parsed.startDate || null;
    if (parsed.endDate !== undefined)
      updateData.endDate = parsed.endDate || null;
    if (parsed.status !== undefined) updateData.status = parsed.status;

    if (Object.keys(updateData).length === 0) {
      return { success: false, error: "Tidak ada data yang diubah" };
    }

    const issue = await prisma.issue.update({
      where: { id },
      data: updateData,
      include: issueInclude,
    });

    return { success: true, data: issue as Issue };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui issue",
    };
  }
}

export async function deleteIssue(id: string): Promise<ActionResponse<void>> {
  try {
    const session = await requirePermission({ logbook: ["review"] });

    const supervisorProfile = await prisma.supervisorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!supervisorProfile) {
      return { success: false, error: "Profil supervisor tidak ditemukan" };
    }

    const existing = await prisma.issue.findFirst({
      where: {
        id,
        supervisorProfileId: supervisorProfile.id,
        deletedAt: null,
      },
      include: {
        _count: {
          select: { logbooks: true },
        },
      },
    });

    if (!existing) return { success: false, error: "Issue tidak ditemukan" };

    if (existing._count.logbooks > 0) {
      return {
        success: false,
        error:
          "Issue tidak dapat dihapus karena memiliki logbook terkait. Arsipkan issue sebagai 'cancelled' jika tidak digunakan.",
      };
    }

    await prisma.issue.delete({
      where: { id },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus issue",
    };
  }
}
