"use client";

import { EyeIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";

import type { SupervisedIntern } from "../../types/intern-types";
import { initials } from "@/lib/utils";

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

const assessmentLabel: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  finalized: "Finalized",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

const baseColumns: ColumnDef<SupervisedIntern>[] = [
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
            {row.original.nik}
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "institution",
    header: "Institusi",
    accessorFn: (row) => row.institution,
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm">{row.original.institution}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.team ?? "-"}
        </span>
      </div>
    ),
  },
  {
    id: "internStatus",
    header: "Status",
    accessorFn: (row) => row.internStatus,
    cell: ({ row }) => (
      <Badge variant={statusVariant[row.original.internStatus] || "outline"}>
        {statusLabel[row.original.internStatus] || row.original.internStatus}
      </Badge>
    ),
  },
  {
    id: "logbook",
    header: "Logbook",
    accessorFn: (row) =>
      row.totalLogbooks > 0
        ? row.approvedLogbooks / row.totalLogbooks
        : -1,
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap">
        {row.original.approvedLogbooks}/{row.original.totalLogbooks} disetujui
        {row.original.pendingLogbooks > 0 && (
          <span className="text-muted-foreground">
            {" "}
            ({row.original.pendingLogbooks} menunggu)
          </span>
        )}
      </span>
    ),
  },
  {
    id: "attendance",
    header: "Presensi",
    accessorFn: (row) => row.presentDays,
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap">
        {row.original.presentDays}/{row.original.totalAttendance} hadir
      </span>
    ),
  },
  {
    id: "assessment",
    header: "Penilaian",
    accessorFn: (row) => row.assessmentStatus ?? "",
    cell: ({ row }) =>
      row.original.assessmentStatus ? (
        <Badge variant="secondary">
          {assessmentLabel[row.original.assessmentStatus] ||
            row.original.assessmentStatus}
        </Badge>
      ) : (
        <span className="text-sm text-muted-foreground">Belum dinilai</span>
      ),
  },
  {
    id: "periodStart",
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
  onView: (row: SupervisedIntern) => void;
}) {
  const viewColumn: ColumnDef<SupervisedIntern> = {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <Button
        size="sm"
        variant="outline"
        className="gap-2"
        onClick={() => actions.onView(row.original)}
      >
        <EyeIcon className="size-4" />
        Detail
      </Button>
    ),
  };

  return [...baseColumns, viewColumn];
}
