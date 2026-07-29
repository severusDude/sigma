"use client";

import {
  BookUser,
  CalendarCheck,
  ChartLine,
  FileText,
  UserCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import type { DashboardData } from "../types/dashboard-types";
import { DeptBarChart } from "../components/dashboard/dept-bar-chart";
import { StatusPieChart } from "../components/dashboard/status-pie-chart";
import { FillRateChart } from "../components/dashboard/fill-rate-chart";

type DashboardPageProps = {
  data: DashboardData;
};

export default function DashboardPage({ data }: DashboardPageProps) {
  const hasWarning = data.warningInterns.length > 0;

  return (
    <ScrollArea className="w-full max-h-[calc(100vh-5rem)] mx-auto space-y-6 pr-2">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard HR</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan operasional magang BPS Kota Tasikmalaya
        </p>
      </header>

      <div className="grid gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatBlock
          mode="range"
          data={{
            current: data.totalActiveInterns,
            previous: data.totalInternsPrevMonth,
          }}
        >
          <StatHeader>
            <StatIcon icon={<BookUser className="h-5 w-5" />} />
            <div>
              <StatTitle>Intern Aktif</StatTitle>
              <StatDescription>Total intern aktif</StatDescription>
            </div>
          </StatHeader>
          <StatContent>
            <StatMain>
              <StatValue />
              <StatSubValue asPercentage />
            </StatMain>
          </StatContent>
        </StatBlock>

        <StatBlock mode="single" data={{ value: data.totalActiveSupervisors }}>
          <StatHeader>
            <StatIcon icon={<UserCheck className="h-5 w-5" />} />
            <div>
              <StatTitle>Supervisor Aktif</StatTitle>
              <StatDescription>Total supervisor</StatDescription>
            </div>
          </StatHeader>
          <StatContent>
            <StatMain>
              <StatValue />
            </StatMain>
          </StatContent>
        </StatBlock>

        <StatBlock
          mode="range"
          data={{
            current: data.logbookFillRate,
            previous: data.logbookFillRatePrevMonth,
          }}
        >
          <StatHeader>
            <StatIcon icon={<FileText className="h-5 w-5" />} />
            <div>
              <StatTitle>Logbook Filling</StatTitle>
              <StatDescription>Rata-rata pengisian</StatDescription>
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
            current: data.attendanceRate,
            previous: data.attendanceRatePrevMonth,
          }}
        >
          <StatHeader>
            <StatIcon icon={<CalendarCheck className="h-5 w-5" />} />
            <div>
              <StatTitle>Kehadiran</StatTitle>
              <StatDescription>Rata-rata kehadiran</StatDescription>
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
      </div>

      <div className="grid gap-4 mb-6 lg:grid-cols-2">
        <DeptBarChart data={data.teamDistribution} />
        {/* TODO: fix label animation appearing from top left corner of the element */}
        <StatusPieChart data={data.internStatusCounts} />
      </div>

      <div className="mb-6">
        <FillRateChart data={data.weeklyFillRates} />
      </div>

      {hasWarning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <ChartLine className="h-5 w-5" />
              Intern dengan Fill Rate &lt; 50%
            </CardTitle>
            <CardDescription>
              Perlu perhatian khusus — pengisian logbook sangat rendah
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {data.warningInterns.map((intern) => (
                <div
                  key={intern.internId}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{intern.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {intern.institution}
                      {intern.team ? ` — ${intern.team}` : ""}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-rose-600">
                    {intern.logbookRate}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!hasWarning && data.totalActiveInterns === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">Belum ada data</p>
        </div>
      )}
    </ScrollArea>
  );
}
