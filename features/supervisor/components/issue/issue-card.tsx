"use client";

import { format } from "date-fns";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  UserIcon,
  UsersIcon,
} from "lucide-react";

import { id } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IssueStatus } from "@/generated/prisma/enums";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { Issue } from "../../types/issue-types";

interface IssueCardProps {
  issue: Issue;
  onView: (issue: Issue) => void;
  onEdit: (issue: Issue) => void;
  onDelete: (issue: Issue) => void;
}

const statusConfig: Record<
  string,
  {
    label: string;
    badgeClass: string;
  }
> = {
  [IssueStatus.active]: {
    label: "AKTIF",
    badgeClass:
      "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  },
  [IssueStatus.completed]: {
    label: "SELESAI",
    badgeClass:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  },
  [IssueStatus.cancelled]: {
    label: "DIBATALKAN",
    badgeClass:
      "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
  },
};

function formatDateRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
) {
  if (!start && !end) return "—";
  if (!end)
    return format(new Date(start!), "d MMM yyyy", { locale: id });
  if (!start)
    return format(new Date(end), "d MMM yyyy", { locale: id });
  if (new Date(start).toDateString() === new Date(end).toDateString())
    return format(new Date(start), "d MMM yyyy", { locale: id });
  return `${format(new Date(start), "d MMM", { locale: id })} — ${format(new Date(end), "d MMM yyyy", { locale: id })}`;
}

export function IssueCard({ issue, onView, onEdit, onDelete }: IssueCardProps) {
  const status = statusConfig[issue.status] ?? statusConfig.active;

  return (
    <Card className="relative transition-all border border-border/50 hover:border-primary/30 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-3">
          <Badge
            variant="outline"
            className={`gap-1 text-[10px] font-bold uppercase ${status.badgeClass}`}
          >
            {status.label}
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="size-7">
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(issue)}>
                <EyeIcon className="mr-2 size-4" />
                Detail
              </DropdownMenuItem>
              {issue.status === IssueStatus.active && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(issue)}>
                    <PencilIcon className="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDelete(issue)}
                  >
                    <Trash2Icon className="mr-2 size-4" />
                    Hapus
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CardTitle className="text-base font-semibold leading-snug transition-colors group-hover:text-primary line-clamp-2">
          {issue.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          {issue.internProfile ? (
            <UserIcon className="size-4 shrink-0" />
          ) : (
            <UsersIcon className="size-4 shrink-0" />
          )}
          <span>{issue.internProfile?.user.name ?? "Semua Intern"}</span>
        </div>

        {/* TODO: handle single date issue (not date range) */}
        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <CalendarDaysIcon className="size-4 shrink-0" />
          <span>{formatDateRange(issue.startDate, issue.endDate)}</span>
        </div>

        <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
          <BookOpenIcon className="size-4 shrink-0" />
          <span>{issue._count.logbooks} logbook</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full mt-4"
          onClick={() => onView(issue)}
        >
          <EyeIcon className="mr-2 size-3.5" />
          Lihat Detail
        </Button>
      </CardContent>
    </Card>
  );
}
