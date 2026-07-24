import { prisma } from "@/lib/prisma"
import {
  uploadFromBuffer,
  buildDocumentKey,
  buildTemplateKey,
} from "@/services/storage"
import fs from "fs"
import path from "path"

async function migrateDocuments() {
  const docs = await prisma.document.findMany({
    where: { fileUrl: { not: null } },
    select: {
      id: true,
      documentNumber: true,
      fileUrl: true,
      documentType: true,
    },
  })

  let ok = 0
  let skip = 0

  for (const doc of docs) {
    if (!doc.fileUrl) continue
    if (doc.fileUrl.startsWith("documents/")) {
      skip++
      continue
    }

    const localPath = path.resolve(doc.fileUrl)
    if (!fs.existsSync(localPath)) {
      console.warn(`[SKIP] File not found: ${localPath} (doc ${doc.id})`)
      skip++
      continue
    }

    const ext = path.extname(localPath) || ".pdf"
    const key = buildDocumentKey(doc.documentType, doc.documentNumber!, ext)
    const buffer = fs.readFileSync(localPath)
    const mime =
      ext === ".pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    await uploadFromBuffer(key, buffer, mime)
    await prisma.document.update({ where: { id: doc.id }, data: { fileUrl: key } })
    console.log(`[OK] ${doc.documentNumber} → ${key}`)
    ok++
  }

  console.log(`\nDocuments: ${ok} migrated, ${skip} skipped`)
}

async function migrateTemplates() {
  const templates = await prisma.documentTemplate.findMany()
  let ok = 0
  let skip = 0

  for (const t of templates) {
    if (t.content.startsWith("documents/")) {
      skip++
      continue
    }

    const localPath = path.resolve(t.content)
    if (!fs.existsSync(localPath)) {
      console.warn(`[SKIP] Template file not found: ${localPath} (id ${t.id})`)
      skip++
      continue
    }

    const filename = path.basename(localPath)
    const key = buildTemplateKey(t.documentType, filename)
    const buffer = fs.readFileSync(localPath)

    await uploadFromBuffer(
      key,
      buffer,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "template",
    )
    await prisma.documentTemplate.update({
      where: { id: t.id },
      data: { content: key },
    })
    console.log(`[OK] template "${t.name}" → ${key}`)
    ok++
  }

  console.log(`\nTemplates: ${ok} migrated, ${skip} skipped`)
}

async function main() {
  console.log("=== Migrating Documents ===")
  await migrateDocuments()
  console.log("\n=== Migrating Templates ===")
  await migrateTemplates()
  console.log("\n=== Migration Complete ===")
}

main().catch((e) => {
  console.error("Migration failed:", e)
  process.exit(1)
})