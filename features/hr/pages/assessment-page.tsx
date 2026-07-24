"use client";

import { useState, useMemo } from "react";

import { DataTable } from "@/components/shared/data-table";

import { createColumns } from "../components/assessment/columns";
import { DetailDialog } from "../components/assessment/detail-dialog";
import type { HrAssessmentListItem } from "../types/assessment-types";

interface AssessmentPageProps {
  initialData: HrAssessmentListItem[];
}

export default function AssessmentPage({
  initialData,
}: AssessmentPageProps) {
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);

  const filterCategories = useMemo(
    () => [
      {
        id: "status" as const,
        label: "Status Penilaian",
        options: [
          { label: "Semua", value: "" },
          { label: "Menunggu", value: "submitted" },
          { label: "Sudah Difinalisasi", value: "finalized" },
        ],
      },
      {
        id: "internProfileStatus" as const,
        label: "Status Intern",
        options: [
          { label: "Aktif", value: "active" },
          { label: "Selesai", value: "completed" },
          { label: "Ditarik", value: "withdrawn" },
        ],
      },
    ],
    [],
  );

  const sortOptions = useMemo(
    () => [
      { id: "internName" as const, label: "Nama Intern" },
      { id: "supervisorName" as const, label: "Supervisor" },
      { id: "finalScore" as const, label: "Nilai Akhir" },
    ],
    [],
  );

  const columns = useMemo(
    () =>
      createColumns({
        onDetail: (row) => setSelectedAssessmentId(row.assessmentId),
      }),
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-primary">
          Penilaian & Evaluasi
        </h1>
      </div>

      <DataTable
        columns={columns}
        data={initialData}
        filterCategories={filterCategories}
        sortOptions={sortOptions}
        defaultFilters={[
          {
            categoryId: "internProfileStatus",
            categoryLabel: "Status Intern",
            value: "active",
            valueLabel: "Aktif",
          },
        ]}
        defaultColumnVisibility={{ internProfileStatus: false }}
      />

      <DetailDialog
        assessmentId={selectedAssessmentId}
        onClose={() => setSelectedAssessmentId(null)}
      />
    </div>
  );
}
