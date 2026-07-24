"use server";

import { auth } from "@/lib/auth";
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
