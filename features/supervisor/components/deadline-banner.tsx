"use client"

import { AlertTriangleIcon } from "lucide-react"

interface DeadlineBannerProps {
  deadline: string
}

export function DeadlineBanner({ deadline }: DeadlineBannerProps) {

  return (
    <div className="flex items-start gap-3 rounded-none border border-destructive/30 bg-destructive/5 p-3">
      <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
      <div>
        <p className="text-sm font-semibold text-destructive">Mendekati Batas Akhir Penilaian</p>
        <p className="text-xs text-muted-foreground">
          Mohon segera menyelesaikan penilaian untuk peserta yang memiliki batas waktu sampai {deadline}.
        </p>
      </div>
    </div>
  )
}
