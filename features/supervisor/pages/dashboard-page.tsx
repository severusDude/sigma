"use client";

import { ClipboardCheck, FileText, UserCheck, Users } from "lucide-react";

import Link from "next/link";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

import type { SupervisorDashboardData } from "../types/dashboard-types";
import { LogbookStatusChart } from "../components/dashboard/logbook-status-chart";
import { AssessmentProgressChart } from "../components/dashboard/assessment-progress-chart";

type DashboardPageProps = {
  data: SupervisorDashboardData;
};

export default function DashboardPage({ data }: DashboardPageProps) {
  const hasInterns = data.totalInterns > 0;

  return (
    <ScrollArea className="w-full max-h-[calc(100vh-5rem)] mx-auto space-y-8 pr-2">
      <div className="space-y-6 contents">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dashboard Supervisor
          </h1>
          <p className="text-sm text-muted-foreground">
            Ringkasan bimbingan intern BPS Kota Tasikmalaya
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatBlock mode="single" data={{ value: data.totalInterns }}>
            <StatHeader>
              <StatIcon icon={<Users className="w-5 h-5" />} />
              <div>
                <StatTitle>Intern Binaan</StatTitle>
                <StatDescription>Total intern aktif</StatDescription>
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
              current: data.pendingReviewCount,
              previous: data.pendingReviewYesterday,
            }}
          >
            <StatHeader>
              <StatIcon icon={<FileText className="w-5 h-5" />} />
              <div>
                <StatTitle>Logbook Perlu Review</StatTitle>
                <StatDescription>Menunggu persetujuan</StatDescription>
              </div>
            </StatHeader>
            <StatContent>
              <StatMain>
                <StatValue />
                <StatSubValue asPercentage displayPolarity={false} />
              </StatMain>
            </StatContent>
          </StatBlock>

          <StatBlock
            mode="single"
            data={{ value: data.pendingAssessmentCount }}
          >
            <StatHeader>
              <StatIcon icon={<ClipboardCheck className="w-5 h-5" />} />
              <div>
                <StatTitle>Penilaian Perlu Diisi</StatTitle>
                <StatDescription>Intern belum dinilai</StatDescription>
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
              current: data.avgCompliance,
              previous: data.avgCompliancePrevMonth,
            }}
          >
            <StatHeader>
              <StatIcon icon={<UserCheck className="w-5 h-5" />} />
              <div>
                <StatTitle>Kepatuhan Rata-rata</StatTitle>
                <StatDescription>Fill rate logbook</StatDescription>
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

        {hasInterns && (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <LogbookStatusChart data={data.internLogbookStatus} />
              <AssessmentProgressChart data={data.assessmentProgress} />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Daftar Intern Binaan</CardTitle>
                <CardDescription>
                  {data.totalInterns} intern aktif
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Logbook</TableHead>
                      <TableHead>Kehadiran</TableHead>
                      <TableHead>Penilaian</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.interns.map((intern) => {
                      const logbookPct =
                        intern.totalLogbooks > 0
                          ? Math.round(
                              (intern.approvedLogbooks / intern.totalLogbooks) *
                                100,
                            )
                          : 0;
                      const attPct =
                        intern.totalAttendance > 0
                          ? Math.round(
                              (intern.presentDays / intern.totalAttendance) *
                                100,
                            )
                          : 0;

                      return (
                        <TableRow key={intern.internProfileId}>
                          <TableCell className="font-medium">
                            {intern.name}
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                logbookPct < 50
                                  ? "text-rose-600 font-semibold"
                                  : ""
                              }
                            >
                              {intern.approvedLogbooks}/{intern.totalLogbooks} (
                              {logbookPct}%)
                            </span>
                          </TableCell>
                          <TableCell>{attPct}%</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                intern.assessmentStatus === "finalized"
                                  ? "success"
                                  : intern.assessmentStatus === "submitted"
                                    ? "warning"
                                    : intern.assessmentStatus === "draft"
                                      ? "info"
                                      : "secondary"
                              }
                            >
                              {intern.assessmentStatus === "finalized"
                                ? "Selesai"
                                : intern.assessmentStatus === "submitted"
                                  ? "Terkirim"
                                  : intern.assessmentStatus === "draft"
                                    ? "Draft"
                                    : "Belum"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/supervisor/penilaian/${intern.internProfileId}`}
                              className="text-sm text-primary hover:underline"
                            >
                              {intern.assessmentStatus === "finalized"
                                ? "Lihat"
                                : "Nilai"}
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {!hasInterns && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada intern binaan
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
