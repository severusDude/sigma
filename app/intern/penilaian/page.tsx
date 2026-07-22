import { requireAuth } from "@/helpers/guard"
import { Role } from "@/generated/prisma/enums"
import { fetchInternAssessment } from "@/features/intern/data/assessment-intern-data"
import AssessmentInternPage from "@/features/intern/pages/assessment-intern-page"

export default async function Page() {
  const { user } = await requireAuth([Role.admin, Role.intern])

  const data = await fetchInternAssessment(user.id)

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-none border bg-card py-16 text-center">
        <p className="text-sm text-muted-foreground">
          Belum ada penilaian. Hubungi supervisor untuk informasi lebih lanjut.
        </p>
      </div>
    )
  }

  return <AssessmentInternPage data={data} />
}
