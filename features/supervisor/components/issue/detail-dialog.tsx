"use client";

import { format } from "date-fns";
import {
  CalendarDaysIcon,
  UserIcon,
  UsersIcon,
  BookOpenIcon,
  FileTextIcon,
} from "lucide-react";

import { id } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IssueStatus } from "@/generated/prisma/enums";

import type { Issue } from "../../types/issue-types";
import { useQuery } from "@tanstack/react-query";
import { getIssueById } from "../../actions/issue-actions";

interface DetailDialogProps {
  issueId: string | null;
  onClose: () => void;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  [IssueStatus.active]: {
    label: "Aktif",
    className: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  },
  [IssueStatus.completed]: {
    label: "Selesai",
    className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  },
  [IssueStatus.cancelled]: {
    label: "Dibatalkan",
    className: "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
  },
};

export function DetailDialog({ issueId, onClose }: DetailDialogProps) {
  const { data: issue, isLoading } = useQuery({
    queryKey: ["issue", issueId],
    queryFn: async () => {
      if (!issueId) return null;
      const res = await getIssueById(issueId);
      if (!res.success) throw new Error(res.error);
      return res.data ?? null;
    },
    enabled: !!issueId,
  });

  return (
    <Dialog open={!!issueId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detail Rencana Kegiatan</DialogTitle>
          <DialogDescription>
            Informasi lengkap rencana kegiatan intern bimbingan
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-5 rounded animate-pulse bg-muted"
              />
            ))}
          </div>
        ) : issue ? (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold leading-snug pr-4">
                  {issue.title}
                </h3>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-[10px] font-bold uppercase ${
                    statusLabels[issue.status]?.className ?? ""
                  }`}
                >
                  {statusLabels[issue.status]?.label ?? issue.status}
                </Badge>
              </div>

              {issue.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {issue.description}
                </p>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-sm">
                  {issue.internProfile ? (
                    <UserIcon className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <UsersIcon className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span>
                    {issue.internProfile?.user.name ?? "Semua Intern"}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-sm">
                  <CalendarDaysIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span>
                    {issue.startDate
                      ? format(new Date(issue.startDate), "d MMMM yyyy", {
                          locale: id,
                        })
                      : "—"}{" "}
                    s.d.{" "}
                    {issue.endDate
                      ? format(new Date(issue.endDate), "d MMMM yyyy", {
                          locale: id,
                        })
                      : "—"}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 text-sm">
                  <BookOpenIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span>{issue._count.logbooks} entri logbook</span>
                </div>

                <div className="flex items-center gap-2.5 text-sm">
                  <FileTextIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span>
                    Supervisor: {issue.supervisor.user.name}
                  </span>
                </div>
              </div>
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Issue tidak ditemukan
          </p>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
