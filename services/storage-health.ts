import { HeadBucketCommand, S3ServiceException } from "@aws-sdk/client-s3"
import { cacheLife } from "next/cache"
import { getR2Client, getR2Bucket } from "@/lib/r2"

// ── Error classes ─────────────────────────────────────

export class StorageError extends Error {
  public readonly retryable: boolean
  public readonly userMessage: string

  constructor(message: string, retryable: boolean, userMessage: string) {
    super(message)
    this.name = "StorageError"
    this.retryable = retryable
    this.userMessage = userMessage
  }
}

export class StorageUnavailableError extends StorageError {
  constructor(message: string) {
    super(message, true, "Penyimpanan tidak tersedia. Coba lagi nanti.")
    this.name = "StorageUnavailableError"
  }
}

export class StorageAuthError extends StorageError {
  constructor(message: string) {
    super(message, false, "Konfigurasi penyimpanan tidak valid. Hubungi administrator.")
    this.name = "StorageAuthError"
  }
}

export class StorageNotFoundError extends StorageError {
  constructor(message: string) {
    super(message, false, "File tidak ditemukan di penyimpanan.")
    this.name = "StorageNotFoundError"
  }
}

export class StorageRateLimitError extends StorageError {
  constructor(message: string) {
    super(message, true, "Penyimpanan sedang sibuk. Coba lagi beberapa saat.")
    this.name = "StorageRateLimitError"
  }
}

export class StorageCorruptError extends StorageError {
  constructor(message: string) {
    super(message, true, "File di penyimpanan rusak atau tidak dapat dibaca.")
    this.name = "StorageCorruptError"
  }
}

// ── Error classifier ─────────────────────────────────

export function classifyStorageError(cause: unknown): StorageError {
  if (cause instanceof StorageError) return cause

  const name =
    cause instanceof S3ServiceException
      ? cause.name
      : (cause as Error)?.name ?? ""

  const message = cause instanceof Error ? cause.message : String(cause)

  switch (name) {
    case "AccessDenied":
    case "InvalidAccessKeyId":
    case "SignatureDoesNotMatch":
    case "CredentialsProviderError":
      return new StorageAuthError(message)

    case "NoSuchKey":
    case "NotFound":
      return new StorageNotFoundError(message)

    case "SlowDown":
    case "TooManyRequests":
      return new StorageRateLimitError(message)

    case "TimeoutError":
    case "NetworkingError":
    case "RequestTimeout":
      return new StorageUnavailableError(message)

    default:
      return new StorageUnavailableError(message)
  }
}

// ── Health check (shared across serverless instances via remote cache) ──

export async function checkStorageHealth(): Promise<{ healthy: boolean }> {
  "use cache: remote"
  cacheLife({ revalidate: 60 })

  try {
    await getR2Client().send(
      new HeadBucketCommand({ Bucket: getR2Bucket() }),
    )
    return { healthy: true }
  } catch (e) {
    const error = classifyStorageError(e)
    console.error("R2 health check failed", error.userMessage)
    return { healthy: false }
  }
}

export async function assertStorageHealthy(): Promise<void> {
  const { healthy } = await checkStorageHealth()
  if (!healthy) {
    throw new StorageUnavailableError("R2 health check failed")
  }
}
