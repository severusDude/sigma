import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import fs from "fs"
import path from "path"

const TEMPLATE_DIR = path.join(process.cwd(), "templates", "hr")

export type TemplateName =
  | "assignment-letter"
  | "assessment-report"
  | "attendance-report"
  | "completion-letter"

export function getTemplatePath(name: TemplateName): string {
  return path.join(TEMPLATE_DIR, `${name}.docx`)
}

export function loadTemplateBuffer(name: TemplateName): Buffer {
  const filePath = getTemplatePath(name)
  return fs.readFileSync(filePath)
}

export function generateFromTemplate(
  templateBuffer: Buffer,
  data: Record<string, unknown>,
): Buffer {
  const zip = new PizZip(templateBuffer)
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  })
  doc.render(data)
  return doc.toBuffer()
}

export function generateFromTemplateName(
  name: TemplateName,
  data: Record<string, unknown>,
): Buffer {
  const templateBuffer = loadTemplateBuffer(name)
  return generateFromTemplate(templateBuffer, data)
}
