"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { updateTag } from "next/cache"

import { requirePermission } from "@/lib/auth/authorize"
import type { ActionResponse } from "@/lib/types"

import { createOrUpdateAssessmentSchema, submitAssessmentSchema } from "../schemas/assessment-form-schemas"
import type { CreateOrUpdateAssessmentInput } from "../schemas/assessment-form-schemas"

export async function createOrUpdateAssessment(
  input: CreateOrUpdateAssessmentInput,
): Promise<ActionResponse<{ assessmentId: string }>> {
  try {
    await requirePermission({ assessment: ["create", "update"] })

    const parsed = createOrUpdateAssessmentSchema.parse(input)

    const session = await auth.api.getSession({ headers: await headers() })
    const supervisor = await prisma.supervisorProfile.findUnique({
      where: { userId: session!.user.id },
    })
    if (!supervisor) return { success: false, error: "Profil supervisor tidak ditemukan" }

    const assignment = await prisma.internSupervisor.findFirst({
      where: {
        supervisorProfileId: supervisor.id,
        internProfileId: parsed.internProfileId,
        endedAt: null,
      },
    })
    if (!assignment) return { success: false, error: "Anda tidak membimbing intern ini" }

    const existingAssessment = await prisma.assessment.findFirst({
      where: {
        internProfileId: parsed.internProfileId,
        supervisorProfileId: supervisor.id,
        status: "draft",
      },
      include: { components: true },
    })

    if (existingAssessment) {
      for (const comp of parsed.components) {
        const existing = existingAssessment.components.find((c) => c.name === comp.name)
        if (existing) {
          await prisma.assessmentComponent.update({
            where: { id: existing.id },
            data: {
              score: comp.score,
              notes: comp.notes ?? null,
            },
          })
        } else {
          await prisma.assessmentComponent.create({
            data: {
              assessmentId: existingAssessment.id,
              name: comp.name,
              weight: comp.weight,
              score: comp.score,
              notes: comp.notes ?? null,
            },
          })
        }
      }

      updateTag(`assessment-form-${parsed.internProfileId}`)
      updateTag(`assessment-list-${supervisor.id}`)

      return { success: true, data: { assessmentId: existingAssessment.id } }
    }

    const assessment = await prisma.assessment.create({
      data: {
        internProfileId: parsed.internProfileId,
        supervisorProfileId: supervisor.id,
        periodStart: new Date(),
        periodEnd: new Date(),
        status: "draft",
        components: {
          create: parsed.components.map((c) => ({
            name: c.name,
            weight: c.weight,
            score: c.score,
            notes: c.notes ?? null,
          })),
        },
      },
    })

    updateTag(`assessment-form-${parsed.internProfileId}`)
    updateTag(`assessment-list-${supervisor.id}`)

    return { success: true, data: { assessmentId: assessment.id } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menyimpan penilaian",
    }
  }
}

export async function submitAssessment(
  assessmentId: string,
): Promise<ActionResponse<void>> {
  try {
    await requirePermission({ assessment: ["update"] })

    const session = await auth.api.getSession({ headers: await headers() })
    const supervisor = await prisma.supervisorProfile.findUnique({
      where: { userId: session!.user.id },
    })
    if (!supervisor) return { success: false, error: "Profil supervisor tidak ditemukan" }

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { components: true },
    })

    if (!assessment) return { success: false, error: "Penilaian tidak ditemukan" }
    if (assessment.supervisorProfileId !== supervisor.id) {
      return { success: false, error: "Anda tidak memiliki akses ke penilaian ini" }
    }
    if (assessment.status !== "draft") {
      return { success: false, error: "Penilaian sudah tidak dalam status draft" }
    }

    const allFilled = assessment.components.every((c) => c.score !== null)
    if (!allFilled) {
      return { success: false, error: "Semua komponen wajib diisi sebelum submit" }
    }

    const totalWeight = assessment.components.reduce((sum, c) => sum + c.weight, 0)
    const finalScore =
      totalWeight > 0
        ? assessment.components.reduce((sum, c) => sum + (c.score ?? 0) * c.weight, 0) / totalWeight
        : 0

    await prisma.assessment.update({
      where: { id: assessmentId },
      data: {
        status: "submitted",
        finalScore: Math.round(finalScore * 10) / 10,
      },
    })

    const assignment = await prisma.internSupervisor.findFirst({
      where: { supervisorProfileId: supervisor.id, internProfileId: assessment.internProfileId },
    })

    if (assignment) {
      updateTag(`assessment-form-${assessment.internProfileId}`)
      updateTag(`assessment-list-${supervisor.id}`)
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal submit penilaian",
    }
  }
}
