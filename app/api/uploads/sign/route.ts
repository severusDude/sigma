import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import {
  getSignedUploadUrl,
  buildAttachmentKey,
  validateFileType,
  validateFileSize,
  ALLOWED_UPLOAD_MIME_TYPES,
} from "@/services/storage"

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { fileName, fileSize, attachableType, attachableId } =
    await request.json()

  if (!fileName || !fileSize || !attachableType || !attachableId) {
    return NextResponse.json(
      { error: "Missing required fields: fileName, fileSize, attachableType, attachableId" },
      { status: 400 },
    )
  }

  try {
    const mimeType = validateFileType(fileName, ALLOWED_UPLOAD_MIME_TYPES)
    validateFileSize(fileSize, "attachment")

    const key = buildAttachmentKey(attachableType, attachableId, fileName)
    const uploadUrl = await getSignedUploadUrl(key, mimeType, 900)

    return NextResponse.json({ uploadUrl, key, requiredContentType: mimeType })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Validation failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}