"use client";

import { useMemo, useState } from "react";

import {
  differenceInCalendarDays,
  differenceInDays,
  format,
  getISOWeek,
  startOfWeek,
} from "date-fns";
import {
  BookOpenIcon,
  CalendarDaysIcon,
  ClipboardCheckIcon,
  ClockIcon,
  PlusIcon,
} from "lucide-react";

import { id } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  StatBlock,
  StatContent,
  StatDescription,
  StatHeader,
  StatIcon,
  StatMain,
  StatTitle,
  StatValue,
} from "@/components/shared/stat-block";

import type { Logbook } from "../types/logbook-types";
import { getLogbooks } from "../actions/logbook-actions";
import { WeekGroup } from "../components/logbook/week-group";
import { LogbookCard } from "../components/logbook/logbook-card";
import { AlertBanner } from "../components/logbook/alert-banner";
import { DetailDialog } from "../components/logbook/detail-dialog";
import { DeleteDialog } from "../components/logbook/delete-dialog";
import { CreateLogbookForm } from "../components/logbook/create-form";
import { UpdateLogbookForm } from "../components/logbook/update-form";

interface LogbookPageProps {
  periodStart?: Date;
  periodEnd?: Date;
  internName?: string;
}

function groupByWeek(logbooks: Logbook[]) {
  const now = new Date();
  const currentWeek = getISOWeek(now);
  const currentYear = now.getFullYear();

  const groups: { label: string; logbooks: Logbook[]; rangeStart: Date; rangeEnd: Date }[] = [];
  const weekMap = new Map<string, Logbook[]>();

  for (const lb of logbooks) {
    const d = new Date(lb.date);
    const week = getISOWeek(d);
    const year = d.getFullYear();
    const key = `${year}-W${String(week).padStart(2, "0")}`;

    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key)!.push(lb);
  }

  const sortedWeeks = Array.from(weekMap.entries()).sort(([a], [b]) =>
    b.localeCompare(a),
  );

  for (const [key, lbs] of sortedWeeks) {
    const [yearStr, weekStr] = key.split("-W");
    const weekNum = Number(weekStr);
    const yearNum = Number(yearStr);

    const rangeStart = startOfWeek(new Date(yearNum, 0, 1 + (weekNum - 1) * 7), {
      weekStartsOn: 1,
    });
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeStart.getDate() + 6);

    let label: string;
    if (weekNum === currentWeek && yearNum === currentYear) {
      label = "Minggu Ini";
    } else if (weekNum === currentWeek - 1 && yearNum === currentYear) {
      label = "Minggu Lalu";
    } else {
      label = format(rangeStart, "d MMM yyyy", { locale: id });
    }

    groups.push({
      label,
      logbooks: lbs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
      rangeStart,
      rangeEnd,
    });
  }

  return groups;
}

