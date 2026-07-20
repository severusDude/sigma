"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

const statusOptions = [
  { label: "Semua", value: "" },
  { label: "Belum Dinilai", value: "belum_dinilai" },
  { label: "Draft", value: "draft" },
  { label: "Submitted", value: "submitted" },
  { label: "Finalized", value: "finalized" },
];

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")} items={statusOptions}>
      <SelectTrigger className="w-48">
        <SelectValue />{" "}
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        side="bottom"
        className="w-48"
      >
        {statusOptions.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
