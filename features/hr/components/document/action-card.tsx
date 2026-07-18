"use client";

import { FileText, Send, Eye } from "lucide-react";

import { DocumentPreview } from "@/components/shared/document";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentType } from "@/generated/prisma/enums";

const documentTypeLabels: Record<string, string> = {
  [DocumentType.certificate]: "Sertifikat Standar",
  [DocumentType.assignment_letter]: "Surat Tugas",
  [DocumentType.assessment_report]: "Laporan Penilaian",
  [DocumentType.attendance_report]: "Rekap Absensi",
  [DocumentType.completion_letter]: "Surat Keterangan Selesai",
};

export function ActionCard() {
  return (
    <aside className="flex flex-col gap-4 w-80 shrink-0">
      <div className="p-4 border rounded-md bg-muted/50">
        <h3 className="mb-3 text-sm font-medium">Template Dokumen</h3>

        <div className="space-y-3">
          <Select defaultValue={DocumentType.certificate}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(documentTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DocumentPreview size="thumbnail" />
        </div>
      </div>

      <div className="p-4 border rounded-md bg-muted/50">
        <h3 className="mb-3 text-sm font-medium">Generate</h3>

        <div className="space-y-3">
          <Button className="w-full gap-2" disabled>
            <FileText className="size-4" />
            Generate Document
          </Button>
          <Button variant="secondary" className="w-full gap-2" disabled>
            <Send className="size-4" />
            Generate &amp; Kirim ke TTE
          </Button>
        </div>
      </div>
    </aside>
  );
}
