"use client"

import AssessmentForm from "../components/assessment-form"
import type { AssessmentFormData } from "../types/assessment-form-types"

interface AssessmentFormPageProps {
  data: AssessmentFormData
}

export default function AssessmentFormPage({ data }: AssessmentFormPageProps) {
  return <AssessmentForm data={data} />
}
