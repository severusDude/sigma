import { prisma } from "@/lib/prisma"
import { cacheTag } from "next/cache"

import type { AssessmentListItem, AssessmentListResponse, AssessmentPeriod } from "../types/assessment-types"

const ITEMS_PER_PAGE = 9

export async function fetchSupervisorProfileId(userId: string): Promise<string | null> {
  "use cache"
  cacheTag(`supervisor-profile-${userId}`)

  const profile = await prisma.supervisorProfile.findUnique({
    where: { userId },
    select: { id: true },
  })

  return profile?.id ?? null
}

export async function fetchAssessmentList(
  supervisorProfileId: string,
  page: number = 1,
  search?: string,
  status?: string,
): Promise<AssessmentListResponse> {
  "use cache"
  cacheTag(`assessment-list-${supervisorProfileId}`)

  const assignments = await prisma.internSupervisor.findMany({
    where: {
      supervisorProfileId,
      endedAt: null,
      internProfile: { deletedAt: null },
    },
    include: {
      internProfile: {
        include: {
          user: true,
          department: true,
          assessments: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { components: true },
          },
          logbooks: {
            where: { deletedAt: null },
            select: { status: true },
          },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  })

  let items: AssessmentListItem[] = assignments.map((a) => {
    const intern = a.internProfile
    const latestAssessment = intern.assessments[0] ?? null

    const totalLogbooks = intern.logbooks.length
    const approvedLogbooks = intern.logbooks.filter((l) => l.status === "approved").length
    const logbookProgress = totalLogbooks > 0 ? Math.round((approvedLogbooks / totalLogbooks) * 100) : 0

    const totalComponents = latestAssessment?.components.length ?? 0
    const filledComponents = latestAssessment?.components.filter((c) => c.score !== null).length ?? 0
    const assessmentProgress = totalComponents > 0 ? Math.round((filledComponents / totalComponents) * 100) : 0

    return {
      internProfileId: intern.id,
      internName: intern.user.name,
      photoUrl: intern.user.image,
      nim: intern.nik,
      institution: intern.institution,
      divisionName: intern.department?.name ?? null,
      periodStart: intern.periodStart,
      periodEnd: intern.periodEnd,
      logbookProgress,
      assessmentProgress,
      assessmentId: latestAssessment?.id ?? null,
      assessmentStatus: latestAssessment?.status ?? null,
    }
  })

  if (search) {
    const q = search.toLowerCase()
    items = items.filter(
      (i) =>
        i.internName.toLowerCase().includes(q) ||
        i.nim.toLowerCase().includes(q),
    )
  }

  if (status) {
    if (status === "belum_dinilai") {
      items = items.filter((i) => i.assessmentStatus === null)
    } else {
      items = items.filter((i) => i.assessmentStatus === status)
    }
  }

  const total = items.length
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)
  const skip = (page - 1) * ITEMS_PER_PAGE
  const pagedItems = items.slice(skip, skip + ITEMS_PER_PAGE)

  return {
    items: pagedItems,
    total,
    page,
    totalPages,
  }
}

export async function fetchAssessmentPeriod(supervisorProfileId: string): Promise<AssessmentPeriod | null> {
  "use cache"
  cacheTag(`assessment-period-${supervisorProfileId}`)

  // Prioritaskan dari SystemConfig
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: { in: ["assessment_period_start", "assessment_period_end", "assessment_deadline"] },
    },
  })

  const configMap = new Map(configs.map((c) => [c.key, c.value]))

  const cfgStart = configMap.get("assessment_period_start")
  const cfgEnd = configMap.get("assessment_period_end")
  const cfgDeadline = configMap.get("assessment_deadline")

  if (cfgStart && cfgEnd && cfgDeadline) {
    return {
      periodStart: new Date(cfgStart),
      periodEnd: new Date(cfgEnd),
      deadline: new Date(cfgDeadline),
    }
  }

  // Fallback: derivasi dari InternProfile milik supervisor ini
  const interns = await prisma.internSupervisor.findMany({
    where: {
      supervisorProfileId,
      endedAt: null,
      internProfile: { deletedAt: null },
    },
    select: {
      internProfile: {
        select: {
          periodStart: true,
          periodEnd: true,
        },
      },
    },
  })

  if (interns.length === 0) return null

  let earliestStart: Date | null = null
  let latestEnd: Date | null = null

  for (const { internProfile } of interns) {
    if (!earliestStart || internProfile.periodStart < earliestStart) {
      earliestStart = internProfile.periodStart
    }
    if (!latestEnd || internProfile.periodEnd > latestEnd) {
      latestEnd = internProfile.periodEnd
    }
  }

  if (earliestStart && latestEnd) {
    return {
      periodStart: earliestStart,
      periodEnd: latestEnd,
      deadline: latestEnd,
    }
  }

  return null
}
