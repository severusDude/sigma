"use client";

import { useState } from "react";

import { ChevronDownIcon, FilterIcon, SearchIcon, XIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { IssueStatus } from "@/generated/prisma/enums";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  const [internOpen, setInternOpen] = useState(false);

  const statusOptions: SelectItemType<IssueStatus>[] = [
    { value: "all", label: "Semua Status" },
    { value: IssueStatus.active, label: "Aktif" },
    { value: IssueStatus.completed, label: "Selesai" },
    { value: IssueStatus.cancelled, label: "Dibatalkan" },
  ];

  function toggleIntern(id: string) {
    const next = selectedInterns.includes(id)
      ? selectedInterns.filter((i) => i !== id)
      : [...selectedInterns, id];
    onInternsChange(next);
  }

  const selectedNames = internOptions
    .filter((o) => selectedInterns.includes(o.id))
    .map((o) => o.name);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
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
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Status
        </label>
        <Select
          value={statusFilter}
          onValueChange={(val) => onStatusChange(val ?? "all")}
        >
          <SelectTrigger className="w-[140px]">
            <FilterIcon className="size-3.5 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Intern
        </label>
        <Popover open={internOpen} onOpenChange={setInternOpen}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="h-8 justify-between min-w-[160px] text-xs font-normal"
              >
                <span className="truncate">
                  {selectedInterns.length === 0
                    ? "Semua Intern"
                    : `${selectedInterns.length} intern dipilih`}
                </span>
                <ChevronDownIcon className="size-3.5 ml-2 shrink-0 opacity-50" />
              </Button>
            }
          />
          <PopoverContent className="w-[220px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Cari intern..." />
              <CommandList>
                <CommandEmpty>Tidak ada intern.</CommandEmpty>
                <CommandGroup>
                  {internOptions.map((intern) => (
                    <CommandItem
                      key={intern.id}
                      value={intern.id}
                      onSelect={() => toggleIntern(intern.id)}
                      data-checked={selectedInterns.includes(intern.id)}
                    >
                      <Checkbox
                        checked={selectedInterns.includes(intern.id)}
                        className="size-3.5"
                      />
                      <span className="text-xs">{intern.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
            {selectedInterns.length > 0 && (
              <div className="flex items-center gap-1.5 p-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] w-full"
                  onClick={() => {
                    onInternsChange([]);
                    setInternOpen(false);
                  }}
                >
                  Reset filter
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        {selectedNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {selectedNames.slice(0, 2).map((name) => (
              <Badge key={name} variant="secondary" className="text-[10px] h-4">
                {name}
              </Badge>
            ))}
            {selectedNames.length > 2 && (
              <Badge variant="secondary" className="text-[10px] h-4">
                +{selectedNames.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
