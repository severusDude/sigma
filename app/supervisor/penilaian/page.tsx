import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/helpers/guard"
import { Role } from "@/generated/prisma/enums"
import AssessmentPage from "@/features/supervisor/pages/assessment-page"
import {
  fetchSupervisorProfileId,
  fetchAssessmentList,
  fetchAssessmentPeriod,
} from "@/features/supervisor/data/assessment-data"

export default async function Page() {
  const { user } = await requireAuth([Role.admin, Role.supervisor])

  const supervisorProfileId = await fetchSupervisorProfileId(user.id)

  if (!supervisorProfileId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Profil supervisor tidak ditemukan.
        </p>
      </div>
    )
  }

  const [initialData, assessmentPeriod] = await Promise.all([
    fetchAssessmentList(supervisorProfileId),
    fetchAssessmentPeriod(supervisorProfileId),
  ])

  return (
    <AssessmentPage
      supervisorProfileId={supervisorProfileId}
      initialData={initialData}
      assessmentPeriod={assessmentPeriod}
    />
  )
}
