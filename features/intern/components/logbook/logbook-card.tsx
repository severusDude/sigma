"use client";

import { format } from "date-fns";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ClockIcon,
  EyeIcon,
  MessageSquareIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

import { id } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogbookStatus } from "@/generated/prisma/enums";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Logbook } from "../../types/logbook-types";

interface LogbookCardProps {
  logbook: Logbook;
  onView: (logbook: Logbook) => void;
  onEdit: (logbook: Logbook) => void;
  onDelete: (logbook: Logbook) => void;
}

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
    badgeClass: string;
    icon: React.ReactNode;
  }
> = {
  [LogbookStatus.pending_review]: {
    label: "MENUNGGU REVIEW",
    variant: "outline",
    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: <ClockIcon className="size-3.5 text-yellow-600" />,
  },
  [LogbookStatus.approved]: {
    label: "DISETUJUI",
    variant: "default",
    badgeClass: "bg-green-100 text-green-700 border-green-200",
    icon: <CheckCircle2Icon className="size-3.5" />,
  },
  [LogbookStatus.revision]: {
    label: "REVISI",
    variant: "destructive",
    badgeClass: "bg-red-100 text-red-700 border-red-200",
    icon: <AlertCircleIcon className="size-3.5" />,
  },
};

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} Menit`;
  if (m === 0) return `${h} Jam`;
  return `${h} Jam ${m} Menit`;
}

export function LogbookCard({
  logbook,
  onView,
  onEdit,
  onDelete,
}: LogbookCardProps) {
  const status = statusConfig[logbook.status] ?? statusConfig.pending_review;

  return (
    <Card className="relative transition-all border border-outline-variant/50 hover:border-primary group ring-0">
      <CardHeader className="flex flex-col items-start justify-between">
        <main className="flex items-start justify-between w-full mb-4">
          <div className="flex flex-col">
            <h2 className="text-sm font-medium text-muted-foreground">
              {format(new Date(logbook.date), "EEEE, d MMMM yyyy", {
                locale: id,
              })}
            </h2>
            <p className="text-xs text-primary mt-0.5">
              {formatDuration(logbook.duration)}
            </p>
          </div>
          <div className="flex items-center justify-end gap-2">
            <Badge
              variant={status.variant}
              className={`gap-1 text-[10px] font-bold uppercase ${status.badgeClass}`}
            >
              {status.icon}
              {status.label}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon">
                    <MoreHorizontalIcon className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(logbook)}>
                  <EyeIcon className="mr-2 size-4" />
                  Detail
                </DropdownMenuItem>
                {logbook.status !== LogbookStatus.approved && (
                  <DropdownMenuItem onClick={() => onEdit(logbook)}>
                    <PencilIcon className="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {logbook.status === LogbookStatus.pending_review && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(logbook)}
                  >
                    <Trash2Icon className="mr-2 size-4" />
                    Hapus
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </main>
        <CardTitle className="text-lg font-semibold transition-colors group-hover:text-primary">
          {logbook.issue?.title || "Kegiatan Harian"}
        </CardTitle>
      </CardHeader>

      <CardContent className="mb-6 text-sm text-muted-foreground line-clamp-3">
        {logbook.activity}

        {logbook.notes && logbook.status === LogbookStatus.revision && (
          <div className="p-4 border bg-surface-container-low border-primary/10">
            <div className="flex items-center gap-2 mb-1.5">
              <MessageSquareIcon className="size-4 text-primary" />
              <span className="text-xs font-semibold uppercase text-primary">
                Catatan Pembimbing
              </span>
            </div>
            <p className="text-sm italic text-foreground">{logbook.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
