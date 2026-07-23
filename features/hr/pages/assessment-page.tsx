"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { DataTable } from "@/components/shared/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

import { getAssessmentsForHR } from "../actions/assessment-actions";
import { createColumns } from "../components/assessment/columns";
import { DetailDialog } from "../components/assessment/detail-dialog";
import type { HrAssessmentListItem } from "../types/assessment-types";

interface AssessmentPageProps {
  initialData: HrAssessmentListItem[];
  supervisorOptions: { id: string; name: string; nip: string }[];
}

export default function AssessmentPage({
  initialData,
  supervisorOptions,
}: AssessmentPageProps) {
  const [statusFilter, setStatusFilter] = useState("");
  const [supervisorFilter, setSupervisorFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);

  const { data: assessments = initialData, isLoading } = useQuery({
    queryKey: ["hr-assessments", statusFilter, supervisorFilter, debouncedSearch],
    queryFn: async () => {
      const res = await getAssessmentsForHR({
        status: statusFilter || undefined,
        supervisorId: supervisorFilter || undefined,
        search: debouncedSearch || undefined,
      });
      if (!res.success) throw new Error(res.error);
      return res.data ?? [];
    },
    initialData,
  });

  const filterCategories = useMemo(
    () => [
      {
        id: "status" as const,
        label: "Status",
        options: [
          { label: "Semua", value: "" },
          { label: "Menunggu", value: "submitted" },
          { label: "Sudah Difinalisasi", value: "finalized" },
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

  function handleSearch(value: string) {
    setSearchQuery(value);
    const timer = setTimeout(() => setDebouncedSearch(value), 300);
    return () => clearTimeout(timer);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-primary">
          Penilaian & Evaluasi
        </h1>

        {/*<div className="flex flex-wrap items-center gap-2">
          <InputGroup>
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Cari intern atau supervisor..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </InputGroup>

          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v ?? "")}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} side="bottom" className="w-40">
              <SelectItem value="">Semua Status</SelectItem>
              <SelectItem value="submitted">Menunggu</SelectItem>
              <SelectItem value="finalized">Sudah Difinalisasi</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={supervisorFilter}
            onValueChange={(v) => setSupervisorFilter(v ?? "")}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Semua Supervisor" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} side="bottom" className="w-48">
              <SelectItem value="">Semua Supervisor</SelectItem>
              {supervisorOptions.map((sup) => (
                <SelectItem key={sup.id} value={sup.id}>
                  {sup.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>*/}
      </div>

      <DataTable
        columns={columns}
        data={assessments}
        filterCategories={filterCategories}
        sortOptions={sortOptions}
      />

      <DetailDialog
        assessmentId={selectedAssessmentId}
        onClose={() => setSelectedAssessmentId(null)}
      />
    </div>
  );
}
