const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? ""

function toFullUrl(src: string): string | null {
  if (!R2_PUBLIC_URL) return null
  if (src.startsWith(R2_PUBLIC_URL)) return src
  if (src.startsWith("avatars/")) {
    return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${src}`
  }
  return null
}

export function getOptimizedSrc(
  src: string | null | undefined,
  _width?: number,
  _quality?: number,
): string {
  if (!src) return ""
  const fullUrl = toFullUrl(src)
  if (!fullUrl) return src
  return fullUrl
}
