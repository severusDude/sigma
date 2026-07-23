"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { updateTag } from "next/cache"

import { requirePermission } from "@/lib/auth/authorize"
import type { ActionResponse } from "@/lib/types"

import { getAssessmentsSchema, finalizeAssessmentSchema } from "../schemas/assessment-schemas"
import type { GetAssessmentsInput } from "../schemas/assessment-schemas"
import { fetchAssessmentsForHR, fetchAssessmentDetail, fetchSupervisorOptions } from "../data/assessment-data"
import type { HrAssessmentListItem, HrAssessmentDetail } from "../types/assessment-types"

export async function getAssessmentsForHR(
  input: GetAssessmentsInput,
): Promise<ActionResponse<HrAssessmentListItem[]>> {
  try {
    await requirePermission({ assessment: ["read"] })

    const parsed = getAssessmentsSchema.parse(input)

    const data = await fetchAssessmentsForHR({
      status: parsed.status,
      supervisorId: parsed.supervisorId,
      search: parsed.search,
    })

    return { success: true, data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengambil data penilaian",
    }
  }
}

export async function getAssessmentDetail(
  assessmentId: string,
): Promise<ActionResponse<HrAssessmentDetail | null>> {
  try {
    await requirePermission({ assessment: ["read"] })

    const detail = await fetchAssessmentDetail(assessmentId)

    if (!detail) return { success: false, error: "Penilaian tidak ditemukan" }

    return { success: true, data: detail }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengambil detail penilaian",
    }
  }
}

export async function getSupervisorOptions(): Promise<
  ActionResponse<{ id: string; name: string; nip: string }[]>
> {
  try {
    await requirePermission({ supervisor: ["read"] })

    const options = await fetchSupervisorOptions()

    return { success: true, data: options }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengambil data supervisor",
    }
  }
}

function calculateGrade(score: number): string {
  if (score >= 85) return "A"
  if (score >= 70) return "B"
  if (score >= 55) return "C"
  if (score >= 40) return "D"
  return "E"
}

export async function finalizeAssessment(
  assessmentId: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission({ assessment: ["finalize"] })

    const session = await auth.api.getSession({ headers: await headers() })

    const parsed = finalizeAssessmentSchema.parse({ assessmentId })

    const assessment = await prisma.assessment.findUnique({
      where: { id: parsed.assessmentId },
      include: { components: true },
    })

    if (!assessment) {
      return { success: false, error: "Penilaian tidak ditemukan" }
    }

    if (assessment.status !== "submitted") {
      return { success: false, error: "Penilaian sudah tidak dalam status menunggu" }
    }

    const totalWeight = assessment.components.reduce((sum, c) => sum + c.weight, 0)
    const finalScore =
      totalWeight > 0
        ? assessment.components.reduce((sum, c) => sum + (c.score ?? 0) * c.weight, 0) / totalWeight
        : 0

    const roundedScore = Math.round(finalScore * 10) / 10
    const grade = calculateGrade(roundedScore)

    await prisma.assessment.update({
      where: { id: parsed.assessmentId },
      data: {
        status: "finalized",
        finalScore: roundedScore,
        finalGrade: grade,
        finalizedAt: new Date(),
        finalizedBy: session!.user.id,
      },
    })

    updateTag("hr-assessments")
    updateTag(`hr-assessment-${parsed.assessmentId}`)

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal finalisasi penilaian",
    }
  }
}
