import { requireAuth } from "@/helpers/guard"
import { Role } from "@/generated/prisma/enums"
import { fetchAssessmentsForHR, fetchSupervisorOptions } from "@/features/hr/data/assessment-data"
import AssessmentPage from "@/features/hr/pages/assessment-page"

export default async function Page() {
  await requireAuth([Role.admin, Role.hr])

  const [initialData, supervisorOptions] = await Promise.all([
    fetchAssessmentsForHR({}),
    fetchSupervisorOptions(),
  ])

  return (
    <AssessmentPage
      initialData={initialData}
      supervisorOptions={supervisorOptions}
    />
  )
}
