"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import {
  getObjectMetadata,
  deleteObject,
  MAX_FILE_SIZES,
  AVATAR_ALLOWED_MIME_TYPES,
} from "@/services/storage"

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? ""

function extractKeyFromUrl(url: string): string | null {
  if (!R2_PUBLIC_URL) return null
  if (!url.startsWith(R2_PUBLIC_URL)) return null
  return url.replace(R2_PUBLIC_URL.replace(/\/$/, ""), "").replace(/^\//, "")
}

export async function updateAvatar(key: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session) {
      return { success: false as const, error: "Unauthorized" }
    }

    const { size, contentType } = await getObjectMetadata(key)

    if (size <= 0 || size > MAX_FILE_SIZES.avatar) {
      return { success: false as const, error: "File terlalu besar" }
    }

    if (!AVATAR_ALLOWED_MIME_TYPES.includes(contentType)) {
      return { success: false as const, error: "Tipe file tidak diizinkan" }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    })

    if (user?.image) {
      const oldKey = extractKeyFromUrl(user.image)
      if (oldKey) {
        await deleteObject(oldKey).catch(() => {})
      }
    }

    const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}` : key

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: publicUrl },
    })

    return { success: true as const, url: publicUrl }
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Gagal memperbarui foto profile",
    }
  }
}
