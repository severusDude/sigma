"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { ActionResponse } from "@/lib/types";
import type { Supervisor } from "../types/supervisor-types";
import type {
  CreateSupervisorInput,
  UpdateSupervisorInput,
} from "../schemas/supervisor-schemas";
import {
  createSupervisorSchema,
  updateSupervisorSchema,
} from "../schemas/supervisor-schemas";
import { requirePermission } from "@/lib/auth/authorize";
import { updateTag } from "next/cache";
import { fetchSupervisors } from "../data/supervisor-data";

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
        error instanceof Error ? error.message : "Gagal mengambil data supervisor",
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
      include: { supervisorProfile: true },
    });

    if (!user?.supervisorProfile || user.supervisorProfile.deletedAt)
      return { success: false, error: "Supervisor tidak ditemukan" };
    return { success: true, data: user as Supervisor };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Gagal mengambil data supervisor",
    };
  }
}

export async function createSupervisor(
  input: CreateSupervisorInput,
): Promise<ActionResponse<Supervisor>> {
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

    const password = Math.random().toString(36).slice(2, 10);

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

    return { success: true, data: user as Supervisor };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal membuat supervisor",
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

export async function deleteSupervisor(id: string): Promise<ActionResponse<void>> {
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
      error: error instanceof Error ? error.message : "Gagal menghapus supervisor",
    };
  }
}
