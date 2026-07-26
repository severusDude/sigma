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
import { assertStorageHealthy, StorageError } from "@/services/storage-health"

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

    await assertStorageHealthy()

    const key = buildAttachmentKey(attachableType, attachableId, fileName)
    const uploadUrl = await getSignedUploadUrl(key, mimeType, 900)

    return NextResponse.json({ uploadUrl, key, requiredContentType: mimeType })
  } catch (e) {
    const message = e instanceof StorageError
      ? e.userMessage
      : e instanceof Error
        ? e.message
        : "Validation failed"
    const status = e instanceof StorageError ? 503 : 400
    return NextResponse.json({ error: message }, { status })
  }
}