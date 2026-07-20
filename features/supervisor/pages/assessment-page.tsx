"use client"

import { useCallback, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Skeleton } from "@/components/ui/skeleton"
import { differenceInCalendarDays } from "date-fns"

import { getSupervisorAssessmentList } from "../actions/assessment-actions"
import { AssessmentCard } from "../components/assessment-card"
import { AssessmentHeader } from "../components/assessment-header"
import { DeadlineBanner } from "../components/deadline-banner"
import { Pagination } from "../components/pagination"
import { SearchInput } from "../components/search-input"
import { StatusFilter } from "../components/status-filter"

import type { AssessmentListResponse, AssessmentPeriod } from "../types/assessment-types"

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

function formatPeriod(date: Date | string) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

interface AssessmentPageProps {
  supervisorProfileId: string
  initialData: AssessmentListResponse
  assessmentPeriod: AssessmentPeriod | null
}

function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-none border bg-card p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-8 w-24" />
    </div>
  )
}

export default function AssessmentPage({
  supervisorProfileId,
  initialData,
  assessmentPeriod,
}: AssessmentPageProps) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const periodStart = assessmentPeriod ? formatPeriod(assessmentPeriod.periodStart) : "—"
  const periodEnd = assessmentPeriod ? formatPeriod(assessmentPeriod.periodEnd) : "—"
  const deadline = assessmentPeriod ? formatDate(assessmentPeriod.deadline) : "—"

  const isNearDeadline = assessmentPeriod
    ? differenceInCalendarDays(assessmentPeriod.deadline, new Date()) <= 7
    : false

  const isInitialState = page === 1 && !search && !statusFilter

  const { data, isLoading } = useQuery({
    queryKey: ["supervisor-assessment-list", supervisorProfileId, page, search, statusFilter],
    queryFn: async () => {
      const res = await getSupervisorAssessmentList({
        supervisorProfileId,
        page,
        search: search || undefined,
        status: statusFilter || undefined,
      })
      if (!res.success) throw new Error(res.error)
      return res.data
    },
    initialData: isInitialState ? initialData : undefined,
  })

  const items = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
  }, [])

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value)
    setPage(1)
  }, [])

  return (
    <div className="space-y-6">
      <AssessmentHeader />

      {isNearDeadline && <DeadlineBanner deadline={deadline} />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full max-w-xl">
          <SearchInput value={search} onChange={handleSearchChange} />
        </div>
        <div className="flex items-center gap-2">
          <StatusFilter value={statusFilter} onChange={handleStatusChange} />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">Belum ada intern bimbingan aktif.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((intern) => (
              <AssessmentCard key={intern.internProfileId} intern={intern} />
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  )
}
