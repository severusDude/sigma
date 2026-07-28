import { PDFDocument, rgb, PDFFont, StandardFonts } from "pdf-lib"

export type TextField = {
  name: string
  value: string
  x: number
  y: number
  size: number
  font?: "Inter" | "LibreBaskerville"
  align?: "left" | "center" | "right"
  color?: { r: number; g: number; b: number }
  hidden?: boolean
}

function hexToRgb(hex?: string) {
  if (!hex) return undefined
  const clean = hex.replace("#", "")
  const num = Number.parseInt(clean, 16)
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  }
}

export async function getPdfDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true })
  const pages = doc.getPages()
  if (pages.length === 0) {
    throw new Error("PDF tidak memiliki halaman")
  }
  const { width, height } = pages[0].getSize()
  return { width, height }
}

const DEFAULT_W = 842
const DEFAULT_H = 595

export function getDefaultCertificateFields(
  canvasW?: number,
  canvasH?: number,
): TextField[] {
  const sx = canvasW ? canvasW / DEFAULT_W : 1
  const sy = canvasH ? canvasH / DEFAULT_H : 1
  const s = canvasW ? Math.min(sx, sy) : 1
  const scaleCoord = (val: number) => Math.round(val * s)
  const scaleSize = (val: number) => Math.max(6, Math.round(val * s))

  return [
    { name: "nomor_sertifikat", value: "", x: scaleCoord(50), y: scaleCoord(50), size: scaleSize(10), font: "Inter", align: "left", hidden: false },
    { name: "nama_peserta", value: "", x: scaleCoord(421), y: scaleCoord(330), size: scaleSize(22), font: "LibreBaskerville", align: "center", color: { r: 0.12, g: 0.16, b: 0.23 }, hidden: false },
    { name: "nik", value: "", x: scaleCoord(50), y: scaleCoord(420), size: scaleSize(11), font: "Inter", align: "left", hidden: false },
    { name: "institusi", value: "", x: scaleCoord(421), y: scaleCoord(380), size: scaleSize(11), font: "Inter", align: "center", hidden: false },
    { name: "program", value: "", x: scaleCoord(421), y: scaleCoord(405), size: scaleSize(11), font: "Inter", align: "center", hidden: false },
    { name: "bidang", value: "", x: scaleCoord(421), y: scaleCoord(430), size: scaleSize(11), font: "Inter", align: "center", hidden: false },
    { name: "tanggal_mulai", value: "", x: scaleCoord(300), y: scaleCoord(460), size: scaleSize(11), font: "Inter", align: "left", hidden: false },
    { name: "tanggal_selesai", value: "", x: scaleCoord(500), y: scaleCoord(460), size: scaleSize(11), font: "Inter", align: "left", hidden: false },
    { name: "nama_pembimbing", value: "", x: scaleCoord(421), y: scaleCoord(520), size: scaleSize(12), font: "Inter", align: "center", hidden: false },
    { name: "nip_pembimbing", value: "", x: scaleCoord(421), y: scaleCoord(535), size: scaleSize(10), font: "Inter", align: "center", hidden: false },
    { name: "tanggal_sertifikat", value: "", x: scaleCoord(421), y: scaleCoord(560), size: scaleSize(10), font: "Inter", align: "center", hidden: false },
  ]
}

export async function generateCertificatePdf(
  backgroundPdfBuffer: Buffer,
  fields: TextField[],
): Promise<Buffer> {
  const bgDoc = await PDFDocument.load(backgroundPdfBuffer, { ignoreEncryption: true })

  const bgPages = bgDoc.getPages()
  if (bgPages.length === 0) {
    throw new Error("Template PDF tidak memiliki halaman")
  }

  const newDoc = await PDFDocument.create()

  const interFont = await newDoc.embedFont(StandardFonts.Helvetica)
  const libreBaskervilleFont = await newDoc.embedFont(StandardFonts.TimesRoman)
  const fontCache = new Map<string, PDFFont>([
    ["Inter", interFont],
    ["LibreBaskerville", libreBaskervilleFont],
  ])

  const firstBgPage = bgPages[0]
  const { width: pageW, height: pageH } = firstBgPage.getSize()

  const embeddedBg = await newDoc.embedPage(firstBgPage, {
    left: 0,
    right: pageW,
    bottom: 0,
    top: pageH,
  })

  const page = newDoc.addPage([pageW, pageH])

  page.drawPage(embeddedBg, {
    x: 0,
    y: 0,
    width: pageW,
    height: pageH,
  })

  for (const field of fields) {
    if (field.hidden) continue
    if (!field.value || field.value.trim() === "") continue

    const fontKey = field.font ?? "Inter"
    const font = fontCache.get(fontKey) ?? fontCache.get("Inter")!

    const fieldColor = field.color ?? { r: 0, g: 0, b: 0 }

    const fieldX = field.x
    const fieldY = pageH - field.y

    const textWidth = font.widthOfTextAtSize(field.value, field.size)

    let drawX = fieldX
    if (field.align === "center") {
      drawX = fieldX - textWidth / 2
    } else if (field.align === "right") {
      drawX = fieldX - textWidth
    }

    const fontHeight = font.heightAtSize(field.size)
    const drawY = fieldY - fontHeight * 0.2

    page.drawText(field.value, {
      x: drawX,
      y: drawY,
      size: field.size,
      font,
      color: rgb(fieldColor.r, fieldColor.g, fieldColor.b),
    })
  }

  return Buffer.from(await newDoc.save())
}
