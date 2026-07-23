"use server"

import { requirePermission } from "@/lib/auth/authorize"
import type { ActionResponse } from "@/lib/types"
import type { AssessmentListResponse, AssessmentPeriod } from "../types/assessment-types"
import { getAssessmentListSchema } from "../schemas/assessment-schemas"
import { fetchAssessmentList, fetchAssessmentPeriod } from "../data/assessment-data"

export async function getSupervisorAssessmentList(
  input: {
    supervisorProfileId: string
    page?: number
    search?: string
    status?: string
  },
): Promise<ActionResponse<AssessmentListResponse>> {
  try {
    await requirePermission({ assessment: ["read"] })

    const parsed = getAssessmentListSchema.parse({
      supervisorProfileId: input.supervisorProfileId,
      page: input.page ?? 1,
      search: input.search,
      status: input.status,
    })

    const result = await fetchAssessmentList(
      parsed.supervisorProfileId,
      parsed.page,
      parsed.search,
      parsed.status,
    )

    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengambil data penilaian",
    }
  }
}

export async function getAssessmentPeriod(
  supervisorProfileId: string,
): Promise<ActionResponse<AssessmentPeriod | null>> {
  try {
    await requirePermission({ assessment: ["read"] })

    const period = await fetchAssessmentPeriod(supervisorProfileId)

    return { success: true, data: period }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengambil periode penilaian",
    }
  }
}
