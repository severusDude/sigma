import type { ImageLoaderProps } from "next/image"

const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? ""

function normalizeSrc(src: string): string {
  if (src.startsWith("http")) {
    return src.replace(/^https?:\/\//, "")
  }
  return src.replace(/^\//, "")
}

export default function cfImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps) {
  if (process.env.NODE_ENV === "development") return src

  const params = [`width=${width}`, `quality=${quality || 75}`, "format=auto"]
  return `/cdn-cgi/image/${params.join(",")}/${normalizeSrc(src)}`
}

export function getOptimizedSrc(
  src: string | null | undefined,
  width: number,
  quality?: number,
): string {
  if (!src) return ""
  if (process.env.NODE_ENV === "development") return src

  if (src.startsWith(R2_PUBLIC_URL)) {
    const params = [`width=${width}`, `quality=${quality || 75}`, "format=auto"]
    return `/cdn-cgi/image/${params.join(",")}/${normalizeSrc(src)}`
  }

  return src
}
