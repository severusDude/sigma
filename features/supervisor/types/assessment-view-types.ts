import type { AssessmentStatus } from "./assessment-form-types"

export type AssessmentViewComponent = {
  name: string
  weight: number
  score: number | null
  notes: string | null
}

export type AssessmentViewData = {
  internProfileId: string
  internName: string
  nim: string
  institution: string
  avatarUrl: string | null
  supervisorName: string
  periodStart: Date
  periodEnd: Date
  status: AssessmentStatus | null
  finalScore: number | null
  predikat: string
  grade: string
  finalizedAt: Date | null
  finalizedBy: string | null
  components: AssessmentViewComponent[]
  assessmentId: string | null
}

export function getPredikat(score: number | null): string {
  if (score === null) return "—"
  if (score >= 81) return "Sangat Baik"
  if (score >= 61) return "Baik"
  if (score >= 41) return "Cukup"
  if (score >= 21) return "Kurang"
  return "Sangat Kurang"
}

export function getGrade(score: number | null): string {
  if (score === null) return "—"
  if (score >= 81) return "A"
  if (score >= 61) return "B"
  if (score >= 41) return "C"
  if (score >= 21) return "D"
  return "E"
}
