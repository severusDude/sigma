"use client";

import { FileTextIcon, ExternalLinkIcon, SendIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DocumentType } from "@/generated/prisma/enums";

import type { ActiveTemplateInfo } from "../../pages/document-page";

const documentTypeLabels: Record<string, string> = {
  [DocumentType.certificate]: "Sertifikat",
  [DocumentType.assignment_letter]: "Surat Tugas",
  [DocumentType.assessment_report]: "Laporan Penilaian",
  [DocumentType.attendance_report]: "Rekap Absensi",
  [DocumentType.completion_letter]: "Surat Keterangan Selesai",
};

interface ActionCardProps {
  tab: DocumentType;
  activeTemplates: ActiveTemplateInfo[];
}

function templatePreviewUrl(type: string): string {
  if (type === "certificate") return "/api/templates/certificate/preview";
  return `/api/templates/${type}/preview`;
}

export function ActionCard({ tab, activeTemplates }: ActionCardProps) {
  const activeTemplate = activeTemplates.find((t) => t.documentType === tab);
  const hasTemplate = tab === DocumentType.certificate || !!activeTemplate;

  return (
    <aside className="flex flex-col gap-4 w-80 shrink-0">
      <div className="p-4 border rounded-md bg-muted/50">
        <h3 className="mb-3 text-sm font-medium">Template Dokumen</h3>

        {hasTemplate ? (
          <a
            href={templatePreviewUrl(tab)}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col items-center justify-center h-60 rounded-md border border-dashed bg-card transition-colors hover:border-primary/50 hover:bg-accent/30"
          >
            <FileTextIcon className="size-10 text-muted-foreground/40 group-hover:text-primary/60 transition-colors mb-2" />
            <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              {tab === DocumentType.certificate
                ? "Klik untuk lihat preview"
                : "Klik untuk lihat preview template"}
            </p>

            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow">
                <ExternalLinkIcon className="size-3.5" />
                Lihat Preview
              </div>
            </div>

            {activeTemplate && (
              <div className="absolute bottom-2 left-2 right-2">
                <div className="rounded bg-background/90 px-2 py-1 text-xs text-muted-foreground truncate text-center">
                  {activeTemplate.name}
                  {activeTemplate.variables.length > 0 && (
                    <span className="ml-1.5 text-[10px] text-muted-foreground/60">
                      &middot; {activeTemplate.variables.length} placeholder
                    </span>
                  )}
                </div>
              </div>
            )}
          </a>
        ) : (
          <div className="flex flex-col items-center justify-center h-60 rounded-md border border-dashed bg-card">
            <FileTextIcon className="size-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">Belum ada template</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1 text-center px-4">
              Upload template {documentTypeLabels[tab]?.toLowerCase() ?? "dokumen"} di menu Kelola Template
            </p>
          </div>
        )}
      </div>

      <div className="p-4 border rounded-md bg-muted/50">
        <h3 className="mb-3 text-sm font-medium">Generate</h3>

        <div className="space-y-3">
          <Button className="w-full gap-2" disabled>
            <FileTextIcon className="size-4" />
            Generate Document
          </Button>
          <Button variant="secondary" className="w-full gap-2" disabled>
            <SendIcon className="size-4" />
            Generate &amp; Kirim ke TTE
          </Button>
        </div>
      </div>
    </aside>
  );
}
