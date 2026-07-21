"use client";

import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";
import { UserIcon } from "lucide-react";

import { Input } from "@base-ui/react/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InternOption {
  id: string;
  name: string;
}

interface IssueFormValues {
  title: string;
  description?: string;
  internProfileId?: string;
  startDate?: string;
  endDate?: string;
}

interface IssueFormFieldsProps {
  control: Control<IssueFormValues>;
  internOptions: InternOption[];
}

export function IssueFormFields({
  control,
  internOptions,
}: IssueFormFieldsProps) {
  const titleField = useController({ control, name: "title" });
  const descriptionField = useController({ control, name: "description" });
  const internField = useController({ control, name: "internProfileId" });
  const startDateField = useController({ control, name: "startDate" });
  const endDateField = useController({ control, name: "endDate" });

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="title">Judul Rencana Kegiatan</Label>
        <Input
          id="title"
          placeholder="Misal: Pengolahan Data Regsosek 2024"
          value={titleField.field.value ?? ""}
          onValueChange={titleField.field.onChange}
        />
        {titleField.fieldState.error && (
          <p className="text-xs text-destructive">
            {titleField.fieldState.error.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          placeholder="Jelaskan ruang lingkup kegiatan ini..."
          value={descriptionField.field.value ?? ""}
          onChange={(e) => descriptionField.field.onChange(e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="intern">Assign ke Intern</Label>
        <Select
          value={internField.field.value ?? ""}
          onValueChange={(val) => internField.field.onChange(val || undefined)}
        >
          <SelectTrigger id="intern" className="w-full">
            <UserIcon className="size-3.5 mr-1" />
            <SelectValue placeholder="Semua Intern (default)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Intern</SelectItem>
            {internOptions.map((intern) => (
              <SelectItem key={intern.id} value={intern.id}>
                {intern.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Tanggal Mulai</Label>
          <Input
            id="startDate"
            type="date"
            value={startDateField.field.value ?? ""}
            onValueChange={startDateField.field.onChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Tanggal Selesai</Label>
          <Input
            id="endDate"
            type="date"
            value={endDateField.field.value ?? ""}
            onValueChange={endDateField.field.onChange}
          />
        </div>
      </div>
    </div>
  );
}
