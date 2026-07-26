import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { getR2Client, getR2Bucket } from "@/lib/r2"
import { assertStorageHealthy, StorageCorruptError } from "@/services/storage-health"

// ── Allowed types ────────────────────────────────────

export const ALLOWED_UPLOAD_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/svg+xml": [".svg"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
} as const

export const ALLOWED_TEMPLATE_MIME_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

export const ALLOWED_UPLOAD_MIME_TYPES = Object.keys(ALLOWED_UPLOAD_TYPES)

export const MAX_FILE_SIZES = {
  template: 10 * 1024 * 1024,
  attachment: 5 * 1024 * 1024,
  generatedDocument: 20 * 1024 * 1024,
} as const

export type FileCategory = keyof typeof MAX_FILE_SIZES

// ── Errors ───────────────────────────────────────────

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ValidationError"
  }
}

// ── Validation helpers ──────────────────────────────

function getExtension(filename: string): string {
  const i = filename.lastIndexOf(".")
  return i === -1 ? "" : filename.slice(i).toLowerCase()
}

function mimeFromExtension(filename: string): string | null {
  const ext = getExtension(filename)
  for (const [mime, exts] of Object.entries(ALLOWED_UPLOAD_TYPES)) {
    if ((exts as readonly string[]).includes(ext)) return mime
  }
  return null
}

export function validateFileType(
  filename: string,
  allowedMimeTypes: string[],
): string {
  const mime = mimeFromExtension(filename)
  if (!mime || !allowedMimeTypes.includes(mime)) {
    throw new ValidationError(
      `Tipe file tidak diizinkan: ${getExtension(filename) || filename}. Format yang diizinkan: ${allowedMimeTypes.join(", ")}`,
    )
  }
  return mime
}

export function validateFileSize(size: number, category: FileCategory): void {
  const max = MAX_FILE_SIZES[category]
  if (size > max) {
    const mb = max / 1024 / 1024
    throw new ValidationError(
      `File terlalu besar (maksimal ${mb}MB untuk ${category}).`,
    )
  }
}

// ── Key builders ─────────────────────────────────────

export function buildDocumentKey(
  documentType: string,
  docNumber: string,
  ext: string,
): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  return `documents/generated/${documentType}/${year}/${month}/${docNumber}${ext.startsWith(".") ? ext : `.${ext}`}`
}

export function buildTemplateKey(documentType: string, filename: string): string {
  return `documents/templates/${documentType}/${filename}`
}

export function buildAttachmentKey(
  attachableType: string,
  attachableId: string,
  filename: string,
): string {
  return `attachments/${attachableType}/${attachableId}/${crypto.randomUUID()}-${filename}`
}

// ── Upload ──────────────────────────────────────────

export async function uploadFromBuffer(
  key: string,
  buffer: Buffer,
  contentType: string,
  category: FileCategory = "generatedDocument",
): Promise<void> {
  validateFileSize(buffer.length, category)
  await assertStorageHealthy()

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  )
}

// ── Read ─────────────────────────────────────────────

export async function getObjectStream(key: string) {
  await assertStorageHealthy()
  const { Body, ContentType } = await getR2Client().send(
    new GetObjectCommand({ Bucket: getR2Bucket(), Key: key }),
  )

  if (!Body) throw new StorageCorruptError(`Object not found: ${key}`)

  return {
    stream: Body.transformToWebStream(),
    contentType: ContentType ?? "application/octet-stream",
  }
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  await assertStorageHealthy()
  const { Body } = await getR2Client().send(
    new GetObjectCommand({ Bucket: getR2Bucket(), Key: key }),
  )

  if (!Body) throw new StorageCorruptError(`Object not found: ${key}`)

  return Buffer.from(await Body.transformToByteArray())
}

// ── Template cache ──────────────────────────────────

const templateCache = new Map<
  string,
  { buffer: Buffer; timestamp: number }
>()
const TEMPLATE_CACHE_TTL = 5 * 60 * 1000
const TEMPLATE_CACHE_MAX = 50

function getCachedTemplate(key: string) {
  const cached = templateCache.get(key)
  if (!cached) return null
  if (Date.now() - cached.timestamp > TEMPLATE_CACHE_TTL) {
    templateCache.delete(key)
    return null
  }
  return cached
}

function setCachedTemplate(key: string, buffer: Buffer): void {
  if (templateCache.size >= TEMPLATE_CACHE_MAX) {
    const oldest = templateCache.keys().next().value
    if (oldest) templateCache.delete(oldest)
  }
  templateCache.set(key, { buffer, timestamp: Date.now() })
}

export async function fetchTemplateFromR2(key: string): Promise<Buffer> {
  await assertStorageHealthy()
  const cached = getCachedTemplate(key)
  if (cached) return cached.buffer

  const buffer = await getObjectBuffer(key)
  setCachedTemplate(key, buffer)
  return buffer
}

// ── Presigned URLs ──────────────────────────────────

export async function getSignedDownloadUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  await assertStorageHealthy()
  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({ Bucket: getR2Bucket(), Key: key }),
    { expiresIn },
  )
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 900,
): Promise<string> {
  await assertStorageHealthy()
  return getSignedUrl(
    getR2Client(),
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn },
  )
}

// ── Delete & metadata ───────────────────────────────

export async function deleteObject(key: string): Promise<void> {
  await assertStorageHealthy()
  await getR2Client().send(
    new DeleteObjectCommand({ Bucket: getR2Bucket(), Key: key }),
  )
}

export async function objectExists(key: string): Promise<boolean> {
  await assertStorageHealthy()
  try {
    await getR2Client().send(
      new HeadObjectCommand({ Bucket: getR2Bucket(), Key: key }),
    )
    return true
  } catch {
    return false
  }
}

export async function getObjectMetadata(key: string) {
  await assertStorageHealthy()
  const { ContentLength, ContentType } = await getR2Client().send(
    new HeadObjectCommand({ Bucket: getR2Bucket(), Key: key }),
  )

  return {
    size: ContentLength ?? 0,
    contentType: ContentType ?? "application/octet-stream",
  }
}