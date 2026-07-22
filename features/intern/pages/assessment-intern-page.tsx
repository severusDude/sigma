"use client"

import AssessmentView from "../components/assessment-view"
import type { AssessmentViewData } from "@/features/supervisor/types/assessment-view-types"

interface AssessmentInternPageProps {
  data: AssessmentViewData
}

export default function AssessmentInternPage({ data }: AssessmentInternPageProps) {
  return <AssessmentView data={data} />
}
