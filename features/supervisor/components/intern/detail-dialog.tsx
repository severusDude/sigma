"use client";

import Link from "next/link";
import { ClipboardCheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { SupervisedIntern } from "../../types/intern-types";

interface DetailDialogProps {
  intern: SupervisedIntern | null;
  onClose: () => void;
}

const statusLabel: Record<string, string> = {
  active: "Aktif",
  completed: "Selesai",
  withdrawn: "Ditarik",
};

const assessmentLabel: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  finalized: "Finalized",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

export function DetailDialog({ intern, onClose }: DetailDialogProps) {
  const isActive = intern !== null && intern.assignmentEndedAt === null;

  return (
    <Dialog open={intern !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-screen max-w-screen md:min-w-[calc(100%-52rem)] md:h-fit gap-0">
        <DialogHeader className="sticky pb-4 -mx-6 space-y-4 border-b">
          <div className="px-6">
            <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
              Detail Intern Bimbingan
            </DialogTitle>
            <DialogDescription>
              Ringkasan progres peserta magang
            </DialogDescription>
          </div>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(100vh-12rem)] -mr-6 pr-6">
          {intern && (
            <div className="pt-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{intern.name}</h3>
                  <p className="text-sm text-muted-foreground">{intern.nik}</p>
                </div>
                <Badge>
                  {statusLabel[intern.internStatus] || intern.internStatus}
                </Badge>
              </div>

              <div>
                <InfoRow label="Institusi" value={intern.institution} />
                <InfoRow label="Tim" value={intern.team ?? "-"} />
                <InfoRow
                  label="Periode"
                  value={`${formatDate(intern.periodStart)} - ${formatDate(intern.periodEnd)}`}
                />
                <InfoRow
                  label="Logbook disetujui"
                  value={`${intern.approvedLogbooks}/${intern.totalLogbooks}`}
                />
                <InfoRow
                  label="Logbook menunggu review"
                  value={`${intern.pendingLogbooks}`}
                />
                <InfoRow
                  label="Kehadiran"
                  value={`${intern.presentDays}/${intern.totalAttendance} hari`}
                />
                <InfoRow
                  label="Penilaian"
                  value={
                    intern.assessmentStatus
                      ? (assessmentLabel[intern.assessmentStatus] ||
                          intern.assessmentStatus)
                      : "Belum dinilai"
                  }
                />
              </div>

              {isActive ? (
                <Link
                  href={`/supervisor/penilaian/${intern.internProfileId}`}
                  className={cn(buttonVariants(), "gap-2 w-full")}
                >
                  <ClipboardCheckIcon className="size-4" />
                  {intern.assessmentStatus
                    ? "Lihat Penilaian"
                    : "Isi Penilaian"}
                </Link>
              ) : (
                <p className="text-sm text-center text-muted-foreground">
                  Periode bimbingan telah berakhir.
                </p>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
