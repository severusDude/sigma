import { requireAuth } from "@/helpers/guard"
import { Role } from "@/generated/prisma/enums"
import { fetchAssessmentsForHR } from "@/features/hr/data/assessment-data"
import AssessmentPage from "@/features/hr/pages/assessment-page"

export default async function Page() {
  await requireAuth([Role.admin, Role.hr])

  const initialData = await fetchAssessmentsForHR({ internStatus: "active" })

  return (
    <AssessmentPage
      initialData={initialData}
    />
  )
}
