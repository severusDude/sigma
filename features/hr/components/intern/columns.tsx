"use client";

import { EyeIcon, PencilIcon, Trash2Icon, KeyRoundIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    id: "institution",
    header: "Institusi",
    accessorFn: (row) => row.internProfile?.institution,
    cell: ({ row }) => row.original.internProfile!.institution,
  },
  {
    id: "supervisor",
    header: "Supervisor",
    accessorFn: (row) =>
      row.internProfile?.supervisorAssignments?.[0]?.supervisorProfile?.user
        ?.name ?? null,
    cell: ({ row }) => {
      const supervisor =
        row.original.internProfile?.supervisorAssignments?.[0]
          ?.supervisorProfile?.user;

      if (!supervisor) return <span className="text-muted-foreground">-</span>;

      return (
        <div className="flex items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>
              {supervisor.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">{supervisor.name}</span>
        </div>
      );
    },
  },
  {
    id: "status",
    header: "Status",
    accessorFn: (row) => row.internProfile!.status,
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
    accessorFn: (row) => row.internProfile!.periodStart,
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
  onChangePassword: (row: Intern) => void;
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
      label: "Ubah Password",
      icon: <KeyRoundIcon className="size-4" />,
      onClick: (row) => actions.onChangePassword(row as Intern),
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
