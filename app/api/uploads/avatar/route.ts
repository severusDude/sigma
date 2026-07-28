import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { prisma } from "@/lib/prisma"
import {
  uploadFromBuffer,
  deleteObject,
  buildAvatarKey,
  validateFileType,
  AVATAR_ALLOWED_MIME_TYPES,
} from "@/services/storage"
import { assertStorageHealthy, StorageError } from "@/services/storage-health"

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? ""

function extractKeyFromUrl(url: string): string | null {
  if (!R2_PUBLIC_URL) return null
  if (!url.startsWith(R2_PUBLIC_URL)) return null
  return url.replace(R2_PUBLIC_URL.replace(/\/$/, ""), "").replace(/^\//, "")
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!R2_PUBLIC_URL) {
    return NextResponse.json(
      { error: "R2_PUBLIC_URL belum dikonfigurasi" },
      { status: 500 },
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Hanya file gambar yang diizinkan" }, { status: 400 })
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File terlalu besar. Maksimal 2MB" }, { status: 400 })
    }

    const mimeType = validateFileType(
      `avatar.${file.type.split("/")[1]}`,
      AVATAR_ALLOWED_MIME_TYPES,
    )

    await assertStorageHealthy()

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = mimeType === "image/jpeg" ? ".jpg" : ".webp"
    const key = buildAvatarKey(session.user.id, ext)

    await uploadFromBuffer(key, buffer, mimeType, "avatar")

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

    const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: publicUrl },
    })

    return NextResponse.json({ url: publicUrl })
  } catch (e) {
    const message =
      e instanceof StorageError
        ? e.userMessage
        : e instanceof Error
          ? e.message
          : "Gagal mengupload foto profile"
    const status = e instanceof StorageError ? 503 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
