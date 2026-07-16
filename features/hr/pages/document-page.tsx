"use client";

import { useState } from "react";

import { SortOption } from "@/lib/types/sort";
import { FilterCategory } from "@/lib/types/filter";
import { DataTable } from "@/components/shared/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentType } from "@/generated/prisma/enums";
import { FileText, Send } from "lucide-react";

import type { DocumentRow } from "../types/document-types";
import { createColumns } from "../components/document/columns";
import { ActionCard } from "../components/document/action-card";

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

const batchActions = [
  {
    label: "Generate Document",
    icon: <FileText className="size-4" />,
    onClick: () => {},
  },
  {
    label: "Generate & Kirim ke TTE",
    icon: <Send className="size-4" />,
    onClick: () => {},
  },
];

export default function DocumentPage({ interns }: DocumentPageProps) {
  const [tab, setTab] = useState<DocumentType>(DocumentType.certificate);

  const columns = createColumns({
    onView: () => {},
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
            {t.value === DocumentType.certificate ? (
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
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                <p>Tab {t.label} — belum diimplementasikan</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
