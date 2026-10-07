import { prisma } from "@/lib/prisma";
import { cacheTag } from "next/cache";
import type {
  SupervisedIntern,
  SupervisedInternList,
} from "../types/intern-types";

interface AssignmentRow {
  endedAt: Date | null;
  internProfile: {
    id: string;
    nik: string;
    institution: string;
    periodStart: Date;
    periodEnd: Date;
    status: SupervisedIntern["internStatus"];
    user: { name: string; image: string | null };
    team: { name: string } | null;
    logbooks: { status: string }[];
    attendanceRecords: { status: string }[];
    assessments: { status: string }[];
  };
}

const PRESENT_STATUSES = new Set(["present", "late", "field_duty"]);

// Fungsi murni (testable): agregat + split aktif vs riwayat.
export function groupSupervisedInterns(
  assignments: AssignmentRow[],
): SupervisedInternList {
  const active: SupervisedIntern[] = [];
  const history: SupervisedIntern[] = [];

  for (const a of assignments) {
    const intern = a.internProfile;
    const item: SupervisedIntern = {
      internProfileId: intern.id,
      name: intern.user.name,
      image: intern.user.image,
      nik: intern.nik,
      institution: intern.institution,
      team: intern.team?.name ?? null,
      periodStart: intern.periodStart,
      periodEnd: intern.periodEnd,
      internStatus: intern.status,
      assignmentEndedAt: a.endedAt,
      approvedLogbooks: intern.logbooks.filter(
        (l) => l.status === "approved",
      ).length,
      totalLogbooks: intern.logbooks.length,
      pendingLogbooks: intern.logbooks.filter(
        (l) => l.status === "pending_review",
      ).length,
      presentDays: intern.attendanceRecords.filter((r) =>
        PRESENT_STATUSES.has(r.status),
      ).length,
      totalAttendance: intern.attendanceRecords.length,
      assessmentStatus:
        (intern.assessments[0]?.status as SupervisedIntern["assessmentStatus"]) ??
        null,
    };

    if (a.endedAt) {
      history.push(item);
    } else {
      active.push(item);
    }
  }

  return { active, history };
}

export async function fetchSupervisorInterns(
  supervisorProfileId: string,
): Promise<SupervisedInternList> {
  "use cache";
  cacheTag(`supervisor-interns-${supervisorProfileId}`);

  const assignments = await prisma.internSupervisor.findMany({
    where: {
      supervisorProfileId,
      internProfile: { deletedAt: null },
    },
    include: {
      internProfile: {
        include: {
          user: { select: { name: true, image: true } },
          team: { select: { name: true } },
          logbooks: {
            where: { deletedAt: null },
            select: { status: true },
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

  return groupSupervisedInterns(assignments);
}
