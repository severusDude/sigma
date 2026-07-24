"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ActionResponse } from "@/lib/types";
import type { Supervisor } from "../types/supervisor-types";
import type {
  CreateSupervisorInput,
  CreateSupervisorResult,
  UpdateSupervisorInput,
} from "../schemas/supervisor-schemas";
import {
  createSupervisorSchema,
  updateSupervisorSchema,
} from "../schemas/supervisor-schemas";
import { requirePermission } from "@/lib/auth/authorize";
import { updateTag } from "next/cache";
import {
  fetchSupervisors,
  fetchSupervisorInterns,
} from "../data/supervisor-data";
import { supervisorInclude } from "../types/supervisor-types";
import type {
  AssignResult,
  AssignedIntern,
  ReassignAllResult,
} from "../types/supervisor-types";
import type { AssignMultipleInput } from "../schemas/supervisor-schemas";
import { assignMultipleSchema } from "../schemas/supervisor-schemas";

export async function getSupervisors(
  query?: string,
): Promise<ActionResponse<Supervisor[]>> {
  try {
    await requirePermission({ supervisor: ["read"] });

    const users = await fetchSupervisors(query);

    return { success: true, data: users as Supervisor[] };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal mengambil data supervisor",
    };
  }
}

export async function getSupervisorById(
  id: string,
): Promise<ActionResponse<Supervisor>> {
  try {
    await requirePermission({ supervisor: ["read"] });

    const user = await prisma.user.findUnique({
      where: { id },
      include: supervisorInclude,
    });

    if (!user?.supervisorProfile || user.supervisorProfile.deletedAt)
      return { success: false, error: "Supervisor tidak ditemukan" };
    return { success: true, data: user as Supervisor };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal mengambil data supervisor",
    };
  }
}

export async function createSupervisor(
  input: CreateSupervisorInput,
): Promise<ActionResponse<CreateSupervisorResult>> {
  try {
    await requirePermission({ supervisor: ["create"] });

    const parsed = createSupervisorSchema.parse(input);

    const existing = await prisma.user.findFirst({
      where: { supervisorProfile: { nip: parsed.nip } },
    });
    if (existing) return { success: false, error: "NIP sudah digunakan" };

    const username =
      parsed.name
        .toLowerCase()
        .replace(/\s+/g, ".")
        .replace(/[^a-z0-9.]/g, "")
        .slice(0, 20) + Math.random().toString(36).slice(2, 6);

    const password = parsed.nip;

    const created = await auth.api.createUser({
      body: {
        name: parsed.name,
        email: parsed.email || `${username}@sigma.app`,
        password,
        role: "supervisor",
        data: { username },
      },
    });

    const userId = created.user.id;

    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          supervisorProfile: {
            create: {
              nip: parsed.nip,
              field: parsed.field,
              phone: parsed.phone || null,
              email: parsed.email || null,
              maxInterns: parsed.maxInterns ?? 5,
            },
          },
        },
        include: { supervisorProfile: true },
      });

      updateTag("supervisors");

      return {
        success: true,
        data: { user: user as Supervisor, generatedPassword: password },
      };
    } catch (profileError) {
      await auth.api.removeUser({ body: { userId: userId } });
      updateTag("supervisors");
      return {
        success: false,
        error:
          profileError instanceof Error
            ? profileError.message
            : "Gagal membuat profil supervisor",
      };
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal membuat supervisor",
    };
  }
}

export async function updateSupervisor(
  id: string,
  input: UpdateSupervisorInput,
): Promise<ActionResponse<Supervisor>> {
  try {
    await requirePermission({ supervisor: ["update"] });

    const parsed = updateSupervisorSchema.parse(input);

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { supervisorProfile: true },
    });
    if (!existing?.supervisorProfile)
      return { success: false, error: "Supervisor tidak ditemukan" };

    if (parsed.name !== undefined) {
      await prisma.user.update({
        where: { id },
        data: { name: parsed.name },
      });
    }

    const supervisorData: Record<string, unknown> = {};
    if (parsed.nip !== undefined) supervisorData.nip = parsed.nip;
    if (parsed.field !== undefined) supervisorData.field = parsed.field;
    if (parsed.phone !== undefined) supervisorData.phone = parsed.phone || null;
    if (parsed.email !== undefined) supervisorData.email = parsed.email || null;
    if (parsed.maxInterns !== undefined)
      supervisorData.maxInterns = parsed.maxInterns;

    if (Object.keys(supervisorData).length > 0) {
      await prisma.supervisorProfile.update({
        where: { userId: id },
        data: supervisorData,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { supervisorProfile: true },
    });

    updateTag("supervisors");

    return { success: true, data: user as Supervisor };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal memperbarui supervisor",
    };
  }
}

