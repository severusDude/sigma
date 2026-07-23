"use client";

import { EyeIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import {
  type ActionOption,
  withActionColumn,
  withSelectColumn,
} from "@/components/shared/data-table/column-helpers";
import { DocumentType } from "@/generated/prisma/enums";

import type { DocumentRow } from "../../types/document-types";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

type Completeness = {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
};

function checkCompleteness(row: DocumentRow, tab: DocumentType): Completeness {
  const intern = row.internProfile;
  const supervisor = intern?.supervisorAssignments?.[0]?.supervisorProfile;
  const hasSupervisor = Boolean(supervisor?.user?.name && supervisor?.nip);

  const hasBasicData = Boolean(
    row.name && intern?.nik && intern?.institution && intern?.department?.name &&
    intern?.periodStart && intern?.periodEnd,
  );

  if (!hasBasicData) {
    return { label: "Tidak Lengkap", variant: "destructive" };
  }

  switch (tab) {
    case DocumentType.assignment_letter:
    case DocumentType.completion_letter:
    case DocumentType.certificate:
      if (!hasSupervisor) {
        return { label: "Tidak Lengkap", variant: "destructive" };
      }
      return { label: "Lengkap", variant: "default" };

    case DocumentType.assessment_report:
      if (!hasSupervisor) {
        return { label: "Tidak Lengkap", variant: "destructive" };
      }
      return { label: "Lengkap", variant: "default" };

    case DocumentType.attendance_report:
      return { label: "Lengkap", variant: "default" };

    default:
      return { label: "Lengkap", variant: "default" };
  }
}

export function createColumns(
  actions: {
    onView: (row: DocumentRow) => void;
  },
  activeTab: DocumentType,
) {
  const baseColumns: ColumnDef<DocumentRow>[] = [
    {
      id: "nameNik",
      header: "Nama",
      accessorFn: (row) => row.name,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.internProfile!.nik}
          </span>
        </div>
      ),
    },
    {
      id: "department",
      header: "Bidang",
      accessorFn: (row) => row.internProfile?.department?.name ?? null,
      cell: ({ row }) => (
        <span>
          {row.original.internProfile?.department?.name ?? (
            <span className="text-muted-foreground">-</span>
          )}
        </span>
      ),
    },
    {
      id: "period",
      header: "Periode",
      accessorFn: (row) => row.internProfile!.periodStart,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(row.original.internProfile!.periodStart)} -{" "}
          {formatDate(row.original.internProfile!.periodEnd)}
        </span>
      ),
    },
    {
      id: "dataCompleteness",
      header: "Kelengkapan Data",
      cell: ({ row }) => {
        const { label, variant } = checkCompleteness(row.original, activeTab);
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
  ];

  const actionOptions: ActionOption<DocumentRow>[] = [
    {
      label: "Lihat Detail",
      icon: <EyeIcon className="size-4" />,
      onClick: (row) => actions.onView(row as DocumentRow),
    },
  ];

  return withSelectColumn(withActionColumn(baseColumns, actionOptions));
}
