import { HeadBucketCommand, S3ServiceException } from "@aws-sdk/client-s3"
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

// ── Health check ──────────────────────────────────────

let healthCache: {
  healthy: boolean
  checkedAt: number
  healthyError: StorageError | null
} | null = null

let inflight: Promise<{
  healthy: boolean
  error: StorageError | null
}> | null = null

const HEALTH_CACHE_TTL = 60_000

export async function checkStorageHealth(): Promise<{
  healthy: boolean
  error: StorageError | null
}> {
  const now = Date.now()
  if (healthCache && now - healthCache.checkedAt < HEALTH_CACHE_TTL) {
    return { healthy: healthCache.healthy, error: healthCache.healthyError }
  }

  if (inflight) return inflight

  inflight = (async () => {
    try {
      await getR2Client().send(
        new HeadBucketCommand({ Bucket: getR2Bucket() }),
      )
      healthCache = { healthy: true, checkedAt: Date.now(), healthyError: null }
      return { healthy: true, error: null }
    } catch (e) {
      const error = classifyStorageError(e)
      healthCache = { healthy: false, checkedAt: Date.now(), healthyError: error }
      return { healthy: false, error }
    } finally {
      inflight = null
    }
  })()

  return inflight
}

export async function assertStorageHealthy(): Promise<void> {
  const { healthy, error } = await checkStorageHealth()
  if (!healthy && error) throw error
}

export function invalidateHealthCache(): void {
  healthCache = null
}
