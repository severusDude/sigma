import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { requireAuth } from "@/helpers/guard"
import { Role } from "@/generated/prisma/enums"
import { fetchSupervisorProfileId } from "@/features/supervisor/data/assessment-data"
import { fetchAssessmentFormData } from "@/features/supervisor/data/assessment-form-data"
import AssessmentFormPage from "@/features/supervisor/pages/assessment-form-page"

export const metadata: Metadata = {
  title: "Form Penilaian Intern",
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

  const data = await fetchAssessmentFormData(supervisorProfileId, internProfileId)

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-muted-foreground">Intern tidak ditemukan atau bukan bimbingan Anda.</p>
      </div>
    )
  }

  return <AssessmentFormPage data={data} />
}
