"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useStorageToast } from "@/hooks/use-storage-toast";

import { SortOption } from "@/lib/types/sort";
import { FilterCategory } from "@/lib/types/filter";
import { DataTable } from "@/components/shared/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentType } from "@/generated/prisma/enums";
import { FileText } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import type { DocumentRow, GenerateDocResult } from "../types/document-types";
import { createColumns } from "../components/document/columns";
import { ActionCard } from "../components/document/action-card";
import {
  generateCertificates,
  generateAssignmentLetter,
  generateAssessmentReport,
  generateAttendanceReport,
  generateCompletionLetter,
  validateInternsCompleteness,
  getInternDocuments,
  filterExistingDocuments,
} from "../actions/document-actions";
import type { CompletenessError, ExistingDocInfo } from "../actions/document-actions";
import { DocumentDialog } from "../components/document/document-dialog";

export type ActiveTemplateInfo = {
  documentType: string;
  name: string;
  content: string;
  variables: string[];
  createdAt: Date;
};

interface DocumentPageProps {
  interns: DocumentRow[];
  activeTemplates: ActiveTemplateInfo[];
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
    id: "team",
    label: "Team",
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
  { id: "team", label: "Team" },
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

export default function DocumentPage({ interns, activeTemplates }: DocumentPageProps) {
  const [tab, setTab] = useState<DocumentType>(DocumentType.certificate);
  const router = useRouter();
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [docDialog, setDocDialog] = useState<{
    open: boolean
    internName: string
    documents: { id: string; documentType: string; fileUrl: string | null }[]
  }>({ open: false, internName: "", documents: [] });
  const [templateAlert, setTemplateAlert] = useState<{ open: boolean; message: string }>({ open: false, message: "" });
  const [completenessAlert, setCompletenessAlert] = useState<{ open: boolean; errors: CompletenessError[] }>({ open: false, errors: [] });
  const [duplicateAlert, setDuplicateAlert] = useState<{
    open: boolean
    label: string
    duplicates: ExistingDocInfo[]
    remainingIds: string[]
  }>({ open: false, label: "", duplicates: [], remainingIds: [] });
  const { execute } = useStorageToast();

  function checkTemplateError(genData: GenerateDocResult[]): string | null {
    const firstError = genData[0]?.error;
    if (
      genData.length > 0 &&
      genData.every((r) => r.error?.startsWith("TEMPLATE_NOT_FOUND:")) &&
      firstError?.startsWith("TEMPLATE_NOT_FOUND:")
    ) {
      return firstError.replace("TEMPLATE_NOT_FOUND:", "");
    }
    return null;
  }

  const handleGenerateBatch = async (ids: string[], label: string) => {
    const generateFn = generateActions[tab];

    setGenerating(true);
    const result = await generateFn(ids);
    setGenerating(false);

    if (!result.success) {
      toast.error(result.error ?? `Gagal generate ${label}`);
      return;
    }

    const genData = result.data!;
    const templateMsg = checkTemplateError(genData);
    if (templateMsg) {
      setTemplateAlert({ open: true, message: templateMsg });
      return;
    }

    const docSuccess = genData.filter((r) => !r.error);
    const docFailed = genData.filter((r) => r.error);

    if (docSuccess.length > 0 && docFailed.length === 0) {
      toast.success(`${docSuccess.length} ${label} berhasil dibuat`);
    } else if (docSuccess.length > 0 && docFailed.length > 0) {
      toast.success(`${docSuccess.length} ${label} berhasil dibuat`);
      toast.error(`${docFailed.length} ${label} gagal: ${docFailed[0].error}`);
    } else {
      toast.error(genData[0]?.error ?? `Gagal generate ${label}`);
    }

    router.refresh();
  };

  const handleViewDocs = async (row: DocumentRow) => {
    const internProfileId = row.internProfile?.id
    if (!internProfileId) return
    const docs = await getInternDocuments(internProfileId)
    setDocDialog({ open: true, internName: row.name, documents: docs })
  }

  const handleGenerate = async (rows: DocumentRow | DocumentRow[]) => {
    const internIds = (Array.isArray(rows) ? rows : [rows]).map((r) => r.id);
    const generateFn = generateActions[tab];
    const label = documentLabels[tab] ?? "dokumen";

    const validationErrors = await validateInternsCompleteness(internIds, tab);
    if (validationErrors.length > 0) {
      setCompletenessAlert({ open: true, errors: validationErrors });
      return;
    }

    const { duplicates, cleanIds } = await filterExistingDocuments(internIds, tab);

    if (duplicates.length > 0) {
      setDuplicateAlert({ open: true, label, duplicates, remainingIds: cleanIds });
      if (cleanIds.length === 0) return;
    }

    setGenerating(true);
    const result = await generateFn(cleanIds.length > 0 ? cleanIds : internIds);
    setGenerating(false);

    if (!result.success) {
      toast.error(result.error ?? `Gagal generate ${label}`);
      return;
    }

    const genData = result.data!;
    const templateMsg = checkTemplateError(genData);
    if (templateMsg) {
      setTemplateAlert({ open: true, message: templateMsg });
      return;
    }

    const docSuccess = genData.filter((r) => !r.error);
    const docFailed = genData.filter((r) => r.error);

    if (docSuccess.length > 0 && docFailed.length === 0) {
      toast.success(`${docSuccess.length} ${label} berhasil dibuat`);
    } else if (docSuccess.length > 0 && docFailed.length > 0) {
      toast.success(`${docSuccess.length} ${label} berhasil dibuat`);
      toast.error(`${docFailed.length} ${label} gagal: ${docFailed[0].error}`);
    } else {
      toast.error(genData[0]?.error ?? `Gagal generate ${label}`);
    }

    router.refresh();
  };

  const batchActions = [
    {
      label: generating ? "Memproses..." : "Generate Document",
      icon: <FileText className="size-4" />,
      onClick: handleGenerate,
    },
  ];

  const columns = createColumns(
    {
      onViewDocs: handleViewDocs,
    },
    tab,
  );

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

              {/*<ActionCard tab={t.value} activeTemplates={activeTemplates} />*/}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      <DocumentDialog
        internName={docDialog.internName}
        documents={docDialog.documents}
        open={docDialog.open}
        onClose={() => setDocDialog((prev) => ({ ...prev, open: false }))}
      />

      <AlertDialog open={templateAlert.open} onOpenChange={(open) => setTemplateAlert((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Template Belum Tersedia</AlertDialogTitle>
            <AlertDialogDescription>{templateAlert.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setTemplateAlert({ open: false, message: "" })}>
              Mengerti
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={duplicateAlert.open}
        onOpenChange={(open) => setDuplicateAlert((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dokumen Sudah Ada</AlertDialogTitle>
            <AlertDialogDescription>
              {duplicateAlert.duplicates.length === 1
                ? `Peserta berikut sudah memiliki ${duplicateAlert.label}:`
                : `${duplicateAlert.duplicates.length} peserta berikut sudah memiliki ${duplicateAlert.label}:`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            {duplicateAlert.duplicates.map((dup, i) => (
              <div key={i} className="rounded-lg border p-3 text-sm">
                <p className="font-semibold">{dup.internName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  No: {dup.docNumber} &middot; Status: {dup.status}
                </p>
              </div>
            ))}
            {duplicateAlert.remainingIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Sisa {duplicateAlert.remainingIds.length} peserta akan diproses.
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setDuplicateAlert((prev) => ({ ...prev, open: false }))
                if (duplicateAlert.remainingIds.length > 0) {
                  handleGenerateBatch(duplicateAlert.remainingIds, duplicateAlert.label)
                }
              }}
            >
              {duplicateAlert.remainingIds.length > 0 ? "Lanjutkan" : "Mengerti"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={completenessAlert.open} onOpenChange={(open) => setCompletenessAlert((prev) => ({ ...prev, open }))}>
        <AlertDialogContent className="max-h-[60vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Data Intern Tidak Lengkap</AlertDialogTitle>
            <AlertDialogDescription>
              Berikut data yang tidak lengkap sebelum generate dokumen:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            {completenessAlert.errors.map((err, i) => (
              <div key={i} className="rounded-lg border p-3 text-sm">
                <p className="font-semibold">{err.internName}</p>
                <ul className="mt-1 list-inside list-disc text-muted-foreground">
                  {err.missingFields.map((field, j) => (
                    <li key={j}>{field}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setCompletenessAlert({ open: false, errors: [] })}>
              Mengerti
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
