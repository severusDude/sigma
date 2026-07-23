"use client"

import AssessmentView from "../components/assessment-view"
import type { AssessmentViewData } from "../types/assessment-view-types"

interface AssessmentViewPageProps {
  data: AssessmentViewData
}

export default function AssessmentViewPage({ data }: AssessmentViewPageProps) {
  return <AssessmentView data={data} />
}
