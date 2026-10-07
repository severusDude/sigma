import { prisma } from "@/lib/prisma";
import { cacheTag } from "next/cache";
import { differenceInDays, startOfWeek, format, subWeeks } from "date-fns";
import { id } from "date-fns/locale";
import type { InternDashboardData } from "../types/dashboard-types";

export async function fetchInternDashboardData(
  userId: string,
): Promise<InternDashboardData | null> {
  "use cache";
  cacheTag(`intern-dashboard-${userId}`);

  const profile = await prisma.internProfile.findUnique({
    where: { userId, deletedAt: null },
    include: {
      user: { select: { name: true } },
      team: { select: { name: true } },
      supervisorAssignments: {
        where: { endedAt: null },
        include: {
          supervisorProfile: {
            include: { user: { select: { name: true } } },
          },
        },
      },
      logbooks: {
        where: { deletedAt: null },
        orderBy: { date: "desc" },
        select: { id: true, date: true, status: true, activity: true },
      },
      attendanceRecords: {
        where: { deletedAt: null },
        select: { status: true },
      },
      assessments: {
        where: { status: "finalized" },
        include: { components: { select: { score: true } } },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!profile) return null;

  const now = new Date();
  const totalDays =
    differenceInDays(profile.periodEnd, profile.periodStart) + 1;
  const elapsedDays = differenceInDays(now, profile.periodStart) + 1;
  const activeDay = Math.max(1, Math.min(elapsedDays, totalDays));

  const filledDates = new Set(
    profile.logbooks.map((l) => l.date.toISOString().slice(0, 10)),
  ).size;

  const presentCount = profile.attendanceRecords.filter(
    (a) =>
      a.status === "present" ||
      a.status === "late" ||
      a.status === "field_duty",
  ).length;

  const assessment = profile.assessments[0];
  const avgScore = assessment?.components.length
    ? Math.round(
        assessment.components.reduce(
          (s, c) => s + (c.score ?? 0),
          0,
        ) / assessment.components.length,
      )
    : null;
  const avgGrade =
    avgScore !== null
      ? avgScore >= 81
        ? "Sangat Baik"
        : avgScore >= 61
          ? "Baik"
          : avgScore >= 41
            ? "Cukup"
            : avgScore >= 21
              ? "Kurang"
              : "Sangat Kurang"
      : null;

  const prevWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const prevWeekFilled = profile.logbooks.filter(
    (l) => l.date >= prevWeekStart && l.date < thisWeekStart,
  ).length;
  const thisWeekFilled = profile.logbooks.filter(
    (l) => l.date >= thisWeekStart,
  ).length;
  const logbookTrend =
    prevWeekFilled > 0
      ? Math.round(
          ((thisWeekFilled - prevWeekFilled) / prevWeekFilled) * 100,
        )
      : thisWeekFilled > 0
        ? 100
        : 0;

  const attTrend = presentCount;

  const weeklyLogbooks = [];
  for (let i = 11; i >= 0; i--) {
    const ws = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
    const we = new Date(ws);
    we.setDate(we.getDate() + 6);
    const entries = profile.logbooks.filter(
      (l) => l.date >= ws && l.date <= we,
    );
    weeklyLogbooks.push({
      week: format(ws, "d MMM", { locale: id }),
      approved: entries.filter((l) => l.status === "approved").length,
      pending: entries.filter((l) => l.status === "pending_review").length,
      revision: entries.filter((l) => l.status === "revision").length,
    });
  }

  const supervisor =
    profile.supervisorAssignments[0]?.supervisorProfile;

  return {
    name: profile.user.name,
    status: profile.status,
    periodStart: profile.periodStart.toISOString(),
    periodEnd: profile.periodEnd.toISOString(),
    activeDay,
    totalDays,
    logbookFilled: filledDates,
    logbookTotal: activeDay,
    logbookTrend,
    attendancePresent: presentCount,
    attendanceTotal: profile.attendanceRecords.length,
    attendanceTrend: attTrend,
    avgScore,
    avgGrade,
    supervisorName: supervisor?.user.name ?? null,
    supervisorNip: supervisor?.nip ?? null,
    teamName: profile.team?.name ?? null,
    weeklyLogbooks,
    recentActivity: profile.logbooks.slice(0, 10).map((l) => ({
      date: l.date.toISOString(),
      activity: l.activity,
      status: l.status,
    })),
  };
}
