"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { EyeIcon, PencilIcon, Trash2Icon } from "lucide-react";
import {
  withSelectColumn,
  withActionColumn,
  type ActionOption,
} from "@/components/shared/data-table/column-helpers";
import type { InternRow } from "../../types/intern-types";

const statusLabel: Record<string, string> = {
  active: "Aktif",
  completed: "Selesai",
  withdrawn: "Ditarik",
};

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  completed: "secondary",
  withdrawn: "outline",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

const baseColumns: ColumnDef<InternRow>[] = [
  {
    id: "nameNik",
    header: "Nama",
    accessorFn: (row) => row.name,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        <span className="text-xs text-muted-foreground">{row.original.nik}</span>
      </div>
    ),
  },
  {
    accessorKey: "institution",
    header: "Institusi",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.status] || "outline"}>
        {statusLabel[row.original.status] || row.original.status}
      </Badge>
    ),
  },
  {
    id: "period",
    header: "Periode",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(row.original.periodStart)} - {formatDate(row.original.periodEnd)}
      </span>
    ),
  },
];

export function createColumns(actions: {
  onView: (row: InternRow) => void;
  onEdit: (row: InternRow) => void;
  onDelete: (row: InternRow) => void;
}) {
  const actionOptions: ActionOption<InternRow>[] = [
    {
      label: "Lihat Detail",
      icon: <EyeIcon className="size-4" />,
      onClick: (row) => actions.onView(row as InternRow),
    },
    {
      label: "Edit",
      icon: <PencilIcon className="size-4" />,
      onClick: (row) => actions.onEdit(row as InternRow),
    },
    {
      label: "Hapus",
      icon: <Trash2Icon className="size-4" />,
      onClick: (row) => actions.onDelete(row as InternRow),
      destructive: true,
    },
  ];

  return withSelectColumn(withActionColumn(baseColumns, actionOptions));
}