export default function LogbookPage({
  periodStart,
  periodEnd,
  internName,
}: LogbookPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [updateLogbook, setUpdateLogbook] = useState<Logbook | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [deleteLogbook, setDeleteLogbook] = useState<Logbook | null>(null);

  const { data: logbooks = [], isLoading } = useQuery({
    queryKey: ["logbooks"],
    queryFn: async () => {
      const res = await getLogbooks();
      if (!res.success) throw new Error(res.error);
      return res.data ?? [];
    },
  });

  const weekGroups = useMemo(() => groupByWeek(logbooks), [logbooks]);

  const defaultWeeks = useMemo(
    () => weekGroups.filter((g) => g.label === "Minggu Ini" || g.label === "Minggu Lalu").map((g) => g.label),
    [weekGroups],
  );

  const approvedCount = useMemo(
    () => logbooks.filter((lb) => lb.status === "approved").length,
    [logbooks],
  );

  const hasConsecutiveMiss = useMemo(() => {
    if (logbooks.length === 0) return false;
    const dates = logbooks.map((lb) => new Date(lb.date).toDateString());
    const uniqueDates = new Set(dates);
    const today = new Date();
    let streak = 0;
    for (let i = 1; i <= 5; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (!uniqueDates.has(d.toDateString())) {
        streak++;
        if (streak >= 2) return true;
      } else {
        streak = 0;
      }
    }
    return false;
  }, [logbooks]);

  const totalDays =
    periodStart && periodEnd ? differenceInDays(periodEnd, periodStart) : 0;
  const elapsedDays = periodStart
    ? differenceInCalendarDays(new Date(), periodStart)
    : 0;
  const activeDays = Math.max(0, Math.min(elapsedDays, totalDays));

  return (
    <ScrollArea className="max-w-[100vw] h-[calc(100vh-5rem)] pr-2">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Logbook Harian
            </h1>
            <p className="text-sm text-muted-foreground">
              Catat dan kelola kegiatan harian magang Anda
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <PlusIcon className="size-4" />
            Tambah Logbook
          </Button>
        </div>

        {hasConsecutiveMiss && (
          <AlertBanner
            message="Anda belum mengisi logbook 2 hari terakhir. Segera lengkapi logbook Anda untuk evaluasi mingguan."
            action={{
              label: "Lengkapi Sekarang",
              onClick: () => setCreateOpen(true),
            }}
          />
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatBlock mode="single">
            <StatHeader>
              <StatIcon icon={<CalendarDaysIcon className="size-5" />} />
              <div>
                <StatTitle>Periode Magang</StatTitle>
              </div>
            </StatHeader>
            <StatContent>
              <StatMain>
                <StatValue>
                  {periodStart && periodEnd
                    ? `${format(periodStart, "d MMM", { locale: id })} - ${format(periodEnd, "d MMM yyyy", { locale: id })}`
                    : "—"}
                </StatValue>
              </StatMain>
            </StatContent>
          </StatBlock>

          <StatBlock
            mode="range"
            data={{ current: activeDays, previous: totalDays }}
          >
            <StatHeader>
              <StatIcon icon={<ClockIcon className="size-5" />} />
              <div>
                <StatTitle>Status Hari</StatTitle>
              </div>
            </StatHeader>
            <StatContent>
              <StatMain>
                <StatValue />
              </StatMain>
            </StatContent>
          </StatBlock>

          <StatBlock mode="single">
            <StatHeader>
              <StatIcon icon={<ClipboardCheckIcon className="size-5" />} />
              <div>
                <StatTitle>Presensi</StatTitle>
              </div>
            </StatHeader>
            <StatContent>
              <StatMain>
                <StatValue>—</StatValue>
              </StatMain>
              <StatDescription>Fitur presensi belum tersedia</StatDescription>
            </StatContent>
          </StatBlock>

          <StatBlock mode="single">
            <StatHeader>
              <StatIcon icon={<BookOpenIcon className="size-5" />} />
              <div>
                <StatTitle>Logbook Diterima</StatTitle>
              </div>
            </StatHeader>
            <StatContent>
              <StatMain>
                <StatValue>{approvedCount}</StatValue>
              </StatMain>
              <StatDescription>Entri disetujui</StatDescription>
            </StatContent>
          </StatBlock>
        </div>

        <Tabs defaultValue="riwayat">
          <TabsList>
            <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
            <TabsTrigger value="statistik">Statistik</TabsTrigger>
          </TabsList>
          <TabsContent value="riwayat" className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-24 rounded-lg animate-pulse bg-muted"
                  />
                ))}
              </div>
            ) : weekGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpenIcon className="mb-4 size-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">Belum ada entri logbook</p>
                <Button
                  variant="outline"
                  className="gap-2 mt-4"
                  onClick={() => setCreateOpen(true)}
                >
                  <PlusIcon className="size-4" />
                  Buat Entri Pertama
                </Button>
              </div>
            ) : (
              <Accordion multiple defaultValue={defaultWeeks}>
                {weekGroups.map((group) => (
                  <WeekGroup key={group.label} value={group.label} label={group.label} rangeStart={group.rangeStart} rangeEnd={group.rangeEnd}>
                    {group.logbooks.map((lb) => (
                      <LogbookCard
                        key={lb.id}
                        logbook={lb}
                        onView={(l) => setDetailId(l.id)}
                        onEdit={(l) => setUpdateLogbook(l)}
                        onDelete={(l) => setDeleteLogbook(l)}
                      />
                    ))}
                  </WeekGroup>
                ))}
              </Accordion>
            )}
          </TabsContent>
          <TabsContent value="statistik" className="mt-4">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                Statistik akan tersedia pada pembaruan berikutnya
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="h-screen max-w-screen md:min-w-[calc(100%-52rem)] md:h-fit gap-0">
            <DialogHeader className="sticky pb-4 -mx-6 space-y-4 border-b">
              <div className="px-6">
                <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
                  Tambah Logbook
                </DialogTitle>
                <DialogDescription>
                  Catat kegiatan harian magang Anda
                </DialogDescription>
              </div>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(100vh-12rem)] -mr-6 pr-6">
              <div className="pt-6">
                <CreateLogbookForm onSuccess={() => setCreateOpen(false)} />
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!updateLogbook}
          onOpenChange={(open) => !open && setUpdateLogbook(null)}
        >
          <DialogContent className="h-screen max-w-screen md:min-w-[calc(100%-52rem)] md:h-fit gap-0">
            <DialogHeader className="sticky pb-4 -mx-6 space-y-4 border-b">
              <div className="px-6">
                <DialogTitle className="text-2xl font-semibold tracking-tight text-primary">
                  Edit Logbook
                </DialogTitle>
                <DialogDescription>
                  Perbarui entri logbook Anda
                </DialogDescription>
              </div>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(100vh-12rem)] -mr-6 pr-6">
              <div className="pt-6">
                {updateLogbook && (
                  <UpdateLogbookForm
                    logbook={updateLogbook}
                    onSuccess={() => setUpdateLogbook(null)}
                  />
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <DetailDialog logbookId={detailId} onClose={() => setDetailId(null)} />

        <DeleteDialog
          logbook={deleteLogbook}
          onClose={() => setDeleteLogbook(null)}
        />
      </div>
    </ScrollArea>
  );
}
