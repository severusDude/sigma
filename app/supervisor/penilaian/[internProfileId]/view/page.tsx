import type { Metadata } from "next"
import { requireAuth } from "@/helpers/guard"
import { Role } from "@/generated/prisma/enums"
import { fetchSupervisorProfileId } from "@/features/supervisor/data/assessment-data"
import { fetchAssessmentViewData } from "@/features/supervisor/data/assessment-view-data"
import AssessmentViewPage from "@/features/supervisor/pages/assessment-view-page"

export const metadata: Metadata = {
  title: "Lihat Penilaian Intern",
  robots: { index: false, follow: false },
};

export default async function Page({
  params,
}: {
  params: Promise<{ internProfileId: string }>
}) {
  const { user } = await requireAuth([Role.admin, Role.supervisor])
  const { internProfileId } = await params

  const supervisorProfileId = await fetchSupervisorProfileId(user.id)

  if (!supervisorProfileId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">Profil supervisor tidak ditemukan.</p>
      </div>
    )
  }

  const data = await fetchAssessmentViewData(supervisorProfileId, internProfileId)

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">Intern tidak ditemukan atau bukan bimbingan Anda.</p>
      </div>
    )
  }

  return <AssessmentViewPage data={data} />
}
