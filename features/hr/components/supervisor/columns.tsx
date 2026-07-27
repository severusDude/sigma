"use client";

import { EyeIcon, PencilIcon, Trash2Icon, KeyRoundIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { ColumnDef } from "@tanstack/react-table";
import {
  type ActionOption,
  withActionColumn,
  withSelectColumn,
} from "@/components/shared/data-table/column-helpers";

import type { Supervisor } from "../../types/supervisor-types";
import { initials } from "@/lib/utils";

const baseColumns: ColumnDef<Supervisor>[] = [
  {
    id: "name",
    header: "Nama",
    accessorFn: (row) => row.name,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Avatar size="sm">
          <AvatarImage src={row.original.image ?? ""} alt="Avatar" />
          <AvatarFallback>{initials(row.original.name)}</AvatarFallback>
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
    accessorFn: (row) => row.supervisorProfile?.internAssignments?.length ?? 0,
    cell: ({ row }) => {
      const count =
        row.original.supervisorProfile?.internAssignments?.length ?? 0;
      const max = row.original.supervisorProfile?.maxInterns ?? 5;
      const percentage = max > 0 ? Math.round((count / max) * 100) : 0;

      let barColor: string;
      let labelColor: string;
      let statusLabel: string;

      if (count === 0) {
        barColor = "bg-muted";
        labelColor = "text-muted-foreground";
      } else if (percentage <= 40) {
        barColor = "bg-blue-500";
        labelColor = "text-blue-600";
      } else if (percentage <= 75) {
        barColor = "bg-amber-500";
        labelColor = "text-amber-600";
      } else {
        barColor = "bg-red-500";
        labelColor = "text-red-600";
      }

      const barWidth = count === 0 ? 0 : Math.max(percentage, 4);

      return (
        <div className="flex flex-col gap-1 min-w-28">
          <div className="flex items-center justify-between text-xs">
            <span className={labelColor}>
              {count}/{max}
            </span>
            <span className={labelColor}></span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${barColor}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>
      );
    },
  },
  {
    id: "isActive",
    header: "Status",
    accessorFn: (row) => row.supervisorProfile?.isActive.toString(),
    cell: ({ row }) => (
      <Badge
        variant={
          row.original.supervisorProfile!.isActive ? "default" : "outline"
        }
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
  onChangePassword: (row: Supervisor) => void;
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
      label: "Ubah Password",
      icon: <KeyRoundIcon className="size-4" />,
      onClick: (row) => actions.onChangePassword(row as Supervisor),
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
