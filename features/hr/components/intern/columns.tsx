"use client";

import { EyeIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import {
  type ActionOption,
  withActionColumn,
  withSelectColumn,
} from "@/components/shared/data-table/column-helpers";

import type { Intern } from "../../types/intern-types";

const statusLabel: Record<string, string> = {
  active: "Aktif",
  completed: "Selesai",
  withdrawn: "Ditarik",
};

const statusVariant: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
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

const baseColumns: ColumnDef<Intern>[] = [
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
    accessorKey: "institution",
    header: "Institusi",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        variant={statusVariant[row.original.internProfile!.status] || "outline"}
      >
        {statusLabel[row.original.internProfile!.status] ||
          row.original.internProfile!.status}
      </Badge>
    ),
  },
  {
    id: "period",
    header: "Periode",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        {formatDate(row.original.internProfile!.periodStart)} -{" "}
        {formatDate(row.original.internProfile!.periodEnd)}
      </span>
    ),
  },
];

export function createColumns(actions: {
  onView: (row: Intern) => void;
  onUpdate: (row: Intern) => void;
  onDelete: (row: Intern) => void;
}) {
  const actionOptions: ActionOption<Intern>[] = [
    {
      label: "Lihat Detail",
      icon: <EyeIcon className="size-4" />,
      onClick: (row) => actions.onView(row as Intern),
    },
    {
      label: "Update",
      icon: <PencilIcon className="size-4" />,
      onClick: (row) => actions.onUpdate(row as Intern),
    },
    {
      label: "Hapus",
      icon: <Trash2Icon className="size-4" />,
      onClick: (row) => actions.onDelete(row as Intern),
      destructive: true,
    },
  ];

  return withSelectColumn(withActionColumn(baseColumns, actionOptions));
}
