"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ActionResponse } from "@/lib/types";
import type { InternWithRelations, InternRow } from "../types/intern-types";
import type { CreateInternInput, UpdateInternInput } from "../schemas/intern-schemas";
import { createInternSchema, updateInternSchema } from "../schemas/intern-schemas";
import { requirePermission } from "@/lib/auth/authorize";

function toRow(intern: InternWithRelations): InternRow {
  const assignment = intern.supervisorAssignments?.[0];
  return {
    id: intern.id,
    name: intern.user.name,
    nik: intern.nik,
    institution: intern.institution,
    phone: intern.phone,
    email: intern.email,
    department: intern.department?.name ?? null,
    departmentId: intern.department?.id ?? null,
    periodStart: intern.periodStart,
    periodEnd: intern.periodEnd,
    status: intern.status,
    supervisor: assignment?.supervisorProfile.user.name ?? null,
    internProfile: intern,
  };
}

export async function getInterns(
  query?: string,
): Promise<ActionResponse<InternRow[]>> {
  try {
    await requirePermission({ intern: ["read"] });

    const interns = await prisma.internProfile.findMany({
      where: {
        deletedAt: null,
        ...(query
          ? {
              OR: [
                { user: { name: { contains: query, mode: "insensitive" } } },
                { nik: { contains: query, mode: "insensitive" } },
                { institution: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
        supervisorAssignments: {
          include: {
            supervisorProfile: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: interns.map(toRow) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengambil data intern",
    };
  }
}

export async function getInternById(
  id: string,
): Promise<ActionResponse<InternWithRelations>> {
  try {
    await requirePermission({ intern: ["read"] });

    const intern = await prisma.internProfile.findUnique({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
        supervisorAssignments: {
          include: {
            supervisorProfile: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
      },
    });

    if (!intern) return { success: false, error: "Intern tidak ditemukan" };
    return { success: true, data: intern };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengambil data intern",
    };
  }
}

export async function createIntern(
  input: CreateInternInput,
): Promise<ActionResponse<InternWithRelations>> {
  try {
    await requirePermission({ intern: ["create"] });

    const parsed = createInternSchema.parse(input);

    const username =
      parsed.name
        .toLowerCase()
        .replace(/\s+/g, ".")
        .replace(/[^a-z0-9.]/g, "")
        .slice(0, 20) +
      Math.random().toString(36).slice(2, 6);

    const password = Math.random().toString(36).slice(2, 10);

    const created = await auth.api.createUser({
      body: {
        name: parsed.name,
        email: parsed.email || `${username}@sigma.app`,
        password,
        role: "intern",
        data: { username },
      },
    });

    const userId = created.user.id;

    const intern = await prisma.internProfile.create({
      data: {
        userId,
        nik: parsed.nik,
        institution: parsed.institution,
        phone: parsed.phone || null,
        email: parsed.email || null,
        periodStart: parsed.periodStart,
        periodEnd: parsed.periodEnd,
        status: parsed.status,
        departmentId: parsed.departmentId || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
        supervisorAssignments: {
          include: {
            supervisorProfile: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
      },
    });

    return { success: true, data: intern };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat intern",
    };
  }
}

export async function updateIntern(
  id: string,
  input: UpdateInternInput,
): Promise<ActionResponse<InternWithRelations>> {
  try {
    await requirePermission({ intern: ["update"] });

    const parsed = updateInternSchema.parse(input);

    if (parsed.name) {
      const intern = await prisma.internProfile.findUnique({
        where: { id },
        select: { userId: true },
      });
      if (intern) {
        await prisma.user.update({
          where: { id: intern.userId },
          data: { name: parsed.name },
        });
      }
    }

    const intern = await prisma.internProfile.update({
      where: { id },
      data: {
        ...(parsed.nik !== undefined && { nik: parsed.nik }),
        ...(parsed.institution !== undefined && { institution: parsed.institution }),
        ...(parsed.phone !== undefined && { phone: parsed.phone || null }),
        ...(parsed.email !== undefined && { email: parsed.email || null }),
        ...(parsed.periodStart !== undefined && { periodStart: parsed.periodStart }),
        ...(parsed.periodEnd !== undefined && { periodEnd: parsed.periodEnd }),
        ...(parsed.status !== undefined && { status: parsed.status }),
        ...(parsed.departmentId !== undefined && { departmentId: parsed.departmentId || null }),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true } },
        supervisorAssignments: {
          include: {
            supervisorProfile: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
      },
    });

    return { success: true, data: intern };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal memperbarui intern",
    };
  }
}

export async function deleteIntern(id: string): Promise<ActionResponse<void>> {
  try {
    await requirePermission({ intern: ["delete"] });

    await prisma.internProfile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus intern",
    };
  }
}
