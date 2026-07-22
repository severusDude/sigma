"use client";

import { FilterIcon, SearchIcon, XIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { IssueStatus } from "@/generated/prisma/enums";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InternSelect } from "./intern-select";
import { SelectItemType } from "@/lib/types";

interface InternOption {
  id: string;
  name: string;
}

interface FiltersBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  selectedInterns: string[];
  onInternsChange: (ids: string[]) => void;
  internOptions: InternOption[];
}

export function FiltersBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  selectedInterns,
  onInternsChange,
  internOptions,
}: FiltersBarProps) {
  const statusOptions: SelectItemType<IssueStatus>[] = [
    { value: "all", label: "Semua Status" },
    { value: IssueStatus.active, label: "Aktif" },
    { value: IssueStatus.completed, label: "Selesai" },
    { value: IssueStatus.cancelled, label: "Dibatalkan" },
  ];

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative flex-1 max-w-sm min-w-50">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Cari rencana kegiatan..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 pl-8 text-xs"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute -translate-y-1/2 right-2 top-1/2 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
          Status
        </label>
        <Select
          items={statusOptions}
          value={statusFilter}
          onValueChange={(val) => onStatusChange(val ?? "all")}
        >
          <SelectTrigger className="w-42">
            <FilterIcon className="size-3.5 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} side="bottom">
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
          Intern
        </label>
        <InternSelect
          options={internOptions}
          value={selectedInterns}
          onValueChange={(val) => onInternsChange(val as string[])}
          multiple
        />
      </div>
    </div>
  );
}
