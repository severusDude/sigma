export type AssessmentListItem = {
  internProfileId: string
  internName: string
  photoUrl: string | null
  nim: string
  institution: string
  divisionName: string | null
  periodStart: Date
  periodEnd: Date
  logbookProgress: number
  assessmentProgress: number
  assessmentId: string | null
  assessmentStatus: string | null
}

export type AssessmentListResponse = {
  items: AssessmentListItem[]
  total: number
  page: number
  totalPages: number
}

export type AssessmentPeriod = {
  periodStart: Date
  periodEnd: Date
  deadline: Date
}