export async function deleteSupervisor(
  id: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission({ supervisor: ["delete"] });

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { supervisorProfile: true },
    });
    if (!existing?.supervisorProfile)
      return { success: false, error: "Supervisor tidak ditemukan" };

    await prisma.supervisorProfile.delete({
      where: { userId: id },
    });

    updateTag("supervisors");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal menghapus supervisor",
    };
  }
}

export async function assignSupervisor(
  internProfileId: string,
  supervisorProfileId: string,
): Promise<AssignResult> {
  try {
    await requirePermission({ supervisor: ["update"] });

    const supervisor = await prisma.supervisorProfile.findUnique({
      where: { id: supervisorProfileId },
      include: {
        user: { select: { name: true } },
        internAssignments: { where: { endedAt: null } },
      },
    });

    if (!supervisor || !supervisor.isActive) {
      return {
        success: false,
        error: "Supervisor tidak ditemukan atau tidak aktif",
      };
    }

    const intern = await prisma.internProfile.findUnique({
      where: { id: internProfileId },
    });

    if (!intern || intern.status !== "active") {
      return {
        success: false,
        error: "Intern tidak ditemukan atau tidak aktif",
      };
    }

    const currentCount = supervisor.internAssignments.length;
    const isOverLimit = currentCount >= supervisor.maxInterns;

    await prisma.internSupervisor.create({
      data: {
        internProfileId,
        supervisorProfileId,
      },
    });

    updateTag("supervisors");
    updateTag("interns");

    const result: AssignResult = { success: true };
    if (isOverLimit) {
      result.warning = `Supervisor ${supervisor.user.name} sudah memiliki ${currentCount + 1} dari ${supervisor.maxInterns} maksimal intern`;
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal meng-assign supervisor",
    };
  }
}

export async function assignMultipleInterns(
  input: AssignMultipleInput,
): Promise<AssignResult> {
  try {
    await requirePermission({ supervisor: ["update"] });

    const parsed = assignMultipleSchema.parse(input);

    const internProfileIds = [
      ...new Set(parsed.interns.map((i) => i.internProfileId)),
    ];

    const supervisor = await prisma.supervisorProfile.findUnique({
      where: { id: parsed.supervisorProfileId },
      include: {
        user: { select: { name: true } },
        internAssignments: { where: { endedAt: null } },
      },
    });

    if (!supervisor || !supervisor.isActive) {
      return {
        success: false,
        error: "Supervisor tidak ditemukan atau tidak aktif",
      };
    }

    const validInterns = await prisma.internProfile.findMany({
      where: {
        id: { in: internProfileIds },
        deletedAt: null,
        status: "active",
      },
    });

    if (validInterns.length !== internProfileIds.length) {
      return {
        success: false,
        error: "Beberapa intern tidak valid atau tidak aktif",
      };
    }

    const existingAssignments = await prisma.internSupervisor.findMany({
      where: {
        internProfileId: { in: internProfileIds },
        endedAt: null,
      },
    });

    if (existingAssignments.length > 0) {
      return {
        success: false,
        error: "Beberapa intern sudah memiliki supervisor aktif",
      };
    }

    const currentCount = supervisor.internAssignments.length;
    const newCount = internProfileIds.length;
    const isOverLimit = currentCount + newCount > supervisor.maxInterns;

    await prisma.$transaction(
      internProfileIds.map((internProfileId) =>
        prisma.internSupervisor.create({
          data: {
            internProfileId,
            supervisorProfileId: parsed.supervisorProfileId,
          },
        }),
      ),
    );

    updateTag("supervisors");
    updateTag("interns");

    const result: AssignResult = { success: true };
    if (isOverLimit) {
      result.warning = `Supervisor ${supervisor.user.name} akan memiliki ${currentCount + newCount} dari ${supervisor.maxInterns} maksimal intern`;
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal meng-assign multiple intern",
    };
  }
}

export async function getSupervisorInterns(
  supervisorId: string,
): Promise<ActionResponse<AssignedIntern[]>> {
  try {
    await requirePermission({ supervisor: ["read"] });

    const supervisor = await prisma.supervisorProfile.findUnique({
      where: { userId: supervisorId },
      select: { id: true },
    });

    if (!supervisor) {
      return { success: false, error: "Supervisor tidak ditemukan" };
    }

    const interns = await fetchSupervisorInterns(supervisor.id);

    return { success: true, data: interns };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Gagal mengambil data intern bimbingan",
    };
  }
}

