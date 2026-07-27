import type { ImageLoaderProps } from "next/image"

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? ""

function normalizeSrc(src: string): string {
  if (src.startsWith("http")) {
    return src.replace(/^https?:\/\//, "")
  }
  return src.replace(/^\//, "")
}

function isR2Url(src: string): boolean {
  return !!(R2_PUBLIC_URL && src.startsWith(R2_PUBLIC_URL))
}

function toFullUrl(src: string): string | null {
  if (!R2_PUBLIC_URL) return null
  if (isR2Url(src)) return src
  if (src.startsWith("avatars/")) {
    return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${src}`
  }
  return null
}

function buildCfImageUrl(
  src: string,
  width: number,
  quality?: number,
): string {
  const params = [`width=${width}`, `quality=${quality || 75}`, "format=auto"]
  return `/cdn-cgi/image/${params.join(",")}/${normalizeSrc(src)}`
}

export default function cfImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps) {
  const fullUrl = toFullUrl(src)
  if (!fullUrl) return src
  return buildCfImageUrl(fullUrl, width, quality)
}

export function getOptimizedSrc(
  src: string | null | undefined,
  width: number,
  quality?: number,
): string {
  if (!src) return ""
  const fullUrl = toFullUrl(src)
  if (!fullUrl) return src
  return buildCfImageUrl(fullUrl, width, quality)
}
