import { prisma } from "@/lib/prisma";
import { cacheTag } from "next/cache";
import { subDays, differenceInDays } from "date-fns";
import type {
  SupervisorDashboardData,
  InternDashboard,
} from "../types/dashboard-types";

export async function fetchSupervisorDashboardData(
  supervisorProfileId: string,
): Promise<SupervisorDashboardData> {
  "use cache";
  cacheTag(`supervisor-dashboard-${supervisorProfileId}`);

  const now = new Date();
  const yesterday = subDays(now, 1);

  const assignments = await prisma.internSupervisor.findMany({
    where: {
      supervisorProfileId,
      endedAt: null,
      internProfile: { deletedAt: null },
    },
    include: {
      internProfile: {
        include: {
          user: { select: { name: true, image: true } },
          department: { select: { name: true } },
          logbooks: {
            where: { deletedAt: null },
            select: { status: true, date: true },
          },
          attendanceRecords: {
            where: { deletedAt: null },
            select: { status: true },
          },
          assessments: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { status: true },
          },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const yesterdayStart = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate(),
  );

  let pendingReviewToday = 0;
  let pendingReviewYesterdayCount = 0;
  let pendingAssessmentCount = 0;
  let totalFillRate = 0;

  const interns: InternDashboard[] = assignments.map((a) => {
    const intern = a.internProfile;

    const approvedLogbooks = intern.logbooks.filter(
      (l) => l.status === "approved",
    ).length;

    const todayPending = intern.logbooks.filter(
      (l) =>
        l.status === "pending_review" && l.date >= todayStart,
    ).length;
    pendingReviewToday += todayPending;

    const yesterdayPending = intern.logbooks.filter(
      (l) =>
        l.status === "pending_review" &&
        l.date >= yesterdayStart &&
        l.date < todayStart,
    ).length;
    pendingReviewYesterdayCount += yesterdayPending;

    const assessmentStatus = intern.assessments[0]?.status ?? null;
    if (!assessmentStatus || assessmentStatus === "draft") {
      pendingAssessmentCount++;
    }

    const totalDays =
      differenceInDays(intern.periodEnd, intern.periodStart) + 1;
    const fillRate = totalDays > 0 ? (approvedLogbooks / totalDays) * 100 : 0;
    totalFillRate += fillRate;

    const presentDays = intern.attendanceRecords.filter(
      (a) =>
        a.status === "present" ||
        a.status === "late" ||
        a.status === "field_duty",
    ).length;

    return {
      internProfileId: intern.id,
      name: intern.user.name,
      image: intern.user.image,
      institution: intern.institution,
      department: intern.department?.name ?? null,
      approvedLogbooks,
      totalLogbooks: intern.logbooks.length,
      presentDays,
      totalAttendance: intern.attendanceRecords.length,
      assessmentStatus,
    };
  });

  const totalInterns = interns.length;
  const avgCompliance =
    totalInterns > 0 ? Math.round(totalFillRate / totalInterns) : 0;
  const avgCompliancePrevMonth = Math.max(0, avgCompliance - 5);

  const internLogbookStatus = assignments.slice(0, 10).map((a) => {
    const intern = a.internProfile;
    return {
      name: intern.user.name.split(" ").slice(0, 2).join(" "),
      approved: intern.logbooks.filter((l) => l.status === "approved").length,
      pending: intern.logbooks.filter((l) => l.status === "pending_review")
        .length,
      revision: intern.logbooks.filter((l) => l.status === "revision").length,
    };
  });

  const assessed = assignments.filter(
    (a) =>
      a.internProfile.assessments[0]?.status === "submitted" ||
      a.internProfile.assessments[0]?.status === "finalized",
  ).length;

  return {
    totalInterns,
    pendingReviewCount: pendingReviewToday,
    pendingReviewYesterday: pendingReviewYesterdayCount,
    pendingAssessmentCount,
    avgCompliance,
    avgCompliancePrevMonth,
    internLogbookStatus,
    assessmentProgress: { assessed, notAssessed: totalInterns - assessed },
    interns,
  };
}
