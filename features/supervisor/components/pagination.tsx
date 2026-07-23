"use client"

import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPages = () => {
    const pages: (number | "...")[] = []
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    pages.push(1)
    if (page > 3) pages.push("...")
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (page < totalPages - 2) pages.push("...")
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="outline"
        size="icon-xs"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeftIcon className="size-4" />
      </Button>

      {getPages().map((p, i) =>
        p === "..." ? (
          <Button key={`ellipsis-${i}`} variant="ghost" size="icon-xs" disabled>
            <MoreHorizontalIcon className="size-4" />
          </Button>
        ) : (
          <Button
            key={p}
            variant="ghost"
            size="icon-xs"
            onClick={() => onPageChange(p)}
            className={cn(p === page && "bg-primary text-primary-foreground hover:bg-primary")}
          >
            {p}
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="icon-xs"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRightIcon className="size-4" />
      </Button>
    </div>
  )
}
