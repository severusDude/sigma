"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertTriangleIcon,
  ArchiveIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  MessageSquareIcon,
  PencilIcon,
  RotateCcwIcon,
  ThumbsUpIcon,
} from "lucide-react";

import Link from "next/link";
import { id } from "date-fns/locale";
import { initials } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button, buttonVariants } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IssueStatus, LogbookStatus } from "@/generated/prisma/enums";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { updateIssue } from "../actions/issue-actions";
import type { IssueDetail } from "../types/issue-types";
import {
  approveLogbook,
  requestRevision,
} from "../actions/logbook-review-actions";

type IssueWithLogbooks = IssueDetail & {
  logbooks: Array<{
    id: string;
    internProfileId: string;
    date: Date;
    activity: string;
    duration: number;
    status: string;
    notes: string | null;
    internProfile: {
      id: string;
      user: {
        name: string;
        image: string | null;
      };
    };
  }>;
};

interface IssueViewProps {
  issue: IssueWithLogbooks;
}

const issueStatusConfig: Record<string, { label: string; className: string }> =
  {
    [IssueStatus.active]: {
      label: "Aktif",
      className:
        "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    },
    [IssueStatus.completed]: {
      label: "Selesai",
      className:
        "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    },
    [IssueStatus.cancelled]: {
      label: "Dibatalkan",
      className:
        "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700",
    },
  };

const logbookStatusConfig: Record<
  string,
  { label: string; badgeClass: string; icon: typeof CheckIcon }
> = {
  [LogbookStatus.approved]: {
    label: "Disetujui",
    badgeClass: "bg-green-50 text-green-700 border-green-200",
    icon: CheckIcon,
  },
  [LogbookStatus.revision]: {
    label: "Revisi",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    icon: RotateCcwIcon,
  },
  [LogbookStatus.pending_review]: {
    label: "Menunggu Review",
    badgeClass: "bg-slate-50 text-slate-600 border-slate-200",
    icon: ClockIcon,
  },
};

const dayStatusConfig: Record<
  string,
  { label: string; icon: typeof CheckIcon; iconClass: string }
> = {
  all: {
    label: "Semua intern sudah mengisi",
    icon: CheckIcon,
    iconClass: "bg-green-100 text-green-700",
  },
  partial: {
    label: "Sebagian intern sudah mengisi",
    icon: AlertTriangleIcon,
    iconClass: "bg-amber-50 text-amber-700",
  },
  none: {
    label: "Belum ada yang mengisi",
    icon: ClockIcon,
    iconClass: "bg-slate-100 text-slate-500",
  },
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} menit`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} jam`;
  return `${h} jam ${m} menit`;
}

function getAssignedInternCount(issue: IssueWithLogbooks): number {
  if (issue.internProfile) return 1;
  const uniqueInterns = new Set(issue.logbooks.map((l) => l.internProfileId));
  return uniqueInterns.size || 1;
}

export default function IssueView({ issue }: IssueViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [issueData, setIssueData] = useState(issue);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [revisionDialog, setRevisionDialog] = useState<{
    logbookId: string;
    internName: string;
  } | null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");

  const status = issueStatusConfig[issueData.status] ?? issueStatusConfig.active;

  const logbooksByDate = useMemo(() => {
    const map = new Map<string, IssueWithLogbooks["logbooks"]>();
    for (const logbook of issueData.logbooks) {
      const dateKey = format(new Date(logbook.date), "yyyy-MM-dd");
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(logbook);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [issue.logbooks]);

  const internAvatarMap = useMemo(() => {
    const map = new Map<string, { name: string; image: string | null }>();
    for (const logbook of issueData.logbooks) {
      if (!map.has(logbook.internProfileId)) {
        map.set(logbook.internProfileId, {
          name: logbook.internProfile.user.name,
          image: logbook.internProfile.user.image,
        });
      }
    }
    return Array.from(map.values());
  }, [issue.logbooks]);

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const res = await updateIssue(issue.id, {
        status: IssueStatus.cancelled,
      });
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      setIssueData((prev) => ({ ...prev, status: IssueStatus.cancelled }));
      toast.success("Rencana kegiatan berhasil diarsipkan");
      setArchiveOpen(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengarsipkan",
      );
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (logbookId: string) => {
      const res = await approveLogbook(logbookId);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: (_data, logbookId) => {
      queryClient.invalidateQueries({ queryKey: ["issue", issue.id] });
      setIssueData((prev) => ({
        ...prev,
        logbooks: prev.logbooks.map((lb) =>
          lb.id === logbookId ? { ...lb, status: LogbookStatus.approved } : lb,
        ),
      }));
      toast.success("Logbook berhasil disetujui");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyetujui logbook",
      );
    },
  });

  const revisionMutation = useMutation({
    mutationFn: async ({
      logbookId,
      notes,
    }: {
      logbookId: string;
      notes: string;
    }) => {
      const res = await requestRevision(logbookId, notes);
      if (!res.success) throw new Error(res.error);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["issue", issue.id] });
      setIssueData((prev) => ({
        ...prev,
        logbooks: prev.logbooks.map((lb) =>
          lb.id === variables.logbookId
            ? { ...lb, status: LogbookStatus.revision, notes: variables.notes }
            : lb,
        ),
      }));
      toast.success("Revisi logbook berhasil diminta");
      setRevisionDialog(null);
      setRevisionNotes("");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Gagal meminta revisi",
      );
    },
  });

  const handleApprove = useCallback(
    (logbookId: string) => {
      approveMutation.mutate(logbookId);
    },
    [approveMutation],
  );

  const handleRevision = useCallback(() => {
    if (!revisionDialog || !revisionNotes.trim()) return;
    revisionMutation.mutate({
      logbookId: revisionDialog.logbookId,
      notes: revisionNotes.trim(),
    });
  }, [revisionDialog, revisionNotes, revisionMutation]);

  const assignedCount = getAssignedInternCount(issueData);

  return (
    <ScrollArea className="max-w-[100vw] h-[calc(100vh-5rem)] pr-2">
      <div className="w-full pb-8 space-y-8">
        <Link
          href="/supervisor/issues"
          className={buttonVariants({
            variant: "link",
            size: "sm",
            className:
              "pl-0 inline-flex items-center gap-1 text-xs font-medium transition-all text-primary hover:underline group",
          })}
        >
          <ArrowLeftIcon className="size-4 group-hover:-translate-x-0.5 transition-transform" />
          Kembali ke Rencana Kegiatan
        </Link>

        <Card size="sm" className="p-8">
          <CardContent className="px-0 py-0">
            <div className="flex items-start justify-between gap-6">
              <div className="min-w-0 space-y-3">
                {/* Title & Status */}
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-xl font-semibold tracking-tight text-foreground">
                    {issue.title}
                  </h1>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] font-bold uppercase ${status.className}`}
                  >
                    {status.label}
                  </Badge>
                </div>

                {/* Period */}
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {issue.startDate && issue.endDate ? (
                      <span>
                        {format(new Date(issue.startDate), "d MMMM yyyy", {
                          locale: id,
                        })}{" "}
                        -{" "}
                        {format(new Date(issue.endDate), "d MMMM yyyy", {
                          locale: id,
                        })}
                      </span>
                    ) : (
                      "Tidak ada periode pengerjaan"
                    )}
                  </span>
                </div>

                {/* Description */}
                <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  {issue.description ?? "Tidak ada deskripsi"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => router.push("/supervisor/issues")}
                >
                  <PencilIcon className="size-3.5" />
                  Edit
                </Button>
                {issueData.status === IssueStatus.active && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-muted-foreground"
                    onClick={() => setArchiveOpen(true)}
                  >
                    <ArchiveIcon className="size-3.5" />
                    Arsipkan
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold tracking-tight">
                Riwayat Logbook
              </h2>
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 text-[11px] font-bold"
              >
                {issueData.logbooks.length}
              </Badge>
            </div>
          </div>

          {logbooksByDate.length === 0 ? (
            <Card
              size="sm"
              className="p-12 bg-transparent border-0 shadow-none ring-0"
            >
              <CardContent className="px-0 py-0">
                <div className="flex flex-col items-center justify-center space-y-2 text-center">
                  <ClockIcon className="size-10 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Belum ada entri logbook
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    Logbook akan muncul setelah intern mengisi kegiatan harian
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            logbooksByDate.map(([dateKey, logbooks]) => {
              const dateObj = new Date(dateKey + "T00:00:00");
              const dayLabel = format(dateObj, "EEEE, d MMM yyyy", {
                locale: id,
              });
              const filledCount = logbooks.length;
              const dayStatus =
                filledCount >= assignedCount
                  ? dayStatusConfig.all
                  : filledCount > 0
                    ? dayStatusConfig.partial
                    : dayStatusConfig.none;
              const DayIcon = dayStatus.icon;

              const uniqueInternsOnDay = new Set(
                logbooks.map((l) => l.internProfileId),
              );

              return (
                <Accordion key={dateKey} defaultValue={[dateKey]} multiple>
                  <AccordionItem value={dateKey}>
                    <AccordionTrigger className="flex items-center justify-between p-4 border rounded-xl data-open:rounded-b-none hover:no-underline [&>svg]:hidden">
                      <div className="flex items-center flex-1 gap-4">
                        <div
                          className={`flex items-center justify-center size-7 rounded-full ${dayStatus.iconClass} ring-4 ring-background`}
                        >
                          <DayIcon className="size-3.5" />
                        </div>
                        <span className="text-sm font-medium">{dayLabel}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold uppercase ${dayStatus === dayStatusConfig.all ? "bg-green-50 text-green-700 border-green-200" : dayStatus === dayStatusConfig.partial ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}
                        >
                          {filledCount}/{assignedCount} Intern
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <AvatarGroup>
                          {logbooks.slice(0, 3).map((l) => (
                            <Avatar key={l.id} size="sm">
                              <AvatarImage
                                src={l.internProfile.user.image ?? undefined}
                                alt={l.internProfile.user.name}
                              />
                              <AvatarFallback>
                                {initials(l.internProfile.user.name)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {logbooks.length > 3 && (
                            <AvatarGroupCount>
                              +{logbooks.length - 3}
                            </AvatarGroupCount>
                          )}
                        </AvatarGroup>
                        <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[slot=accordion-trigger][aria-expanded=true]:rotate-180" />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-4 space-y-4 border border-t-0 rounded-b-xl bg-muted/30">
                        {logbooks.map((logbook) => {
                          const lbStatus =
                            logbookStatusConfig[logbook.status] ??
                            logbookStatusConfig.pending_review;
                          const StatusIcon = lbStatus.icon;
                          return (
                            <Card
                              key={logbook.id}
                              size="sm"
                              className="border shadow-none"
                            >
                              <CardContent className="px-4 py-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex items-center gap-2.5 flex-wrap">
                                      <Avatar size="sm">
                                        <AvatarImage
                                          src={
                                            logbook.internProfile.user.image ??
                                            undefined
                                          }
                                          alt={logbook.internProfile.user.name}
                                        />
                                        <AvatarFallback>
                                          {initials(
                                            logbook.internProfile.user.name,
                                          )}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs font-medium">
                                        {logbook.internProfile.user.name}
                                      </span>
                                      <span className="text-muted-foreground/40">
                                        •
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDuration(logbook.duration)}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] font-bold uppercase gap-1 ${lbStatus.badgeClass}`}
                                      >
                                        <StatusIcon className="size-3" />
                                        {lbStatus.label}
                                      </Badge>
                                    </div>
                                    <p className="text-xs leading-relaxed text-foreground">
                                      {logbook.activity}
                                    </p>
                                  </div>
                                </div>

                                {logbook.notes && (
                                  <div className="mt-3 p-3 bg-muted rounded-lg border-l-4 border-primary/30 flex gap-2.5">
                                    <MessageSquareIcon className="size-4 text-primary/40 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="text-xs italic text-muted-foreground">
                                        &ldquo;{logbook.notes}&rdquo;
                                      </p>
                                      <p className="text-[10px] text-primary font-bold mt-1">
                                        — Supervisor
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {logbook.status ===
                                  LogbookStatus.pending_review && (
                                  <div className="flex items-center gap-2 pt-3 mt-3 border-t">
                                    <Button
                                      size="xs"
                                      className="gap-1"
                                      onClick={() => handleApprove(logbook.id)}
                                      disabled={approveMutation.isPending}
                                    >
                                      {approveMutation.isPending ? (
                                        <Spinner />
                                      ) : (
                                        <ThumbsUpIcon className="size-3" />
                                      )}
                                      Approve
                                    </Button>
                                    <Button
                                      size="xs"
                                      variant="outline"
                                      className="gap-1"
                                      onClick={() => {
                                        setRevisionDialog({
                                          logbookId: logbook.id,
                                          internName:
                                            logbook.internProfile.user.name,
                                        });
                                        setRevisionNotes(logbook.notes ?? "");
                                      }}
                                    >
                                      <RotateCcwIcon className="size-3" />
                                      Revision
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              );
            })
          )}
        </section>

        <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia>
                <ArchiveIcon className="text-muted-foreground" />
              </AlertDialogMedia>
              <AlertDialogTitle>Arsipkan Rencana Kegiatan?</AlertDialogTitle>
              <AlertDialogDescription>
                Rencana kegiatan <strong>&ldquo;{issue.title}&rdquo;</strong>{" "}
                akan diarsipkan dengan status &ldquo;Dibatalkan&rdquo;. Intern
                tidak dapat lagi mengisi logbook untuk kegiatan ini.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={archiveMutation.isPending}>
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={archiveMutation.isPending}
                onClick={() => archiveMutation.mutate()}
              >
                {archiveMutation.isPending ? "Mengarsipkan..." : "Arsipkan"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog
          open={!!revisionDialog}
          onOpenChange={(open) => {
            if (!open) {
              setRevisionDialog(null);
              setRevisionNotes("");
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Minta Revisi Logbook</DialogTitle>
              <DialogDescription>
                Berikan catatan revisi untuk logbook milik{" "}
                <strong>{revisionDialog?.internName}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <textarea
                className="w-full min-h-[100px] rounded-lg border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
                placeholder="Jelaskan apa yang perlu direvisi..."
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRevisionDialog(null);
                    setRevisionNotes("");
                  }}
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleRevision}
                  disabled={!revisionNotes.trim() || revisionMutation.isPending}
                  className="gap-1"
                >
                  {revisionMutation.isPending && <Spinner />}
                  {revisionMutation.isPending ? "Mengirim..." : "Kirim Revisi"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
}
