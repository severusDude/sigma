import { prisma } from "@/lib/prisma"
import { cacheTag } from "next/cache"

import type { AssessmentViewData } from "../types/assessment-view-types"
import { getPredikat, getGrade } from "../types/assessment-view-types"

async function resolveFinalizedByName(id: string | null): Promise<string | null> {
  if (!id) return null

  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true },
  })

  return user?.name ?? id
}

export async function fetchAssessmentViewData(
  supervisorProfileId: string,
  internProfileId: string,
): Promise<AssessmentViewData | null> {
  "use cache"
  cacheTag(`assessment-view-${internProfileId}`)

  const assignment = await prisma.internSupervisor.findFirst({
    where: {
      supervisorProfileId,
      internProfileId,
      endedAt: null,
      internProfile: { deletedAt: null },
    },
    include: {
      internProfile: {
        include: {
          user: true,
          assessments: {
            orderBy: { updatedAt: "desc" },
            take: 1,
            include: { components: true },
          },
        },
      },
      supervisorProfile: {
        include: { user: true },
      },
    },
  })

  if (!assignment) return null

  const intern = assignment.internProfile
  const assessment = intern.assessments[0] ?? null

  return {
    internProfileId: intern.id,
    internName: intern.user.name,
    nim: intern.nik,
    institution: intern.institution,
    avatarUrl: intern.user.image,
    supervisorName: assignment.supervisorProfile.user.name,
    periodStart: intern.periodStart,
    periodEnd: intern.periodEnd,
    status: (assessment?.status ?? null) as AssessmentViewData["status"],
    finalScore: assessment?.finalScore ?? null,
    predikat: getPredikat(assessment?.finalScore ?? null),
    grade: getGrade(assessment?.finalScore ?? null),
    finalizedAt: assessment?.finalizedAt ?? null,
    finalizedBy: await resolveFinalizedByName(assessment?.finalizedBy ?? null),
    assessmentId: assessment?.id ?? null,
    components: (assessment?.components ?? []).map((c) => ({
      name: c.name,
      weight: c.weight,
      score: c.score,
      notes: c.notes,
    })),
  }
}
