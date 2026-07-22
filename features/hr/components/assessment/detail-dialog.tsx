"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2Icon,
  CheckCircle2Icon,
  AlertCircleIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent as AlertDialogContent2,
  AlertDialogDescription as AlertDialogDescription2,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle as AlertDialogTitle2,
} from "@/components/ui/alert-dialog";

import { getAssessmentDetail, finalizeAssessment } from "../../actions/assessment-actions";
import type { HrAssessmentDetail } from "../../types/assessment-types";

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getGradeLabel(grade: string): string {
  const map: Record<string, string> = {
    A: "Sangat Baik",
    B: "Baik",
    C: "Cukup",
    D: "Kurang",
    E: "Sangat Kurang",
  };
  return map[grade] ?? "";
}

function calculatePreviewScore(components: HrAssessmentDetail["components"]): number {
  const totalWeight = components.reduce((sum, c) => sum + c.weight, 0);
  const score =
    totalWeight > 0
      ? components.reduce((sum, c) => sum + (c.score ?? 0) * c.weight, 0) / totalWeight
      : 0;
  return Math.round(score * 10) / 10;
}

function calculatePreviewGrade(score: number): string {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "E";
}

const statusLabel: Record<string, string> = {
  draft: "Draft",
  submitted: "Menunggu Finalisasi",
  finalized: "Sudah Difinalisasi",
};

const statusVariant: Record<string, "default" | "secondary" | "outline"> = {
  draft: "outline",
  submitted: "secondary",
  finalized: "default",
};

interface DetailDialogProps {
  assessmentId: string | null;
  onClose: () => void;
}

