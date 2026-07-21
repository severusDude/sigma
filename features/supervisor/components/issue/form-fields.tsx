"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { cn } from "@/lib/utils";
import { id } from "date-fns/locale";
import { SelectItemType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { IssueStatus } from "@/generated/prisma/enums";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";

import { InternSelect } from "./intern-select";

interface InternOption {
  id: string;
  name: string;
}

interface IssueFormFieldsProps<T extends FieldValues> {
  control: Control<T>;
  internOptions: InternOption[];
  periodValue?: DateRange | undefined;
  onPeriodChange?: (range: DateRange | undefined) => void;
}

const statusOptions: SelectItemType<IssueStatus>[] = [
  { value: IssueStatus.active, label: "Aktif" },
  { value: IssueStatus.completed, label: "Selesai" },
  { value: IssueStatus.cancelled, label: "Dibatalkan" },
];

export function IssueFormFields<T extends FieldValues>({
  control,
  internOptions,
  periodValue,
  onPeriodChange,
}: IssueFormFieldsProps<T>) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Controller
        name={"title" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field className="col-span-2" data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="title">Judul Rencana Kegiatan</FieldLabel>
            <InputGroup>
              <InputGroupInput
                autoFocus
                id="title"
                placeholder="Misal: Pengolahan Data Regsosek 2024"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
              />
            </InputGroup>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Status */}
      <Controller
        name={"status" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field>
            <FieldLabel htmlFor="edit-status">Status</FieldLabel>
            <Select
              items={statusOptions}
              value={field.value ?? IssueStatus.active}
              onValueChange={field.onChange}
            >
              <SelectTrigger id="edit-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Periode Kegiatan */}
      <Field>
        <FieldLabel>Periode Kegiatan</FieldLabel>
        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !periodValue?.from && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 size-4" />
                {periodValue?.from ? (
                  periodValue.to ? (
                    <>
                      {format(periodValue.from, "d MMM yyyy", { locale: id })} -{" "}
                      {format(periodValue.to, "d MMM yyyy", { locale: id })}
                    </>
                  ) : (
                    format(periodValue.from, "d MMM yyyy", { locale: id })
                  )
                ) : (
                  "Pilih tanggal mulai dan selesai"
                )}
              </Button>
            }
          />
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={periodValue}
              onSelect={onPeriodChange}
              locale={id}
              numberOfMonths={2}
              min={2}
            />
          </PopoverContent>
        </Popover>
      </Field>

      <Controller
        name={"description" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field className="col-span-2" data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="description">Deskripsi</FieldLabel>
            <InputGroup>
              <InputGroupAddon align="block-start">
                <span className="text-xs text-muted-foreground">
                  Jelaskan ruang lingkup kegiatan ini...
                </span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {(field.value || "").length}/500
                </span>
              </InputGroupAddon>
              <InputGroupTextarea
                {...field}
                id="description"
                rows={12}
                maxLength={500}
                aria-invalid={fieldState.invalid}
                className="resize-none min-h-28"
              />
            </InputGroup>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name={"internProfileId" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field className="col-span-2" data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="intern">Assign ke Intern</FieldLabel>
            <InternSelect
              options={internOptions}
              value={field.value ?? ""}
              onValueChange={(val) => field.onChange(val || undefined)}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </div>
  );
}
