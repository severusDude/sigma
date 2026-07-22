import { prisma } from "@/lib/prisma"
import { cacheTag } from "next/cache"

import type { AssessmentFormData, ComponentFormValue, AssessmentStatus } from "../types/assessment-form-types"
import { DEFAULT_COMPONENTS } from "../types/assessment-form-types"

export async function fetchAssessmentFormData(
  supervisorProfileId: string,
  internProfileId: string,
): Promise<AssessmentFormData | null> {
  "use cache"
  cacheTag(`assessment-form-${internProfileId}`)

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
          department: true,
          assessments: {
            orderBy: { updatedAt: "desc" },
            take: 1,
            include: { components: true },
          },
        },
      },
    },
  })

  if (!assignment) return null

  const intern = assignment.internProfile
  const existingAssessment = intern.assessments[0] ?? null

  let components: ComponentFormValue[]

  if (existingAssessment && existingAssessment.components.length > 0) {
    components = existingAssessment.components.map((c) => ({
      name: c.name,
      weight: c.weight,
      score: c.score,
      notes: c.notes ?? "",
    }))
  } else {
    components = DEFAULT_COMPONENTS.map((c) => ({
      name: c.name,
      weight: c.weight,
      score: null,
      notes: "",
    }))
  }

  return {
    internProfileId: intern.id,
    internName: intern.user.name,
    nim: intern.nik,
    institution: intern.institution,
    avatarUrl: intern.user.image,
    periodStart: intern.periodStart,
    periodEnd: intern.periodEnd,
    assessmentId: existingAssessment?.id ?? null,
    status: (existingAssessment?.status as AssessmentStatus | null) ?? null,
    lastModified: existingAssessment?.updatedAt ?? null,
    components,
  }
}
