"use client";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  MoreHorizontalIcon,
  EyeIcon,
  PencilIcon,
  Trash2Icon,
  ClockIcon,
  MessageSquareIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Logbook } from "../../types/logbook-types";
import { LogbookStatus } from "@/generated/prisma/enums";

interface LogbookCardProps {
  logbook: Logbook;
  onView: (logbook: Logbook) => void;
  onEdit: (logbook: Logbook) => void;
  onDelete: (logbook: Logbook) => void;
}

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }
> = {
  [LogbookStatus.pending_review]: {
    label: "MENUNGGU REVIEW",
    variant: "outline",
    icon: <ClockIcon className="size-3.5 text-amber-600" />,
  },
  [LogbookStatus.approved]: {
    label: "DISETUJUI",
    variant: "default",
    icon: <CheckCircle2Icon className="size-3.5" />,
  },
  [LogbookStatus.revision]: {
    label: "REVISI",
    variant: "destructive",
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

export function LogbookCard({ logbook, onView, onEdit, onDelete }: LogbookCardProps) {
  const status = statusConfig[logbook.status] ?? statusConfig.pending_review;

  return (
    <Card className="rounded-lg border-l-4 border-l-transparent hover:border-l-muted-foreground/20 transition-colors shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-medium text-foreground">
                {format(new Date(logbook.date), "EEEE, d MMMM yyyy", { locale: id })}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDuration(logbook.duration)}
              </span>
              <Badge variant={status.variant} className="gap-1">
                {status.icon}
                {status.label}
              </Badge>
            </div>

            <p className="text-sm font-semibold">
              {logbook.issue?.title || "Kegiatan Harian"}
            </p>

            <p className="text-sm text-muted-foreground line-clamp-2">
              {logbook.activity}
            </p>

            {logbook.notes && logbook.status === LogbookStatus.revision && (
              <div className="flex gap-2 rounded-md bg-muted p-3 mt-2">
                <MessageSquareIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Catatan Pembimbing
                  </p>
                  <p className="text-sm text-foreground">{logbook.notes}</p>
                </div>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="size-8 shrink-0">
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
      </CardContent>
    </Card>
  );
}
