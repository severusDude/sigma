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

const PAGE_HEIGHT = 595
const PAGE_WIDTH = 842

function resolveY(y: number): number {
  return PAGE_HEIGHT - y
}

export function getDefaultCertificateFields(): TextField[] {
  return [
    { name: "nomor_sertifikat", value: "", x: 50, y: 50, size: 10, font: "Inter", align: "left" },
    { name: "nama_peserta", value: "", x: 421, y: 330, size: 22, font: "LibreBaskerville", align: "center", color: { r: 0.12, g: 0.16, b: 0.23 } },
    { name: "nik", value: "", x: 50, y: 420, size: 11, font: "Inter", align: "left" },
    { name: "institusi", value: "", x: 421, y: 380, size: 11, font: "Inter", align: "center" },
    { name: "program", value: "", x: 421, y: 405, size: 11, font: "Inter", align: "center" },
    { name: "bidang", value: "", x: 421, y: 430, size: 11, font: "Inter", align: "center" },
    { name: "tanggal_mulai", value: "", x: 300, y: 460, size: 11, font: "Inter", align: "left" },
    { name: "tanggal_selesai", value: "", x: 500, y: 460, size: 11, font: "Inter", align: "left" },
    { name: "nama_pembimbing", value: "", x: 421, y: 520, size: 12, font: "Inter", align: "center" },
    { name: "nip_pembimbing", value: "", x: 421, y: 535, size: 10, font: "Inter", align: "center" },
    { name: "tanggal_sertifikat", value: "", x: 421, y: 560, size: 10, font: "Inter", align: "center" },
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
  const { width: bgW, height: bgH } = firstBgPage.getSize()
  const scale = Math.min(PAGE_WIDTH / bgW, PAGE_HEIGHT / bgH)

  const embeddedBg = await newDoc.embedPage(firstBgPage, {
    left: 0,
    right: bgW,
    bottom: 0,
    top: bgH,
  })

  const page = newDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])

  page.drawPage(embeddedBg, {
    x: 0,
    y: 0,
    width: bgW * scale,
    height: bgH * scale,
  })

  for (const field of fields) {
    if (!field.value || field.value.trim() === "") continue

    const fontKey = field.font ?? "Inter"
    const font = fontCache.get(fontKey) ?? fontCache.get("Inter")!

    const fieldColor = field.color ?? { r: 0, g: 0, b: 0 }

    const fieldX = field.x
    const fieldY = resolveY(field.y)

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
