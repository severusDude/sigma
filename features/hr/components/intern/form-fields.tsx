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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface InternFormFieldsProps<T extends FieldValues> {
  control: Control<T>;
  departmentOptions: { id: string; name: string }[];
  periodValue?: DateRange | undefined;
  onPeriodChange?: (range: DateRange | undefined) => void;
}

function PeriodDuration({ from, to }: { from?: Date; to?: Date }) {
  if (!from || !to) return null;

  const diffMs = to.getTime() - from.getTime();
  if (diffMs <= 0) return null;

  const months = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
  const days = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24),
  );

  const parts: string[] = [];
  if (months > 0) parts.push(`${months} bulan`);
  if (days > 0) parts.push(`${days} hari`);

  return (
    <p className="text-xs text-muted-foreground mt-1">
      Durasi: {parts.join(" ")}
    </p>
  );
}

export function InternFormFields<T extends FieldValues>({
  control,
  departmentOptions,
  periodValue,
  onPeriodChange,
}: InternFormFieldsProps<T>) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Controller
        name={"name" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="col-span-2">
            <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
            <Input
              {...field}
              autoFocus
              id="name"
              placeholder="Masukkan nama lengkap"
              autoComplete="off"
              maxLength={100}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name={"nik" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="nik">NIK</FieldLabel>
            <InputGroup>
              <InputGroupInput
                {...field}
                id="nik"
                placeholder="Masukkan NIK"
                autoComplete="off"
                maxLength={16}
                aria-invalid={fieldState.invalid}
              />
              <InputGroupAddon align="inline-end">
                {field.value.length}/16
              </InputGroupAddon>
            </InputGroup>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name={"institution" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="institution">Institusi</FieldLabel>
            <Input
              {...field}
              id="institution"
              placeholder="Masukkan asal institusi"
              autoComplete="off"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Email */}
      <Controller
        name={"email" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              {...field}
              id="email"
              type="email"
              placeholder="email@example.com"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      {/* Phone */}
      <Controller
        name={"phone" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="phone">No. HP</FieldLabel>
            <Input
              {...field}
              id="phone"
              placeholder="085xxxxx"
              autoComplete="off"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name={"departmentId" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="department">Departemen</FieldLabel>
            <Select
              value={field.value || ""}
              onValueChange={(val) => field.onChange(val || undefined)}
            >
              <SelectTrigger
                id="department"
                value={field.value}
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder="Pilih departemen" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {departmentOptions.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name={"status" as FieldPath<T>}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="status">Status Intern</FieldLabel>
            <Select
              value={field.value || ""}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id="status"
                value={field.value}
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="withdrawn">Ditarik</SelectItem>
              </SelectContent>
            </Select>
            {fieldState.error && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Field>
        <FieldLabel>Periode Magang</FieldLabel>
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
        <PeriodDuration from={periodValue?.from} to={periodValue?.to} />
      </Field>
    </div>
  );
}
