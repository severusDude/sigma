"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import type { ActionResponse } from "@/lib/types";
import { requirePermission } from "@/lib/auth/authorize";
import { SetPasswordInput, setPasswordSchema } from "@/features/auth/schemas";

export async function setPassword(
  input: SetPasswordInput,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission({ user: ["set-password"] });

    const parsed = setPasswordSchema.parse(input);

    const user = await prisma.user.findUnique({
      where: { id: parsed.userId },
    });
    if (!user) return { success: false, error: "User tidak ditemukan" };

    await auth.api.setUserPassword({
      body: {
        userId: parsed.userId,
        newPassword: parsed.newPassword,
      },
      headers: await headers(),
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengubah password",
    };
  }
}
