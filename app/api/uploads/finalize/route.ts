import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import {
  getObjectMetadata,
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_FILE_SIZES,
} from "@/services/storage"

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { key, fileName, attachableType, attachableId } =
    await request.json()

  if (!key || !fileName || !attachableType || !attachableId) {
    return NextResponse.json(
      {
        error:
          "Missing required fields: key, fileName, attachableType, attachableId",
      },
      { status: 400 },
    )
  }

  try {
    const { size, contentType } = await getObjectMetadata(key)

    if (size <= 0 || size > MAX_FILE_SIZES.attachment) {
      return NextResponse.json({ error: "Invalid file size" }, { status: 400 })
    }

    if (!ALLOWED_UPLOAD_MIME_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }

    const attachment = await prisma.attachment.create({
      data: {
        attachableType: attachableType as "logbook" | "document" | "guide",
        attachableId,
        fileName,
        fileUrl: key,
        mimeType: contentType,
        fileSize: size,
      },
    })

    return NextResponse.json({ ok: true, attachment })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Finalize failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}