export async function reassignIntern(
  internProfileId: string,
  newSupervisorProfileId: string,
): Promise<AssignResult> {
  try {
    await requirePermission({ supervisor: ["update"] });

    const newSupervisor = await prisma.supervisorProfile.findUnique({
      where: { id: newSupervisorProfileId },
      include: {
        user: { select: { name: true } },
        internAssignments: { where: { endedAt: null } },
      },
    });

    if (!newSupervisor || !newSupervisor.isActive) {
      return {
        success: false,
        error: "Supervisor tujuan tidak ditemukan atau tidak aktif",
      };
    }

    const intern = await prisma.internProfile.findUnique({
      where: { id: internProfileId },
    });

    if (!intern || intern.status !== "active") {
      return {
        success: false,
        error: "Intern tidak ditemukan atau tidak aktif",
      };
    }

    const currentAssignment = await prisma.internSupervisor.findFirst({
      where: { internProfileId, endedAt: null },
    });

    if (!currentAssignment) {
      return {
        success: false,
        error: "Intern tidak memiliki supervisor aktif",
      };
    }

    if (currentAssignment.supervisorProfileId === newSupervisorProfileId) {
      return {
        success: false,
        error: "Intern sudah di-assign ke supervisor tersebut",
      };
    }

    const currentCount = newSupervisor.internAssignments.length;
    const isOverLimit = currentCount >= newSupervisor.maxInterns;

    await prisma.$transaction([
      prisma.internSupervisor.update({
        where: { id: currentAssignment.id },
        data: { endedAt: new Date(), reason: "Reassign oleh HR" },
      }),
      prisma.internSupervisor.create({
        data: { internProfileId, supervisorProfileId: newSupervisorProfileId },
      }),
    ]);

    updateTag("supervisors");
    updateTag("interns");

    const result: AssignResult = { success: true };
    if (isOverLimit) {
      result.warning = `Supervisor ${newSupervisor.user.name} sudah memiliki ${currentCount + 1} dari ${newSupervisor.maxInterns} maksimal intern`;
    }

    return result;
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal me-reassign intern",
    };
  }
}

export async function reassignAllInterns(
  fromSupervisorProfileId: string,
  toSupervisorProfileId: string,
): Promise<ReassignAllResult> {
  try {
    await requirePermission({ supervisor: ["update"] });

    const [fromSupervisor, toSupervisor] = await Promise.all([
      prisma.supervisorProfile.findUnique({
        where: { id: fromSupervisorProfileId },
      }),
      prisma.supervisorProfile.findUnique({
        where: { id: toSupervisorProfileId },
        include: {
          user: { select: { name: true } },
          internAssignments: { where: { endedAt: null } },
        },
      }),
    ]);

    if (!fromSupervisor) {
      return {
        success: false,
        count: 0,
        error: "Supervisor asal tidak ditemukan",
      };
    }

    if (!toSupervisor || !toSupervisor.isActive) {
      return {
        success: false,
        count: 0,
        error: "Supervisor tujuan tidak ditemukan atau tidak aktif",
      };
    }

    if (fromSupervisorProfileId === toSupervisorProfileId) {
      return {
        success: false,
        count: 0,
        error: "Supervisor asal dan tujuan tidak boleh sama",
      };
    }

    const activeAssignments = await prisma.internSupervisor.findMany({
      where: { supervisorProfileId: fromSupervisorProfileId, endedAt: null },
    });

    if (activeAssignments.length === 0) {
      return {
        success: false,
        count: 0,
        error: "Tidak ada intern yang perlu dipindahkan",
      };
    }

    const operations = activeAssignments.flatMap((assignment) => [
      prisma.internSupervisor.update({
        where: { id: assignment.id },
        data: { endedAt: new Date(), reason: "Reassign oleh HR" },
      }),
      prisma.internSupervisor.create({
        data: {
          internProfileId: assignment.internProfileId,
          supervisorProfileId: toSupervisorProfileId,
        },
      }),
    ]);

    await prisma.$transaction(operations);

    updateTag("supervisors");
    updateTag("interns");

    return { success: true, count: activeAssignments.length };
  } catch (error) {
    return {
      success: false,
      count: 0,
      error:
        error instanceof Error
          ? error.message
          : "Gagal me-reassign semua intern",
    };
  }
}
