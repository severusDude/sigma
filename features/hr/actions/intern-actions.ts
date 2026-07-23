"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ActionResponse } from "@/lib/types";
import type { Intern } from "../types/intern-types";
import type {
  CreateInternInput,
  CreateInternResult,
  UpdateInternInput,
} from "../schemas/intern-schemas";
import {
  createInternSchema,
  updateInternSchema,
} from "../schemas/intern-schemas";
import { requirePermission } from "@/lib/auth/authorize";
import { updateTag } from "next/cache";
import { fetchInterns } from "../data/intern-data";

export async function getInterns(
  query?: string,
): Promise<ActionResponse<Intern[]>> {
  try {
    await requirePermission({ intern: ["read"] });

    const users = await fetchInterns(query);

    return { success: true, data: users as Intern[] };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal mengambil data intern",
    };
  }
}

export async function getInternById(
  id: string,
): Promise<ActionResponse<Intern>> {
  try {
    await requirePermission({ intern: ["read"] });

    const user = await prisma.user.findUnique({
      where: { id },
      include: { internProfile: true },
    });

    if (!user?.internProfile || user.internProfile.deletedAt)
      return { success: false, error: "Intern tidak ditemukan" };
    return { success: true, data: user as Intern };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal mengambil data intern",
    };
  }
}

export async function createIntern(
  input: CreateInternInput,
): Promise<ActionResponse<CreateInternResult>> {
  try {
    await requirePermission({ intern: ["create"] });

    const parsed = createInternSchema.parse(input);

    const existing = await prisma.user.findFirst({
      where: { internProfile: { nik: parsed.nik } },
    });
    if (existing) return { success: false, error: "NIK sudah digunakan" };

    const username =
      parsed.name
        .toLowerCase()
        .replace(/\s+/g, ".")
        .replace(/[^a-z0-9.]/g, "")
        .slice(0, 20) + Math.random().toString(36).slice(2, 6);

    const password = parsed.nik;

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

    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          internProfile: {
            create: {
              nik: parsed.nik,
              institution: parsed.institution,
              phone: parsed.phone || null,
              email: parsed.email || null,
              periodStart: parsed.periodStart,
              periodEnd: parsed.periodEnd,
              status: parsed.status as "active" | "completed" | "withdrawn",
              departmentId: parsed.departmentId || null,
            },
          },
        },
        include: { internProfile: true },
      });

      updateTag("interns");

      return {
        success: true,
        data: { user: user as Intern, generatedPassword: password },
      };
    } catch (profileError) {
      await auth.api.removeUser({ body: { userId: userId } });
      updateTag("interns");
      return {
        success: false,
        error:
          profileError instanceof Error
            ? profileError.message
            : "Gagal membuat profil intern",
      };
    }
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
): Promise<ActionResponse<Intern>> {
  try {
    await requirePermission({ intern: ["update"] });

    const parsed = updateInternSchema.parse(input);

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { internProfile: true },
    });
    if (!existing?.internProfile)
      return { success: false, error: "Intern tidak ditemukan" };

    if (parsed.name !== undefined) {
      await prisma.user.update({
        where: { id },
        data: { name: parsed.name },
      });
    }

    const internData: Record<string, unknown> = {};
    if (parsed.nik !== undefined) internData.nik = parsed.nik;
    if (parsed.institution !== undefined)
      internData.institution = parsed.institution;
    if (parsed.phone !== undefined) internData.phone = parsed.phone || null;
    if (parsed.email !== undefined) internData.email = parsed.email || null;
    if (parsed.periodStart !== undefined)
      internData.periodStart = parsed.periodStart;
    if (parsed.periodEnd !== undefined) internData.periodEnd = parsed.periodEnd;
    if (parsed.status !== undefined) internData.status = parsed.status;
    if (parsed.departmentId !== undefined)
      internData.departmentId = parsed.departmentId || null;

    if (Object.keys(internData).length > 0) {
      await prisma.internProfile.update({
        where: { userId: id },
        data: internData,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: { internProfile: true },
    });

    updateTag("interns");

    return { success: true, data: user as Intern };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal memperbarui intern",
    };
  }
}

export async function deleteIntern(id: string): Promise<ActionResponse<void>> {
  try {
    await requirePermission({ intern: ["delete"] });

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { internProfile: true },
    });
    if (!existing?.internProfile)
      return { success: false, error: "Intern tidak ditemukan" };

    await prisma.internProfile.delete({
      where: { userId: id },
    });

    updateTag("interns");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus intern",
    };
  }
}
