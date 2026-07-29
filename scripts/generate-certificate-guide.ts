import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { writeFileSync } from "fs"
import { join } from "path"
import { getDefaultCertificateFields } from "../lib/pdf-certificate"

const PAGE_W = 842
const PAGE_H = 595

const FIELD_LABELS: Record<string, string> = {
  nomor_sertifikat: "Nomor Sertifikat",
  nama_peserta: "Nama Peserta",
  nik: "NIK",
  institusi: "Institusi",
  program: "Program",
  team: "Team",
  tanggal_mulai: "Tanggal Mulai",
  tanggal_selesai: "Tanggal Selesai",
  nama_pembimbing: "Nama Pembimbing",
  nip_pembimbing: "NIP Pembimbing",
  tanggal_sertifikat: "Tanggal Sertifikat",
}

const GRID_COLOR = rgb(0.85, 0.85, 0.85)
const BOX_COLOR = rgb(0.9, 0.2, 0.2)
const TEXT_COLOR = rgb(0.1, 0.1, 0.1)
const INFO_COLOR = rgb(0.4, 0.4, 0.4)
const EDGE_COLOR = rgb(0.0, 0.4, 0.8)
const LABEL_BG = rgb(1, 1, 0.85)

function resolveY(y: number): number {
  return PAGE_H - y
}

async function main() {
  const doc = await PDFDocument.create()
  const helv = await doc.embedFont(StandardFonts.Helvetica)
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([PAGE_W, PAGE_H])

  // ── Grid ──
  const gridStep = 50
  for (let x = 0; x <= PAGE_W; x += gridStep) {
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: PAGE_H },
      color: GRID_COLOR,
      thickness: x % 100 === 0 ? 0.5 : 0.2,
    })
  }
  for (let y = 0; y <= PAGE_H; y += gridStep) {
    page.drawLine({
      start: { x: 0, y },
      end: { x: PAGE_W, y },
      color: GRID_COLOR,
      thickness: y % 100 === 0 ? 0.5 : 0.2,
    })
  }

  // Grid labels (every 100px)
  for (let x = 0; x <= PAGE_W; x += 100) {
    page.drawText(`${x}`, {
      x: x + 2,
      y: 2,
      size: 6,
      font: helv,
      color: GRID_COLOR,
    })
  }
  for (let y = 0; y <= PAGE_H; y += 100) {
    page.drawText(`${PAGE_H - y}`, {
      x: 2,
      y: y + 2,
      size: 6,
      font: helv,
      color: GRID_COLOR,
    })
  }

  // ── Edge dimensions ──
  page.drawText("0", { x: 4, y: 4, size: 7, font: helvBold, color: EDGE_COLOR })
  page.drawText("0", { x: 4, y: PAGE_H - 12, size: 7, font: helvBold, color: EDGE_COLOR })
  page.drawText(`${PAGE_W}`, {
    x: PAGE_W - 32,
    y: 4,
    size: 7,
    font: helvBold,
    color: EDGE_COLOR,
  })

  // ── Fields ──
  const fields = getDefaultCertificateFields()

  for (const f of fields) {
    const label = FIELD_LABELS[f.name] ?? f.name
    const cx = f.x
    const cy = resolveY(f.y)
    const boxW = f.size * 8
    const boxH = f.size * 1.6
    const halfW = boxW / 2
    const halfH = boxH / 2

    // Box center
    const bx = f.align === "center" ? cx - halfW : f.align === "right" ? cx - boxW : cx
    const by = cy - halfH

    // Bounding box
    page.drawRectangle({
      x: bx,
      y: by,
      width: boxW,
      height: boxH,
      borderColor: BOX_COLOR,
      borderWidth: 1,
      color: rgb(1, 0.95, 0.95),
      opacity: 0.3,
    })

    // Crosshair at anchor point
    page.drawLine({
      start: { x: cx - 4, y: cy },
      end: { x: cx + 4, y: cy },
      color: BOX_COLOR,
      thickness: 0.5,
    })
    page.drawLine({
      start: { x: cx, y: cy - 4 },
      end: { x: cx, y: cy + 4 },
      color: BOX_COLOR,
      thickness: 0.5,
    })

    // Label background
    const labelText = `[${label}]`
    const labelW = helv.widthOfTextAtSize(labelText, 7) + 6
    const labelH = 12

    page.drawRectangle({
      x: bx + 2,
      y: by + boxH + 2,
      width: labelW,
      height: labelH,
      color: LABEL_BG,
      borderColor: BOX_COLOR,
      borderWidth: 0.5,
    })

    page.drawText(labelText, {
      x: bx + 5,
      y: by + boxH + 4,
      size: 7,
      font: helvBold,
      color: BOX_COLOR,
    })

    // Info line
    const alignLabel = f.align === "left" ? "kiri" : f.align === "center" ? "tengah" : "kanan"
    const infoLine = `x:${f.x} y:${f.y} size:${f.size} align:${alignLabel}`

    page.drawText(infoLine, {
      x: bx + 2,
      y: by - 11,
      size: 6,
      font: helv,
      color: INFO_COLOR,
    })

    // Corner coordinate markers for box
    const cornerInfo = `(${f.x}, ${f.y})`
    const ciW = helv.widthOfTextAtSize(cornerInfo, 6) + 4
    page.drawRectangle({
      x: cx - ciW / 2,
      y: cy + 4,
      width: ciW,
      height: 10,
      color: rgb(0.9, 0.95, 1),
      borderColor: EDGE_COLOR,
      borderWidth: 0.3,
    })
    page.drawText(cornerInfo, {
      x: cx - ciW / 2 + 2,
      y: cy + 5,
      size: 6,
      font: helv,
      color: EDGE_COLOR,
    })
  }

  // ── Legend ──
  const legendX = 20
  const legendY = 40
  page.drawRectangle({
    x: legendX,
    y: legendY,
    width: 280,
    height: 90,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.6, 0.6, 0.6),
    borderWidth: 0.5,
  })
  page.drawText("LEGEND", {
    x: legendX + 10,
    y: legendY + 76,
    size: 8,
    font: helvBold,
    color: TEXT_COLOR,
  })

  const legendItems = [
    { label: "Bounding box field", color: BOX_COLOR },
    { label: "Crosshair = anchor point (x,y)", color: BOX_COLOR },
    { label: "Grid = 50px interval", color: GRID_COLOR },
    { label: "Koordinat canvas: X kiri - kanan, Y atas - bawah", color: EDGE_COLOR },
  ]
  legendItems.forEach((item, i) => {
    const ly = legendY + 60 - i * 14
    page.drawText(">", { x: legendX + 10, y: ly - 1, size: 7, font: helv, color: item.color })
    page.drawText(item.label, { x: legendX + 24, y: ly, size: 7, font: helv, color: TEXT_COLOR })
  })

  const buf = Buffer.from(await doc.save())
  const outPath = join(process.cwd(), "scripts", "output", "certificate-field-guide.pdf")
  writeFileSync(outPath, buf)
  console.log(`✅ Guide PDF generated: ${outPath}`)
  console.log(`   Page size: ${PAGE_W} × ${PAGE_H} pt (A4 landscape)`)
  console.log(`   Fields shown: ${fields.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
