import { ClipboardCheck, MessageCircle, Clock, ArrowRight } from "lucide-react"

import { requireAuth } from "@/helpers/guard"
import { Role } from "@/generated/prisma/enums"
import { fetchInternAssessment } from "@/features/intern/data/assessment-intern-data"
import AssessmentInternPage from "@/features/intern/pages/assessment-intern-page"

export default async function Page() {
  const { user } = await requireAuth([Role.admin, Role.intern])

  const data = await fetchInternAssessment(user.id)

  if (!data) {
    return (
      <div className="flex w-full items-center justify-center py-6">
        <div className="w-full max-w-lg space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex size-24 items-center justify-center rounded-none border-2 border-dashed bg-muted/20">
              <ClipboardCheck className="size-12 text-muted-foreground/60" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold tracking-tight">
                Belum Ada Penilaian
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Penilaian dari supervisor belum tersedia saat ini. Hasil
                evaluasi akan muncul di halaman ini setelah supervisor
                menyelesaikan dan memfinalisasi penilaian.
              </p>
            </div>
          </div>

          <div className="rounded-none border bg-card p-5">
            <h3 className="mb-3 text-sm font-medium">Langkah selanjutnya:</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-none border bg-muted/50">
                  <MessageCircle className="size-3.5 text-muted-foreground" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Hubungi Supervisor</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Tanyakan kepada supervisor bimbingan Anda mengenai estimasi
                    waktu penyelesaian penilaian.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-none border bg-muted/50">
                  <Clock className="size-3.5 text-muted-foreground" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Cek Berkala</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Pantau halaman ini secara berkala untuk melihat
                    pembaruan status penilaian.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <AssessmentInternPage data={data} />
}
