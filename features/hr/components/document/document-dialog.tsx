"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, ExternalLink } from "lucide-react"
import { DocumentType } from "@/generated/prisma/enums"

const DOCUMENT_CONFIG = [
  { type: DocumentType.certificate, label: "Sertifikat" },
  { type: DocumentType.assignment_letter, label: "Surat Tugas" },
  { type: DocumentType.assessment_report, label: "Laporan Penilaian" },
  { type: DocumentType.attendance_report, label: "Rekap Absensi" },
  { type: DocumentType.completion_letter, label: "Surat Keterangan Selesai" },
]

type DocumentInfo = {
  id: string
  documentType: string
  fileUrl: string | null
}

interface DocumentDialogProps {
  internName: string
  documents: DocumentInfo[]
  open: boolean
  onClose: () => void
}

export function DocumentDialog({ internName, documents, open, onClose }: DocumentDialogProps) {
  const docMap = new Map(documents.map((d) => [d.documentType, d]))

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dokumen — {internName}</DialogTitle>
          <DialogDescription>
            Daftar dokumen yang tersedia untuk peserta ini.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {DOCUMENT_CONFIG.map((cfg) => {
            const doc = docMap.get(cfg.type)
            return (
              <div
                key={cfg.type}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium">{cfg.label}</span>
                </div>
                {doc?.fileUrl ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/api/documents/${doc.id}/file`, "_blank")}
                  >
                    Buka
                    <ExternalLink className="ml-1 size-3" />
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">Belum Ada</span>
                )}
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
