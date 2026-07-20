"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { FileEditIcon, EyeIcon, FilePlusIcon } from "lucide-react"
import Link from "next/link"

import type { AssessmentListItem } from "../types/assessment-types"

function getStatusLabel(status: string | null) {
  if (status === null) return "Belum Dinilai"
  const map: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    finalized: "Finalized",
  }
  return map[status] ?? status
}

function getStatusBadgeVariant(status: string | null): "default" | "secondary" | "outline" | "destructive" | "ghost" | "link" {
  if (status === null) return "outline"
  const map: Record<string, "default" | "secondary" | "outline" | "destructive" | "ghost" | "link"> = {
    draft: "outline",
    submitted: "default",
    finalized: "default",
  }
  return map[status] ?? "outline"
}

interface AssessmentCardProps {
  intern: AssessmentListItem
}

export function AssessmentCard({ intern }: AssessmentCardProps) {
  const initials = intern.internName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const actionButton = () => {
    if (!intern.assessmentId || intern.assessmentStatus === null) {
      return (
        <Link
          href={`/supervisor/penilaian/${intern.internProfileId}`}
          className={cn(buttonVariants(), "gap-2 w-full")}
        >
          <FilePlusIcon className="size-3.5" />
          Isi Penilaian
        </Link>
      )
    }

    if (intern.assessmentStatus === "draft") {
      return (
        <Link
          href={`/supervisor/penilaian/${intern.internProfileId}`}
          className={cn(buttonVariants({ variant: "outline"}), "gap-2 w-full")}
        >
          <FileEditIcon className="size-3.5" />
          Lihat/Edit
        </Link>
      )
    }

    return (
      <Link
        href={`/supervisor/penilaian/${intern.internProfileId}/view`}
        className={cn(buttonVariants({ variant: "outline"}), "gap-2 w-full")}
      >
        <EyeIcon className="size-3.5" />
        Lihat Hasil
      </Link>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-none border bg-card p-4">
      <div className="flex items-start gap-3">
        <Avatar size="lg">
          <AvatarImage src={intern.photoUrl ?? undefined} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold">{intern.internName}</p>
            <Badge variant={getStatusBadgeVariant(intern.assessmentStatus)} className="shrink-0 mt-0.5">
              {getStatusLabel(intern.assessmentStatus)}
            </Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">{intern.institution}</p>
          <p className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(intern.periodStart))}
            {" — "}
            {new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(intern.periodEnd))}
          </p>
        </div>
      </div>

      <div className="pt-1">{actionButton()}</div>
    </div>
  )
}
