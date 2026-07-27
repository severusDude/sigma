"use client";

import {
  BookOpen,
  CalendarCheck,
  GraduationCap,
  Trophy,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  StatBlock,
  StatContent,
  StatDescription,
  StatHeader,
  StatIcon,
  StatMain,
  StatSubValue,
  StatTitle,
  StatValue,
} from "@/components/shared/stat-block";

import type { InternDashboardData } from "../types/dashboard-types";
import { LogbookProgressChart } from "../components/dashboard/logbook-progress-chart";

type DashboardPageProps = {
  data: InternDashboardData;
};

export default function DashboardPage({ data }: DashboardPageProps) {
  const hasRecent = data.recentActivity.length > 0;

  return (
    <ScrollArea className="w-full max-h-[calc(100vh-5rem)] mx-auto space-y-8 pr-2">
      <div className="space-y-6 contents">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Selamat datang, {data.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              Ringkasan aktivitas magang Anda
            </p>
          </div>
          <Badge variant="success">
            {data.status === "active" ? "Aktif" : data.status}
          </Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatBlock
            mode="range"
            data={{ current: data.activeDay, previous: data.totalDays }}
          >
            <StatHeader>
              <StatIcon icon={<CalendarCheck className="w-5 h-5" />} />
              <div>
                <StatTitle>Hari Aktif</StatTitle>
                <StatDescription>Periode magang</StatDescription>
              </div>
            </StatHeader>
            <StatContent>
              <StatMain>
                <StatValue />
                <StatSubValue
                  variant="badge"
                  asPercentage
                  displayPolarity={false}
                />
              </StatMain>
            </StatContent>
          </StatBlock>

          <StatBlock
            mode="range"
            data={{
              current: data.logbookFilled,
              previous: data.logbookTotal,
            }}
          >
            <StatHeader>
              <StatIcon icon={<BookOpen className="w-5 h-5" />} />
              <div>
                <StatTitle>Logbook Terisi</StatTitle>
                <StatDescription>
                  {data.logbookTrend >= 0 ? "▲ Naik" : "▼ Turun"} vs minggu lalu
                </StatDescription>
              </div>
            </StatHeader>
            <StatContent>
              <StatMain>
                <StatValue />
                <StatSubValue
                  variant="badge"
                  asPercentage
                  displayPolarity={false}
                />
              </StatMain>
            </StatContent>
          </StatBlock>

          <StatBlock
            mode="range"
            data={{
              current: data.attendancePresent,
              previous: data.attendanceTotal,
            }}
          >
            <StatHeader>
              <StatIcon icon={<User className="w-5 h-5" />} />
              <div>
                <StatTitle>Kehadiran</StatTitle>
                <StatDescription>Total presensi</StatDescription>
              </div>
            </StatHeader>
            <StatContent>
              <StatMain>
                <StatValue />
                <StatSubValue
                  variant="badge"
                  asPercentage
                  displayPolarity={false}
                />
              </StatMain>
            </StatContent>
          </StatBlock>

          <StatBlock mode="single" data={{ value: data.avgGrade ?? "—" }}>
            <StatHeader>
              <StatIcon icon={<Trophy className="w-5 h-5" />} />
              <div>
                <StatTitle>Rata-rata Nilai</StatTitle>
                <StatDescription>
                  {data.avgScore !== null
                    ? `Skor ${data.avgScore}`
                    : "Belum ada"}
                </StatDescription>
              </div>
            </StatHeader>
            <StatContent>
              <StatMain>
                <StatValue />
              </StatMain>
            </StatContent>
          </StatBlock>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <LogbookProgressChart data={data.weeklyLogbooks} />
          <Card>
            <CardHeader>
              <CardTitle>Info Pembimbing</CardTitle>
              <CardDescription>Supervisor dan divisi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                  <GraduationCap className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {data.supervisorName ?? "Belum ada"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data.supervisorNip
                      ? `NIP. ${data.supervisorNip}`
                      : "Supervisor"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {data.departmentName ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">Divisi</p>
                </div>
              </div>
              <div className="pt-2 text-xs text-muted-foreground">
                Periode:{" "}
                {new Date(data.periodStart).toLocaleDateString("id-ID")} —{" "}
                {new Date(data.periodEnd).toLocaleDateString("id-ID")}
              </div>
            </CardContent>
          </Card>
        </div>

        {hasRecent && (
          <Card>
            <CardHeader>
              <CardTitle>Aktivitas Terbaru</CardTitle>
              <CardDescription>10 entry logbook terakhir</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {data.recentActivity.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm wrap line-clamp-3 max-w-dvw">
                        {item.activity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <Badge
                      className="ml-3 shrink-0"
                      variant={
                        item.status === "approved"
                          ? "success"
                          : item.status === "pending_review"
                            ? "warning"
                            : "destructive"
                      }
                    >
                      {item.status === "approved"
                        ? "Disetujui"
                        : item.status === "pending_review"
                          ? "Menunggu"
                          : "Revisi"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!hasRecent && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada data logbook
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
