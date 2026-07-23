"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  try {
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });

    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Gagal mengubah password",
    };
  }
}

export async function toggleSupervisorStatus(
  userId: string,
  isActive: boolean,
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) throw new Error("Unauthorized");
    if (session.user.id !== userId) {
      throw new Error("Forbidden");
    }

    await prisma.supervisorProfile.update({
      where: { userId },
      data: { isActive },
    });

    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Gagal mengubah status",
    };
  }
}
