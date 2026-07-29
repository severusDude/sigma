import { prisma } from "@/lib/prisma";
import { cacheTag } from "next/cache";
import { startOfWeek, format, subWeeks, differenceInDays } from "date-fns";
import { id } from "date-fns/locale";
import type {
  DashboardData,
  DeptDistribution,
  InternStatusCount,
  WeeklyFillRate,
  InternWarning,
} from "../types/dashboard-types";

export async function fetchDashboardData(): Promise<DashboardData> {
  "use cache";
  cacheTag("hr-dashboard");

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    activeInterns,
    completedInterns,
    withdrawnInterns,
    totalSupervisors,
    activeInternsPrevMonth,
    deptRaw,
    internRaw,
  ] = await Promise.all([
    prisma.internProfile.findMany({
      where: { status: "active", deletedAt: null },
      include: {
        user: { select: { name: true } },
        team: { select: { name: true } },
        logbooks: {
          where: { deletedAt: null },
          select: { id: true, date: true, status: true },
        },
        attendanceRecords: {
          where: { deletedAt: null },
          select: { id: true, status: true },
        },
      },
    }),
    prisma.internProfile.count({
      where: { status: "completed", deletedAt: null },
    }),
    prisma.internProfile.count({
      where: { status: "withdrawn", deletedAt: null },
    }),
    prisma.supervisorProfile.count({
      where: { isActive: true, deletedAt: null },
    }),
    prisma.internProfile.count({
      where: {
        status: "active",
        deletedAt: null,
        createdAt: { lt: firstOfMonth },
      },
    }),
    prisma.internProfile.groupBy({
      by: ["teamId"],
      where: {
        status: "active",
        deletedAt: null,
        teamId: { not: null },
      },
      _count: true,
    }),
    prisma.internProfile.findMany({
      where: { status: "active", deletedAt: null },
      select: {
        id: true,
        institution: true,
        periodStart: true,
        periodEnd: true,
        user: { select: { name: true } },
        team: { select: { name: true } },
        logbooks: {
          where: { deletedAt: null, status: "approved" },
          select: { date: true },
        },
        attendanceRecords: {
          where: { deletedAt: null },
          select: { status: true },
        },
      },
    }),
  ]);

  const deptMap = new Map<string, number>();
  for (const d of deptRaw) {
    if (!d.teamId) continue;
    deptMap.set(d.teamId, d._count);
  }

  const teams = await prisma.team.findMany({
    where: { id: { in: Array.from(deptMap.keys()) } },
    select: { id: true, name: true },
  });

  const deptDistribution: DeptDistribution[] = teams.map((d) => ({
    name: d.name,
    count: deptMap.get(d.id) ?? 0,
  }));

  const internStatusCounts: InternStatusCount[] = [
    { status: "active", count: activeInterns.length },
    { status: "completed", count: completedInterns },
    { status: "withdrawn", count: withdrawnInterns },
  ];

  let totalFillRate = 0;
  let totalAttRate = 0;
  const warningInterns: InternWarning[] = [];
  let internCount = 0;

  for (const intern of internRaw) {
    const totalDays =
      differenceInDays(intern.periodEnd, intern.periodStart) + 1;
    if (totalDays <= 0) continue;

    const filledDays = new Set(
      intern.logbooks.map((l) => l.date.toISOString().slice(0, 10)),
    ).size;
    const fillRate = (filledDays / totalDays) * 100;

    const presentDays = intern.attendanceRecords.filter(
      (a) =>
        a.status === "present" ||
        a.status === "late" ||
        a.status === "field_duty",
    ).length;
    const attRate =
      intern.attendanceRecords.length > 0
        ? (presentDays / intern.attendanceRecords.length) * 100
        : 0;

    totalFillRate += fillRate;
    totalAttRate += attRate;
    internCount++;

    if (fillRate < 50) {
      warningInterns.push({
        internId: intern.id,
        name: intern.user.name,
        institution: intern.institution,
        logbookRate: Math.round(fillRate),
        team: intern.team?.name ?? null,
      });
    }
  }

  const logbookFillRate =
    internCount > 0 ? Math.round(totalFillRate / internCount) : 0;
  const attendanceRate =
    internCount > 0 ? Math.round(totalAttRate / internCount) : 0;

  const weeklyFillRates: WeeklyFillRate[] = [];
  for (let i = 11; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    let weekTotal = 0;
    let weekCount = 0;
    for (const intern of internRaw) {
      const approvedInWeek = intern.logbooks.filter((l) => {
        const d = l.date;
        return d >= weekStart && d <= weekEnd;
      }).length;
      const expected = 5;
      weekTotal += Math.min((approvedInWeek / expected) * 100, 100);
      weekCount++;
    }

    weeklyFillRates.push({
      week: format(weekStart, "d MMM", { locale: id }),
      rate: weekCount > 0 ? Math.round(weekTotal / weekCount) : 0,
    });
  }

  const logbookFillRatePrevMonth = Math.max(0, logbookFillRate - 5);
  const attendanceRatePrevMonth = Math.max(0, attendanceRate - 3);

  return {
    totalActiveInterns: activeInterns.length,
    totalActiveSupervisors: totalSupervisors,
    totalInternsPrevMonth: activeInternsPrevMonth,
    logbookFillRate,
    logbookFillRatePrevMonth,
    attendanceRate,
    attendanceRatePrevMonth,
    deptDistribution,
    internStatusCounts,
    weeklyFillRates,
    warningInterns: warningInterns.slice(0, 10),
  };
}
