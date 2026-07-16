"use client";

import { FileText, Send, Eye } from "lucide-react";

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
      <div className="rounded-md border bg-muted/50 p-4">
        <h3 className="text-sm font-medium mb-3">Template Dokumen</h3>

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

          <Button variant="outline" className="w-full gap-2" disabled>
            <Eye className="size-4" />
            Lihat Preview
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-muted/50 p-4">
        <h3 className="text-sm font-medium mb-3">Generate</h3>

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
