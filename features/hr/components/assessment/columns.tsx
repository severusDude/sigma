"use client";

import { EyeIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import {
  type ActionOption,
  withActionColumn,
} from "@/components/shared/data-table/column-helpers";

import type { HrAssessmentListItem } from "../../types/assessment-types";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

const statusLabel: Record<string, string> = {
  draft: "Draft",
  submitted: "Menunggu",
  finalized: "Sudah Difinalisasi",
};

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  draft: "outline",
  submitted: "secondary",
  finalized: "default",
};

const baseColumns: ColumnDef<HrAssessmentListItem>[] = [
  {
    id: "intern",
    header: "Intern",
    accessorFn: (row) => row.internName,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.internName}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.internNim}
        </span>
      </div>
    ),
  },
  {
    id: "institution",
    header: "Institusi",
    accessorFn: (row) => row.institution,
  },
  {
    id: "supervisor",
    header: "Supervisor",
    accessorFn: (row) => row.supervisorName,
  },
  {
    id: "status",
    header: "Status",
    accessorFn: (row) => row.status,
    cell: ({ row }) => (
      <Badge
        variant={statusVariant[row.original.status] || "outline"}
        className="rounded-none text-xs"
      >
        {statusLabel[row.original.status] || row.original.status}
      </Badge>
    ),
  },
  {
    id: "score",
    header: "Nilai Akhir",
    accessorFn: (row) => row.finalScore,
    cell: ({ row }) => {
      const score = row.original.finalScore;
      const grade = row.original.finalGrade;
      if (score === null) return <span className="text-muted-foreground">-</span>;
      return (
        <span className="font-medium tabular-nums">
          {score} ({grade})
        </span>
      );
    },
  },
  {
    id: "period",
    header: "Periode",
    accessorFn: (row) => row.periodStart,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(row.original.periodStart)} -{" "}
        {formatDate(row.original.periodEnd)}
      </span>
    ),
  },
];

export function createColumns(actions: {
  onDetail: (row: HrAssessmentListItem) => void;
}) {
  const actionOptions: ActionOption<HrAssessmentListItem>[] = [
    {
      label: "Detail",
      icon: <EyeIcon className="size-4" />,
      onClick: (row) => actions.onDetail(row as HrAssessmentListItem),
    },
  ];

  return withActionColumn(baseColumns, actionOptions);
}
