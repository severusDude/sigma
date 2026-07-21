import { prisma } from "@/lib/prisma";
import { cacheTag } from "next/cache";

import { assessmentInclude } from "../types/assessment-types";
import type { HrAssessmentListItem, HrAssessmentDetail } from "../types/assessment-types";

export async function fetchAssessmentsForHR(input: {
  status?: string;
  supervisorId?: string;
  search?: string;
}) {
  "use cache";
  cacheTag("hr-assessments");

  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (input.status && input.status !== "all") {
    where.status = input.status;
  }

  if (input.supervisorId) {
    where.supervisorProfileId = input.supervisorId;
  }

  const assessments = await prisma.assessment.findMany({
    where,
    include: assessmentInclude,
    orderBy: { updatedAt: "desc" },
  });

  let items: HrAssessmentListItem[] = assessments.map((a) => {
    const internUser = a.internProfile.user;
    const supervisorUser = a.supervisor.user;

    return {
      assessmentId: a.id,
      internName: internUser.name,
      internNim: a.internProfile.nik,
      institution: a.internProfile.institution,
      supervisorName: supervisorUser.name,
      supervisorNip: a.supervisor.nip,
      status: a.status,
      periodStart: a.periodStart,
      periodEnd: a.periodEnd,
      finalScore: a.finalScore,
      finalGrade: a.finalGrade,
    };
  });

  if (input.search) {
    const q = input.search.toLowerCase();
    items = items.filter(
      (i) =>
        i.internName.toLowerCase().includes(q) ||
        i.supervisorName.toLowerCase().includes(q),
    );
  }

  return items;
}

export async function fetchAssessmentDetail(assessmentId: string) {
  "use cache";
  cacheTag(`hr-assessment-${assessmentId}`);

  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: assessmentInclude,
  });

  if (!assessment) return null;

  const internUser = assessment.internProfile.user;
  const supervisorUser = assessment.supervisor.user;

  const detail: HrAssessmentDetail = {
    assessmentId: assessment.id,
    internProfileId: assessment.internProfileId,
    internName: internUser.name,
    internNim: assessment.internProfile.nik,
    institution: assessment.internProfile.institution,
    supervisorName: supervisorUser.name,
    supervisorNip: assessment.supervisor.nip,
    supervisorField: assessment.supervisor.field,
    periodStart: assessment.periodStart,
    periodEnd: assessment.periodEnd,
    status: assessment.status,
    finalScore: assessment.finalScore,
    finalGrade: assessment.finalGrade,
    finalizedAt: assessment.finalizedAt,
    finalizedBy: assessment.finalizedBy,
    components: assessment.components.map((c) => ({
      name: c.name,
      weight: c.weight,
      score: c.score,
      notes: c.notes,
    })),
  };

  return detail;
}

export async function fetchSupervisorOptions() {
  "use cache";
  cacheTag("supervisor-options");

  const supervisors = await prisma.supervisorProfile.findMany({
    where: { deletedAt: null, isActive: true },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  return supervisors.map((s) => ({
    id: s.id,
    name: s.user.name,
    nip: s.nip,
  }));
}
