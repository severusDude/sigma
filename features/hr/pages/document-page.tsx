"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { SortOption } from "@/lib/types/sort";
import { FilterCategory } from "@/lib/types/filter";
import { DataTable } from "@/components/shared/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentType } from "@/generated/prisma/enums";
import { FileText, Send } from "lucide-react";

import type { DocumentRow, GenerateDocResult } from "../types/document-types";
import { createColumns } from "../components/document/columns";
import { ActionCard } from "../components/document/action-card";
import {
  generateCertificates,
  generateAssignmentLetter,
  generateAssessmentReport,
  generateAttendanceReport,
  generateCompletionLetter,
} from "../actions/document-actions";
import { PreviewDialog } from "@/components/shared/document";

interface DocumentPageProps {
  interns: DocumentRow[];
}

const tabConfig: { value: DocumentType; label: string }[] = [
  { value: DocumentType.certificate, label: "Sertifikat" },
  { value: DocumentType.assignment_letter, label: "Surat Tugas" },
  { value: DocumentType.assessment_report, label: "Laporan Penilaian" },
  { value: DocumentType.attendance_report, label: "Rekap Absensi" },
  { value: DocumentType.completion_letter, label: "Surat Keterangan Selesai" },
];

const filterOptions: FilterCategory[] = [
  {
    id: "department",
    label: "Bidang",
    options: [
      { label: "Statistik Sosial", value: "Statistik Sosial" },
      { label: "Statistik Produksi", value: "Statistik Produksi" },
      { label: "Statistik Distribusi", value: "Statistik Distribusi" },
      { label: "IT Support", value: "IT Support" },
      { label: "Nerwilis", value: "Nerwilis" },
    ],
  },
];

const sortOptions: SortOption[] = [
  { id: "nameNik", label: "Nama" },
  { id: "department", label: "Bidang" },
  { id: "period", label: "Periode" },
];

type GenerateFn = (ids: string[]) => Promise<{ success: boolean; data?: GenerateDocResult[]; error?: string }>;

const generateActions: Record<string, GenerateFn> = {
  [DocumentType.certificate]: generateCertificates as GenerateFn,
  [DocumentType.assignment_letter]: generateAssignmentLetter as GenerateFn,
  [DocumentType.assessment_report]: generateAssessmentReport as GenerateFn,
  [DocumentType.attendance_report]: generateAttendanceReport as GenerateFn,
  [DocumentType.completion_letter]: generateCompletionLetter as GenerateFn,
};

const documentLabels: Record<string, string> = {
  [DocumentType.certificate]: "sertifikat",
  [DocumentType.assignment_letter]: "surat tugas",
  [DocumentType.assessment_report]: "laporan penilaian",
  [DocumentType.attendance_report]: "rekap absensi",
  [DocumentType.completion_letter]: "surat keterangan selesai",
};

export default function DocumentPage({ interns }: DocumentPageProps) {
  const [tab, setTab] = useState<DocumentType>(DocumentType.certificate);
  const router = useRouter();
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const handleGenerate = async (rows: DocumentRow | DocumentRow[]) => {
    const internIds = (Array.isArray(rows) ? rows : [rows]).map((r) => r.id);
    const generateFn = generateActions[tab];
    const label = documentLabels[tab] ?? "dokumen";

    setGenerating(true);
    const result = await generateFn(internIds);
    setGenerating(false);

    if (!result.success) {
      toast.error(result.error || `Gagal generate ${label}`);
      return;
    }

    const genData = result.data!;
    const docSuccess = genData.filter((r) => !r.error);

    if (docSuccess.length > 0) {
      toast.success(
        `${docSuccess.length} ${label} berhasil dibuat dan siap dikirim ke TTE`,
      );
    }

    router.refresh();
  };

  const handleGenerateAndSend = async (rows: DocumentRow | DocumentRow[]) => {
    const internIds = (Array.isArray(rows) ? rows : [rows]).map((r) => r.id);
    const generateFn = generateActions[tab];
    const label = documentLabels[tab] ?? "dokumen";

    setSending(true);
    const result = await generateFn(internIds);
    setSending(false);

    if (!result.success) {
      toast.error(result.error || `Gagal generate ${label}`);
      return;
    }

    const genData = result.data!;
    const docSuccess = genData.filter((r) => !r.error);

    if (docSuccess.length > 0) {
      toast.success(
        `${docSuccess.length} ${label} berhasil dibuat dan siap dikirim ke TTE`,
      );
      router.refresh();
    }
  };

  const batchActions = [
    {
      label: generating ? "Memproses..." : "Generate Document",
      icon: <FileText className="size-4" />,
      onClick: handleGenerate,
    },
    {
      label: sending
        ? "Memproses..."
        : "Generate & Kirim ke TTE",
      icon: <Send className="size-4" />,
      onClick: handleGenerateAndSend,
    },
  ];

  const columns = createColumns({
    onView: (row) => setPreviewDocId(row.id),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Generate Documents
        </h1>
        <p className="text-sm text-muted-foreground">
          Terbitkan sertifikat, surat tugas, dan dokumen kelengkapan magang
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as DocumentType)}>
        <TabsList className="gap-2">
          {tabConfig.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabConfig.map((t) => (
          <TabsContent key={t.value} value={t.value}>
            <div className="flex gap-4 items-start">
              <div className="flex-1 min-w-0">
                <DataTable
                  columns={columns}
                  data={interns}
                  filterCategories={filterOptions}
                  sortOptions={sortOptions}
                  batchActions={batchActions}
                />
              </div>

              <ActionCard />
            </div>
          </TabsContent>
        ))}
      </Tabs>
      <PreviewDialog docId={previewDocId} onClose={() => setPreviewDocId(null)} />
    </div>
  );
}