export function DetailDialog({ assessmentId, onClose }: DetailDialogProps) {
  const queryClient = useQueryClient();
  const [detail, setDetail] = useState<HrAssessmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);

  useEffect(() => {
    if (assessmentId && assessmentId !== loadedId) {
      setIsLoading(true);
      getAssessmentDetail(assessmentId).then((res) => {
        if (res.success) setDetail(res.data ?? null);
        setIsLoading(false);
        setLoadedId(assessmentId);
      });
    }
    if (!assessmentId) {
      setDetail(null);
      setLoadedId(null);
    }
  }, [assessmentId]);

  const { mutateAsync: finalizeAsync, isPending: isFinalizing } = useMutation({
    mutationKey: ["finalize-assessment"],
    mutationFn: async (id: string) => {
      const res = await finalizeAssessment(id);
      if (!res.success) throw new Error(res.error);
      return res;
    },
  });

  function handleFinalizeClick() {
    if (!assessmentId) return;
    setShowFinalizeDialog(true);
  }

  async function handleConfirmFinalize() {
    setShowFinalizeDialog(false);
    if (!assessmentId) return;

    const promise = finalizeAsync(assessmentId);

    toast.promise(promise, {
      loading: "Memfinalisasi nilai...",
      success: "Nilai berhasil difinalisasi",
      error: (err) =>
        err instanceof Error ? err.message : "Gagal finalisasi nilai",
    });

    try {
      await promise;
      queryClient.refetchQueries({ queryKey: ["hr-assessments"] });
      onClose();
    } catch {
      // error handled by toast
    }
  }

  const isReadOnly = detail?.status === "finalized";

  return (
    <Dialog open={!!assessmentId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-screen max-w-screen md:min-w-[calc(100%-32rem)] md:h-fit gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 space-y-1 border-b">
          <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
            Detail Penilaian
          </DialogTitle>
          <DialogDescription>Review dan finalisasi nilai intern</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100vh-12rem)]">
          <div className="px-6 py-6 space-y-6">
            {isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-20 w-full" />
              </div>
            )}

            {!isLoading && !detail && (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Data penilaian tidak ditemukan
              </p>
            )}

            {detail && (
              <>
                {/* Info Intern & Supervisor */}
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{detail.internName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {detail.internNim} &middot; {detail.institution}
                      </p>
                    </div>
                    <Badge
                      variant={statusVariant[detail.status] ?? "outline"}
                      className="rounded-none text-xs"
                    >
                      {statusLabel[detail.status] ?? detail.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Supervisor</p>
                      <p className="font-medium">{detail.supervisorName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Bidang Supervisor</p>
                      <p className="font-medium">{detail.supervisorField}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Periode Penilaian</p>
                      <p className="font-medium">
                        {formatDate(detail.periodStart)} — {formatDate(detail.periodEnd)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Komponen Nilai */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-semibold text-foreground mb-3">
                    Komponen Nilai
                  </h4>

                  <div className="space-y-2">
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      <span>Komponen</span>
                      <span className="text-right">Bobot</span>
                      <span className="text-right">Nilai</span>
                      <span className="text-right">Skor</span>
                    </div>
                    {detail.components.map((comp) => (
                      <div
                        key={comp.name}
                        className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-2 rounded-none border bg-card px-3 py-2.5 text-sm"
                      >
                        <span className="font-medium">{comp.name}</span>
                        <span className="text-right text-muted-foreground">
                          {comp.weight}%
                        </span>
                        <span className="text-right tabular-nums">
                          {comp.score !== null
                            ? comp.score
                            : <span className="text-muted-foreground">&mdash;</span>}
                        </span>
                        <span className="text-right tabular-nums text-muted-foreground">
                          {comp.score !== null
                            ? ((comp.score * comp.weight) / 100).toFixed(1)
                            : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Catatan Supervisor */}
                {detail.components.some((c) => c.notes) && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-semibold text-foreground mb-3">
                      Catatan Supervisor
                    </h4>
                    <div className="space-y-2">
                      {detail.components
                        .filter((c) => c.notes)
                        .map((comp) => (
                          <div key={comp.name} className="text-sm">
                            <span className="font-medium">{comp.name}: </span>
                            <span className="text-muted-foreground">{comp.notes}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Hasil / Preview Nilai */}
                {(detail.finalScore !== null || detail.status === "submitted") && (
                  <div className="border-t pt-4">
                    <div
                      className={`rounded-none border p-4 ${
                        detail.status === "finalized"
                          ? "bg-primary/5"
                          : "bg-muted/30 border-dashed"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">
                            {detail.status === "finalized" ? "Nilai Akhir" : "Preview Nilai"}
                          </p>
                          {(() => {
                            const previewScore =
                              detail.finalScore ??
                              calculatePreviewScore(detail.components);
                            return (
                              <p className="text-3xl font-bold tabular-nums">
                                {previewScore}
                                <span className="text-sm font-normal text-muted-foreground">
                                  {" "}
                                  / 100
                                </span>
                              </p>
                            );
                          })()}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">Grade</p>
                          {(() => {
                            const previewScore =
                              detail.finalScore ??
                              calculatePreviewScore(detail.components);
                            const previewGrade =
                              detail.finalGrade ?? calculatePreviewGrade(previewScore);
                            return (
                              <p className="text-2xl font-bold">
                                {previewGrade}
                                <span className="text-sm font-normal text-muted-foreground ml-1">
                                  ({getGradeLabel(previewGrade)})
                                </span>
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                      {detail.finalizedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Difinalisasi pada {formatDateTime(detail.finalizedAt)}
                        </p>
                      )}
                      {detail.status === "submitted" && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Grade akan dikunci setelah finalisasi
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Bobot Warning */}
                {(() => {
                  const totalWeight = detail.components.reduce((s, c) => s + c.weight, 0);
                  if (totalWeight !== 100) {
                    return (
                      <div className="flex items-center gap-2 rounded-none border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        <AlertCircleIcon className="size-4 shrink-0" />
                        Total bobot: {totalWeight}% (ideal: 100%)
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Tombol Aksi */}
                {!isReadOnly && (
                  <div className="border-t pt-4 flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                      Kembali
                    </Button>
                    <Button
                      onClick={handleFinalizeClick}
                      disabled={isFinalizing}
                      className="gap-2"
                    >
                      {isFinalizing ? (
                        <Loader2Icon className="size-4 animate-spin" />
                      ) : (
                        <CheckCircle2Icon className="size-4" />
                      )}
                      Finalisasi Nilai
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>

      <AlertDialog
        open={showFinalizeDialog}
        onOpenChange={setShowFinalizeDialog}
      >
        <AlertDialogContent2>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <AlertTriangleIcon className="text-amber-500" />
            </AlertDialogMedia>
            <AlertDialogTitle2>Finalisasi Penilaian</AlertDialogTitle2>
            <AlertDialogDescription2>
              Setelah difinalisasi, nilai tidak bisa diubah. Lanjutkan?
            </AlertDialogDescription2>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmFinalize}>
              Ya, Finalisasi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent2>
      </AlertDialog>
    </Dialog>
  );
}
