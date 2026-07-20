export type ComponentFormValue = {
  name: string
  weight: number
  score: number | null
  notes: string
}

export type AssessmentStatus = "draft" | "submitted" | "finalized"

export type AssessmentFormData = {
  internProfileId: string
  internName: string
  nim: string
  institution: string
  avatarUrl: string | null
  periodStart: Date
  periodEnd: Date
  assessmentId: string | null
  status: AssessmentStatus | null
  lastModified: Date | null
  components: ComponentFormValue[]
}

export const DEFAULT_COMPONENTS = [
  { name: "Disiplin & Kehadiran", weight: 20 },
  { name: "Kualitas Kerja", weight: 20 },
  { name: "Inisiatif & Proaktif", weight: 20 },
  { name: "Kerjasama Tim", weight: 20 },
  { name: "Penguasaan Tugas", weight: 20 },
] as const
