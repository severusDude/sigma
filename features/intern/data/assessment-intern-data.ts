import { prisma } from "@/lib/prisma"
import { cacheTag } from "next/cache"

import { getPredikat, getGrade } from "@/features/supervisor/types/assessment-view-types"
import type { AssessmentViewData } from "@/features/supervisor/types/assessment-view-types"

async function resolveFinalizedByName(id: string | null): Promise<string | null> {
  if (!id) return null

  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true },
  })

  return user?.name ?? id
}

export async function fetchInternAssessment(
  userId: string,
): Promise<AssessmentViewData | null> {
  "use cache"
  cacheTag(`intern-assessment-${userId}`)

  const internProfile = await prisma.internProfile.findUnique({
    where: { userId, deletedAt: null },
    include: {
      user: true,
      assessments: {
        where: { status: "finalized" },
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: {
          components: true,
          supervisor: { include: { user: true } },
        },
      },
    },
  })

  if (!internProfile) return null

  const assessment = internProfile.assessments[0]
  if (!assessment) return null

  return {
    internProfileId: internProfile.id,
    internName: internProfile.user.name,
    nim: internProfile.nik,
    institution: internProfile.institution,
    avatarUrl: internProfile.user.image,
    supervisorName: assessment.supervisor.user.name,
    periodStart: internProfile.periodStart,
    periodEnd: internProfile.periodEnd,
    status: "finalized",
    finalScore: assessment.finalScore,
    predikat: getPredikat(assessment.finalScore),
    grade: getGrade(assessment.finalScore),
    finalizedAt: assessment.finalizedAt,
    finalizedBy: await resolveFinalizedByName(assessment.finalizedBy),
    assessmentId: assessment.id,
    components: assessment.components.map((c) => ({
      name: c.name,
      weight: c.weight,
      score: c.score,
      notes: c.notes,
    })),
  }
}
