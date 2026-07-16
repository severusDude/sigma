"use client";

import { EyeIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import {
  type ActionOption,
  withActionColumn,
  withSelectColumn,
} from "@/components/shared/data-table/column-helpers";

import type { Supervisor } from "../../types/supervisor-types";

const baseColumns: ColumnDef<Supervisor>[] = [
  {
    id: "nameNip",
    header: "Nama",
    accessorFn: (row) => row.name,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback>
            {row.original.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-medium">{row.original.name}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.supervisorProfile!.nip}
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "field",
    header: "Bidang",
    accessorFn: (row) => row.supervisorProfile?.field,
    cell: ({ row }) => row.original.supervisorProfile!.field,
  },
  {
    id: "internCount",
    header: "Jumlah Intern",
    accessorFn: (row) =>
      row.supervisorProfile?.internAssignments?.length ?? 0,
    cell: ({ row }) => {
      const count = row.original.supervisorProfile?.internAssignments?.length ?? 0;
      const max = row.original.supervisorProfile?.maxInterns ?? 5;
      return (
        <span className="text-sm">
          {count} / {max}
        </span>
      );
    },
  },
  {
    id: "isActive",
    header: "Status",
    accessorFn: (row) => row.supervisorProfile?.isActive,
    cell: ({ row }) => (
      <Badge
        variant={row.original.supervisorProfile!.isActive ? "default" : "outline"}
      >
        {row.original.supervisorProfile!.isActive ? "Aktif" : "Nonaktif"}
      </Badge>
    ),
  },
];

export function createColumns(actions: {
  onView: (row: Supervisor) => void;
  onUpdate: (row: Supervisor) => void;
  onDelete: (row: Supervisor) => void;
}) {
  const actionOptions: ActionOption<Supervisor>[] = [
    {
      label: "Lihat Detail",
      icon: <EyeIcon className="size-4" />,
      onClick: (row) => actions.onView(row as Supervisor),
    },
    {
      label: "Update",
      icon: <PencilIcon className="size-4" />,
      onClick: (row) => actions.onUpdate(row as Supervisor),
    },
    {
      label: "Hapus",
      icon: <Trash2Icon className="size-4" />,
      onClick: (row) => actions.onDelete(row as Supervisor),
      destructive: true,
    },
  ];

  return withSelectColumn(withActionColumn(baseColumns, actionOptions));
}
